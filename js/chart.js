// PulseTrade Live - Interactive Canvas Candlestick & Indicator Chart Engine

class CandlestickChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.timeframe = '1m'; // '1m' or '5m'
    this.stock = null;
    this.hoverIndex = -1;
    this.hoverX = -1;
    this.hoverY = -1;
    this.activeNewsPin = null;

    // Technical Overlays & Subgraph Toggles
    this.showEMA9 = true;
    this.showEMA20 = true;
    this.showRSI = true;
    this.showPatterns = true;

    this.padding = { top: 30, right: 75, bottom: 40, left: 15 };
    this.initEvents();
  }

  setStock(stock) {
    this.stock = stock;
    this.render();
  }

  isIntraday() {
    return this.timeframe === '1m' || this.timeframe === '5m' || this.timeframe === '1D';
  }

  setTimeframe(tf) {
    this.timeframe = tf;
    if (window.arcadeAudio) window.arcadeAudio.playBlip();

    // Update timeframe buttons styling in DOM
    const tfList = ['1m', '5m', '1D', '1M', '1Y', '3Y', '5Y'];
    tfList.forEach(t => {
      const btn = document.getElementById(`tf-btn-${t}`);
      if (btn) {
        if (t === tf) {
          btn.className = "px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#00F0FF] text-[#090B10] shadow-sm";
        } else {
          btn.className = "px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-400 hover:text-slate-100 hover:bg-[#111622] transition-colors";
        }
      }
    });

    const labels = {
      '1m': '1 Minute (Intraday Scalp)',
      '5m': '5 Minute (ORB & Breakout)',
      '1D': '1 Day (Intraday Stream)',
      '1M': '1 Month (Daily Swings)',
      '1Y': '1 Year (52-Week Trajectory)',
      '3Y': '3 Year (Multi-Year Compound Cycle)',
      '5Y': '5 Year (Long-Term Macro Trend)'
    };

    if (window.showAppToast) {
      window.showAppToast({
        title: `${this.stock ? this.stock.symbol : 'Stock'} • ${labels[tf] || tf}`,
        message: `Mounted ${this.getCandlesForTimeframe(tf).length} candlestick bars for timeframe ${tf}.`,
        type: 'info'
      });
    }

    this.render();
  }

  getCandlesForTimeframe(tf) {
    if (!this.stock) return [];
    if (!this.stock._multiTfCache) this.stock._multiTfCache = {};

    if (tf === '1m') {
      return this.stock.candles1m && this.stock.candles1m.length > 0 ? this.stock.candles1m : this.generate1DayCandles(40);
    }
    if (tf === '5m') {
      return this.stock.candles5m && this.stock.candles5m.length > 0 ? this.stock.candles5m : this.generate1DayCandles(30);
    }

    if (this.stock._multiTfCache[tf]) {
      return this.stock._multiTfCache[tf];
    }

    let generated = [];
    if (tf === '1D') {
      generated = this.generate1DayCandles(26);
    } else if (tf === '1M') {
      generated = this.generate1MonthCandles();
    } else if (tf === '1Y') {
      generated = this.generate1YearCandles();
    } else if (tf === '3Y') {
      generated = this.generate3YearCandles();
    } else if (tf === '5Y') {
      generated = this.generate5YearCandles();
    } else {
      generated = this.stock.candles5m || this.stock.candles1m || [];
    }

    this.stock._multiTfCache[tf] = generated;
    return generated;
  }

  generate1DayCandles(count = 26) {
    const s = this.stock;
    const ltp = s.ltp;
    const open = s.dayOpen || (ltp * 0.995);
    const high = s.dayHigh || (ltp * 1.012);
    const low = s.dayLow || (ltp * 0.988);
    const times = ["09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00", "14:15", "14:30", "14:45", "15:00", "15:15", "15:30"];
    
    const candles = [];
    let cur = open;
    for (let i = 0; i < count; i++) {
      const t = times[i % times.length];
      const prog = i / (count - 1);
      const target = open + (ltp - open) * prog;
      const noise = (Math.sin(i * 1.3) * 0.004) * ltp;
      const cOpen = Number(cur.toFixed(2));
      const cClose = i === count - 1 ? ltp : Number((target + noise).toFixed(2));
      const cHigh = Math.min(high, Math.max(cOpen, cClose) + (Math.abs(Math.sin(i * 2.1)) * 0.003 * ltp));
      const cLow = Math.max(low, Math.min(cOpen, cClose) - (Math.abs(Math.cos(i * 1.8)) * 0.003 * ltp));
      const vol = Math.floor(45000 + Math.abs(Math.sin(i * 0.8)) * 120000 + (i === 0 || i === count - 1 ? 250000 : 0));
      const vwap = Number(((cOpen + cHigh + cLow + cClose) / 4).toFixed(2));

      candles.push({
        time: t,
        open: Number(cOpen.toFixed(2)),
        high: Number(cHigh.toFixed(2)),
        low: Number(cLow.toFixed(2)),
        close: Number(cClose.toFixed(2)),
        volume: vol,
        vwap: vwap
      });
      cur = cClose;
    }
    return candles;
  }

  generate1MonthCandles() {
    const s = this.stock;
    const ltp = s.ltp;
    const base = Number((ltp * 0.955).toFixed(2));
    const dates = [
      "17 Oct", "20 Oct", "21 Oct", "22 Oct", "23 Oct", "24 Oct", "27 Oct", "28 Oct", "29 Oct", "30 Oct", "31 Oct",
      "03 Nov", "04 Nov", "05 Nov", "06 Nov", "07 Nov", "10 Nov", "11 Nov", "12 Nov", "13 Nov", "14 Nov", "15 Nov"
    ];

    const candles = [];
    let cur = base;
    const total = dates.length;
    for (let i = 0; i < total; i++) {
      const d = dates[i];
      const prog = i / (total - 1);
      const target = base + (ltp - base) * prog;
      const swing = (Math.sin(i * 1.1) * 0.015) * ltp;
      const cOpen = Number(cur.toFixed(2));
      const cClose = i === total - 1 ? ltp : Number((target + swing).toFixed(2));
      const cHigh = Number((Math.max(cOpen, cClose) * (1 + Math.abs(Math.sin(i * 1.7)) * 0.012)).toFixed(2));
      const cLow = Number((Math.min(cOpen, cClose) * (1 - Math.abs(Math.cos(i * 1.4)) * 0.012)).toFixed(2));
      const vol = Math.floor(3500000 + Math.abs(Math.sin(i * 0.9)) * 8500000);

      candles.push({
        date: d,
        time: d,
        open: cOpen,
        high: cHigh,
        low: cLow,
        close: cClose,
        volume: vol,
        vwap: Number(((cOpen + cHigh + cLow + cClose) / 4).toFixed(2))
      });
      cur = cClose;
    }
    return candles;
  }

  generate1YearCandles() {
    const s = this.stock;
    const ltp = s.ltp;
    const low52 = s.week52Low || Number((ltp * 0.74).toFixed(2));
    const high52 = s.week52High || Number((ltp * 1.22).toFixed(2));
    const weeks = 52;
    const candles = [];

    const monthNames = ["Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26", "Oct 26", "Nov 26"];
    let cur = Number((low52 * 1.08).toFixed(2));

    for (let i = 0; i < weeks; i++) {
      const monthIdx = Math.floor((i / weeks) * (monthNames.length - 1));
      const weekInMonth = (i % 4) + 1;
      const d = `W${weekInMonth} ${monthNames[monthIdx]}`;

      let norm = 0;
      if (i < 10) {
        norm = (1 - (i / 10)) * (low52 - cur) * 0.4;
      } else if (i < 42) {
        norm = ((i - 10) / 32) * (high52 - low52);
      } else {
        norm = (high52 - low52) - ((i - 42) / 10) * (high52 - ltp);
      }

      const noise = (Math.sin(i * 0.7) * 0.02) * ltp;
      const cOpen = Number(cur.toFixed(2));
      let cClose = i === weeks - 1 ? ltp : Number((low52 + norm + noise).toFixed(2));
      cClose = Math.min(high52, Math.max(low52, cClose));

      const cHigh = Number((Math.min(high52, Math.max(cOpen, cClose) * 1.018)).toFixed(2));
      const cLow = Number((Math.max(low52, Math.min(cOpen, cClose) * 0.982)).toFixed(2));
      const vol = Math.floor(18000000 + Math.abs(Math.sin(i * 0.5)) * 32000000);

      candles.push({
        date: d,
        time: d,
        open: cOpen,
        high: cHigh,
        low: cLow,
        close: cClose,
        volume: vol,
        vwap: Number(((cOpen + cHigh + cLow + cClose) / 4).toFixed(2))
      });
      cur = cClose;
    }
    return candles;
  }

  generate3YearCandles() {
    const s = this.stock;
    const ltp = s.ltp;
    const base = Number((ltp * 0.58).toFixed(2));
    const months = [
      "Nov 23", "Dec 23", "Jan 24", "Feb 24", "Mar 24", "Apr 24", "May 24", "Jun 24", "Jul 24", "Aug 24", "Sep 24", "Oct 24", "Nov 24", "Dec 24",
      "Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25", "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25",
      "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26", "Oct 26", "Nov 26"
    ];

    const candles = [];
    let cur = base;
    const count = months.length;

    for (let i = 0; i < count; i++) {
      const d = months[i];
      const prog = i / (count - 1);
      const trend = base + (ltp - base) * Math.pow(prog, 0.9);
      const cycleNoise = (Math.sin(i * 0.6) * 0.04) * ltp;
      const cOpen = Number(cur.toFixed(2));
      const cClose = i === count - 1 ? ltp : Number((trend + cycleNoise).toFixed(2));
      const cHigh = Number((Math.max(cOpen, cClose) * (1 + Math.abs(Math.sin(i * 1.3)) * 0.035)).toFixed(2));
      const cLow = Number((Math.min(cOpen, cClose) * (1 - Math.abs(Math.cos(i * 1.1)) * 0.035)).toFixed(2));
      const vol = Math.floor(65000000 + Math.abs(Math.sin(i * 0.4)) * 140000000);

      candles.push({
        date: d,
        time: d,
        open: cOpen,
        high: cHigh,
        low: cLow,
        close: cClose,
        volume: vol,
        vwap: Number(((cOpen + cHigh + cLow + cClose) / 4).toFixed(2))
      });
      cur = cClose;
    }
    return candles;
  }

  generate5YearCandles() {
    const s = this.stock;
    const ltp = s.ltp;
    const base = Number((ltp * 0.42).toFixed(2));
    const periods = [
      "Nov 21", "Jan 22", "Mar 22", "May 22", "Jul 22", "Sep 22", "Nov 22", "Jan 23", "Mar 23", "May 23", "Jul 23", "Sep 23", "Nov 23",
      "Jan 24", "Mar 24", "May 24", "Jul 24", "Sep 24", "Nov 24", "Jan 25", "Mar 25", "May 25", "Jul 25", "Sep 25", "Nov 25",
      "Jan 26", "Mar 26", "May 26", "Jul 26", "Sep 26", "Nov 26"
    ];

    const candles = [];
    let cur = base;
    const count = periods.length;

    for (let i = 0; i < count; i++) {
      const d = periods[i];
      const prog = i / (count - 1);
      const trend = base + (ltp - base) * Math.pow(prog, 0.85);
      const macroDip = (i >= 3 && i <= 8) ? -0.05 * ltp : 0;
      const cycleNoise = (Math.sin(i * 0.5) * 0.035) * ltp;
      const cOpen = Number(cur.toFixed(2));
      const cClose = i === count - 1 ? ltp : Number((trend + macroDip + cycleNoise).toFixed(2));
      const cHigh = Number((Math.max(cOpen, cClose) * (1 + Math.abs(Math.sin(i * 1.5)) * 0.045)).toFixed(2));
      const cLow = Number((Math.min(cOpen, cClose) * (1 - Math.abs(Math.cos(i * 1.2)) * 0.045)).toFixed(2));
      const vol = Math.floor(95000000 + Math.abs(Math.sin(i * 0.3)) * 220000000);

      candles.push({
        date: d,
        time: d,
        open: cOpen,
        high: cHigh,
        low: cLow,
        close: cClose,
        volume: vol,
        vwap: Number(((cOpen + cHigh + cLow + cClose) / 4).toFixed(2))
      });
      cur = cClose;
    }
    return candles;
  }

  initEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.hoverX = e.clientX - rect.left;
      this.hoverY = e.clientY - rect.top;
      this.render();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverIndex = -1;
      this.hoverX = -1;
      this.hoverY = -1;
      this.activeNewsPin = null;
      this.render();
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.activeNewsPin) {
        if (window.showAppToast) {
          window.showAppToast({
            title: `CATALYST: ${this.activeNewsPin.title}`,
            message: `Reported at ${this.activeNewsPin.time} • Sentiment: ${this.activeNewsPin.sentiment}`,
            type: this.activeNewsPin.sentiment === 'BULLISH' ? 'success' : 'info'
          });
        }
      }
    });

    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth * window.devicePixelRatio;
      this.canvas.height = parent.clientHeight * window.devicePixelRatio;
      this.canvas.style.width = `${parent.clientWidth}px`;
      this.canvas.style.height = `${parent.clientHeight}px`;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.render();
    }
  }

  render() {
    if (!this.canvas || !this.stock) return;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    const candles = this.getCandlesForTimeframe(this.timeframe);
    if (!candles || candles.length === 0) return;

    const plotWidth = width - this.padding.left - this.padding.right;
    const hasRSI = this.showRSI;
    const mainHeight = (height - this.padding.top - this.padding.bottom) * (hasRSI ? 0.62 : 0.78);
    const volHeight = (height - this.padding.top - this.padding.bottom) * (hasRSI ? 0.16 : 0.20);
    const volTop = this.padding.top + mainHeight + 8;
    const rsiHeight = hasRSI ? (height - this.padding.top - this.padding.bottom) * 0.18 : 0;
    const rsiTop = volTop + volHeight + 8;

    // Determine price min & max
    let minPrice = Math.min(...candles.map(c => c.low));
    let maxPrice = Math.max(...candles.map(c => c.high));

    if (this.isIntraday()) {
      if (this.stock.orh) maxPrice = Math.max(maxPrice, this.stock.orh);
      if (this.stock.orl) minPrice = Math.min(minPrice, this.stock.orl);
      if (this.stock.pdh) maxPrice = Math.max(maxPrice, this.stock.pdh);
      if (this.stock.pdl) minPrice = Math.min(minPrice, this.stock.pdl);
    } else if (this.stock.week52High && this.stock.week52Low && (this.timeframe === '1Y' || this.timeframe === '3Y' || this.timeframe === '5Y')) {
      maxPrice = Math.max(maxPrice, this.stock.week52High);
      minPrice = Math.min(minPrice, this.stock.week52Low);
    }

    // Padding around price
    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.05;
    maxPrice += priceRange * 0.08;

    const maxVol = Math.max(...candles.map(c => c.volume)) * 1.25 || 1;

    const candleWidth = Math.max(4, (plotWidth / candles.length) * 0.65);
    const candleSpacing = plotWidth / candles.length;

    // Helper functions
    const getY = (price) => {
      return this.padding.top + mainHeight - ((price - minPrice) / (maxPrice - minPrice)) * mainHeight;
    };
    const getX = (index) => {
      return this.padding.left + index * candleSpacing + candleSpacing / 2;
    };
    const getVolY = (vol) => {
      return volTop + volHeight - (vol / maxVol) * volHeight;
    };

    // 1. Draw Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const priceVal = minPrice + (priceRange / gridSteps) * i;
      const y = getY(priceVal);

      ctx.beginPath();
      ctx.moveTo(this.padding.left, y);
      ctx.lineTo(this.padding.left + plotWidth, y);
      ctx.stroke();

      // Right Y-axis label
      ctx.setLineDash([]);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`₹${priceVal.toFixed(1)}`, this.padding.left + plotWidth + 8, y + 3);
      ctx.setLineDash([3, 4]);
    }

    // 2. Draw Shaded 15m Opening Range (ORH / ORL) Band (Intraday only)
    if (this.isIntraday() && this.stock.orh && this.stock.orl) {
      const orhY = getY(this.stock.orh);
      const orlY = getY(this.stock.orl);

      // Shaded area
      ctx.fillStyle = 'rgba(0, 240, 255, 0.06)';
      ctx.fillRect(this.padding.left, orhY, plotWidth, orlY - orhY);

      // ORH Line
      ctx.strokeStyle = '#00F0FF';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(this.padding.left, orhY);
      ctx.lineTo(this.padding.left + plotWidth, orhY);
      ctx.stroke();

      // ORL Line
      ctx.strokeStyle = '#FF2A6D';
      ctx.beginPath();
      ctx.moveTo(this.padding.left, orlY);
      ctx.lineTo(this.padding.left + plotWidth, orlY);
      ctx.stroke();

      // Badges
      ctx.setLineDash([]);
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = '#00F0FF';
      ctx.fillText(`15m ORH ₹${this.stock.orh.toFixed(1)}`, this.padding.left + 5, orhY - 4);

      ctx.fillStyle = '#FF2A6D';
      ctx.fillText(`15m ORL ₹${this.stock.orl.toFixed(1)}`, this.padding.left + 5, orlY + 12);
    }

    // 3. Draw Previous Day High (PDH) and Low (PDL) (Intraday only)
    if (this.isIntraday() && this.stock.pdh) {
      const pdhY = getY(this.stock.pdh);
      ctx.strokeStyle = 'rgba(255, 184, 0, 0.5)';
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.padding.left, pdhY);
      ctx.lineTo(this.padding.left + plotWidth, pdhY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#FFB800';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(`PDH ₹${this.stock.pdh.toFixed(1)}`, this.padding.left + plotWidth - 70, pdhY - 3);
    }

    // 3B. Draw 52W High / 52W Low Reference Lines for Swing / Multi-Year Timeframes
    if (!this.isIntraday() && (this.stock.week52High || this.stock.week52Low)) {
      if (this.stock.week52High && this.stock.week52High >= minPrice && this.stock.week52High <= maxPrice) {
        const y52h = getY(this.stock.week52High);
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.padding.left, y52h);
        ctx.lineTo(this.padding.left + plotWidth, y52h);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#00FF88';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(`52W HIGH ₹${this.stock.week52High.toFixed(1)}`, this.padding.left + 5, y52h - 4);
      }
      if (this.stock.week52Low && this.stock.week52Low >= minPrice && this.stock.week52Low <= maxPrice) {
        const y52l = getY(this.stock.week52Low);
        ctx.strokeStyle = 'rgba(255, 42, 109, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.padding.left, y52l);
        ctx.lineTo(this.padding.left + plotWidth, y52l);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#FF2A6D';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(`52W LOW ₹${this.stock.week52Low.toFixed(1)}`, this.padding.left + 5, y52l + 12);
      }
    }

    // 4. Draw Candlesticks & Volume Bars
    candles.forEach((c, idx) => {
      const x = getX(idx);
      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);
      const isBullish = c.close >= c.open;
      const color = isBullish ? '#00FF88' : '#FF2A6D';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

      // Volume bar
      const volBarY = getVolY(c.volume);
      ctx.fillStyle = isBullish ? 'rgba(0, 255, 136, 0.35)' : 'rgba(255, 42, 109, 0.35)';
      ctx.fillRect(x - candleWidth / 2, volBarY, candleWidth, volTop + volHeight - volBarY);
    });

    // 5. Draw Cyan VWAP Line with Subtle Glow
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    candles.forEach((c, idx) => {
      const x = getX(idx);
      const y = getY(c.vwap);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 5B. Draw 9 EMA (Amber) and 20 EMA (Fuchsia) Trend Overlays
    const closes = candles.map(c => c.close);
    if (this.showEMA9 && window.TechnicalIndicators) {
      const ema9 = window.TechnicalIndicators.computeEMA(closes, 9);
      ctx.strokeStyle = '#FFB800';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      let started = false;
      candles.forEach((c, idx) => {
        if (ema9[idx] !== undefined) {
          const x = getX(idx);
          const y = getY(ema9[idx]);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else { ctx.lineTo(x, y); }
        }
      });
      ctx.stroke();
    }

    if (this.showEMA20 && window.TechnicalIndicators) {
      const ema20 = window.TechnicalIndicators.computeEMA(closes, 20);
      ctx.strokeStyle = '#D946EF';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      let started = false;
      candles.forEach((c, idx) => {
        if (ema20[idx] !== undefined) {
          const x = getX(idx);
          const y = getY(ema20[idx]);
          if (!started) { ctx.moveTo(x, y); started = true; }
          else { ctx.lineTo(x, y); }
        }
      });
      ctx.stroke();
    }

    // 5C. Draw RSI (14) Indicator Subgraph Panel
    if (this.showRSI && rsiHeight > 0 && window.TechnicalIndicators) {
      // Panel separator
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.padding.left, rsiTop);
      ctx.lineTo(this.padding.left + plotWidth, rsiTop);
      ctx.stroke();

      // 70 (Overbought) & 30 (Oversold) threshold lines
      const getRsiY = (v) => rsiTop + rsiHeight - (v / 100) * rsiHeight;
      const y70 = getRsiY(70);
      const y30 = getRsiY(30);
      const y50 = getRsiY(50);

      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = 'rgba(255, 42, 109, 0.4)';
      ctx.beginPath();
      ctx.moveTo(this.padding.left, y70);
      ctx.lineTo(this.padding.left + plotWidth, y70);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
      ctx.beginPath();
      ctx.moveTo(this.padding.left, y30);
      ctx.lineTo(this.padding.left + plotWidth, y30);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.beginPath();
      ctx.moveTo(this.padding.left, y50);
      ctx.lineTo(this.padding.left + plotWidth, y50);
      ctx.stroke();

      ctx.setLineDash([]);

      // Compute and draw rolling RSI line
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let rsiValLast = 54;
      candles.forEach((c, idx) => {
        const slice = candles.slice(0, idx + 1);
        const rsiData = window.TechnicalIndicators.computeRSI(slice, 14);
        const x = getX(idx);
        const y = getRsiY(rsiData.value);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        if (idx === candles.length - 1) rsiValLast = rsiData.value;
      });
      ctx.stroke();

      // RSI Label
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText(`RSI (14):`, this.padding.left + 5, rsiTop + 14);
      ctx.fillStyle = rsiValLast >= 70 ? '#FF2A6D' : (rsiValLast <= 30 ? '#00FF88' : '#00F0FF');
      ctx.fillText(`${rsiValLast}`, this.padding.left + 58, rsiTop + 14);

      // Y-axis labels
      ctx.fillStyle = '#64748b';
      ctx.fillText('70', this.padding.left + plotWidth + 6, y70 + 3);
      ctx.fillText('30', this.padding.left + plotWidth + 6, y30 + 3);
    }

    // 5D. Pattern Detection Tag on Latest Candle
    if (this.showPatterns && window.TechnicalIndicators && candles.length >= 3) {
      const detected = window.TechnicalIndicators.detectPatterns(candles, this.stock);
      if (detected.length > 0 && detected[0].type !== 'NEUTRAL') {
        const p = detected[0];
        const lastIdx = candles.length - 1;
        const tagX = getX(lastIdx);
        const tagY = getY(candles[lastIdx].high) - 30;

        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = p.type.includes('BULL') ? '#00FF88' : '#FF2A6D';
        ctx.lineWidth = 1;
        const text = p.name.toUpperCase();
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        const tw = ctx.measureText(text).width + 12;
        ctx.fillRect(tagX - tw / 2, tagY - 12, tw, 16);
        ctx.strokeRect(tagX - tw / 2, tagY - 12, tw, 16);

        ctx.fillStyle = p.type.includes('BULL') ? '#00FF88' : '#FF2A6D';
        ctx.textAlign = 'center';
        ctx.fillText(text, tagX, tagY);
      }
    }

    // Top Right Technical Legend
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    const legendX = this.padding.left + plotWidth - 10;
    if (this.isIntraday()) {
      ctx.fillStyle = '#00F0FF';
      ctx.fillText('● VWAP', legendX - 180, 16);
    } else {
      ctx.fillStyle = '#00FF88';
      ctx.fillText('● 52W H/L', legendX - 180, 16);
    }
    ctx.fillStyle = '#FFB800';
    ctx.fillText('● 9 EMA', legendX - 125, 16);
    ctx.fillStyle = '#D946EF';
    ctx.fillText('● 20 EMA', legendX - 65, 16);
    ctx.fillStyle = '#00FF88';
    ctx.fillText('● RSI 14', legendX, 16);

    // 6. Draw News Event Pins on Candles
    this.activeNewsPin = null;
    if (this.stock.newsPins && this.stock.newsPins.length > 0) {
      this.stock.newsPins.forEach(pin => {
        const pinIdx = Math.min(candles.length - 1, Math.max(0, pin.candleIndex !== undefined ? pin.candleIndex : candles.length - 1));
        const pinX = getX(pinIdx);
        const pinY = getY(candles[pinIdx].high) - 22;

        // Draw pin icon badge
        ctx.fillStyle = '#FFB800';
        ctx.beginPath();
        ctx.arc(pinX, pinY, 9, 0, Math.PI * 2);
        ctx.fill();

        // Pin border
        ctx.strokeStyle = '#090B10';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pin symbol (lightning / text)
        ctx.fillStyle = '#090B10';
        ctx.font = 'bold 9px DM Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', pinX, pinY + 3);

        // Check hover over pin
        if (this.hoverX >= pinX - 14 && this.hoverX <= pinX + 14 && this.hoverY >= pinY - 14 && this.hoverY <= pinY + 14) {
          this.activeNewsPin = pin;
          // Draw popover badge
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#FFB800';
          ctx.lineWidth = 1;
          const label = `NEWS: ${pin.title.substring(0, 36)}...`;
          const textW = ctx.measureText(label).width + 16;
          ctx.fillRect(pinX - textW / 2, pinY - 26, textW, 18);
          ctx.strokeRect(pinX - textW / 2, pinY - 26, textW, 18);
          ctx.fillStyle = '#FFB800';
          ctx.fillText(label, pinX, pinY - 14);
        }
      });
    }

    // 7. Crosshair & Interactive Hover Inspection
    if (this.hoverX >= this.padding.left && this.hoverX <= this.padding.left + plotWidth && this.hoverY >= this.padding.top && this.hoverY <= height - this.padding.bottom) {
      // Find nearest candle
      const rawIndex = Math.floor((this.hoverX - this.padding.left) / candleSpacing);
      const index = Math.max(0, Math.min(candles.length - 1, rawIndex));
      const candle = candles[index];
      const snapX = getX(index);

      // Vertical crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(snapX, this.padding.top);
      ctx.lineTo(snapX, height - this.padding.bottom);
      ctx.stroke();

      // Horizontal crosshair
      ctx.beginPath();
      ctx.moveTo(this.padding.left, this.hoverY);
      ctx.lineTo(this.padding.left + plotWidth, this.hoverY);
      ctx.stroke();

      // Time/Date tag at bottom
      ctx.setLineDash([]);
      const timeLabel = candle.date || candle.time || '';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      const tagW = Math.max(54, ctx.measureText(timeLabel).width + 14);
      ctx.fillStyle = '#00F0FF';
      ctx.fillRect(snapX - tagW / 2, height - this.padding.bottom + 4, tagW, 16);
      ctx.fillStyle = '#002226';
      ctx.textAlign = 'center';
      ctx.fillText(timeLabel, snapX, height - this.padding.bottom + 16);

      // Price tag at right axis
      const hoverPrice = maxPrice - ((this.hoverY - this.padding.top) / mainHeight) * (maxPrice - minPrice);
      if (this.hoverY <= this.padding.top + mainHeight) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(this.padding.left + plotWidth + 4, this.hoverY - 8, 65, 16);
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'left';
        ctx.fillText(`₹${hoverPrice.toFixed(2)}`, this.padding.left + plotWidth + 8, this.hoverY + 4);
      }

      // HUD Top Stats Bar
      this.drawHUD(ctx, candle);
    } else {
      // Default HUD showing last candle
      this.drawHUD(ctx, candles[candles.length - 1]);
    }
  }

  drawHUD(ctx, candle) {
    if (!candle) return;
    ctx.textAlign = 'left';
    ctx.font = '11px JetBrains Mono, monospace';

    const items = [
      { label: 'TF', val: this.timeframe, color: '#00F0FF' },
      { label: candle.date ? 'DATE' : 'TIME', val: candle.date || candle.time, color: '#94a3b8' },
      { label: 'O', val: `₹${candle.open.toFixed(2)}`, color: '#e2e8f0' },
      { label: 'H', val: `₹${candle.high.toFixed(2)}`, color: '#00FF88' },
      { label: 'L', val: `₹${candle.low.toFixed(2)}`, color: '#FF2A6D' },
      { label: 'C', val: `₹${candle.close.toFixed(2)}`, color: candle.close >= candle.open ? '#00FF88' : '#FF2A6D' },
      { label: this.isIntraday() ? 'VWAP' : 'AVG', val: `₹${candle.vwap.toFixed(2)}`, color: '#00F0FF' },
      { label: 'VOL', val: candle.volume >= 100000 ? `${(candle.volume / 100000).toFixed(2)}L` : `${(candle.volume / 1000).toFixed(1)}k`, color: '#FFB800' }
    ];

    let startX = this.padding.left + 5;
    items.forEach(it => {
      ctx.fillStyle = '#64748b';
      ctx.fillText(it.label + ':', startX, 16);
      const labelW = ctx.measureText(it.label + ':').width;

      ctx.fillStyle = it.color;
      ctx.fillText(it.val, startX + labelW + 4, 16);
      const valW = ctx.measureText(it.val).width;

      startX += labelW + valW + 14;
    });
  }
}

window.CandlestickChart = CandlestickChart;
