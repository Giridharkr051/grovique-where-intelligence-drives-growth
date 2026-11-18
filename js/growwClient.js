// PulseTrade Live - Groww Trade API & Market Data Client
// Enables live intraday broker execution and market data streaming from Groww

class GrowwClient {
  constructor() {
    this.activeGrowwOrders = JSON.parse(localStorage.getItem('pulsetrade_groww_orders') || '[]');
    this.listeners = [];
  }

  isLive() {
    return window.settingsManager ? window.settingsManager.isGrowwLive() : false;
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this));
  }

  saveOrders() {
    localStorage.setItem('pulsetrade_groww_orders', JSON.stringify(this.activeGrowwOrders));
  }

  // Fetch live market data quote from Groww
  async getLiveQuote(symbol) {
    try {
      const res = await fetch(`/api/groww/quote?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error('Groww quote request failed');
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn(`Groww market quote fallback for ${symbol}:`, err);
      // Fallback to internal high-precision feed
      const s = window.marketStream ? window.marketStream.stocks.find(st => st.symbol === symbol) : null;
      if (s) {
        return {
          tradingSymbol: s.symbol,
          exchange: 'NSE',
          segment: 'EQUITY',
          ltp: s.ltp,
          vwap: s.vwap,
          open: s.dayOpen,
          high: s.dayHigh,
          low: s.dayLow,
          volume: s.volume,
          timestamp: Date.now()
        };
      }
      return null;
    }
  }

  // Execute order via Groww or Paper Sandbox based on active mode
  async executeOrder(stock, direction = 'BUY') {
    if (!stock) return false;

    // Check NSE Market Status (Weekends & Holidays)
    if (window.nseCalendar) {
      const cal = window.nseCalendar.getMarketStatus();
      if (!cal.isOpen) {
        if (window.arcadeAudio) window.arcadeAudio.playWarning();
        if (window.showAppToast) {
          window.showAppToast({
            title: "NSE Market Closed",
            message: `Exchange is closed (${cal.realReason}). Enable Practice Simulator Mode to test setups.`,
            type: "error"
          });
        }
        return false;
      }
      if (this.isLive() && cal.isRealWorldClosed) {
        if (window.arcadeAudio) window.arcadeAudio.playWarning();
        if (window.showAppToast) {
          window.showAppToast({
            title: "Live Groww Order Blocked",
            message: `NSE exchange is closed (${cal.realReason}). Real MIS orders cannot be routed on weekends or public holidays. Switch to Sandbox mode.`,
            type: "error"
          });
        }
        return false;
      }
    }

    // Check if Live Groww mode is enabled
    if (this.isLive()) {
      return this.promptGrowwLiveConfirmation(stock, direction);
    } else {
      // Paper Trading Sandbox mode
      return window.paperTradingDesk.executeOrder(stock, direction);
    }
  }

  // Show strict confirmation dialog before sending REAL orders to Groww
  promptGrowwLiveConfirmation(stock, direction) {
    const sizing = window.paperTradingDesk.calculateSizing(stock);
    if (!sizing) return false;

    const modal = document.createElement('div');
    modal.id = 'growwConfirmModal';
    modal.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs';
    
    modal.innerHTML = `
      <div class="bg-[#111622] border-2 border-[#FFB800] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col glow-amber">
        <div class="p-4 bg-[#FFB800]/15 border-b border-[#FFB800]/30 flex items-center justify-between text-[#FFB800]">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[22px]">warning</span>
            <span class="font-bold text-sm">CONFIRM LIVE GROWW EXECUTION</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-[#FFB800] text-[#090B10] font-bold text-[10px]">REAL MONEY</span>
        </div>

        <div class="p-5 flex flex-col gap-3 text-slate-200">
          <p class="text-slate-300 text-xs">
            You are about to place a <span class="font-bold text-[#FFB800]">LIVE INTRADAY MIS ORDER</span> through your connected Groww Broker API account.
          </p>

          <div class="p-3 rounded-xl bg-[#191c22] border border-slate-800 flex flex-col gap-2">
            <div class="flex justify-between items-center text-sm">
              <span class="font-bold text-slate-100">${stock.symbol} (NSE)</span>
              <span class="px-2 py-0.5 rounded font-bold ${direction === 'BUY' ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-[#FF2A6D]/20 text-[#FF2A6D]'}">${direction}</span>
            </div>
            <div class="flex justify-between"><span class="text-slate-400">Order Type:</span><span class="font-bold text-slate-200">INTRADAY MIS (Auto-Square 15:15)</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Quantity:</span><span class="font-bold text-slate-100">${sizing.qty} Shares</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Limit / Fill Price:</span><span class="font-bold text-[#00F0FF]">₹${stock.ltp.toFixed(2)}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Stop-Loss Level:</span><span class="font-bold text-[#FF2A6D]">₹${sizing.sl}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Target Level (1:2):</span><span class="font-bold text-[#00FF88]">₹${sizing.target}</span></div>
            <div class="flex justify-between pt-1 border-t border-slate-800"><span class="text-slate-400">Required Margin:</span><span class="font-bold text-[#00FF88]">₹${sizing.requiredMargin.toLocaleString('en-IN')}</span></div>
          </div>

          <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[15px] text-[#00F0FF]">lock</span>
            <span>Groww Client ID: <span class="text-slate-200 font-bold">${window.settingsManager.state.groww.clientId || 'GROWW_DEFAULT'}</span></span>
          </div>
        </div>

        <div class="p-4 bg-[#191c22] border-t border-slate-800 flex items-center justify-between gap-3">
          <button onclick="document.getElementById('growwConfirmModal').remove()"
                  class="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all">
            Cancel
          </button>
          <button id="btnGrowwLiveExecute"
                  class="flex-1 py-2 rounded-lg arcade-btn arcade-btn-green font-bold shadow-lg flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">bolt</span>
            <span>Send to Groww</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btnGrowwLiveExecute').onclick = async () => {
      modal.remove();
      await this.dispatchLiveGrowwOrder(stock, direction, sizing);
    };

    return true;
  }

  // Dispatch live order via server proxy to Groww
  async dispatchLiveGrowwOrder(stock, direction, sizing) {
    if (window.arcadeAudio) window.arcadeAudio.playBlip();

    try {
      const payload = {
        symbol: stock.symbol,
        exchange: 'NSE',
        transactionType: direction,
        orderType: 'MARKET',
        productType: 'MIS',
        quantity: sizing.qty,
        price: stock.ltp,
        stopLoss: sizing.sl,
        target: sizing.target
      };

      const res = await fetch('/api/groww/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        // Record in active live Groww orders
        const growwOrder = {
          ...result,
          id: result.orderId,
          entryPrice: stock.ltp,
          currentPrice: stock.ltp,
          sl: sizing.sl,
          target: sizing.target,
          qty: sizing.qty,
          unrealizedPnl: 0,
          unrealizedPnlPct: 0,
          broker: 'GROWW_LIVE'
        };

        this.activeGrowwOrders.push(growwOrder);
        this.saveOrders();

        if (window.arcadeAudio) {
          if (direction === 'BUY') window.arcadeAudio.playBuyFill();
          else window.arcadeAudio.playSellFill();
        }

        if (window.showAppToast) {
          window.showAppToast({
            title: `GROWW LIVE ORDER EXECUTED!`,
            message: `Order #${result.orderId}: ${direction} ${sizing.qty} ${stock.symbol} @ ₹${result.fillPrice.toFixed(2)} (MIS Intraday)`,
            type: 'success',
            symbol: stock.symbol
          });
        }

        // Also sync into journal desk
        window.paperTradingDesk.activePositions.push({
          ...growwOrder,
          brokerTag: 'GROWW LIVE'
        });
        window.paperTradingDesk.savePositions();
        window.paperTradingDesk.notify();
        this.notify();
        return true;
      } else {
        throw new Error(result.error || 'Groww execution rejected by RMS');
      }
    } catch (err) {
      if (window.arcadeAudio) window.arcadeAudio.playWarning();
      if (window.showAppToast) {
        window.showAppToast({
          title: `GROWW ORDER FAILED`,
          message: err.message,
          type: 'error'
        });
      }
      return false;
    }
  }

  // Square off position on Groww
  async squareOffGrowwPosition(orderId, symbol, qty, direction) {
    try {
      const exitDirection = direction === 'BUY' ? 'SELL' : 'BUY';
      const res = await fetch('/api/groww/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          exchange: 'NSE',
          transactionType: exitDirection,
          quantity: qty,
          orderType: 'MARKET',
          productType: 'MIS'
        })
      });

      const data = await res.json();
      if (data.success) {
        this.activeGrowwOrders = this.activeGrowwOrders.filter(o => o.orderId !== orderId);
        this.saveOrders();
        if (window.arcadeAudio) window.arcadeAudio.playSquareOff();
        if (window.showAppToast) {
          window.showAppToast({
            title: `GROWW POSITION SQUARED OFF`,
            message: `Closed order #${orderId} for ${symbol} at Market`,
            type: 'info'
          });
        }
        this.notify();
      }
    } catch (err) {
      console.error('Groww square off failed:', err);
    }
  }
}

window.growwClient = new GrowwClient();
