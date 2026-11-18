# Groww Trading API Python SDK (`growwapi`) — Complete Master Guide & Architecture

> **GROVIQUE LIVE Institutional Intraday Series**  
> *Teach-Along Reference & Integration Blueprint*

---

## 1. Executive Summary & Overview

The **Groww Trading API** provides programmatic access to Indian financial markets (NSE, BSE, and MCX). It allows retail traders, quantitative researchers, and algorithmic developers to:
1. **Automate Order Execution**: Place Market, Limit, Stop Loss (SL), and Stop Loss Market (SL-M) orders with microsecond-level broker execution.
2. **Stream Market Feeds**: Receive real-time tick-by-tick prices and Market Depth (L2 5-depth order book) via low-latency WebSockets.
3. **Query Historical OHLCV Candles**: Retrieve multi-timeframe candles (1m, 3m, 5m, 15m, 30m, 1h, 1d) for backtesting and technical analysis.
4. **Monitor Risk & Demat Balances**: Dynamically inspect cash margin, collateral haircuts, intraday MIS leverage (up to 5x on equities), and live mark-to-market (MTM) PnL.

The official Python SDK is distributed on PyPI under the package name **`growwapi`**.

---

## 2. Installation & Prerequisites

### System Requirements
- **Python**: Version `3.9` or higher
- **Supported Platforms**: Windows, macOS, Linux (Ubuntu/Debian)

### Installation
Install the official SDK using `pip`:

```bash
pip install growwapi
```

Recommended companion packages for algorithmic trading and quantitative analysis:
```bash
pip install pandas numpy pandas_ta python-dotenv requests websocket-client
```

---

## 3. Authentication & Token Lifecycle

### 3.1 Obtaining API Credentials
1. Log in to the [Groww Developer Dashboard](https://groww.in/trade-api).
2. Create an App or generate an **API Access Token**.
3. Copy your Bearer Auth Token.

### 3.2 Token Expiry & Security
- **Daily 6:00 AM IST Expiry**: Groww Trading API tokens expire every morning at 06:00 IST in compliance with Indian exchange regulatory cycles.
- **Never Hardcode Secrets**: Store your credentials in environment variables (`.env` file) or secure key vaults.

```env
# .env file
GROWW_API_TOKEN=your_bearer_token_here
```

### 3.3 Initializing the SDK Client

```python
import os
from growwapi import GrowwAPI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_TOKEN = os.getenv("GROWW_API_TOKEN")

if not API_TOKEN:
    raise ValueError("Missing GROWW_API_TOKEN. Set it in your environment or .env file.")

# Initialize Groww API REST Client
groww = GrowwAPI(auth_token=API_TOKEN)
print("Groww Trading API client initialized successfully.")
```

---

## 4. SDK Constants & Enumerations

`growwapi` uses typed constants to ensure order parameters conform to exchange specifications:

| Constant Category | SDK Constant | Value / Description |
| :--- | :--- | :--- |
| **Exchanges** | `GrowwAPI.EXCHANGE_NSE`<br>`GrowwAPI.EXCHANGE_BSE`<br>`GrowwAPI.EXCHANGE_MCX` | `"NSE"` (National Stock Exchange)<br>`"BSE"` (Bombay Stock Exchange)<br>`"MCX"` (Multi Commodity Exchange) |
| **Segments** | `GrowwAPI.SEGMENT_CASH`<br>`GrowwAPI.SEGMENT_FNO` | `"CASH"` (Equities)<br>`"FNO"` (Futures & Options) |
| **Products** | `GrowwAPI.PRODUCT_MIS`<br>`GrowwAPI.PRODUCT_CNC` | `"MIS"` (Margin Intraday Square-off, up to 5x leverage)<br>`"CNC"` (Cash and Carry delivery) |
| **Order Types** | `GrowwAPI.ORDER_TYPE_LIMIT`<br>`GrowwAPI.ORDER_TYPE_MARKET`<br>`GrowwAPI.ORDER_TYPE_STOP_LOSS`<br>`GrowwAPI.ORDER_TYPE_STOP_LOSS_MARKET` | `"LIMIT"` (Executes at limit price or better)<br>`"MARKET"` (Immediate execution at best ask/bid)<br>`"SL"` (Stop Loss Limit with trigger)<br>`"SL-M"` (Stop Loss Market with trigger) |
| **Transaction Types**| `GrowwAPI.TRANSACTION_TYPE_BUY`<br>`GrowwAPI.TRANSACTION_TYPE_SELL` | `"BUY"` (Long position)<br>`"SELL"` (Short position / exit) |
| **Order Validity** | `GrowwAPI.VALIDITY_DAY`<br>`GrowwAPI.VALIDITY_IOC` | `"DAY"` (Valid until market closes at 15:30 IST)<br>`"IOC"` (Immediate or Cancel) |

---

## 5. Market Data Endpoints

### 5.1 Fetching Real-Time Stock Quote (LTP & Depth)
Retrieve live market quote including Last Traded Price (LTP), 5-level bid/ask depth, day high/low, open, and VWAP.

```python
quote = groww.get_quote(
    trading_symbol="RELIANCE",
    exchange=GrowwAPI.EXCHANGE_NSE,
    segment=GrowwAPI.SEGMENT_CASH
)

print(f"Symbol: {quote.get('trading_symbol')}")
print(f"LTP: ₹{quote.get('last_price')}")
print(f"Day High: ₹{quote.get('high')} | Day Low: ₹{quote.get('low')}")
print(f"VWAP: ₹{quote.get('vwap')}")
print(f"Total Volume: {quote.get('volume'):,}")
```

### 5.2 Batch LTP Lookup
Fetch the latest traded prices across multiple symbols efficiently:

```python
symbols = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"]
ltp_data = groww.get_stocks_ltp(symbols)

for sym, data in ltp_data.items():
    print(f"{sym}: ₹{data.get('ltp')} ({data.get('day_change_percent', 0):+.2f}%)")
```

### 5.3 Fetching Historical Candlestick Data (OHLCV)
Extract historical candles for quantitative research, backtesting, or indicator generation:

```python
import pandas as pd
from datetime import datetime, timedelta

# Define 5-day historical window
end_time = datetime.now()
start_time = end_time - timedelta(days=5)

candles = groww.get_historical_candle_data(
    trading_symbol="TCS",
    exchange=GrowwAPI.EXCHANGE_NSE,
    segment=GrowwAPI.SEGMENT_CASH,
    start_time=start_time.strftime("%Y-%m-%d %H:%M:%S"),
    end_time=end_time.strftime("%Y-%m-%d %H:%M:%S"),
    interval_in_minutes=15  # 15-minute timeframe
)

# Convert to Pandas DataFrame
df = pd.DataFrame(candles, columns=["timestamp", "open", "high", "low", "close", "volume"])
df["timestamp"] = pd.to_datetime(df["timestamp"])
df.set_index("timestamp", inplace=True)

print(df.tail())
```

---

## 6. Portfolio & Margin Management

### 6.1 Inspecting Available Trading Margin
Check available intraday cash margin, collateral margin, and used funds:

```python
margin_info = groww.get_user_margin()

available_cash = margin_info.get("available_cash", 0)
utilized_margin = margin_info.get("utilized_margin", 0)
net_margin = margin_info.get("net_available_margin", 0)

print(f"Available Cash: ₹{available_cash:,.2f}")
print(f"Utilized Margin: ₹{utilized_margin:,.2f}")
print(f"Net Trading Margin: ₹{net_margin:,.2f}")
```

### 6.2 Tracking Open Positions
Retrieve net positions for the current session (intraday MIS and overnight CNC):

```python
positions = groww.get_positions_for_user()

for pos in positions:
    symbol = pos.get("trading_symbol")
    net_qty = pos.get("net_quantity")
    product = pos.get("product")
    realized_pnl = pos.get("realized_pnl", 0)
    unrealized_pnl = pos.get("unrealized_pnl", 0)
    
    print(f"[{product}] {symbol} | Net Qty: {net_qty} | MTM PnL: ₹{unrealized_pnl:+.2f}")
```

### 6.3 Checking Long-Term Holdings
Retrieve delivery Demat portfolio holdings:

```python
holdings = groww.get_holdings_for_user()

for h in holdings:
    print(f"{h.get('trading_symbol')}: Qty {h.get('quantity')} @ Avg ₹{h.get('average_price'):.2f}")
```

---

## 7. Order Placement & Order Lifecycle

### 7.1 Placing an Intraday Buy Limit Order (with MIS 5x Leverage)

```python
import uuid

# Unique order reference ID for idempotency (8-20 alphanumeric characters)
client_order_id = f"GROV_{uuid.uuid4().hex[:10].upper()}"

order_response = groww.place_order(
    trading_symbol="INFY",
    quantity=10,
    price=1850.50,
    order_type=GrowwAPI.ORDER_TYPE_LIMIT,
    product=GrowwAPI.PRODUCT_MIS,           # Intraday 5x leverage
    transaction_type=GrowwAPI.TRANSACTION_TYPE_BUY,
    exchange=GrowwAPI.EXCHANGE_NSE,
    segment=GrowwAPI.SEGMENT_CASH,
    validity=GrowwAPI.VALIDITY_DAY,
    order_reference_id=client_order_id
)

print("Order Placed Successfully:")
print(f"Order ID: {order_response.get('order_id')}")
print(f"Status: {order_response.get('order_status')}")
```

### 7.2 Placing a Stop-Loss Limit Order
Protects capital by entering an exchange trigger price:

```python
sl_order = groww.place_order(
    trading_symbol="INFY",
    quantity=10,
    price=1828.00,                        # Limit execution price
    trigger_price=1830.00,                # Trigger when LTP hits ₹1830
    order_type=GrowwAPI.ORDER_TYPE_STOP_LOSS,
    product=GrowwAPI.PRODUCT_MIS,
    transaction_type=GrowwAPI.TRANSACTION_TYPE_SELL,
    exchange=GrowwAPI.EXCHANGE_NSE,
    segment=GrowwAPI.SEGMENT_CASH,
    validity=GrowwAPI.VALIDITY_DAY
)

print(f"Stop-Loss Order ID: {sl_order.get('order_id')}")
```

### 7.3 Modifying an Open Order
Update the limit price or quantity before the order is filled:

```python
order_id = order_response.get("order_id")

mod_response = groww.modify_order(
    order_id=order_id,
    price=1852.00,
    quantity=10
)
print("Order Modified:", mod_response)
```

### 7.4 Cancelling an Open Order
Cancel an unfilled order:

```python
cancel_response = groww.cancel_order(order_id=order_id)
print("Order Cancelled:", cancel_response)
```

### 7.5 Inspecting Order Book and Trade History
```python
# Session Order Book
orders = groww.get_order_list()
for o in orders:
    print(f"Order #{o.get('order_id')} | {o.get('trading_symbol')} | {o.get('transaction_type')} | {o.get('order_status')}")

# Execution / Fill History
trades = groww.get_trade_list()
for t in trades:
    print(f"Trade #{t.get('trade_id')} | {t.get('trading_symbol')} | {t.get('quantity')} @ ₹{t.get('price')}")
```

---

## 8. Real-Time Streaming Feeds (`GrowwFeed`)

`GrowwFeed` provides a dedicated WebSocket client for streaming live price ticks and depth events asynchronously.

```python
import time
from growwapi import GrowwFeed

API_TOKEN = os.getenv("GROWW_API_TOKEN")
feed = GrowwFeed(auth_token=API_TOKEN)

def on_ticks(ticks):
    """Callback triggered on every incoming price tick"""
    for tick in ticks:
        print(f"⚡ TICK: {tick.get('trading_symbol')} - LTP: ₹{tick.get('ltp')} | Vol: {tick.get('volume')}")

def on_connect():
    """Callback triggered once WebSocket handshake completes"""
    print("✓ GrowwFeed WebSocket Connected! Subscribing to instruments...")
    instruments = [
        {"symbol": "RELIANCE", "exchange": "NSE", "segment": "CASH"},
        {"symbol": "TCS", "exchange": "NSE", "segment": "CASH"},
        {"symbol": "INFY", "exchange": "NSE", "segment": "CASH"}
    ]
    feed.subscribe_live_data(instruments=instruments, mode="FULL")

def on_error(err):
    print("❌ GrowwFeed Error:", err)

def on_close():
    print("⚠️ GrowwFeed Connection Closed.")

# Bind event listeners
feed.on_ticks = on_ticks
feed.on_connect = on_connect
feed.on_error = on_error
feed.on_close = on_close

# Run stream in background thread or blocking mode
# feed.connect()
```

---

## 9. Institutional Risk Management Rules

When deploying automated strategies with `growwapi`, always enforce institutional safety parameters:

1. **Max Loss / Capital Preservation (1% Rule)**:
   $$\text{Max Risk} = \text{Wallet Capital} \times 0.01$$
2. **Dynamic Position Sizing**:
   $$\text{Shares to Trade} = \left\lfloor \frac{\text{Max Risk}}{|\text{Entry Price} - \text{Stop Loss Price}|} \right\rfloor$$
3. **MIS 5x Margin Compliance**:
   Ensure `Required Margin` $\le \text{Available Margin}$:
   $$\text{Required Margin} = \frac{\text{Shares} \times \text{Entry Price}}{5}$$
4. **Mandatory 15:15 IST Square-Off**:
   Indian exchanges automatically square off intraday MIS positions between 15:15 and 15:20 IST with broker penalty charges. Algorithms must cancel pending orders and square off all open positions by **15:10 - 15:15 IST**.

---

## 10. GROVIQUE LIVE Platform Integration Architecture

GROVIQUE LIVE seamlessly connects to Groww across three architectural layers:

```
┌─────────────────────────────────────────────────────────────┐
│                   GROVIQUE LIVE Terminal                    │
│      (HTML5 / Tailwind / ChartIQ / Multi-Timeframe)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     Node.js Express Proxy     │   │   Gemini Vector RAG & MCP     │
│       (/api/groww/...)        │   │ (Model Context Protocol Svr)  │
│ - Forwards quotes & orders    │   │ - Natural Language Execution  │
│ - Manages auth bearer tokens  │   │ - Contextual Market Analysis  │
└───────────────┬───────────────┘   └───────────────┬───────────────┘
                │                                   │
                └─────────────────┬─────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 Groww Trade API Python SDK                  │
│                (growwapi & GrowwFeed Engine)                 │
│ - https://api.groww.in                                      │
│ - WebSocket Streaming                                       │
│ - Automated Strategy Runners & Backtesting                  │
└─────────────────────────────────────────────────────────────┘
```

1. **UI Execution Ticket**: [js/components.js](file:///c:/Users/krgir/Downloads/pulsetrade/js/components.js) provides the live execution card with dynamic 5x margin calculator, risk limit display, and instant fill engine.
2. **MCP Tooling**: [server/mcpServer.js](file:///c:/Users/krgir/Downloads/pulsetrade/server/mcpServer.js) exposes `place_order`, `get_positions`, and `get_user_margin` as MCP tools so Gemini 2.0 can verify setups and place trades with user confirmation.
3. **Algorithmic Bots**: Python strategy runners (like [scripts/groww_intraday_bot.py](file:///c:/Users/krgir/Downloads/pulsetrade/scripts/groww_intraday_bot.py)) run headlessly alongside the terminal for automated algorithmic order flow.
