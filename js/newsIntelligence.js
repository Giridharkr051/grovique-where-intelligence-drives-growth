// PulseTrade Live - News Intelligence & Intraday Catalyst Engine
// Analyzes Global, Country (India Macro), and Company news with price impact transmission, entry viability, winning setups, and Buy/Sell recommendations

class NewsIntelligenceEngine {
  constructor() {
    this.activeFilter = 'all'; // 'all', 'global', 'country', 'company', 'high-conviction'
    this.searchQuery = '';
    
    // Core Institutional News Database
    this.newsArticles = [
      // ==========================================
      // COMPANY NEWS 1: TATA MOTORS
      // ==========================================
      {
        id: 'news-tata-ev-demerger',
        category: 'company',
        badge: 'COMPANY CATALYST',
        title: 'Tata Motors Board Approves Strategic De-Merger into Two Pure-Play Listed Entities: Commercial & Passenger EVs',
        source: 'NSE Corporate Filing & Exchange Announcement',
        publishedAt: '08:45 AM IST Today',
        affectedStocks: ['TATAMOTORS', 'M&M'],
        primaryStock: 'TATAMOTORS',
        impactSentiment: 'STRONG_BULLISH',
        urgency: 'HIGH',
        
        // 1. HOW IT AFFECTS STOCK PRICES
        priceImpactMechanism: {
          summary: 'Unlocks enterprise valuation multiples for high-growth EV & JLR segments while de-risking cyclical commercial trucks.',
          transmission: [
            'Global EV & luxury arm (JLR + Tata Passenger EV) valued at 12x EV/EBITDA vs blended 7x historical multiple.',
            'Debt segregation into Commercial Vehicles removes long-term balance sheet drag.',
            'Foreign institutional brokerages (Morgan Stanley, Jefferies) raised 12-month target to ₹1,150+, triggering heavy opening gap and aggressive FII algorithmic basket buying.',
            'RVOL projected to surge 3.8x above 30-day average during 09:30-11:00 breakout window.'
          ]
        },

        // 2. IS IT GOOD TO ENTER TRADING TODAY?
        entryViability: {
          verdict: 'HIGH CONVICTION ENTRY',
          badgeClass: 'bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88]',
          isGoodToEnter: true,
          rationale: 'Ideal high-conviction intraday candidate. The catalyst has multi-day institutional backing, high institutional bid depth, narrow bid-ask spread (₹0.05), and strong momentum continuity above 20 EMA and VWAP. Slippage risk is negligible.'
        },

        // 3. POSSIBLE WAYS TO WIN (Intraday Playbook)
        waysToWin: [
          {
            setupName: '09:30 AM Opening Range Breakout (ORB)',
            description: 'Wait for the first 15-minute candle (09:15-09:30) high to be established (around ₹788.00). Place a Buy Stop-Limit 10 paise above the ORB high on 5M timeframe with volume confirmation > 2.5x.'
          },
          {
            setupName: 'VWAP Retest Pullback Bounce',
            description: 'If price spikes aggressively on pre-open euphoria, DO NOT chase. Allow the 5-minute candle to retrace back to test the rising VWAP (₹782-₹784) and enter on a bullish pin-bar/hammer.'
          },
          {
            setupName: 'High-of-Day (HOD) Trail',
            description: 'Trail stop-loss aggressively using the prior 15-minute low to maximize intraday R:R as stock targets intraday R2 resistance.'
          }
        ],

        // 4. BUY / SELL RECOMMENDATION
        recommendation: {
          symbol: 'TATAMOTORS',
          action: 'BUY',
          productType: 'MIS',
          entryPrice: 785.40,
          stopLoss: 775.00,
          target1: 806.00,
          target2: 816.00,
          riskPerShare: 10.40,
          rewardPerShare: 20.60,
          riskRewardRatio: '1:2.0',
          executionRule: 'Strict 15:15 auto square-off. Move SL to breakeven once Target 1 (+2.6%) is achieved.'
        }
      },

      // ==========================================
      // GLOBAL NEWS 1: BRENT CRUDE OIL
      // ==========================================
      {
        id: 'news-brent-crude-drop',
        category: 'global',
        badge: 'GLOBAL MACRO',
        title: 'Brent Crude Slumps 3.4% to $73.80/bbl on OPEC+ Output Normalization & Slower China Demand',
        source: 'Reuters / Bloomberg Global Energy Desk',
        publishedAt: '07:30 AM IST Today',
        affectedStocks: ['BPCL', 'TATAMOTORS', 'RELIANCE'],
        primaryStock: 'BPCL',
        impactSentiment: 'STRONG_BULLISH',
        urgency: 'HIGH',

        // 1. HOW IT AFFECTS STOCK PRICES
        priceImpactMechanism: {
          summary: 'Direct margin tailwind for Indian Oil Marketing Companies (OMCs) and Auto manufacturers; moderate dampener for upstream extractors.',
          transmission: [
            'OMCs (BPCL, HPCL, IOCL) retail fuel pricing remains steady while crude input costs drop $2.60/barrel, expanding gross marketing margins by ~₹1.80/litre.',
            'Auto majors benefit from lower synthetic rubber, petrochemical resins, and logistics freight freight expenses.',
            'Upstream exploration firms (ONGC, Oil India) see marginal realization dip; Reliance downstream margins mildly offset by petchem gains.'
          ]
        },

        // 2. IS IT GOOD TO ENTER TRADING TODAY?
        entryViability: {
          verdict: 'HIGH CONVICTION ENTRY',
          badgeClass: 'bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88]',
          isGoodToEnter: true,
          rationale: 'Fabulous directional trend day setup for BPCL and OMCs. Crude drops produce clean, low-whip institutional accumulation in Indian fuel retailers with high intraday beta.'
        },

        // 3. POSSIBLE WAYS TO WIN
        waysToWin: [
          {
            setupName: 'Morning Momentum Squeeze',
            description: 'Enter BPCL on market open if opening price is above previous day close (+0.8%). Ride first 45 minutes until 10:00 AM with VWAP as trend anchor.'
          },
          {
            setupName: 'Ascending Triangle Breakout',
            description: 'Look for consolidation between ₹302 and ₹305. Enter immediately on 5M candle breakout above ₹305.20.'
          }
        ],

        // 4. BUY / SELL RECOMMENDATION
        recommendation: {
          symbol: 'BPCL',
          action: 'BUY',
          productType: 'MIS',
          entryPrice: 304.50,
          stopLoss: 299.50,
          target1: 314.50,
          target2: 319.50,
          riskPerShare: 5.00,
          rewardPerShare: 10.00,
          riskRewardRatio: '1:2.0',
          executionRule: 'Exit before European market open if crude reverses above $75.50.'
        }
      },

      // ==========================================
      // COUNTRY (INDIA) NEWS 1: RBI MONETARY POLICY
      // ==========================================
      {
        id: 'news-rbi-monetary-policy',
        category: 'country',
        badge: 'COUNTRY MACRO',
        title: 'RBI MPC Holds Repo Rate at 6.50%; Upgrades FY26 India GDP Growth Forecast to 7.2% with Benign Inflation',
        source: 'Reserve Bank of India Official Bulletin / Press Release',
        publishedAt: '10:02 AM IST Today',
        affectedStocks: ['HDFCBANK', 'ICICIBANK', 'SBIN'],
        primaryStock: 'HDFCBANK',
        impactSentiment: 'STRONG_BULLISH',
        urgency: 'CRITICAL',

        // 1. HOW IT AFFECTS STOCK PRICES
        priceImpactMechanism: {
          summary: 'Guarantees bank Net Interest Margin (NIM) stability while eliminating credit delinquency risk in retail & MSME books.',
          transmission: [
            'No rate hike ensures cost of funds remains capped while deposit re-pricing nears completion.',
            'GDP upgrade to 7.2% signals resilient corporate capex demand and 14-16% system-wide credit growth.',
            'Bank Nifty weight represents 34% of Nifty 50, triggering institutional program buying across front-line private banks (HDFC Bank, ICICI Bank).'
          ]
        },

        // 2. IS IT GOOD TO ENTER TRADING TODAY?
        entryViability: {
          verdict: 'HIGH CONVICTION ENTRY',
          badgeClass: 'bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88]',
          isGoodToEnter: true,
          rationale: 'Superb macro clarity. High-liquidity trend session. When RBI releases positive growth guidance, Bank Nifty tends to trend smoothly without intraday whipsaws.'
        },

        // 3. POSSIBLE WAYS TO WIN
        waysToWin: [
          {
            setupName: 'Post-Policy 10:15 Range Breakout',
            description: 'Mark the high of the 10:00-10:15 RBI Governor statement candle. Place Buy trigger above that candle high with strict stop-loss at candle low.'
          },
          {
            setupName: 'Trend-Following VWAP Rider',
            description: 'Add on 5-minute dips to 20-period Exponential Moving Average (EMA). Never short against RBI positive macro trend.'
          }
        ],

        // 4. BUY / SELL RECOMMENDATION
        recommendation: {
          symbol: 'HDFCBANK',
          action: 'BUY',
          productType: 'MIS',
          entryPrice: 1745.50,
          stopLoss: 1730.00,
          target1: 1776.50,
          target2: 1792.00,
          riskPerShare: 15.50,
          rewardPerShare: 31.00,
          riskRewardRatio: '1:2.0',
          executionRule: 'Hold into afternoon session; trail stop-loss below 15-minute swing lows.'
        }
      },

      // ==========================================
      // COMPANY NEWS 2: ZOMATO BLINKIT
      // ==========================================
      {
        id: 'news-zomato-blinkit-profit',
        category: 'company',
        badge: 'COMPANY CATALYST',
        title: 'Zomato Blinkit Reports 112% YoY GOV Growth; Hits Adjusted EBITDA Break-Even 2 Quarters Ahead of Schedule',
        source: 'NSE Exchange Corporate Filings / Investor Presentation',
        publishedAt: '08:15 AM IST Today',
        affectedStocks: ['ZOMATO'],
        primaryStock: 'ZOMATO',
        impactSentiment: 'STRONG_BULLISH',
        urgency: 'HIGH',

        // 1. HOW IT AFFECTS STOCK PRICES
        priceImpactMechanism: {
          summary: 'Dispels cash-burn concerns in Quick Commerce; validates unit economics and dark store expansion pace.',
          transmission: [
            'Blinkit contribution margin turns positive to +1.8% per order vs -2.4% last year.',
            'Target store count raised to 1,200 dark stores by FY27 without secondary equity dilution.',
            'Short sellers holding intraday derivative hedges are forced to cover aggressively at the open.'
          ]
        },

        // 2. IS IT GOOD TO ENTER TRADING TODAY?
        entryViability: {
          verdict: 'HIGH CONVICTION ENTRY',
          badgeClass: 'bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88]',
          isGoodToEnter: true,
          rationale: 'Prime short-squeeze candidate. Zomato exhibits high retail float and rapid momentum expansion. Spreads are liquid and breakouts carry high follow-through.'
        },

        // 3. POSSIBLE WAYS TO WIN
        waysToWin: [
          {
            setupName: 'Quick Squeeze Opening Spike',
            description: 'If opening 3-minute candle closes in upper 20% of range, enter long with target of +3.5% intraday extension.'
          },
          {
            setupName: 'Bullish Flag Breakout',
            description: 'Wait for 15-minute consolidation between 10:00 and 10:30. Enter long when price pierces the descending flag boundary.'
          }
        ],

        // 4. BUY / SELL RECOMMENDATION
        recommendation: {
          symbol: 'ZOMATO',
          action: 'BUY',
          productType: 'MIS',
          entryPrice: 268.40,
          stopLoss: 263.40,
          target1: 278.40,
          target2: 283.40,
          riskPerShare: 5.00,
          rewardPerShare: 10.00,
          riskRewardRatio: '1:2.0',
          executionRule: 'Take partial profit (50%) at Target 1; move SL to ₹268.40.'
        }
      },

      // ==========================================
      // GLOBAL NEWS 2: US FED & TECH DISCRETIONARY SPEND
      // ==========================================
      {
        id: 'news-us-fed-rate-it',
        category: 'global',
        badge: 'GLOBAL MACRO',
        title: 'US Fed Signals "Higher for Longer" Rates; Nasdaq Tech Discretionary Spending Remains Sluggish',
        source: 'Federal Open Market Committee (FOMC) Statement',
        publishedAt: '06:45 AM IST Today',
        affectedStocks: ['INFY'],
        primaryStock: 'INFY',
        impactSentiment: 'BEARISH',
        urgency: 'HIGH',

        // 1. HOW IT AFFECTS STOCK PRICES
        priceImpactMechanism: {
          summary: 'Higher US bond yields delay North American corporate IT spending transformations, hurting Indian IT exporters.',
          transmission: [
            'US 10-Year Treasury Yield spikes to 4.42%, triggering discount rate hikes on tech valuation multiples.',
            'BFSI & Telecom clients in US/Europe freeze non-critical cloud and consulting contracts.',
            'Indian IT index faces heavy opening institutional liquidation; INFY opening with negative delta.'
          ]
        },

        // 2. IS IT GOOD TO ENTER TRADING TODAY?
        entryViability: {
          verdict: 'WAIT FOR RETEST (BEARISH SHORT CANDIDATE)',
          badgeClass: 'bg-[#FF2A6D]/20 border border-[#FF2A6D] text-[#FF2A6D]',
          isGoodToEnter: true,
          rationale: 'Good for intraday short-selling, BUT traders must not short the initial gap down blindly. Wait for a dead-cat bounce to VWAP before triggering the short trade.'
        },

        // 3. POSSIBLE WAYS TO WIN
        waysToWin: [
          {
            setupName: 'VWAP Rejection Short',
            description: 'Wait for price to bounce 0.5% towards VWAP (₹1,858-₹1,862). Short immediately upon observing an upper rejection wick / inverted hammer.'
          },
          {
            setupName: 'Day Low Breakdown',
            description: 'Short if stock breaks below 09:45 AM low with 2x RVOL, placing stop-loss above recent 5M swing high.'
          }
        ],

        // 4. BUY / SELL RECOMMENDATION
        recommendation: {
          symbol: 'INFY',
          action: 'SELL',
          productType: 'MIS',
          entryPrice: 1854.20,
          stopLoss: 1870.00,
          target1: 1822.60,
          target2: 1806.80,
          riskPerShare: 15.80,
          rewardPerShare: 31.60,
          riskRewardRatio: '1:2.0',
          executionRule: 'Sell Short on intraday MIS. Cover automatically before 15:15 IST.'
        }
      },

      // ==========================================
      // COUNTRY (INDIA) NEWS 2: FII / DII INSTITUTIONAL FLOWS
      // ==========================================
      {
        id: 'news-fii-dii-liquidity',
        category: 'country',
        badge: 'COUNTRY MACRO',
        title: 'FIIs Turn Strong Net Buyers of ₹3,420 Cr; Domestic Mutual Funds Absorb Another ₹2,180 Cr in Cash Equities',
        source: 'NSE Daily Institutional Turnovers (Provisional Data)',
        publishedAt: '08:30 AM IST Today',
        affectedStocks: ['RELIANCE', 'SBIN', 'ICICIBANK'],
        primaryStock: 'RELIANCE',
        impactSentiment: 'STRONG_BULLISH',
        urgency: 'HIGH',

        // 1. HOW IT AFFECTS STOCK PRICES
        priceImpactMechanism: {
          summary: 'Massive dual institutional liquidity wave absorbs morning retail sell orders and underpins frontline index heavyweights.',
          transmission: [
            'Sustained cash accumulation in Nifty 50 heavyweight Reliance Industries (post-bonus price ₹1,339.70).',
            'Derivatives open interest shows heavy call unwinding at 1,350 strike and aggressive put writing at 1,320.',
            'Low probability of deep intraday pullbacks; dip buyers dominate all session.'
          ]
        },

        // 2. IS IT GOOD TO ENTER TRADING TODAY?
        entryViability: {
          verdict: 'HIGH CONVICTION ENTRY',
          badgeClass: 'bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88]',
          isGoodToEnter: true,
          rationale: 'Safe, low-beta institutional trend day. Heavy liquidity allows large position sizing with minimal slippage on Reliance MIS trades.'
        },

        // 3. POSSIBLE WAYS TO WIN
        waysToWin: [
          {
            setupName: 'First Pullback to 9 EMA',
            description: 'Enter long on the very first touch of 9 EMA on 15M chart after 10:00 AM.'
          },
          {
            setupName: 'VWAP Bounce with Supertrend Confirmation',
            description: 'Enter when Supertrend turns green and price bounces off the daily VWAP.'
          }
        ],

        // 4. BUY / SELL RECOMMENDATION
        recommendation: {
          symbol: 'RELIANCE',
          action: 'BUY',
          productType: 'MIS',
          entryPrice: 1339.70,
          stopLoss: 1327.70,
          target1: 1363.70,
          target2: 1375.70,
          riskPerShare: 12.00,
          rewardPerShare: 24.00,
          riskRewardRatio: '1:2.0',
          executionRule: 'Hold as core intraday trend runner. Square off before 15:15 IST.'
        }
      },

      // ==========================================
      // COMPANY NEWS 3: MAHINDRA & MAHINDRA
      // ==========================================
      {
        id: 'news-mm-ev-bookings',
        category: 'company',
        badge: 'COMPANY CATALYST',
        title: 'M&M Clocks Record 50,000 Bookings in First 60 Minutes for New Born Electric SUV Series',
        source: 'Exchange Regulatory Filing & Press Release',
        publishedAt: '09:05 AM IST Today',
        affectedStocks: ['M&M', 'TATAMOTORS'],
        primaryStock: 'M&M',
        impactSentiment: 'STRONG_BULLISH',
        urgency: 'HIGH',

        // 1. HOW IT AFFECTS STOCK PRICES
        priceImpactMechanism: {
          summary: 'Guarantees production visibility and revenue realization for the next 14 months at premium average selling prices (ASPs).',
          transmission: [
            'Total order backlog value exceeds ₹12,500 Cr in a single morning launch.',
            'EBITDA margins on electric flagship models estimated at 14.5%, beating consensus expectations.',
            'Institutional auto analysts revise FY26 EPS estimates upward by 8%.'
          ]
        },

        // 2. IS IT GOOD TO ENTER TRADING TODAY?
        entryViability: {
          verdict: 'HIGH CONVICTION ENTRY',
          badgeClass: 'bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88]',
          isGoodToEnter: true,
          rationale: 'Exceptional fundamental trigger with retail buzz. Order flow displays massive green market-order volume clusters at ₹2,920-₹2,930.'
        },

        // 3. POSSIBLE WAYS TO WIN
        waysToWin: [
          {
            setupName: 'High of Day Continuation',
            description: 'Enter on 5M candle breakout above morning peak ₹2,930 with stop-loss at ₹2,900.'
          },
          {
            setupName: 'RVOL Surge Scalp',
            description: 'Scalp 15-20 points every time RVOL prints a new 1-minute high.'
          }
        ],

        // 4. BUY / SELL RECOMMENDATION
        recommendation: {
          symbol: 'M&M',
          action: 'BUY',
          productType: 'MIS',
          entryPrice: 2920.00,
          stopLoss: 2880.00,
          target1: 3000.00,
          target2: 3040.00,
          riskPerShare: 40.00,
          rewardPerShare: 80.00,
          riskRewardRatio: '1:2.0',
          executionRule: 'Take 50% profit at Target 1 (₹3,000.00), trail remaining shares with 15M candle low.'
        }
      }
    ];
  }

  // Filter articles based on active criteria
  getFilteredArticles() {
    return this.newsArticles.filter(item => {
      // Category filter
      if (this.activeFilter === 'global' && item.category !== 'global') return false;
      if (this.activeFilter === 'country' && item.category !== 'country') return false;
      if (this.activeFilter === 'company' && item.category !== 'company') return false;
      if (this.activeFilter === 'high-conviction' && !item.entryViability.verdict.includes('HIGH CONVICTION')) return false;

      // Search query
      if (this.searchQuery && this.searchQuery.trim().length > 0) {
        const query = this.searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesStock = item.affectedStocks.some(s => s.toLowerCase().includes(query));
        const matchesSummary = item.priceImpactMechanism.summary.toLowerCase().includes(query);
        if (!matchesTitle && !matchesStock && !matchesSummary) return false;
      }

      return true;
    });
  }

  setFilter(filter) {
    this.activeFilter = filter;
    if (window.arcadeAudio) window.arcadeAudio.playBlip();
    if (window.app) window.app.renderActiveScreen();
  }

  setSearchQuery(query) {
    this.searchQuery = query;
    if (window.app) window.app.renderActiveScreen();
  }

  // Get news relevant to a specific stock symbol
  getNewsForStock(symbol) {
    if (!symbol) return [];
    const sym = symbol.toUpperCase();
    return this.newsArticles.filter(item => item.affectedStocks.includes(sym));
  }

  // Apply a setup directly to the trade ticket drawer
  applySetupToTicket(newsId) {
    const article = this.newsArticles.find(n => n.id === newsId);
    if (!article || !article.recommendation) return;

    const rec = article.recommendation;
    if (window.arcadeAudio) {
      if (typeof window.arcadeAudio.playOrderExecuted === 'function') {
        window.arcadeAudio.playOrderExecuted();
      } else if (typeof window.arcadeAudio.playBuyFill === 'function') {
        window.arcadeAudio.playBuyFill();
      } else if (typeof window.arcadeAudio.playBlip === 'function') {
        window.arcadeAudio.playBlip();
      }
    }

    if (window.app) {
      window.app.openStockInDrawer(rec.symbol, {
        symbol: rec.symbol,
        action: rec.action,
        entryPrice: rec.entryPrice,
        stopLoss: rec.stopLoss,
        target: rec.target1,
        productType: 'MIS'
      });
    }

    if (window.showAppToast) {
      window.showAppToast({
        title: `Catalyst Setup Applied: ${rec.symbol}`,
        message: `${rec.action} @ ₹${rec.entryPrice} | SL: ₹${rec.stopLoss} | T1: ₹${rec.target1} (R:R ${rec.riskRewardRatio}) loaded into trade ticket.`,
        type: 'success',
        symbol: rec.symbol
      });
    }
  }

  // Trigger Gemini AI deep analysis of this news event
  async analyzeWithGemini(newsId) {
    const article = this.newsArticles.find(n => n.id === newsId);
    if (!article) return;

    if (window.showAppToast) {
      window.showAppToast({
        title: 'Gemini AI Intraday Co-Pilot',
        message: `Analyzing "${article.title.slice(0, 40)}..." for real-time market impact...`,
        type: 'info'
      });
    }

    if (window.geminiIntradayAdvisor) {
      const stock = window.marketStream ? window.marketStream.getStock(article.primaryStock) : null;
      await window.geminiIntradayAdvisor.analyzeStock(stock || { symbol: article.primaryStock, ltp: article.recommendation.entryPrice }, true);
      if (window.app) window.app.renderActiveScreen();
    }
  }
}

// Global engine instance
window.newsIntelligence = new NewsIntelligenceEngine();
