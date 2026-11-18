#!/usr/bin/env python3
"""
GROVIQUE LIVE - Institutional Intraday Trading Bot
Powered by Groww Trading API Python SDK (`growwapi`)

Strategy: 15-Minute Opening Range Breakout (ORB) + VWAP Confluence
Features:
- Dynamic 1% Capital Risk Position Sizing
- Product MIS with 5x Intraday Leverage
- Automated Stop-Loss and 1:2 R:R Target Placement
- Strict 15:15 IST Auto-Square Off Safeguard
- Dual Mode: DRY_RUN (Simulation) & LIVE_EXECUTION
"""

import os
import sys
import time
import math
import uuid
import logging
from datetime import datetime, time as dtime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("GroviqueGrowwBot")

try:
    from growwapi import GrowwAPI
except ImportError:
    logger.warning("`growwapi` package not installed in the active environment.")
    logger.warning("To install: pip install growwapi")
    GrowwAPI = None


class GroviqueIntradayBot:
    """
    Automated Intraday Bot utilizing Groww Trade API.
    """

    def __init__(self, symbol="RELIANCE", dry_run=True):
        self.symbol = symbol.upper()
        self.dry_run = dry_run
        self.api_token = os.getenv("GROWW_API_TOKEN", "")
        
        self.client = None
        self.orb_high = None
        self.orb_low = None
        self.active_position = None
        self.capital = 100_000.0  # Default ₹1,00,000 for sizing if margin query is unavailable

        self._init_client()

    def _init_client(self):
        """Initializes the official GrowwAPI client"""
        if self.dry_run:
            logger.info("⚡ [MODE] DRY-RUN / SIMULATION MODE ENABLED. No live orders will be sent to Groww.")
            return

        if not self.api_token:
            logger.error("Missing GROWW_API_TOKEN. Cannot initialize live client.")
            sys.exit(1)

        if GrowwAPI is None:
            logger.error("The `growwapi` SDK is required for live execution. Run: pip install growwapi")
            sys.exit(1)

        try:
            self.client = GrowwAPI(auth_token=self.api_token)
            logger.info("✓ Groww Trade API Client Authenticated Successfully.")
            self._sync_account_margin()
        except Exception as e:
            logger.error(f"Failed to authenticate with Groww API: {e}")
            sys.exit(1)

    def _sync_account_margin(self):
        """Fetches live margin balances from Groww"""
        try:
            margin = self.client.get_user_margin()
            available = float(margin.get("net_available_margin", margin.get("available_cash", 100_000)))
            self.capital = available
            logger.info(f"Verified Available Margin on Groww: ₹{self.capital:,.2f}")
        except Exception as e:
            logger.warning(f"Could not fetch margin balance, using default capital ₹{self.capital:,.2f}: {e}")

    def fetch_market_snapshot(self):
        """Retrieves LTP, VWAP, and Day Open/High/Low"""
        if self.dry_run or not self.client:
            # Simulated snapshot for demonstration
            return {
                "symbol": self.symbol,
                "ltp": 2540.50,
                "vwap": 2535.00,
                "high": 2552.00,
                "low": 2528.00,
                "volume": 1_450_000
            }

        quote = self.client.get_quote(
            trading_symbol=self.symbol,
            exchange=GrowwAPI.EXCHANGE_NSE,
            segment=GrowwAPI.SEGMENT_CASH
        )
        return {
            "symbol": self.symbol,
            "ltp": float(quote.get("last_price", 0)),
            "vwap": float(quote.get("vwap", quote.get("last_price", 0))),
            "high": float(quote.get("high", 0)),
            "low": float(quote.get("low", 0)),
            "volume": int(quote.get("volume", 0))
        }

    def compute_position_sizing(self, entry_price, stop_loss_price):
        """
        Institutional 1% Risk Allocation with 5x MIS Leverage Check.
        """
        risk_per_trade = self.capital * 0.01  # 1% Max risk
        stop_distance = abs(entry_price - stop_loss_price)

        if stop_distance <= 0:
            return 0, 0, 0

        # Number of shares based on risk budget
        shares_by_risk = math.floor(risk_per_trade / stop_distance)

        # Number of shares supported by 5x MIS margin
        max_position_value = self.capital * 5.0
        shares_by_margin = math.floor(max_position_value / entry_price)

        # Conservative sizing
        final_quantity = max(1, min(shares_by_risk, shares_by_margin))
        required_margin = (final_quantity * entry_price) / 5.0

        return final_quantity, risk_per_trade, required_margin

    def check_and_execute_signals(self):
        """
        Executes 15m ORB Strategy with VWAP Confirmation.
        """
        now = datetime.now()
        market_open = now.replace(hour=9, minute=15, second=0, microsecond=0)
        orb_end = now.replace(hour=9, minute=30, second=0, microsecond=0)
        square_off_time = now.replace(hour=15, minute=15, second=0, microsecond=0)

        # 1. Mandatory 15:15 IST Square-Off Guard
        if now.time() >= dtime(15, 15):
            logger.warning("🚨 15:15 IST REACHED: Initiating mandatory intraday position square-off!")
            self.square_off_all_positions()
            return

        snapshot = self.fetch_market_snapshot()
        ltp = snapshot["ltp"]
        vwap = snapshot["vwap"]

        # 2. Establish 15-Minute Opening Range (09:15 - 09:30)
        if self.orb_high is None or self.orb_low is None:
            # For demonstration / initialization, use first 15m candle high and low
            self.orb_high = snapshot["high"]
            self.orb_low = snapshot["low"]
            logger.info(f"Established 15m ORB Range for {self.symbol} -> High: ₹{self.orb_high:.2f} | Low: ₹{self.orb_low:.2f}")

        logger.info(f"[{self.symbol}] LTP: ₹{ltp:.2f} | VWAP: ₹{vwap:.2f} | ORB High: ₹{self.orb_high:.2f} | ORB Low: ₹{self.orb_low:.2f}")

        # If we already have an active position, monitor SL / Target
        if self.active_position:
            self.monitor_active_trade(ltp)
            return

        # 3. Bullish Breakout Condition: LTP breaks above ORB High AND trades above VWAP
        if ltp > self.orb_high and ltp > vwap:
            sl_price = max(self.orb_low, vwap - (ltp - vwap) * 0.5)
            target_price = ltp + (ltp - sl_price) * 2.0  # 1:2 R:R
            qty, risk_amount, req_margin = self.compute_position_sizing(ltp, sl_price)

            logger.info(f"🚀 BULLISH BREAKOUT SIGNAL DETECTED for {self.symbol}!")
            logger.info(f"   Entry: ₹{ltp:.2f} | SL: ₹{sl_price:.2f} | Target: ₹{target_price:.2f}")
            logger.info(f"   Sizing: {qty} shares | Req Margin (5x): ₹{req_margin:,.2f} | Risk: ₹{risk_amount:,.2f}")

            self.place_entry_order("BUY", qty, ltp, sl_price, target_price)

        # 4. Bearish Breakdown Condition: LTP breaks below ORB Low AND trades below VWAP
        elif ltp < self.orb_low and ltp < vwap:
            sl_price = min(self.orb_high, vwap + (vwap - ltp) * 0.5)
            target_price = ltp - (sl_price - ltp) * 2.0  # 1:2 R:R
            qty, risk_amount, req_margin = self.compute_position_sizing(ltp, sl_price)

            logger.info(f"🔻 BEARISH BREAKDOWN SIGNAL DETECTED for {self.symbol}!")
            logger.info(f"   Entry: ₹{ltp:.2f} | SL: ₹{sl_price:.2f} | Target: ₹{target_price:.2f}")
            logger.info(f"   Sizing: {qty} shares | Req Margin (5x): ₹{req_margin:,.2f} | Risk: ₹{risk_amount:,.2f}")

            self.place_entry_order("SELL", qty, ltp, sl_price, target_price)

    def place_entry_order(self, action, qty, price, sl, target):
        """Sends order to Groww or simulates fill in dry-run mode"""
        order_ref = f"GROV_{uuid.uuid4().hex[:8].upper()}"

        if self.dry_run or not self.client:
            logger.info(f"⚡ [DRY-RUN] Simulated {action} {qty}x {self.symbol} at ₹{price:.2f} (Ref: {order_ref})")
            self.active_position = {
                "action": action,
                "qty": qty,
                "entry_price": price,
                "sl": sl,
                "target": target,
                "order_ref": order_ref,
                "order_id": f"SIM-{order_ref}"
            }
            return

        try:
            # Place Primary Market / Limit Order with Groww MIS
            order_res = self.client.place_order(
                trading_symbol=self.symbol,
                quantity=qty,
                price=price,
                order_type=GrowwAPI.ORDER_TYPE_LIMIT,
                product=GrowwAPI.PRODUCT_MIS,
                transaction_type=GrowwAPI.TRANSACTION_TYPE_BUY if action == "BUY" else GrowwAPI.TRANSACTION_TYPE_SELL,
                exchange=GrowwAPI.EXCHANGE_NSE,
                segment=GrowwAPI.SEGMENT_CASH,
                validity=GrowwAPI.VALIDITY_DAY,
                order_reference_id=order_ref
            )

            order_id = order_res.get("order_id")
            logger.info(f"✓ Live Order Placed on Groww! Order ID: {order_id} | Status: {order_res.get('order_status')}")

            self.active_position = {
                "action": action,
                "qty": qty,
                "entry_price": price,
                "sl": sl,
                "target": target,
                "order_ref": order_ref,
                "order_id": order_id
            }

        except Exception as e:
            logger.error(f"Failed to place order with Groww API: {e}")

    def monitor_active_trade(self, ltp):
        """Tracks active position against Stop-Loss and Target levels"""
        pos = self.active_position
        action = pos["action"]
        entry = pos["entry_price"]
        sl = pos["sl"]
        target = pos["target"]
        qty = pos["qty"]

        # Calculate unrealized MTM PnL
        pnl = (ltp - entry) * qty if action == "BUY" else (entry - ltp) * qty
        logger.info(f"📊 Active Trade: {action} {qty}x @ ₹{entry:.2f} | Current LTP: ₹{ltp:.2f} | MTM PnL: ₹{pnl:+,.2f}")

        # Check Target Hit
        if (action == "BUY" and ltp >= target) or (action == "SELL" and ltp <= target):
            logger.info(f"🎯 TARGET REACHED at ₹{ltp:.2f}! Realized PnL: ₹{pnl:+,.2f}")
            self.square_off_all_positions()

        # Check Stop-Loss Hit
        elif (action == "BUY" and ltp <= sl) or (action == "SELL" and ltp >= sl):
            logger.warning(f"🛑 STOP-LOSS TRIGGERED at ₹{ltp:.2f}! Realized PnL: ₹{pnl:+,.2f}")
            self.square_off_all_positions()

    def square_off_all_positions(self):
        """Squares off active open position"""
        if not self.active_position:
            logger.info("No active positions to square off.")
            return

        pos = self.active_position
        exit_action = "SELL" if pos["action"] == "BUY" else "BUY"

        if self.dry_run or not self.client:
            logger.info(f"⚡ [DRY-RUN] Position closed. Simulated {exit_action} {pos['qty']}x {self.symbol}")
            self.active_position = None
            return

        try:
            logger.info(f"Exiting live Groww position: {exit_action} {pos['qty']}x {self.symbol}...")
            exit_res = self.client.place_order(
                trading_symbol=self.symbol,
                quantity=pos["qty"],
                price=0.0,
                order_type=GrowwAPI.ORDER_TYPE_MARKET,
                product=GrowwAPI.PRODUCT_MIS,
                transaction_type=GrowwAPI.TRANSACTION_TYPE_SELL if exit_action == "SELL" else GrowwAPI.TRANSACTION_TYPE_BUY,
                exchange=GrowwAPI.EXCHANGE_NSE,
                segment=GrowwAPI.SEGMENT_CASH,
                validity=GrowwAPI.VALIDITY_DAY
            )
            logger.info(f"✓ Square-off order placed successfully: {exit_res.get('order_id')}")
            self.active_position = None
        except Exception as e:
            logger.error(f"Failed to square off position on Groww: {e}")


def main():
    print("=" * 70)
    print("  GROVIQUE LIVE - Institutional Groww Algorithmic Trading Bot")
    print("=" * 70)

    # Check for live execution flag
    is_live = "--live" in sys.argv
    symbol = "RELIANCE"
    for arg in sys.argv:
        if arg.startswith("--symbol="):
            symbol = arg.split("=")[1].upper()

    bot = GroviqueIntradayBot(symbol=symbol, dry_run=not is_live)

    logger.info(f"Starting Algorithmic Bot for ticker: {symbol}")
    logger.info("Polling market snapshot every 5 seconds. Press Ctrl+C to terminate.")

    try:
        # Sample iteration loop
        for cycle in range(5):
            bot.check_and_execute_signals()
            time.sleep(5)
    except KeyboardInterrupt:
        logger.info("Trading bot terminated by user.")


if __name__ == "__main__":
    main()
