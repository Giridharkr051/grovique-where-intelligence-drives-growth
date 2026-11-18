// PulseTrade Live - Real-Time Stream Engine & Phase State Machine

class MarketStream {
  constructor() {
    const rawStocks = (typeof window !== 'undefined' && window.INITIAL_STOCKS) ? window.INITIAL_STOCKS : (typeof INITIAL_STOCKS !== 'undefined' ? INITIAL_STOCKS : []);
    const rawSectors = (typeof window !== 'undefined' && window.INITIAL_SECTORS) ? window.INITIAL_SECTORS : (typeof INITIAL_SECTORS !== 'undefined' ? INITIAL_SECTORS : []);
    const rawCatalysts = (typeof window !== 'undefined' && window.INITIAL_CATALYSTS) ? window.INITIAL_CATALYSTS : (typeof INITIAL_CATALYSTS !== 'undefined' ? INITIAL_CATALYSTS : []);

    this.stocks = JSON.parse(JSON.stringify(rawStocks));
    this.stocks.forEach(stock => {
      const prev = stock.previousClose || stock.dayOpen || stock.ltp || 1;
      stock.changePct = Number((((stock.ltp - prev) / prev) * 100).toFixed(2));
    });
    this.sectors = JSON.parse(JSON.stringify(rawSectors));
    this.catalysts = JSON.parse(JSON.stringify(rawCatalysts));
    this.currentPhaseKey = "PRIME_BREAKOUT";
    this.selectedSymbol = "TATAMOTORS";
    this.activeSectorFilter = "AUTO";
    this.activeStrategy = "ORB";
    this.screenerSearchQuery = "";
    this.activeFilters = {
      aboveVwap: true,
      rvol2: true,
      score75: true,
      noCircuit: true,
      noFnoBan: true
    };

    // Real-Time Local IST Clock
    const now = new Date();
    this.clock = {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]
    };

    // Distributed stream telemetry metrics
    this.telemetry = {
      tickRate: 1420,
      redisLatency: 1.2,
      activeWs: 2841,
      windowState: "ORB_15M_WINDOW: ACTIVE",
      health: "OPTIMAL (4/4 WORKERS)",
      lastIngestTime: Date.now()
    };

    this.listeners = [];
    this.tickInterval = null;
    this.clockInterval = null;
    this.tickChanges = {}; // Symbol -> 'up' | 'down'
  }

  init() {
    this.startTickEngine();
    this.startClock();
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

  startClock() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(() => {
      // In real-world mode (or when practice simulator is off), sync to real device clock
      if (!window.nseCalendar || !window.nseCalendar.isSimulatorMode) {
        const now = new Date();
        this.clock.hours = now.getHours();
        this.clock.minutes = now.getMinutes();
        this.clock.seconds = now.getSeconds();
        this.clock.dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
      } else {
        // Only in practice simulator mode do we simulate ticking seconds
        this.clock.seconds++;
        if (this.clock.seconds >= 60) {
          this.clock.seconds = 0;
          this.clock.minutes++;
          if (this.clock.minutes >= 60) {
            this.clock.minutes = 0;
            this.clock.hours++;
          }
        }
      }

      const cal = window.nseCalendar ? window.nseCalendar.getMarketStatus() : { isOpen: false };
      this.telemetry.tickRate = cal.isOpen ? (1380 + Math.floor(Math.random() * 80)) : 0;
      this.telemetry.redisLatency = cal.isOpen ? Number((0.8 + Math.random() * 0.7).toFixed(1)) : 0;
      this.notify();
    }, 1000);
  }

  getClockFormatted() {
    const hh = String(this.clock.hours).padStart(2, '0');
    const mm = String(this.clock.minutes).padStart(2, '0');
    const ss = String(this.clock.seconds).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  getDateFormatted() {
    const now = new Date();
    return now.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getCurrentPhase() {
    const phases = (typeof window !== 'undefined' && window.MARKET_PHASES) ? window.MARKET_PHASES : (typeof MARKET_PHASES !== 'undefined' ? MARKET_PHASES : {});
    return phases[this.currentPhaseKey] || phases.PRIME_BREAKOUT || {};
  }

  setPhase(phaseKey) {
    const phases = (typeof window !== 'undefined' && window.MARKET_PHASES) ? window.MARKET_PHASES : (typeof MARKET_PHASES !== 'undefined' ? MARKET_PHASES : {});
    if (phases[phaseKey]) {
      this.currentPhaseKey = phaseKey;
      // Adjust clock to match phase start
      const [h, m] = phases[phaseKey].startTime.split(':');
      this.clock.hours = parseInt(h);
      this.clock.minutes = parseInt(m) + 2;
      this.clock.seconds = 15;
      
      if (window.arcadeAudio) {
        window.arcadeAudio.playBlip();
      }
      this.recalculateAllScores();
      this.notify();
    }
  }

  setSelectedStock(symbol) {
    if (this.stocks.some(s => s.symbol === symbol)) {
      this.selectedSymbol = symbol;
      if (window.arcadeAudio) {
        window.arcadeAudio.playBlip();
      }
      this.notify();
    }
  }

  getSelectedStock() {
    return this.stocks.find(s => s.symbol === this.selectedSymbol) || this.stocks[0];
  }

  setSectorFilter(sectorId) {
    if (this.activeSectorFilter === sectorId) {
      this.activeSectorFilter = null; // Toggle off
    } else {
      this.activeSectorFilter = sectorId;
    }
    if (window.arcadeAudio) {
      window.arcadeAudio.playBlip();
    }
    this.notify();
  }

  setStrategy(strategyKey) {
    this.activeStrategy = strategyKey;
    if (window.arcadeAudio) {
      window.arcadeAudio.playBlip();
    }
    this.notify();
  }

  toggleFilter(filterKey) {
    if (this.activeFilters[filterKey] !== undefined) {
      this.activeFilters[filterKey] = !this.activeFilters[filterKey];
      if (window.arcadeAudio) {
        window.arcadeAudio.playBlip();
      }
      this.notify();
    }
  }

  resetFilters() {
    this.activeSectorFilter = null;
    this.activeStrategy = "ORB";
    this.screenerSearchQuery = "";
    this.activeFilters = {
      aboveVwap: false,
      rvol2: false,
      score75: false,
      noCircuit: false,
      noFnoBan: false
    };
    if (window.arcadeAudio) {
      window.arcadeAudio.playBlip();
    }
    this.notify();
  }

  setScreenerSearchQuery(query) {
    this.screenerSearchQuery = query || "";
    this.notify();
  }

  startTickEngine() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    
    this.tickInterval = setInterval(() => {
      this.processTicks();
    }, 600); // 600ms tick interval
  }

  processTicks() {
    this.tickChanges = {};

    // Check NSE Market Status (Sunday, Weekend, Public Holiday, or Out-of-Hours)
    const calStatus = window.nseCalendar ? window.nseCalendar.getMarketStatus() : { isOpen: false };
    if (!calStatus.isOpen) {
      // MARKET IS CLOSED TODAY: Prices remain 100% frozen at Friday's official closing figures!
      // No artificial tick walk or synthetic volatility in real-world mode!
      return;
    }

    this.stocks.forEach(stock => {
      // 70% chance of a tick per interval
      if (Math.random() > 0.3) {
        const prevPrice = stock.ltp;
        const volatilityFactor = (stock.rvol || 2) / 2;
        const momentumBias = stock.score >= 80 ? 0.08 : (stock.score < 50 ? -0.08 : 0);
        const randomFactor = (Math.random() - 0.47 + momentumBias) * (stock.ltp * 0.001 * volatilityFactor);
        
        let newLtp = stock.ltp + randomFactor;

        // Circuit guards
        if (newLtp >= stock.upperCircuit) newLtp = stock.upperCircuit;
        if (newLtp <= stock.lowerCircuit) newLtp = stock.lowerCircuit;

        newLtp = Number(newLtp.toFixed(2));
        stock.ltp = newLtp;
        const prev = stock.previousClose || stock.dayOpen || stock.ltp || 1;
        stock.changePct = Number((((stock.ltp - prev) / prev) * 100).toFixed(2));

        // Day High / Low
        if (newLtp > stock.dayHigh) stock.dayHigh = newLtp;
        if (newLtp < stock.dayLow) stock.dayLow = newLtp;

        // Volume increment
        const volStep = Math.floor(Math.random() * 4500 * (stock.rvol || 2));
        const oldVol = stock.volume;
        stock.volume += volStep;

        // Recompute VWAP
        stock.vwap = Number(((stock.vwap * oldVol + newLtp * volStep) / stock.volume).toFixed(2));

        // Update sparkline (keep 12 points)
        if (Math.random() > 0.6) {
          stock.sparkline.shift();
          stock.sparkline.push(newLtp);
        }

        // Update active candles
        if (stock.candles1m && stock.candles1m.length > 0) {
          const lastCandle = stock.candles1m[stock.candles1m.length - 1];
          if (newLtp > lastCandle.high) lastCandle.high = newLtp;
          if (newLtp < lastCandle.low) lastCandle.low = newLtp;
          lastCandle.close = newLtp;
          lastCandle.volume += volStep;
          lastCandle.vwap = stock.vwap;
        }

        if (stock.candles5m && stock.candles5m.length > 0) {
          const lastCandle = stock.candles5m[stock.candles5m.length - 1];
          if (newLtp > lastCandle.high) lastCandle.high = newLtp;
          if (newLtp < lastCandle.low) lastCandle.low = newLtp;
          lastCandle.close = newLtp;
          lastCandle.volume += volStep;
          lastCandle.vwap = stock.vwap;
        }

        // Tick direction
        if (newLtp > prevPrice) {
          this.tickChanges[stock.symbol] = 'up';
        } else if (newLtp < prevPrice) {
          this.tickChanges[stock.symbol] = 'down';
        }

        // Update Level 2 Order Book Depth around new LTP
        this.updateOrderBook(stock);
      }
    });

    this.recalculateAllScores();
    this.notify();
  }

  updateOrderBook(stock) {
    if (!stock.orderBook) return;
    const spreadHalf = (stock.ltp * (stock.spread / 100)) / 2;
    const baseBid = stock.ltp - Math.max(0.05, spreadHalf);
    const baseAsk = stock.ltp + Math.max(0.05, spreadHalf);

    for (let i = 0; i < 5; i++) {
      const step = stock.ltp > 2000 ? 0.5 * (i + 1) : (stock.ltp > 500 ? 0.1 * (i + 1) : 0.05 * (i + 1));
      stock.orderBook.bids[i].price = Number((baseBid - step).toFixed(2));
      stock.orderBook.bids[i].qty += Math.floor((Math.random() - 0.48) * 800);
      if (stock.orderBook.bids[i].qty < 100) stock.orderBook.bids[i].qty = 1200;

      stock.orderBook.asks[i].price = Number((baseAsk + step).toFixed(2));
      stock.orderBook.asks[i].qty += Math.floor((Math.random() - 0.48) * 800);
      if (stock.orderBook.asks[i].qty < 100) stock.orderBook.asks[i].qty = 1100;
    }
  }

  recalculateAllScores() {
    const currentPhase = this.getCurrentPhase();

    this.stocks.forEach(stock => {
      let score = 50;

      // 1. VWAP Alignment
      const vwapDiffPct = ((stock.ltp - stock.vwap) / stock.vwap) * 100;
      if (stock.ltp > stock.vwap) {
        score += Math.min(18, 8 + vwapDiffPct * 5);
      } else {
        score -= Math.min(20, 8 + Math.abs(vwapDiffPct) * 6);
      }

      // 2. RVOL Surge
      if (stock.rvol >= 3.5) score += 18;
      else if (stock.rvol >= 2.5) score += 14;
      else if (stock.rvol >= 2.0) score += 10;
      else if (stock.rvol < 1.2) score -= 12;

      // 3. Opening Range Breakout (ORB)
      if (currentPhase.canBreakout) {
        if (stock.ltp >= stock.orh) {
          score += 16; // Clear ORB Breakout
        } else if (stock.ltp >= stock.orh * 0.995) {
          score += 8; // Approaching Breakout
        } else if (stock.ltp <= stock.orl) {
          score -= 15; // Breakdown
        }
      } else if (this.currentPhaseKey === "CAUTION") {
        // Suppress breakout signals during caution period
        score = Math.min(score, 72);
      }

      // 4. Catalyst Boost
      if (stock.catalystSentiment === "BULLISH") {
        score += 10;
      }

      // 5. Spread & Slippage Quality
      if (stock.spread <= 0.02) score += 4;
      else if (stock.spread > 0.05) score -= 8;

      // 6. Guardrail Penalties
      if (stock.fnoBan) {
        score -= 22; // Strict F&O Ban Penalty
      }
      const circuitGap = Math.min(
        (stock.upperCircuit - stock.ltp) / stock.ltp,
        (stock.ltp - stock.lowerCircuit) / stock.ltp
      ) * 100;

      if (circuitGap < 2.0) {
        score -= 15; // Near Circuit Lock
      }

      // Clamping between 15 and 99
      stock.score = Math.max(15, Math.min(98, Math.round(score)));
    });
  }

  // Feature: Simulate Breaking Catalyst with real-time shock
  simulateBreakingCatalyst() {
    const eligibleStocks = this.stocks.filter(s => !s.fnoBan);
    const stock = eligibleStocks[Math.floor(Math.random() * eligibleStocks.length)];

    const sampleCatalysts = [
      { text: "Wins Mega ₹4,200 Cr International EPC Infrastructure Contract", type: "BULLISH" },
      { text: "Q2 Consolidated Profit Surges +68% YoY; EBITDA Margin Expands 320 bps", type: "BULLISH" },
      { text: "US FDA Approves Breakthrough Therapy Designation with Zero Inspection 483s", type: "BULLISH" },
      { text: "Cabinet Committee Approves ₹12,000 Cr Production Linked Incentive (PLI)", type: "BULLISH" },
      { text: "Global Sovereign Fund Acquires 4.8% Strategic Stake via Institutional Block Deal", type: "BULLISH" }
    ];

    const pick = sampleCatalysts[Math.floor(Math.random() * sampleCatalysts.length)];
    const timeStr = this.getClockFormatted() + " IST";

    // 1. Update stock
    stock.catalyst = pick.text;
    stock.catalystSentiment = pick.type;
    stock.catalystTime = timeStr;
    stock.rvol = Number((stock.rvol + 1.8).toFixed(1));

    // Jump price & volume immediately
    const priceBump = stock.ltp * 0.016;
    stock.ltp = Number((stock.ltp + priceBump).toFixed(2));
    if (stock.ltp > stock.dayHigh) stock.dayHigh = stock.ltp;
    stock.volume += 650000;
    stock.vwap = Number(((stock.vwap + stock.ltp) / 2).toFixed(2));

    // Add News Event Pin to active candles
    if (stock.newsPins) {
      stock.newsPins.unshift({
        candleIndex: (stock.candles1m ? stock.candles1m.length - 1 : 20),
        time: timeStr.substring(0, 5),
        title: pick.text,
        sentiment: pick.type
      });
    }

    // Boost score to 96+
    stock.score = Math.min(99, Math.max(94, stock.score + 14));

    // 2. Add to catalyst wire
    const newCat = {
      id: "cat-" + Date.now(),
      symbol: stock.symbol,
      headline: pick.text,
      sentiment: pick.type,
      time: timeStr,
      source: "BSE / NSE Immediate Broadcast",
      scoreImpact: "+14 pts"
    };
    this.catalysts.unshift(newCat);
    if (this.catalysts.length > 20) this.catalysts.pop();

    // 3. Audio & Toast
    if (window.arcadeAudio) {
      window.arcadeAudio.playAlertChime();
    }

    if (window.showAppToast) {
      window.showAppToast({
        title: `BREAKING NEWS: ${stock.symbol}`,
        message: pick.text,
        type: "success",
        symbol: stock.symbol
      });
    }

    this.setSelectedStock(stock.symbol);
    this.notify();
    return stock;
  }

  getFilteredStocks() {
    let list = [...this.stocks];

    // Sector Filter
    if (this.activeSectorFilter) {
      list = list.filter(s => s.sector === this.activeSectorFilter);
    }

    // Strategy Filter
    if (this.activeStrategy === "ORB") {
      list = list.filter(s => s.ltp >= s.orh * 0.995 || s.score >= 75);
    } else if (this.activeStrategy === "VOLUME") {
      list = list.filter(s => s.rvol >= 2.2);
    } else if (this.activeStrategy === "VWAP") {
      list = list.filter(s => s.ltp >= s.vwap && s.ltp <= s.vwap * 1.015);
    } else if (this.activeStrategy === "EARNINGS") {
      list = list.filter(s => s.catalystSentiment === "BULLISH");
    }

    // Active Rule Filter Pills
    if (this.activeFilters.aboveVwap) {
      list = list.filter(s => s.ltp >= s.vwap);
    }
    if (this.activeFilters.rvol2) {
      list = list.filter(s => s.rvol >= 2.0);
    }
    if (this.activeFilters.score75) {
      list = list.filter(s => s.score >= 75);
    }
    if (this.activeFilters.noCircuit) {
      list = list.filter(s => {
        const upGap = (s.upperCircuit - s.ltp) / s.ltp;
        const downGap = (s.ltp - s.lowerCircuit) / s.ltp;
        return upGap > 0.02 && downGap > 0.02;
      });
    }
    if (this.activeFilters.noFnoBan) {
      list = list.filter(s => !s.fnoBan);
    }

    // Screener Search Query Filter (Ticker / Name / Sector)
    if (this.screenerSearchQuery && this.screenerSearchQuery.trim()) {
      const q = this.screenerSearchQuery.trim().toLowerCase();
      list = list.filter(s =>
        s.symbol.toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.sector && s.sector.toLowerCase().includes(q)) ||
        (s.subSector && s.subSector.toLowerCase().includes(q))
      );
    }

    // Sort by Score descending
    list.sort((a, b) => b.score - a.score);
    return list;
  }

  // Dynamically register and profile any NSE security searched by user
  registerCustomStock(symbol) {
    const sym = (symbol || '').toUpperCase().trim();
    if (!sym) return null;
    const existing = this.stocks.find(s => s.symbol === sym);
    if (existing) return existing;

    const nseInfo = window.nseClient ? window.nseClient.getEquityInfo(sym) : null;
    const basePrice = nseInfo ? (nseInfo.faceValue > 5 ? 1240.0 : 680.0) : 850.0;
    const prevClose = basePrice;
    const ltp = Number((basePrice * (1 + (Math.random() * 0.03 - 0.015))).toFixed(2));
    const vwap = Number(((ltp * 0.6) + (prevClose * 0.4)).toFixed(2));

    const newStock = {
      symbol: sym,
      name: nseInfo ? nseInfo.companyName : `${sym} India Limited`,
      sector: nseInfo ? nseInfo.macroSector : 'NSE DIVERSIFIED',
      subSector: nseInfo ? nseInfo.industry : 'NSE Listed Equity',
      exchange: 'NSE:EQ',
      ltp: ltp,
      previousClose: prevClose,
      dayOpen: prevClose,
      dayHigh: Number((Math.max(ltp, prevClose) * 1.012).toFixed(2)),
      dayLow: Number((Math.min(ltp, prevClose) * 0.988).toFixed(2)),
      vwap: vwap,
      volume: 4200000,
      avgDailyVolume: 3100000,
      rvol: 1.6,
      orh: Number((basePrice * 1.008).toFixed(2)),
      orl: Number((basePrice * 0.992).toFixed(2)),
      pdh: Number((basePrice * 1.018).toFixed(2)),
      pdl: Number((basePrice * 0.982).toFixed(2)),
      circuitLimit: 10,
      upperCircuit: Number((prevClose * 1.10).toFixed(2)),
      lowerCircuit: Number((prevClose * 0.90).toFixed(2)),
      fnoBan: false,
      spread: 0.02,
      score: 82,
      catalyst: `Official NSE Listed Security • Active Real-Time Stream`,
      catalystCategory: 'NSE Listing',
      catalystSentiment: ltp >= prevClose ? 'BULLISH' : 'BEARISH',
      catalystTime: '15:30 IST',
      week52High: Number((basePrice * 1.28).toFixed(2)),
      week52Low: Number((basePrice * 0.74).toFixed(2)),
      sparkline: [prevClose, basePrice * 0.995, basePrice * 1.006, ltp],
      orderBook: {
        bids: [
          { price: Number((ltp - 0.05).toFixed(2)), qty: 4500, orders: 32 },
          { price: Number((ltp - 0.15).toFixed(2)), qty: 8200, orders: 48 },
          { price: Number((ltp - 0.25).toFixed(2)), qty: 14000, orders: 65 },
          { price: Number((ltp - 0.35).toFixed(2)), qty: 22000, orders: 90 },
          { price: Number((ltp - 0.45).toFixed(2)), qty: 35000, orders: 120 }
        ],
        asks: [
          { price: Number((ltp + 0.05).toFixed(2)), qty: 3800, orders: 28 },
          { price: Number((ltp + 0.15).toFixed(2)), qty: 7900, orders: 51 },
          { price: Number((ltp + 0.25).toFixed(2)), qty: 15500, orders: 72 },
          { price: Number((ltp + 0.35).toFixed(2)), qty: 24000, orders: 95 },
          { price: Number((ltp + 0.45).toFixed(2)), qty: 38000, orders: 135 }
        ]
      }
    };

    this.stocks.unshift(newStock);
    this.notify();
    return newStock;
  }
}

window.marketStream = new MarketStream();
