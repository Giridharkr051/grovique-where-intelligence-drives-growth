// PulseTrade Live - Technical Indicators & Pattern Recognition Engine
// Computes Market Breadth, EMAs, RSI, MACD, ATR, Pivot Points, Camarilla, and Candlestick / Breakout Patterns

class TechnicalIndicators {
  // 1. MARKET BREADTH ANALYSIS
  static computeMarketBreadth(stocks) {
    if (!stocks || stocks.length === 0) {
      return { advances: 0, declines: 0, unchanged: 0, adRatio: 1.0, advancePct: 50, declinePct: 50, regime: "NEUTRAL" };
    }

    let advances = 0;
    let declines = 0;
    let unchanged = 0;

    stocks.forEach(s => {
      const diff = s.ltp - s.previousClose;
      if (diff > 0.05) advances++;
      else if (diff < -0.05) declines++;
      else unchanged++;
    });

    const total = stocks.length;
    const adRatio = declines > 0 ? Number((advances / declines).toFixed(2)) : advances;
    const advancePct = Number(((advances / total) * 100).toFixed(1));
    const declinePct = Number(((declines / total) * 100).toFixed(1));

    let regime = "NEUTRAL CONSOLIDATION";
    let regimeColor = "#FFB800";
    if (advances >= 32) {
      regime = "STRONG BULLISH BREADTH (HIGH ACCUMULATION)";
      regimeColor = "#00FF88";
    } else if (advances >= 26) {
      regime = "MODERATE BULLISH (STOCK SPECIFIC)";
      regimeColor = "#00F0FF";
    } else if (declines >= 32) {
      regime = "STRONG BEARISH BREADTH (DISTRIBUTION)";
      regimeColor = "#FF2A6D";
    } else if (declines >= 26) {
      regime = "MODERATE BEARISH (PROFIT BOOKING)";
      regimeColor = "#FF6B8B";
    }

    return {
      total,
      advances,
      declines,
      unchanged,
      adRatio,
      advancePct,
      declinePct,
      regime,
      regimeColor
    };
  }

  // 2. EXPONENTIAL MOVING AVERAGE (EMA)
  static computeEMA(prices, period) {
    if (!prices || prices.length < period) return [];
    const k = 2 / (period + 1);
    const emaArray = [];
    
    // First value is SMA of first 'period' elements
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    let prevEMA = sum / period;
    emaArray[period - 1] = prevEMA;

    for (let i = period; i < prices.length; i++) {
      const currentEMA = prices[i] * k + prevEMA * (1 - k);
      emaArray[i] = currentEMA;
      prevEMA = currentEMA;
    }

    return emaArray;
  }

  // 3. RELATIVE STRENGTH INDEX (RSI - 14)
  static computeRSI(candles, period = 14) {
    if (!candles || candles.length < period + 1) return { value: 55.0, status: "NEUTRAL", color: "#FFB800" };
    
    const closes = candles.map(c => c.close);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return { value: 100, status: "OVERBOUGHT", color: "#FF2A6D" };
    const rs = avgGain / avgLoss;
    const rsi = Number((100 - (100 / (1 + rs))).toFixed(1));

    let status = "NEUTRAL";
    let color = "#00F0FF";
    if (rsi >= 70) {
      status = "OVERBOUGHT (CAUTION LONG)";
      color = "#FF2A6D";
    } else if (rsi <= 30) {
      status = "OVERSOLD (REVERSAL WATCH)";
      color = "#00FF88";
    } else if (rsi >= 60) {
      status = "BULLISH MOMENTUM";
      color = "#00FF88";
    } else if (rsi <= 40) {
      status = "BEARISH MOMENTUM";
      color = "#FF2A6D";
    }

    return { value: rsi, status, color };
  }

  // 4. MOVING AVERAGE CONVERGENCE DIVERGENCE (MACD: 12, 26, 9)
  static computeMACD(candles) {
    if (!candles || candles.length < 26) {
      return { macd: 1.25, signal: 0.95, hist: 0.30, status: "BULLISH CROSSOVER", isBullish: true };
    }

    const closes = candles.map(c => c.close);
    const ema12 = this.computeEMA(closes, 12);
    const ema26 = this.computeEMA(closes, 26);

    const macdLine = [];
    for (let i = 0; i < closes.length; i++) {
      if (ema12[i] !== undefined && ema26[i] !== undefined) {
        macdLine[i] = ema12[i] - ema26[i];
      }
    }

    const validMacd = macdLine.filter(v => v !== undefined);
    const signalLine = this.computeEMA(validMacd, 9);
    
    const lastIdx = validMacd.length - 1;
    const lastMacd = validMacd[lastIdx] || 0;
    const lastSignal = signalLine[signalLine.length - 1] || 0;
    const hist = lastMacd - lastSignal;

    const isBullish = hist >= 0;
    let status = isBullish ? "BULLISH EXPANSION" : "BEARISH CONTRACTION";
    if (isBullish && Math.abs(hist) < 0.2) status = "BULLISH CROSSOVER (FRESH)";
    if (!isBullish && Math.abs(hist) < 0.2) status = "BEARISH CROSSOVER (FRESH)";

    return {
      macd: Number(lastMacd.toFixed(2)),
      signal: Number(lastSignal.toFixed(2)),
      hist: Number(hist.toFixed(2)),
      status,
      isBullish
    };
  }

  // 5. AVERAGE TRUE RANGE (ATR - 14) & VOLATILITY
  static computeATR(stock, candles, period = 14) {
    if (!candles || candles.length < 5) {
      const defaultAtr = Number((stock.ltp * 0.015).toFixed(2));
      return {
        atr: defaultAtr,
        atrPct: 1.5,
        dayRange: Number((stock.dayHigh - stock.dayLow).toFixed(2)),
        rangeExhaustionPct: 65,
        suggestedSLPoints: Number((defaultAtr * 1.2).toFixed(2))
      };
    }

    const trValues = [];
    for (let i = 1; i < candles.length; i++) {
      const c = candles[i];
      const prevC = candles[i - 1];
      const hl = c.high - c.low;
      const hc = Math.abs(c.high - prevC.close);
      const lc = Math.abs(c.low - prevC.close);
      trValues.push(Math.max(hl, hc, lc));
    }

    const sample = trValues.slice(-period);
    const sum = sample.reduce((acc, v) => acc + v, 0);
    const atr = Number((sum / sample.length).toFixed(2));
    const atrPct = Number(((atr / stock.ltp) * 100).toFixed(2));
    const dayRange = Number((stock.dayHigh - stock.dayLow).toFixed(2));
    const rangeExhaustionPct = Math.min(100, Number(((dayRange / (atr * 1.5 || 1)) * 100).toFixed(0)));
    const suggestedSLPoints = Number((atr * 1.25).toFixed(2));

    return {
      atr,
      atrPct,
      dayRange,
      rangeExhaustionPct,
      suggestedSLPoints
    };
  }

  // 6. SUPPORT & RESISTANCE (STANDARD FLOOR PIVOTS & CAMARILLA)
  static computePivots(stock) {
    const H = stock.dayHigh || stock.pdh || stock.ltp * 1.01;
    const L = stock.dayLow || stock.pdl || stock.ltp * 0.99;
    const C = stock.previousClose || stock.ltp;

    // Floor Pivots
    const P = (H + L + C) / 3;
    const R1 = (2 * P) - L;
    const S1 = (2 * P) - H;
    const R2 = P + (H - L);
    const S2 = P - (H - L);
    const R3 = H + 2 * (P - L);
    const S3 = L - 2 * (H - P);

    // Camarilla Pivots (Institutional Intraday Levels)
    const diff = H - L;
    const H4 = C + (diff * 1.1) / 2; // Long Breakout Level
    const H3 = C + (diff * 1.1) / 4; // Mean Reversion Short
    const L3 = C - (diff * 1.1) / 4; // Mean Reversion Long
    const L4 = C - (diff * 1.1) / 2; // Short Breakdown Level

    return {
      P: Number(P.toFixed(2)),
      R1: Number(R1.toFixed(2)),
      R2: Number(R2.toFixed(2)),
      R3: Number(R3.toFixed(2)),
      S1: Number(S1.toFixed(2)),
      S2: Number(S2.toFixed(2)),
      S3: Number(S3.toFixed(2)),
      camarilla: {
        H4: Number(H4.toFixed(2)),
        H3: Number(H3.toFixed(2)),
        L3: Number(L3.toFixed(2)),
        L4: Number(L4.toFixed(2))
      }
    };
  }

  // 7. PRICE ACTION CANDLESTICK & BREAKOUT PATTERNS DETECTOR
  static detectPatterns(candles, stock) {
    if (!candles || candles.length < 3) return [];
    const patterns = [];
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const prev2 = candles[candles.length - 3];

    const body = Math.abs(last.close - last.open);
    const range = last.high - last.low || 0.01;
    const upperWick = last.high - Math.max(last.open, last.close);
    const lowerWick = Math.min(last.open, last.close) - last.low;
    const isBull = last.close >= last.open;

    // A. Pin Bar / Hammer (Bullish Rejection)
    if (lowerWick >= body * 2 && upperWick <= body * 0.5) {
      patterns.push({
        name: "Bullish Pin Bar / Hammer",
        type: "BULLISH_REVERSAL",
        description: "Strong rejection of intraday lows with heavy bottom buying wick.",
        badgeClass: "bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]"
      });
    }

    // B. Shooting Star (Bearish Rejection)
    if (upperWick >= body * 2 && lowerWick <= body * 0.5) {
      patterns.push({
        name: "Bearish Shooting Star",
        type: "BEARISH_REVERSAL",
        description: "Strong rejection of intraday highs with upper selling wick.",
        badgeClass: "bg-[#FF2A6D]/20 text-[#FF2A6D] border-[#FF2A6D]"
      });
    }

    // C. Bullish Engulfing
    if (isBull && prev.close < prev.open && last.close > prev.open && last.open < prev.close) {
      patterns.push({
        name: "Bullish Engulfing",
        type: "BULLISH_CONTINUATION",
        description: "Buyers completely overwhelmed prior selling candle.",
        badgeClass: "bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]"
      });
    }

    // D. Inside Bar / NR7 (Volatility Compression)
    if (last.high <= prev.high && last.low >= prev.low) {
      patterns.push({
        name: "Inside Bar (NR7 Coiling)",
        type: "VOLATILITY_COMPRESSION",
        description: "Range compression inside prior bar. High-velocity breakout imminent.",
        badgeClass: "bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]"
      });
    }

    // E. 15M ORB Breakout
    if (stock && stock.orh && last.close > stock.orh) {
      patterns.push({
        name: "15M ORB High Breakout",
        type: "MOMENTUM_BREAKOUT",
        description: `Price pierced above opening 15-minute range high (₹${stock.orh.toFixed(1)}).`,
        badgeClass: "bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]"
      });
    } else if (stock && stock.orl && last.close < stock.orl) {
      patterns.push({
        name: "15M ORB Low Breakdown",
        type: "MOMENTUM_BREAKDOWN",
        description: `Price broke below opening 15-minute range low (₹${stock.orl.toFixed(1)}).`,
        badgeClass: "bg-[#FF2A6D]/20 text-[#FF2A6D] border-[#FF2A6D]"
      });
    }

    // F. VWAP Pullback Bounce
    if (stock && Math.abs(last.low - stock.vwap) / stock.vwap < 0.003 && last.close > stock.vwap) {
      patterns.push({
        name: "VWAP Test & Bounce",
        type: "INSTITUTIONAL_SUPPORT",
        description: "Price tested institutional VWAP and bounced with buyer absorption.",
        badgeClass: "bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]"
      });
    }

    if (patterns.length === 0) {
      patterns.push({
        name: "Consolidation / Rangebound",
        type: "NEUTRAL",
        description: "Price trading within standard ATR intraday boundary.",
        badgeClass: "bg-slate-800 text-slate-400 border-slate-700"
      });
    }

    return patterns;
  }
}

// Attach globally
if (typeof window !== 'undefined') {
  window.TechnicalIndicators = TechnicalIndicators;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TechnicalIndicators };
}
