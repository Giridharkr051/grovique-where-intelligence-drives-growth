// PulseTrade Live - Working Paper-Trading Sandbox & Algorithmic Position Sizer

class PaperTradingDesk {
  constructor() {
    this.initialCapital = 100000.00;
    this.walletCapital = parseFloat(localStorage.getItem('pulsetrade_wallet') || '100000.00');
    this.riskPercent = parseFloat(localStorage.getItem('pulsetrade_risk_pct') || '1.0');
    
    // Sliders & custom inputs for currently selected stock
    this.customEntry = null;
    this.customSL = null;
    this.customTarget = null;
    this.isMIS = true;
    this.isBracket = true;

    // Active open positions
    this.activePositions = JSON.parse(localStorage.getItem('pulsetrade_active_positions') || '[]');
    
    // Closed trade journal (with sample historical trades for initial display)
    this.tradeJournal = JSON.parse(localStorage.getItem('pulsetrade_journal') || '[]');
    if (this.tradeJournal.length === 0) {
      this.seedInitialJournal();
    }

    this.listeners = [];
  }

  seedInitialJournal() {
    this.tradeJournal = [
      {
        id: "tr-101",
        symbol: "M&M",
        direction: "BUY",
        entryTime: "09:32:15",
        exitTime: "09:58:40",
        entryPrice: 2885.00,
        exitPrice: 2935.00,
        qty: 35,
        pnl: 1750.00,
        pnlPct: 1.73,
        sessionPhase: "PRIME_BREAKOUT",
        setupType: "ORB Breakout",
        sector: "AUTO",
        entryRvol: 3.2,
        discipline: {
          primeWindow: true,
          respectedSL: true,
          rvolValidated: true,
          grade: "A+"
        }
      },
      {
        id: "tr-102",
        symbol: "ZOMATO",
        direction: "BUY",
        entryTime: "09:36:20",
        exitTime: "10:14:10",
        entryPrice: 260.50,
        exitPrice: 267.00,
        qty: 380,
        pnl: 2470.00,
        pnlPct: 2.50,
        sessionPhase: "PRIME_BREAKOUT",
        setupType: "Earnings Momentum",
        sector: "IT",
        entryRvol: 4.1,
        discipline: {
          primeWindow: true,
          respectedSL: true,
          rvolValidated: true,
          grade: "A+"
        }
      },
      {
        id: "tr-103",
        symbol: "RELIANCE",
        direction: "BUY",
        entryTime: "09:41:00",
        exitTime: "10:22:15",
        entryPrice: 2970.00,
        exitPrice: 2984.00,
        qty: 30,
        pnl: 420.00,
        pnlPct: 0.47,
        sessionPhase: "PRIME_BREAKOUT",
        setupType: "VWAP Bounce",
        sector: "ENERGY",
        entryRvol: 2.4,
        discipline: {
          primeWindow: true,
          respectedSL: true,
          rvolValidated: true,
          grade: "A"
        }
      },
      {
        id: "tr-104",
        symbol: "INFY",
        direction: "BUY",
        entryTime: "11:25:00",
        exitTime: "11:50:30",
        entryPrice: 1855.00,
        entryRvol: 1.4,
        exitPrice: 1845.00,
        qty: 50,
        pnl: -500.00,
        pnlPct: -0.54,
        sessionPhase: "MIDDAY_CHOP",
        setupType: "Midday Breakout",
        sector: "IT",
        discipline: {
          primeWindow: false,
          respectedSL: true,
          rvolValidated: false,
          grade: "C"
        }
      }
    ];
    this.saveJournal();
  }

  saveJournal() {
    localStorage.setItem('pulsetrade_journal', JSON.stringify(this.tradeJournal));
  }

  savePositions() {
    localStorage.setItem('pulsetrade_active_positions', JSON.stringify(this.activePositions));
    localStorage.setItem('pulsetrade_wallet', this.walletCapital.toString());
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

  setRiskPercent(pct) {
    this.riskPercent = Math.max(0.2, Math.min(5.0, pct));
    localStorage.setItem('pulsetrade_risk_pct', this.riskPercent.toString());
    this.notify();
  }

  resetWallet() {
    this.walletCapital = 100000.00;
    this.activePositions = [];
    this.savePositions();
    if (window.arcadeAudio) window.arcadeAudio.playSquareOff();
    if (window.showAppToast) {
      window.showAppToast({
        title: "Paper Wallet Reset",
        message: "Capital restored to ₹1,00,000.00 and positions cleared.",
        type: "info"
      });
    }
    this.notify();
  }

  // Calculate position sizing for a given stock
  calculateSizing(stock) {
    if (!stock) return null;

    const entry = this.customEntry !== null ? this.customEntry : stock.ltp;
    
    // Stop loss default: VWAP if entry > VWAP, or 15m ORL, or 1% below entry
    let defaultSL = stock.vwap < entry ? stock.vwap : (stock.orl < entry ? stock.orl : entry * 0.99);
    defaultSL = Number(defaultSL.toFixed(2));
    const sl = this.customSL !== null ? this.customSL : defaultSL;

    const stopDistance = Math.max(0.5, Math.abs(entry - sl));
    
    // Target default: 1:2 Risk to Reward
    const defaultTarget = Number((entry + stopDistance * 2).toFixed(2));
    const target = this.customTarget !== null ? this.customTarget : defaultTarget;
    const targetDistance = Math.abs(target - entry);

    // Max risk capital in INR
    const maxLossINR = (this.walletCapital * (this.riskPercent / 100));

    // Recommended Lot Qty = MaxLoss / StopDistance
    let qty = Math.floor(maxLossINR / stopDistance);
    if (qty < 1) qty = 1;

    // Total Position Value
    const totalPositionValue = Number((qty * entry).toFixed(2));

    // Required Margin: 5x leverage for Intraday MIS
    const requiredMargin = this.isMIS ? Number((totalPositionValue / 5).toFixed(2)) : totalPositionValue;

    // Risk Reward Ratio
    const rrRatio = Number((targetDistance / stopDistance).toFixed(1));

    // Estimated Taxes & Brokerage
    const brokerage = 20.0;
    const stt = totalPositionValue * 0.00025; // 0.025% on sell
    const exchangeTurnover = totalPositionValue * 0.0000345;
    const gst = (brokerage + exchangeTurnover) * 0.18;
    const sebiStamp = 8.5;
    const estimatedCosts = Number((brokerage + stt + exchangeTurnover + gst + sebiStamp).toFixed(2));

    const potentialProfit = Number((qty * targetDistance - estimatedCosts).toFixed(2));
    const potentialLoss = Number((qty * stopDistance + estimatedCosts).toFixed(2));

    return {
      entry,
      sl,
      target,
      stopDistance,
      targetDistance,
      qty,
      totalPositionValue,
      requiredMargin,
      rrRatio,
      estimatedCosts,
      potentialProfit,
      potentialLoss,
      maxLossINR
    };
  }

  // Execute paper order
  executeOrder(stock, direction = "BUY") {
    if (!stock) return false;

    // Check NSE Calendar Status (Weekends & Holidays)
    if (window.nseCalendar) {
      const calStatus = window.nseCalendar.getMarketStatus();
      if (!calStatus.isOpen) {
        if (window.arcadeAudio) window.arcadeAudio.playWarning();
        if (window.showAppToast) {
          window.showAppToast({
            title: "NSE Market Closed",
            message: `Exchange is closed (${calStatus.realReason}). Enable Practice Simulator Mode to test setups.`,
            type: "error"
          });
        }
        return false;
      }
    }

    const sizing = this.calculateSizing(stock);
    if (!sizing) return false;

    if (sizing.requiredMargin > this.walletCapital) {
      if (window.arcadeAudio) window.arcadeAudio.playWarning();
      if (window.showAppToast) {
        window.showAppToast({
          title: "Insufficient Paper Margin",
          message: `Required: ₹${sizing.requiredMargin.toLocaleString()} | Available: ₹${this.walletCapital.toLocaleString()}`,
          type: "error"
        });
      }
      return false;
    }

    const currentPhase = window.marketStream ? window.marketStream.getCurrentPhase() : { label: "PRIME_BREAKOUT" };
    const clockTime = window.marketStream ? window.marketStream.getClockFormatted() : "09:35:00";

    const position = {
      id: "pos-" + Date.now(),
      symbol: stock.symbol,
      direction: direction,
      entryTime: clockTime,
      entryPrice: sizing.entry,
      currentPrice: stock.ltp,
      sl: sizing.sl,
      target: sizing.target,
      qty: sizing.qty,
      totalValue: sizing.totalPositionValue,
      requiredMargin: sizing.requiredMargin,
      isMIS: this.isMIS,
      isBracket: this.isBracket,
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
      sessionPhase: window.marketStream ? window.marketStream.currentPhaseKey : "PRIME_BREAKOUT",
      entryRvol: stock.rvol,
      sector: stock.sector,
      setupType: window.marketStream ? window.marketStream.activeStrategy : "ORB"
    };

    // Deduct margin
    this.walletCapital -= sizing.requiredMargin;
    this.activePositions.push(position);
    this.savePositions();

    // Play arcade audio fill
    if (window.arcadeAudio) {
      if (direction === "BUY") window.arcadeAudio.playBuyFill();
      else window.arcadeAudio.playSellFill();
    }

    if (window.showAppToast) {
      window.showAppToast({
        title: `PAPER ${direction} FILLED: ${stock.symbol}`,
        message: `${sizing.qty} Shares @ ₹${sizing.entry.toFixed(2)} | SL: ₹${sizing.sl} | TGT: ₹${sizing.target}`,
        type: "success",
        symbol: stock.symbol
      });
    }

    this.notify();
    return true;
  }

  // Update unrealized P&L on every market tick & check Bracket Order triggers
  updateTickPositions(marketStream) {
    if (this.activePositions.length === 0) return;

    let stateChanged = false;
    const positionsToClose = [];

    this.activePositions.forEach(pos => {
      const liveStock = marketStream.stocks.find(s => s.symbol === pos.symbol);
      if (liveStock) {
        pos.currentPrice = liveStock.ltp;
        const diff = pos.direction === "BUY" ? (pos.currentPrice - pos.entryPrice) : (pos.entryPrice - pos.currentPrice);
        pos.unrealizedPnl = Number((diff * pos.qty).toFixed(2));
        pos.unrealizedPnlPct = Number(((diff / pos.entryPrice) * 100).toFixed(2));
        stateChanged = true;

        // Auto trigger bracket SL or Target
        if (pos.isBracket) {
          if (pos.direction === "BUY") {
            if (pos.currentPrice >= pos.target) {
              positionsToClose.push({ pos, reason: "Target Hit 🎯" });
            } else if (pos.currentPrice <= pos.sl) {
              positionsToClose.push({ pos, reason: "Stop-Loss Hit 🛑" });
            }
          } else {
            if (pos.currentPrice <= pos.target) {
              positionsToClose.push({ pos, reason: "Target Hit 🎯" });
            } else if (pos.currentPrice >= pos.sl) {
              positionsToClose.push({ pos, reason: "Stop-Loss Hit 🛑" });
            }
          }
        }
      }
    });

    if (positionsToClose.length > 0) {
      positionsToClose.forEach(({ pos, reason }) => {
        this.squareOffPosition(pos.id, reason);
      });
    } else if (stateChanged) {
      this.notify();
    }
  }

  // 1-Click Square Off
  squareOffPosition(positionId, reason = "Manual Square-Off") {
    const idx = this.activePositions.findIndex(p => p.id === positionId);
    if (idx === -1) return;

    const pos = this.activePositions[idx];
    const exitTime = window.marketStream ? window.marketStream.getClockFormatted() : "09:50:00";
    const finalPnl = pos.unrealizedPnl;

    // Return margin + P&L to paper wallet
    this.walletCapital += pos.requiredMargin + finalPnl;
    this.activePositions.splice(idx, 1);
    this.savePositions();

    // Grade trade discipline
    const inPrimeWindow = pos.sessionPhase === "PRIME_BREAKOUT";
    const respectedSL = reason.includes("Target") || reason.includes("Manual") || (finalPnl >= -(pos.totalValue * 0.015));
    const rvolOk = pos.entryRvol >= 2.0;

    let grade = "B";
    if (finalPnl > 0 && inPrimeWindow && rvolOk) grade = "A+";
    else if (finalPnl > 0 && respectedSL) grade = "A";
    else if (finalPnl < 0 && respectedSL && inPrimeWindow) grade = "B";
    else if (finalPnl < 0 && !inPrimeWindow) grade = "C";
    else if (finalPnl < 0 && !respectedSL) grade = "F";

    const closedTrade = {
      id: "tr-" + Date.now(),
      symbol: pos.symbol,
      direction: pos.direction,
      entryTime: pos.entryTime,
      exitTime: exitTime,
      entryPrice: pos.entryPrice,
      exitPrice: pos.currentPrice,
      qty: pos.qty,
      pnl: finalPnl,
      pnlPct: pos.unrealizedPnlPct,
      sessionPhase: pos.sessionPhase,
      setupType: pos.setupType,
      sector: pos.sector,
      exitReason: reason,
      discipline: {
        primeWindow: inPrimeWindow,
        respectedSL: respectedSL,
        rvolValidated: rvolOk,
        grade: grade
      }
    };

    this.tradeJournal.unshift(closedTrade);
    this.saveJournal();

    if (window.arcadeAudio) {
      window.arcadeAudio.playSquareOff();
    }

    if (window.showAppToast) {
      window.showAppToast({
        title: `POSITION CLOSED: ${pos.symbol}`,
        message: `${reason} • P&L: ${finalPnl >= 0 ? '+' : ''}₹${finalPnl.toLocaleString()} (${pos.unrealizedPnlPct}%) [Grade ${grade}]`,
        type: finalPnl >= 0 ? "success" : "info"
      });
    }

    this.notify();
  }

  squareOffAll() {
    if (this.activePositions.length === 0) return;
    const ids = this.activePositions.map(p => p.id);
    ids.forEach(id => this.squareOffPosition(id, "Bulk Square-Off"));
  }

  getTotalUnrealizedPnl() {
    return this.activePositions.reduce((acc, p) => acc + (p.unrealizedPnl || 0), 0);
  }

  getJournalMetrics() {
    if (this.tradeJournal.length === 0) {
      return { totalTrades: 0, wins: 0, losses: 0, winRate: 0, netPnl: 0, profitFactor: 0, disciplineScore: 0 };
    }

    const totalTrades = this.tradeJournal.length;
    const wins = this.tradeJournal.filter(t => t.pnl > 0);
    const losses = this.tradeJournal.filter(t => t.pnl < 0);
    const winRate = Number(((wins.length / totalTrades) * 100).toFixed(1));
    const netPnl = Number(this.tradeJournal.reduce((acc, t) => acc + t.pnl, 0).toFixed(2));

    const totalWinAmount = wins.reduce((acc, t) => acc + t.pnl, 0);
    const totalLossAmount = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0)) || 1;
    const profitFactor = Number((totalWinAmount / totalLossAmount).toFixed(2));

    const primeWindowEntries = this.tradeJournal.filter(t => t.discipline.primeWindow).length;
    const disciplineScore = Number(((primeWindowEntries / totalTrades) * 100).toFixed(0));

    return {
      totalTrades,
      winsCount: wins.length,
      lossesCount: losses.length,
      winRate,
      netPnl,
      profitFactor,
      disciplineScore
    };
  }
}

window.paperTradingDesk = new PaperTradingDesk();
