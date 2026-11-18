// PulseTrade Live - Smart Watchlist & Visual Alert Studio

class AlertStudio {
  constructor() {
    this.watchlist = JSON.parse(localStorage.getItem('pulsetrade_watchlist') || '["TATAMOTORS", "M&M", "ZOMATO", "RELIANCE", "BAJFINANCE", "INFY", "HDFCBANK"]');
    
    this.rules = JSON.parse(localStorage.getItem('pulsetrade_rules') || '[]');
    if (this.rules.length === 0) {
      this.seedInitialRules();
    }

    this.alertHistory = [];
    this.listeners = [];
  }

  seedInitialRules() {
    this.rules = [
      {
        id: "rule-1",
        symbol: "TATAMOTORS",
        condition: "CROSSES_ORH",
        targetVal: 978.00,
        during: "PRIME_WINDOW",
        rvolThreshold: 2.0,
        action: "CHIME_AND_TOAST",
        enabled: true,
        triggeredCount: 1,
        lastTriggered: "09:33 IST"
      },
      {
        id: "rule-2",
        symbol: "ZOMATO",
        condition: "CROSSES_VWAP",
        targetVal: 264.10,
        during: "ANY_TIME",
        rvolThreshold: 2.5,
        action: "CHIME_AND_TOAST",
        enabled: true,
        triggeredCount: 0,
        lastTriggered: null
      },
      {
        id: "rule-3",
        symbol: "M&M",
        condition: "CROSSES_DAY_HIGH",
        targetVal: 2955.00,
        during: "PRIME_WINDOW",
        rvolThreshold: 2.0,
        action: "CHIME_AND_TOAST",
        enabled: true,
        triggeredCount: 0,
        lastTriggered: null
      }
    ];
    this.saveRules();
  }

  saveRules() {
    localStorage.setItem('pulsetrade_rules', JSON.stringify(this.rules));
  }

  saveWatchlist() {
    localStorage.setItem('pulsetrade_watchlist', JSON.stringify(this.watchlist));
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

  toggleWatchlist(symbol) {
    const idx = this.watchlist.indexOf(symbol);
    if (idx >= 0) {
      this.watchlist.splice(idx, 1);
    } else {
      this.watchlist.push(symbol);
    }
    this.saveWatchlist();
    if (window.arcadeAudio) window.arcadeAudio.playBlip();
    this.notify();
  }

  isInWatchlist(symbol) {
    return this.watchlist.includes(symbol);
  }

  // Group watched stocks into the 3 specified Kanban columns
  getKanbanColumns(stocks) {
    const watched = stocks.filter(s => this.watchlist.includes(s.symbol));

    const readyToBreakout = [];
    const approachingVwap = [];
    const extendedAvoid = [];

    watched.forEach(s => {
      const vwapDiffPct = Math.abs((s.ltp - s.vwap) / s.vwap) * 100;
      
      if (s.fnoBan || vwapDiffPct > 3.0 || s.score < 65) {
        extendedAvoid.push(s);
      } else if (vwapDiffPct <= 0.8 && s.ltp >= s.vwap * 0.99) {
        approachingVwap.push(s);
      } else if (s.score >= 80 && (s.ltp >= s.orh * 0.99 || s.rvol >= 2.5)) {
        readyToBreakout.push(s);
      } else {
        approachingVwap.push(s);
      }
    });

    return {
      readyToBreakout,
      approachingVwap,
      extendedAvoid
    };
  }

  addRule(newRule) {
    newRule.id = "rule-" + Date.now();
    newRule.enabled = true;
    newRule.triggeredCount = 0;
    newRule.lastTriggered = null;
    this.rules.unshift(newRule);
    this.saveRules();

    if (window.arcadeAudio) window.arcadeAudio.playBlip();
    if (window.showAppToast) {
      window.showAppToast({
        title: "Rule Created",
        message: `Alert set for ${newRule.symbol} on ${newRule.condition}`,
        type: "info"
      });
    }

    this.notify();
  }

  deleteRule(ruleId) {
    this.rules = this.rules.filter(r => r.id !== ruleId);
    this.saveRules();
    if (window.arcadeAudio) window.arcadeAudio.playBlip();
    this.notify();
  }

  toggleRule(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      this.saveRules();
      if (window.arcadeAudio) window.arcadeAudio.playBlip();
      this.notify();
    }
  }

  // Trigger test notification for rule
  testRule(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return;

    if (window.arcadeAudio) window.arcadeAudio.playAlertChime();
    
    if (window.showAppToast) {
      window.showAppToast({
        title: `ALERT TRIGGERED: ${rule.symbol}`,
        message: `Test condition met: ${rule.condition} @ ₹${rule.targetVal || 'LTP'}`,
        type: "success",
        symbol: rule.symbol
      });
    }
  }

  // Check rules against live tick
  evaluateRules(marketStream) {
    if (!this.rules || this.rules.length === 0) return;

    const currentPhase = marketStream.getCurrentPhase();
    const isPrime = marketStream.currentPhaseKey === "PRIME_BREAKOUT";

    this.rules.forEach(rule => {
      if (!rule.enabled) return;

      const stock = marketStream.stocks.find(s => s.symbol === rule.symbol);
      if (!stock) return;

      // Phase check
      if (rule.during === "PRIME_WINDOW" && !isPrime) return;

      // RVOL check
      if (rule.rvolThreshold && stock.rvol < rule.rvolThreshold) return;

      let triggered = false;
      let reasonText = "";

      if (rule.condition === "CROSSES_ORH" && stock.ltp >= stock.orh) {
        triggered = true;
        reasonText = `Crossed 15m ORH (₹${stock.orh.toFixed(2)}) with ${stock.rvol}x RVOL`;
      } else if (rule.condition === "CROSSES_VWAP" && stock.ltp >= stock.vwap && stock.ltp <= stock.vwap * 1.006) {
        triggered = true;
        reasonText = `Bounced off Cyan VWAP (₹${stock.vwap.toFixed(2)})`;
      } else if (rule.condition === "CROSSES_DAY_HIGH" && stock.ltp >= stock.dayHigh) {
        triggered = true;
        reasonText = `Printed New Day High ₹${stock.dayHigh.toFixed(2)}`;
      }

      if (triggered) {
        // Prevent spamming triggers within 30 seconds
        const now = Date.now();
        if (!rule._lastTriggerTime || now - rule._lastTriggerTime > 30000) {
          rule._lastTriggerTime = now;
          rule.triggeredCount = (rule.triggeredCount || 0) + 1;
          rule.lastTriggered = marketStream.getClockFormatted() + " IST";
          this.saveRules();

          if (window.arcadeAudio) window.arcadeAudio.playAlertChime();

          if (window.showAppToast) {
            window.showAppToast({
              title: `⚡ RADAR ALERT: ${stock.symbol}`,
              message: reasonText,
              type: "success",
              symbol: stock.symbol
            });
          }

          this.alertHistory.unshift({
            time: rule.lastTriggered,
            symbol: stock.symbol,
            message: reasonText
          });
          if (this.alertHistory.length > 20) this.alertHistory.pop();

          this.notify();
        }
      }
    });
  }
}

window.alertStudio = new AlertStudio();
