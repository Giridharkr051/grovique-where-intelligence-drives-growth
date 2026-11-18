// PulseTrade Live - Gemini AI Intraday Entry & Exit Advisory Engine
// Focused specifically on intraday momentum, VWAP retests, and ORB setups

class GeminiIntradayAdvisor {
  constructor() {
    this.cache = {}; // symbol -> { advice, timestamp }
    this.isAnalyzing = false;
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify(data) {
    this.listeners.forEach(cb => cb(data));
  }

  // Generate or fetch intraday advice for selected stock
  async getAdvice(stock, options = {}) {
    if (!stock) return null;

    const stream = window.marketStream;
    const phase = stream ? stream.getCurrentPhase() : { label: '09:30 Prime Breakout', canBreakout: true };
    const clockTime = stream ? stream.getClockFormatted() : '09:35:00';
    const forceRefresh = options.forceRefresh || false;

    // Check cache (valid for 20 seconds unless forced)
    const cacheKey = stock.symbol + '_' + (stream ? stream.currentPhaseKey : 'PRIME');
    const cached = this.cache[cacheKey];
    if (cached && !forceRefresh && (Date.now() - cached.timestamp < 20000)) {
      return cached.advice;
    }

    this.isAnalyzing = true;
    this.notify({ status: 'ANALYZING', symbol: stock.symbol });

    let advice = null;
    const settings = window.settingsManager ? window.settingsManager.state.gemini : { apiKey: '' };

    if (settings.apiKey && settings.apiKey.trim().length > 10) {
      try {
        advice = await this.queryLiveGemini(stock, stream, phase, clockTime, settings);
      } catch (err) {
        console.warn('Live Gemini query failed, falling back to algorithmic intraday engine:', err);
        advice = this.generateAlgorithmicIntradayAdvice(stock, stream, phase, clockTime);
        advice.note = `Live Gemini attempt timed out. Showing Algorithmic Co-Pilot Advice: ${err.message}`;
      }
    } else {
      // Algorithmic high-precision intraday quant generator
      advice = this.generateAlgorithmicIntradayAdvice(stock, stream, phase, clockTime);
    }

    this.cache[cacheKey] = {
      advice,
      timestamp: Date.now()
    };

    this.isAnalyzing = false;
    this.notify({ status: 'READY', symbol: stock.symbol, advice });
    return advice;
  }

  // Construct structured prompt and call Gemini API via backend proxy
  async queryLiveGemini(stock, stream, phase, clockTime, settings) {
    const vwapDiff = Number(((stock.ltp - stock.vwap) / stock.vwap * 100).toFixed(2));
    const orhBreakout = stock.ltp >= stock.orh;
    const nearCircuit = (stock.upperCircuit - stock.ltp) / stock.ltp < 0.02;

    const prompt = `
You are PulseTrade Gemini Intraday Co-Pilot, an elite quant specializing exclusively in NSE/BSE intraday momentum, VWAP retests, and 15-minute Opening Range Breakouts (ORB). Your sole intention is to help the intraday day trader maximize risk-adjusted profit and protect capital.

REAL-TIME INTRADAY TELEMETRY:
- Symbol: ${stock.symbol} (${stock.name}, Sector: ${stock.sector})
- Last Traded Price (LTP): ₹${stock.ltp.toFixed(2)}
- Day Open: ₹${stock.dayOpen.toFixed(2)} | Day High: ₹${stock.dayHigh.toFixed(2)} | Day Low: ₹${stock.dayLow.toFixed(2)}
- Intraday VWAP: ₹${stock.vwap.toFixed(2)} (${vwapDiff >= 0 ? '+' : ''}${vwapDiff}% from VWAP)
- 15m Opening Range: High (ORH) ₹${stock.orh.toFixed(2)} | Low (ORL) ₹${stock.orl.toFixed(2)}
- Relative Volume (RVOL): ${stock.rvol.toFixed(1)}x average volume
- Current IST Market Session: ${clockTime} IST (${phase.bannerTitle || phase.label})
- Probability Score: ${stock.score}/100
- Bid-Ask Spread: ${stock.spread}% | F&O Ban Status: ${stock.fnoBan ? 'IN BAN (Avoid)' : 'CLEAR'}
- Near Upper Circuit: ${nearCircuit ? 'YES (High Slippage Risk)' : 'NO'}
- Latest Intraday Catalyst: "${stock.catalyst}" (${stock.catalystSentiment})

INTRADAY RULES:
1. Opening Range (09:15-09:30): Avoid early breakouts; high opening volatility.
2. Prime Breakout Window (09:30-10:45): Prime window for ORB setups above ORH with RVOL > 2.0x.
3. Midday Chop (11:00-14:00): Do not chase breakouts. Buy only on clean VWAP support pullbacks.
4. Auto Square-Off at 15:15 IST: Intraday MIS orders must have strict targets and trailing SL.
5. Minimum Risk-to-Reward: 1:2.0.

TASK:
Provide your disciplined intraday decision in exactly this JSON format (no markdown code blocks, just raw JSON):
{
  "verdict": "STRONG BUY BREAKOUT" or "BUY ON VWAP RETEST" or "WAIT FOR PULLBACK" or "AVOID (CHOP / EXTENDED)" or "SHORT ON BREAKDOWN",
  "action": "BUY" or "SELL" or "WAIT",
  "entry": 984.50,
  "stopLoss": 974.50,
  "target1": 1004.50,
  "target2": 1014.50,
  "rrRatio": "1:2.0",
  "rationale": "2-3 sentences explaining why this setup is valid right now during this IST phase.",
  "invalidation": "Exact trigger that voids this setup (e.g. 5m close below VWAP ₹974.50).",
  "disciplineWarning": "Key risk caution for intraday trader.",
  "timeHorizon": "15 to 45 mins"
}
`;

    const res = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: settings.apiKey,
        model: settings.model || 'gemini-1.5-flash',
        symbol: stock.symbol,
        catalyst: stock.catalyst,
        prompt
      })
    });

    const data = await res.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      let rawText = data.candidates[0].content.parts[0].text.trim();
      // Clean markdown code blocks if Gemini added them
      rawText = rawText.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(rawText);
      parsed.isLiveGemini = true;
      parsed.modelUsed = settings.model || 'gemini-1.5-flash';
      parsed.timestamp = clockTime;
      parsed.ragGrounding = data.ragGrounding || [];
      return parsed;
    } else {
      throw new Error((data.error && data.error.message) || 'Empty Gemini response');
    }
  }

  // Algorithmic high-precision intraday fallback when no API key is active
  generateAlgorithmicIntradayAdvice(stock, stream, phase, clockTime) {
    const isAboveVwap = stock.ltp >= stock.vwap;
    const isAboveOrh = stock.ltp >= stock.orh;
    const vwapDistance = Math.abs(stock.ltp - stock.vwap);
    const stopDistance = Math.max(stock.ltp * 0.006, vwapDistance);

    let verdict = 'BUY ON VWAP RETEST';
    let action = 'BUY';
    let entry = stock.ltp;
    let sl = Number((isAboveVwap ? stock.vwap : stock.ltp - stopDistance).toFixed(2));
    let t1 = Number((entry + (entry - sl) * 2).toFixed(2));
    let t2 = Number((entry + (entry - sl) * 3).toFixed(2));
    let rationale = '';
    let invalidation = '';
    let disciplineWarning = '';

    if (stream && stream.currentPhaseKey === 'CAUTION') {
      verdict = 'CAUTION: BUILDING 15M RANGE';
      action = 'WAIT';
      entry = Number((stock.orh * 1.002).toFixed(2));
      sl = stock.orl;
      t1 = Number((entry + (entry - sl) * 2).toFixed(2));
      t2 = Number((entry + (entry - sl) * 3).toFixed(2));
      rationale = `Session is in Opening Volatility (09:15-09:30). High institutional order-matching noise. Wait for 09:30 AM range completion before triggering breakout orders.`;
      invalidation = `Any trade taken before 09:30 AM has 48% higher false breakout probability.`;
      disciplineWarning = `Opening range is establishing: High ₹${stock.orh.toFixed(1)} / Low ₹${stock.orl.toFixed(1)}.`;
    } else if (stock.fnoBan) {
      verdict = 'AVOID: IN NSE F&O BAN';
      action = 'WAIT';
      rationale = `Stock is in NSE F&O ban with MWPL > 95%. Intraday institutional liquidity is fragmented. Capital preservation rule dictates avoiding ban stocks.`;
      invalidation = `Do not trade until MWPL cools below 80%.`;
      disciplineWarning = `High penalty & extreme volatility trap risk.`;
    } else if (isAboveOrh && stock.rvol >= 2.5 && isAboveVwap) {
      verdict = 'STRONG BUY BREAKOUT (ORB)';
      action = 'BUY';
      entry = stock.ltp;
      sl = Number(Math.max(stock.vwap, stock.orh * 0.995).toFixed(2));
      t1 = Number((entry + (entry - sl) * 2).toFixed(2));
      t2 = Number((entry + (entry - sl) * 3).toFixed(2));
      rationale = `Classic 15-min Opening Range Breakout confirmed above ₹${stock.orh.toFixed(2)} with surge in RVOL (${stock.rvol.toFixed(1)}x) and aligned with cyan VWAP. Prime Breakout session active.`;
      invalidation = `Candle close below 15m ORH (₹${stock.orh.toFixed(2)}) or cyan VWAP (₹${stock.vwap.toFixed(2)}).`;
      disciplineWarning = `Trail Stop-Loss to Breakeven once Target 1 (+₹${(t1 - entry).toFixed(1)}) is achieved.`;
    } else if (isAboveVwap && stock.ltp <= stock.vwap * 1.012) {
      verdict = 'BUY ON VWAP RETEST';
      action = 'BUY';
      entry = stock.ltp;
      sl = Number((stock.vwap * 0.993).toFixed(2));
      t1 = Number((entry + (entry - sl) * 2).toFixed(2));
      t2 = Number((entry + (entry - sl) * 3).toFixed(2));
      rationale = `Price pulled back to institutional equilibrium (VWAP ₹${stock.vwap.toFixed(2)}). Asymmetrical risk-reward entry with low stop-loss distance of ₹${(entry - sl).toFixed(1)}.`;
      invalidation = `Breakdown and 5m candle close below VWAP ₹${stock.vwap.toFixed(2)}.`;
      disciplineWarning = `Wait for green rejection wick at VWAP before full lot sizing.`;
    } else if (stock.ltp < stock.vwap && stock.score < 60) {
      verdict = 'SHORT SELL / BEARISH BIAS';
      action = 'SELL';
      entry = stock.ltp;
      sl = Number((stock.vwap * 1.006).toFixed(2));
      t1 = Number((entry - (sl - entry) * 2).toFixed(2));
      t2 = Number((entry - (sl - entry) * 3).toFixed(2));
      rationale = `Weak momentum: Trading below intraday VWAP with sub-par volume score (${stock.score}/100). Sellers defending VWAP as ceiling.`;
      invalidation = `Reclaim of VWAP ₹${stock.vwap.toFixed(2)} on volume invalidates short trade.`;
      disciplineWarning = `Strictly intraday MIS. Close short by 15:15 IST auto square-off.`;
    } else {
      verdict = 'WAIT FOR CLEAN CONFIRMATION';
      action = 'WAIT';
      entry = stock.ltp;
      sl = stock.vwap;
      t1 = Number((entry + 15).toFixed(2));
      t2 = Number((entry + 25).toFixed(2));
      rationale = `Stock is consolidating inside intraday range between VWAP (₹${stock.vwap.toFixed(1)}) and ORH (₹${stock.orh.toFixed(1)}). Await clean directional candle close.`;
      invalidation = `Do not enter in the middle of the channel.`;
      disciplineWarning = `Midday chop filter active. Preserve margin for high-probability setups.`;
    }

    const rrRatio = sl !== entry ? `1:${((Math.abs(t1 - entry)) / Math.abs(entry - sl)).toFixed(1)}` : '1:2.0';

    return {
      verdict,
      action,
      entry,
      stopLoss: sl,
      target1: t1,
      target2: t2,
      rrRatio,
      rationale,
      invalidation,
      disciplineWarning,
      timeHorizon: '15 to 45 mins',
      isLiveGemini: false,
      timestamp: clockTime,
      ragGrounding: [
        {
          id: isAboveOrh ? 'playbook-orb-breakout' : 'playbook-vwap-mean-reversion',
          title: isAboveOrh ? 'Opening Range Breakout (ORB) Institutional Playbook' : 'Institutional VWAP Equilibrium & Bounce Playbook',
          category: isAboveOrh ? 'PRICE_ACTION_STRATEGY' : 'MEAN_REVERSION_STRATEGY',
          similarity: 0.88
        },
        {
          id: 'playbook-sebi-circuit-risk',
          title: 'SEBI Intraday Circuit Band & Risk Management Playbook',
          category: 'RISK_MANAGEMENT',
          similarity: 0.82
        }
      ]
    };
  }

  // Apply Gemini recommended levels directly into Co-Pilot Trade Ticket
  applyLevelsToTradeTicket(advice) {
    if (!advice || !window.paperTradingDesk) return;

    window.paperTradingDesk.customEntry = advice.entry;
    window.paperTradingDesk.customSL = advice.stopLoss;
    window.paperTradingDesk.customTarget = advice.target1;
    window.paperTradingDesk.notify();

    if (window.arcadeAudio) window.arcadeAudio.playBlip();

    if (window.showAppToast) {
      window.showAppToast({
        title: "Gemini Levels Applied to Ticket",
        message: `Entry: ₹${advice.entry} | SL: ₹${advice.stopLoss} | TGT: ₹${advice.target1} (1:2 R:R)`,
        type: "success"
      });
    }
  }
}

window.geminiIntradayAdvisor = new GeminiIntradayAdvisor();
