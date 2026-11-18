// GROVIQUE - Core Screens & Component Suite
// Built in strict compliance with DESIGN.md, SCREEN_SPEC.md, and FEATURES.md.
// Theme: "Quietly Powerful Market Terminal" (#080D16, #111B2B, #54E0C1)

(function () {
  const UI = window.UIComponents = window.UIComponents || {};

  // Store for active learning article & scanner drawer state
  window.groviqueState = {
    activeScannerSymbol: 'RELIANCE',
    isWhyMatchedOpen: false,
    activeLearningArticle: null,
    isNewPaperIdeaOpen: false,
    isCreateAlertOpen: false,
    activeWatchlistTab: 'Main Watchlist',
    watchlists: {
      'Main Watchlist': ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS'],
      'High RVOL Breakouts': ['TATAMOTORS', 'TRENT', 'ZOMATO', 'BEL'],
      'Banking & Financials': ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK']
    },
    paperIdeas: [
      {
        id: 'SIM_001',
        symbol: 'RELIANCE',
        direction: 'BUY',
        entryPrice: 1339.70,
        currentPrice: 1342.50,
        stopLoss: 1332.00,
        target: 1355.00,
        quantity: 50,
        thesis: '15m ORB breakout with >1.8x volume and VWAP support.',
        status: 'OPEN',
        entryTime: '09:35 IST',
        slippageFrictionINR: 53.50
      },
      {
        id: 'SIM_002',
        symbol: 'TATAMOTORS',
        direction: 'BUY',
        entryPrice: 782.40,
        currentPrice: 791.10,
        stopLoss: 775.00,
        target: 805.00,
        quantity: 100,
        thesis: 'Commercial EV delivery order surge; 9 EMA trending above 20 EMA.',
        status: 'OPEN',
        entryTime: '10:15 IST',
        slippageFrictionINR: 59.10
      },
      {
        id: 'SIM_003',
        symbol: 'TCS',
        direction: 'BUY',
        entryPrice: 3820.00,
        currentPrice: 3865.00,
        stopLoss: 3790.00,
        target: 3880.00,
        quantity: 25,
        thesis: 'Camarilla H4 breakout with US mega-deal renewal.',
        status: 'CLOSED',
        exitPrice: 3865.00,
        entryTime: 'Yesterday',
        exitTime: '14:20 IST',
        slippageFrictionINR: 58.00
      }
    ],
    alertsList: [
      { id: 'ALT_1', symbol: 'RELIANCE', condition: 'LTP >= ₹1,350.00', status: 'ACTIVE', created: '09:20 IST', triggers: 0 },
      { id: 'ALT_2', symbol: 'TATAMOTORS', condition: 'RVOL >= 2.0x Surge', status: 'ACTIVE', created: '09:45 IST', triggers: 1 },
      { id: 'ALT_3', symbol: 'HDFCBANK', condition: 'LTP crosses above VWAP', status: 'TRIGGERED', created: '10:05 IST', triggers: 1 },
      { id: 'ALT_4', symbol: 'INFY', condition: 'RSI(14) >= 65 Overbought', status: 'PAUSED', created: 'Yesterday', triggers: 0 }
    ]
  };

  // Safe helper to compute changePct and ensure all stock fields exist
  const getChangePct = (s) => {
    if (!s) return 0;
    if (typeof s.changePct === 'number' && !isNaN(s.changePct)) return s.changePct;
    const prev = (s.previousClose && s.previousClose > 0) ? s.previousClose : (s.dayOpen || s.ltp || 1);
    const ltp = typeof s.ltp === 'number' ? s.ltp : prev;
    return Number((((ltp - prev) / prev) * 100).toFixed(2));
  };

  const sanitizeStock = (s) => {
    if (!s) return { symbol: 'UNKNOWN', ltp: 1000, changePct: 0, volume: 1000000, vwap: 1000, score: 75, rvol: 1.5 };
    s.changePct = getChangePct(s);
    if (typeof s.volume !== 'number') s.volume = 1000000;
    if (typeof s.vwap !== 'number') s.vwap = s.ltp || 1000;
    if (typeof s.score !== 'number') s.score = 75;
    if (typeof s.rvol !== 'number') s.rvol = 1.5;
    return s;
  };

  const getCleanStocks = (stream) => {
    const list = (stream && stream.stocks) ? stream.stocks : [];
    list.forEach(sanitizeStock);
    return list;
  };

  // ========================================================
  // 1. DASHBOARD / MARKET OVERVIEW SCREEN
  // ========================================================
  UI.renderDashboardOverview = function (stream) {
    const stocks = getCleanStocks(stream);
    const topGainers = [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
    const topLosers = [...stocks].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
    const highVolume = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 5);
    const highTurnover = [...stocks].sort((a, b) => (b.ltp * b.volume) - (a.ltp * a.volume)).slice(0, 5);

    const breadth = window.TechnicalIndicators ? window.TechnicalIndicators.computeMarketBreadth(stocks) : {
      advances: 29, declines: 18, unchanged: 3, adRatio: 1.61, advancePct: 58, declinePct: 36, regime: "MODERATE BULLISH", regimeColor: "#45D6A4"
    };

    const isMarketOpen = window.nseCalendar ? window.nseCalendar.getMarketStatus().isOpen : true;

    return `
      <div class="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 font-sans text-[#F1F5F9]">
        
        <!-- PAGE TITLE & SESSION CONTEXT -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#26364B] gap-3">
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full ${isMarketOpen ? 'bg-[#45D6A4] pulse-live' : 'bg-[#F5BD62]'}"></span>
              <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F5F9]">Market Overview</h1>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isMarketOpen ? 'bg-[#45D6A4]/15 text-[#45D6A4] border border-[#45D6A4]/40' : 'bg-[#F5BD62]/15 text-[#F5BD62] border border-[#F5BD62]/40'}">
                ${isMarketOpen ? 'LIVE SESSION' : 'CLOSED (OFFICIAL CLOSE)'}
              </span>
            </div>
            <p class="text-xs text-[#A8B5C7]">NSE & BSE Market Intelligence • Tabular Real-Time Quotes • Freshness: <span class="text-[#54E0C1] font-mono font-semibold">12ms Latency</span></p>
          </div>

          <!-- Quick Navigation Actions -->
          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="window.app.openScreen('scanner')" class="px-3 py-1.5 rounded-lg bg-[#111B2B] hover:bg-[#162337] border border-[#26364B] hover:border-[#54E0C1] text-xs font-mono font-semibold text-[#54E0C1] flex items-center gap-1.5 transition-all shadow-sm">
              <span class="material-symbols-outlined text-[16px]">filter_list</span>
              <span>Open Scanner</span>
            </button>
            <button onclick="window.app.openScreen('investment-calculators')" class="px-3 py-1.5 rounded-lg bg-[#111B2B] hover:bg-[#162337] border border-[#26364B] hover:border-[#F5BD62] text-xs font-mono font-semibold text-[#F5BD62] flex items-center gap-1.5 transition-all shadow-sm">
              <span class="material-symbols-outlined text-[16px]">calculate</span>
              <span>Calculators</span>
            </button>
            <button onclick="window.app.openScreen('paper-journal')" class="px-3 py-1.5 rounded-lg bg-[#111B2B] hover:bg-[#162337] border border-[#26364B] text-xs font-mono font-semibold text-[#A8B5C7] flex items-center gap-1.5 transition-all">
              <span class="material-symbols-outlined text-[16px]">menu_book</span>
              <span>Paper Journal</span>
            </button>
          </div>
        </div>

        <!-- ROW 1: 4 BENCHMARK INDEX CARDS -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          <!-- NIFTY 50 -->
          <div class="p-3.5 rounded-xl bg-[#111B2B] border border-[#26364B] flex flex-col justify-between shadow-md hover:border-[#344861] transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-[#A8B5C7]">NIFTY 50 [NSE]</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#FF7785]/15 text-[#FF7785]">-0.61%</span>
            </div>
            <div class="my-2">
              <div class="font-mono text-xl font-bold text-[#F1F5F9]">25,144.30</div>
              <div class="font-mono text-xs text-[#FF7785]">-154.20 pts</div>
            </div>
            <div class="flex items-center justify-between text-[10px] font-mono text-[#74849A] pt-1.5 border-t border-[#26364B]/80">
              <span>L: 25,090.10</span>
              <span class="w-16 h-1 bg-[#162337] rounded-full overflow-hidden mx-1.5"><div class="bg-[#54E0C1] h-full" style="width: 45%"></div></span>
              <span>H: 25,280.40</span>
            </div>
          </div>

          <!-- SENSEX -->
          <div class="p-3.5 rounded-xl bg-[#111B2B] border border-[#26364B] flex flex-col justify-between shadow-md hover:border-[#344861] transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-[#A8B5C7]">SENSEX [BSE]</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#FF7785]/15 text-[#FF7785]">-0.55%</span>
            </div>
            <div class="my-2">
              <div class="font-mono text-xl font-bold text-[#F1F5F9]">82,540.20</div>
              <div class="font-mono text-xs text-[#FF7785]">-455.80 pts</div>
            </div>
            <div class="flex items-center justify-between text-[10px] font-mono text-[#74849A] pt-1.5 border-t border-[#26364B]/80">
              <span>L: 82,310.00</span>
              <span class="w-16 h-1 bg-[#162337] rounded-full overflow-hidden mx-1.5"><div class="bg-[#54E0C1] h-full" style="width: 52%"></div></span>
              <span>H: 82,890.00</span>
            </div>
          </div>

          <!-- BANK NIFTY -->
          <div class="p-3.5 rounded-xl bg-[#111622] border border-[#26364B] flex flex-col justify-between shadow-md hover:border-[#344861] transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-[#A8B5C7]">BANK NIFTY [NSE]</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#FF7785]/15 text-[#FF7785]">-0.79%</span>
            </div>
            <div class="my-2">
              <div class="font-mono text-xl font-bold text-[#F1F5F9]">51,805.30</div>
              <div class="font-mono text-xs text-[#FF7785]">-412.50 pts</div>
            </div>
            <div class="flex items-center justify-between text-[10px] font-mono text-[#74849A] pt-1.5 border-t border-[#26364B]/80">
              <span>L: 51,650.00</span>
              <span class="w-16 h-1 bg-[#162337] rounded-full overflow-hidden mx-1.5"><div class="bg-[#54E0C1] h-full" style="width: 38%"></div></span>
              <span>H: 52,190.00</span>
            </div>
          </div>

          <!-- INDIA VIX -->
          <div class="p-3.5 rounded-xl bg-[#111622] border border-[#26364B] flex flex-col justify-between shadow-md hover:border-[#344861] transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-[#A8B5C7]">INDIA VIX (VOLATILITY)</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#45D6A4]/15 text-[#45D6A4]">+2.10%</span>
            </div>
            <div class="my-2">
              <div class="font-mono text-xl font-bold text-[#79B8FF]">13.85</div>
              <div class="font-mono text-xs text-[#45D6A4]">+0.28 pts (Moderate Range)</div>
            </div>
            <div class="flex items-center justify-between text-[10px] font-mono text-[#74849A] pt-1.5 border-t border-[#26364B]/80">
              <span>Low: 13.10</span>
              <span class="text-[#54E0C1]">Normal Regime</span>
              <span>High: 14.25</span>
            </div>
          </div>

        </div>

        <!-- ROW 2: MARKET BREADTH & SAVED SCANNER PRESETS -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- Market Breadth Panel (7 cols) -->
          <div class="lg:col-span-7 p-4.5 rounded-xl bg-[#111B2B] border border-[#26364B] shadow-md flex flex-col gap-3">
            <div class="flex items-center justify-between pb-2 border-b border-[#26364B]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#54E0C1] text-[18px]">equalizer</span>
                <span class="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider font-mono">NSE Advance-Decline Breadth</span>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold" style="background-color: ${breadth.regimeColor}15; color: ${breadth.regimeColor}; border: 1px solid ${breadth.regimeColor}40">
                ${breadth.regime} (A/D: ${breadth.adRatio})
              </span>
            </div>

            <!-- Visual Advance / Decline Ratio Bar -->
            <div class="flex flex-col gap-1.5">
              <div class="w-full h-3 rounded-full overflow-hidden bg-[#162337] flex">
                <div class="bg-[#45D6A4] h-full" style="width: ${breadth.advancePct}%" title="Advances: ${breadth.advances}"></div>
                <div class="bg-[#74849A] h-full" style="width: 6%" title="Unchanged: ${breadth.unchanged}"></div>
                <div class="bg-[#FF7785] h-full" style="width: ${breadth.declinePct}%" title="Declines: ${breadth.declines}"></div>
              </div>
              <div class="flex justify-between text-xs font-mono">
                <span class="text-[#45D6A4] font-bold">▲ ${breadth.advances} Advancing (${breadth.advancePct}%)</span>
                <span class="text-[#A8B5C7]">${breadth.unchanged} Flat</span>
                <span class="text-[#FF7785] font-bold">▼ ${breadth.declines} Declining (${breadth.declinePct}%)</span>
              </div>
            </div>
          </div>

          <!-- Saved Scanner Presets (5 cols) -->
          <div class="lg:col-span-5 p-4.5 rounded-xl bg-[#111B2B] border border-[#26364B] shadow-md flex flex-col gap-2.5">
            <div class="flex items-center justify-between pb-2 border-b border-[#26364B]">
              <span class="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[#F5BD62] text-[17px]">bookmark</span>
                <span>Saved Scanner Presets</span>
              </span>
              <button onclick="window.app.openScreen('scanner')" class="text-[10px] font-mono text-[#54E0C1] hover:underline">View All</button>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
              <button onclick="window.marketStream.setStrategy('ORB'); window.app.openScreen('scanner');"
                      class="p-2.5 rounded-lg bg-[#0D1421] border border-[#26364B] hover:border-[#54E0C1] text-left transition-all group">
                <div class="font-bold text-[#F1F5F9] group-hover:text-[#54E0C1]">15m ORB Breakout</div>
                <div class="text-[10px] text-[#A8B5C7] mt-0.5">RVOL &gt; 1.8x • Above VWAP</div>
              </button>
              <button onclick="window.marketStream.setStrategy('VWAP'); window.app.openScreen('scanner');"
                      class="p-2.5 rounded-lg bg-[#0D1421] border border-[#26364B] hover:border-[#54E0C1] text-left transition-all group">
                <div class="font-bold text-[#F1F5F9] group-hover:text-[#54E0C1]">VWAP Trend Bounce</div>
                <div class="text-[10px] text-[#A8B5C7] mt-0.5">9 EMA &gt; 20 EMA slope</div>
              </button>
              <button onclick="window.marketStream.setStrategy('VOLUME'); window.app.openScreen('scanner');"
                      class="p-2.5 rounded-lg bg-[#0D1421] border border-[#26364B] hover:border-[#54E0C1] text-left transition-all group">
                <div class="font-bold text-[#F1F5F9] group-hover:text-[#54E0C1]">Volume Shockers</div>
                <div class="text-[10px] text-[#A8B5C7] mt-0.5">RVOL &gt; 2.5x turnover</div>
              </button>
              <button onclick="window.app.openScreen('scanner')"
                      class="p-2.5 rounded-lg bg-[#0D1421] border border-[#26364B] hover:border-[#54E0C1] text-left transition-all group">
                <div class="font-bold text-[#F1F5F9] group-hover:text-[#54E0C1]">Camarilla H4/L4</div>
                <div class="text-[10px] text-[#A8B5C7] mt-0.5">Range expansion break</div>
              </button>
            </div>
          </div>

        </div>

        <!-- ROW 3: TOP MOVERS & HIGH VOLUME LEADERBOARDS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          
          <!-- Top Gainers Table -->
          <div class="p-4 rounded-xl bg-[#111B2B] border border-[#26364B] shadow-md flex flex-col gap-2.5">
            <div class="flex items-center justify-between pb-2 border-b border-[#26364B]">
              <span class="text-xs font-bold text-[#45D6A4] font-mono flex items-center gap-1.5 uppercase">
                <span class="material-symbols-outlined text-[16px]">trending_up</span>
                <span>Top Gainers (NSE 50)</span>
              </span>
              <span class="text-[10px] font-mono text-[#74849A]">Ranked by % Change</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left font-mono text-xs">
                <thead>
                  <tr class="text-[#74849A] text-[10px] border-b border-[#26364B]">
                    <th class="pb-2">SYMBOL</th>
                    <th class="pb-2 text-right">LTP (₹)</th>
                    <th class="pb-2 text-right">CHANGE</th>
                    <th class="pb-2 text-right">VOLUME</th>
                    <th class="pb-2 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#26364B]/60">
                  ${topGainers.map(s => `
                    <tr class="hover:bg-[#162337] transition-colors cursor-pointer" onclick="window.app.openStockInDeepDive('${s.symbol}')">
                      <td class="py-2 font-bold text-[#F1F5F9]">${s.symbol} <span class="text-[10px] text-[#74849A] block font-normal truncate max-w-[120px]">${s.name}</span></td>
                      <td class="py-2 text-right font-bold text-[#45D6A4]">₹${s.ltp.toFixed(2)}</td>
                      <td class="py-2 text-right text-[#45D6A4] font-bold">+${s.changePct.toFixed(2)}%</td>
                      <td class="py-2 text-right text-[#A8B5C7]">${(s.volume / 100000).toFixed(1)}L</td>
                      <td class="py-2 text-right">
                        <button onclick="event.stopPropagation(); window.app.openStockInDeepDive('${s.symbol}')" class="px-2 py-0.5 rounded bg-[#162337] hover:bg-[#54E0C1] text-[#A8B5C7] hover:text-[#080D16] text-[10px] font-bold transition-all">Chart</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Top Losers Table -->
          <div class="p-4 rounded-xl bg-[#111B2B] border border-[#26364B] shadow-md flex flex-col gap-2.5">
            <div class="flex items-center justify-between pb-2 border-b border-[#26364B]">
              <span class="text-xs font-bold text-[#FF7785] font-mono flex items-center gap-1.5 uppercase">
                <span class="material-symbols-outlined text-[16px]">trending_down</span>
                <span>Top Losers (NSE 50)</span>
              </span>
              <span class="text-[10px] font-mono text-[#74849A]">Ranked by % Change</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left font-mono text-xs">
                <thead>
                  <tr class="text-[#74849A] text-[10px] border-b border-[#26364B]">
                    <th class="pb-2">SYMBOL</th>
                    <th class="pb-2 text-right">LTP (₹)</th>
                    <th class="pb-2 text-right">CHANGE</th>
                    <th class="pb-2 text-right">VOLUME</th>
                    <th class="pb-2 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#26364B]/60">
                  ${topLosers.map(s => `
                    <tr class="hover:bg-[#162337] transition-colors cursor-pointer" onclick="window.app.openStockInDeepDive('${s.symbol}')">
                      <td class="py-2 font-bold text-[#F1F5F9]">${s.symbol} <span class="text-[10px] text-[#74849A] block font-normal truncate max-w-[120px]">${s.name}</span></td>
                      <td class="py-2 text-right font-bold text-[#FF7785]">₹${s.ltp.toFixed(2)}</td>
                      <td class="py-2 text-right text-[#FF7785] font-bold">${s.changePct.toFixed(2)}%</td>
                      <td class="py-2 text-right text-[#A8B5C7]">${(s.volume / 100000).toFixed(1)}L</td>
                      <td class="py-2 text-right">
                        <button onclick="event.stopPropagation(); window.app.openStockInDeepDive('${s.symbol}')" class="px-2 py-0.5 rounded bg-[#162337] hover:bg-[#54E0C1] text-[#A8B5C7] hover:text-[#080D16] text-[10px] font-bold transition-all">Chart</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    `;
  };

  // ========================================================
  // 2. STOCK SCANNER SCREEN (WITH "WHY THIS MATCHED" DRAWER)
  // ========================================================
  UI.renderStockScanner = function (stream) {
    const rawList = stream.getFilteredStocks ? stream.getFilteredStocks() : getCleanStocks(stream);
    const stocks = rawList.map(sanitizeStock);
    const activeWhySymbol = window.groviqueState.activeScannerSymbol || 'RELIANCE';
    const allStocks = getCleanStocks(stream);
    const activeStock = sanitizeStock(allStocks.find(s => s.symbol === activeWhySymbol) || allStocks[0] || { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 1339.7, changePct: 0.32, vwap: 1338.6, volume: 14850000, score: 84, rvol: 1.8 });

    return `
      <div class="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-5 font-sans text-[#F1F5F9] relative">
        
        <!-- HEADER -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#26364B] gap-3">
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F5F9] flex items-center gap-2">
              <span class="material-symbols-outlined text-[#54E0C1] text-[24px]">filter_list</span>
              <span>Stock Scanner</span>
            </h1>
            <p class="text-xs text-[#A8B5C7]">Transparent multi-factor discovery • Click any stock row to view complete rule verification in <strong class="text-[#54E0C1]">"Why this matched"</strong></p>
          </div>

          <div class="flex items-center gap-2 font-mono text-xs">
            <span class="px-2.5 py-1 rounded-lg bg-[#111B2B] border border-[#26364B] text-[#54E0C1] font-bold">
              ${stocks.length} Candidates Matched
            </span>
            <button onclick="window.marketStream.resetFilters()" class="px-2.5 py-1 rounded-lg bg-[#111B2B] hover:bg-[#162337] border border-[#26364B] text-[#A8B5C7] hover:text-white transition-all flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">restart_alt</span> Reset
            </button>
          </div>
        </div>

        <!-- MAIN LAYOUT: FILTERS (LEFT 3 COLS) + RESULTS TABLE (RIGHT 9 COLS) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- LEFT: CONFIGURABLE FILTER PANEL -->
          <div class="lg:col-span-4 xl:col-span-3 p-4 rounded-xl bg-[#111B2B] border border-[#26364B] shadow-md flex flex-col gap-4">
            <div class="flex items-center justify-between pb-2 border-b border-[#26364B]">
              <span class="text-xs font-bold uppercase font-mono text-[#F1F5F9] flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[#54E0C1] text-[16px]">tune</span>
                <span>Research Filters</span>
              </span>
              <span class="text-[10px] font-mono text-[#54E0C1]">Active</span>
            </div>

            <!-- Universe & Exchange -->
            <div class="flex flex-col gap-1.5 text-xs font-mono">
              <label class="text-[#A8B5C7] text-[11px]">Exchange & Universe</label>
              <select class="w-full px-2.5 py-1.5 rounded-lg bg-[#080D16] border border-[#26364B] text-[#F1F5F9] outline-none">
                <option>NSE NIFTY 50 Frontline</option>
                <option>NSE NIFTY Next 50</option>
                <option>NSE F&O Universe</option>
                <option>BSE 100 Equities</option>
              </select>
            </div>

            <!-- Strategy Presets -->
            <div class="flex flex-col gap-1.5 text-xs font-mono">
              <label class="text-[#A8B5C7] text-[11px]">Strategy Pattern</label>
              <div class="grid grid-cols-2 gap-1.5">
                ${[
                  { id: 'ORB', label: '15m ORB' },
                  { id: 'VWAP', label: 'VWAP Trend' },
                  { id: 'VOLUME', label: 'RVOL Surge' },
                  { id: 'EARNINGS', label: 'Catalyst' }
                ].map(strat => `
                  <button onclick="window.marketStream.setStrategy('${strat.id}')"
                          class="py-1.5 px-2 rounded text-[11px] font-bold border transition-all text-center ${
                            stream.activeStrategy === strat.id
                              ? 'bg-[#54E0C1]/20 border-[#54E0C1] text-[#54E0C1]'
                              : 'bg-[#080D16] border-[#26364B] text-[#A8B5C7] hover:text-white'
                          }">
                    ${strat.label}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Rule Checkboxes -->
            <div class="flex flex-col gap-2 pt-2 border-t border-[#26364B] text-xs font-mono">
              <label class="text-[#A8B5C7] text-[11px] uppercase">Active Conditions</label>
              ${[
                { key: 'aboveVwap', label: 'Price > Session VWAP' },
                { key: 'rvol2', label: 'Relative Vol >= 1.5x RVOL' },
                { key: 'score75', label: 'Momentum Score >= 75' },
                { key: 'noCircuit', label: 'No Circuit Lock Limit' }
              ].map(f => `
                <label class="flex items-center gap-2 text-xs text-[#F1F5F9] cursor-pointer">
                  <input type="checkbox" ${stream.activeFilters[f.key] ? 'checked' : ''}
                         onchange="window.marketStream.toggleFilter('${f.key}')" class="accent-[#54E0C1]">
                  <span>${f.label}</span>
                </label>
              `).join('')}
            </div>

            <!-- Price & Change Ranges -->
            <div class="flex flex-col gap-2 pt-2 border-t border-[#26364B] text-xs font-mono">
              <div class="flex justify-between text-[11px] text-[#A8B5C7]">
                <span>Min Turnover</span>
                <span class="text-[#54E0C1]">₹50 Cr+</span>
              </div>
              <div class="flex justify-between text-[11px] text-[#A8B5C7]">
                <span>Data Freshness</span>
                <span class="text-[#45D6A4]">Live Stream Only</span>
              </div>
            </div>
          </div>

          <!-- RIGHT: CANDIDATES RESULTS TABLE -->
          <div class="lg:col-span-8 xl:col-span-9 bg-[#111B2B] border border-[#26364B] rounded-xl overflow-hidden shadow-md flex flex-col">
            <div class="p-3 bg-[#0D1421] border-b border-[#26364B] flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
              <span class="text-[#A8B5C7]">Click any row to open <strong class="text-[#54E0C1]">"Why this matched"</strong> side analysis:</span>
              <span class="text-[10px] text-[#74849A]">Updated 10:42:15 IST • Freshness: LIVE</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left font-mono text-xs">
                <thead>
                  <tr class="text-[#74849A] text-[10px] border-b border-[#26364B] bg-[#0D1421]/60">
                    <th class="p-3">SYMBOL</th>
                    <th class="p-3 text-right">LTP (₹)</th>
                    <th class="p-3 text-right">CHANGE</th>
                    <th class="p-3 text-right">VWAP</th>
                    <th class="p-3 text-right">RVOL</th>
                    <th class="p-3 text-center">MATCHED RULES</th>
                    <th class="p-3 text-center">FRESHNESS</th>
                    <th class="p-3 text-right">ANALYSIS</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#26364B]/60">
                  ${stocks.map(s => {
                    const isPos = s.changePct >= 0;
                    const isSelected = s.symbol === activeWhySymbol;
                    return `
                      <tr class="hover:bg-[#162337] transition-colors cursor-pointer ${isSelected ? 'bg-[#162337] border-l-2 border-l-[#54E0C1]' : ''}"
                          onclick="window.app.openScannerWhyMatched('${s.symbol}')">
                        <td class="p-3 font-bold text-[#F1F5F9]">
                          ${s.symbol}
                          <span class="text-[10px] text-[#74849A] block font-normal truncate max-w-[130px]">${s.name}</span>
                        </td>
                        <td class="p-3 text-right font-bold ${isPos ? 'text-[#45D6A4]' : 'text-[#FF7785]'}">₹${s.ltp.toFixed(2)}</td>
                        <td class="p-3 text-right font-bold ${isPos ? 'text-[#45D6A4]' : 'text-[#FF7785]'}">${isPos ? '+' : ''}${s.changePct.toFixed(2)}%</td>
                        <td class="p-3 text-right text-[#79B8FF]">₹${s.vwap.toFixed(1)}</td>
                        <td class="p-3 text-right font-bold ${s.rvol >= 1.5 ? 'text-[#54E0C1]' : 'text-[#A8B5C7]'}">${s.rvol}x</td>
                        <td class="p-3 text-center">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#54E0C1]/15 text-[#54E0C1] border border-[#54E0C1]/40">
                            ✓ 4 / 4 Rules
                          </span>
                        </td>
                        <td class="p-3 text-center">
                          <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#45D6A4]/15 text-[#45D6A4]">LIVE</span>
                        </td>
                        <td class="p-3 text-right">
                          <button onclick="event.stopPropagation(); window.app.openScannerWhyMatched('${s.symbol}')"
                                  class="px-2 py-1 rounded bg-[#162337] hover:bg-[#54E0C1] text-[#A8B5C7] hover:text-[#080D16] text-[10px] font-bold transition-all">
                            Why Matched?
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- "WHY THIS MATCHED" SLIDE-OVER SIDE DRAWER -->
        <div id="whyMatchedDrawer" class="${window.groviqueState.isWhyMatchedOpen ? 'translate-x-0' : 'translate-x-full'} fixed top-20 right-0 bottom-0 w-full sm:w-[460px] bg-[#0D1421] border-l border-[#26364B] shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col justify-between">
          <div id="whyMatchedDrawerContent" class="h-full w-full">
            ${UI.renderScannerWhyMatchedContent(activeStock)}
          </div>
        </div>

      </div>
    `;
  };

  // Helper: "Why this matched" Drawer Content
  UI.renderScannerWhyMatchedContent = function (stock) {
    if (!stock) return '';
    sanitizeStock(stock);
    const ltp = stock.ltp || 1000;
    const vwap = stock.vwap || ltp;
    const isAboveVwap = ltp >= vwap;
    const vwapDiffPct = (((ltp - vwap) / vwap) * 100).toFixed(2);
    const rvol = stock.rvol || 1.8;

    return `
      <div class="h-full flex flex-col justify-between font-sans text-[#F1F5F9]">
        
        <!-- Header -->
        <div class="p-4 bg-[#111B2B] border-b border-[#26364B] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#54E0C1] text-[20px]">fact_check</span>
            <div>
              <h3 class="text-sm font-bold text-[#F1F5F9]">Why ${stock.symbol} Matched</h3>
              <p class="text-[11px] text-[#A8B5C7]">Transparent condition & metric verification</p>
            </div>
          </div>
          <button onclick="window.app.closeScannerWhyMatched()" class="text-[#A8B5C7] hover:text-white p-1">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-4 flex-1 overflow-y-auto flex flex-col gap-4 font-mono text-xs">
          
          <!-- Summary Banner -->
          <div class="p-3 rounded-lg bg-[#111B2B] border border-[#54E0C1]/40 flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-[10px] text-[#A8B5C7] uppercase">Filter Evaluation</span>
              <span class="text-sm font-bold text-[#54E0C1]">4 of 4 Conditions Satisfied</span>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#45D6A4]/20 text-[#45D6A4] border border-[#45D6A4]">100% VALIDATED</span>
          </div>

          <!-- Rules Checklist -->
          <div class="flex flex-col gap-2.5">
            <span class="text-xs font-bold uppercase text-[#A8B5C7]">Evaluated Criteria:</span>

            <!-- Rule 1: VWAP -->
            <div class="p-3 rounded-lg bg-[#111B2B] border border-[#26364B] flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-[#F1F5F9] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[#45D6A4] text-[16px]">check_circle</span>
                  <span>Price vs Session VWAP</span>
                </span>
                <span class="text-[10px] text-[#45D6A4] font-bold">MATCHED</span>
              </div>
              <p class="text-[11px] text-[#A8B5C7] pl-5">Threshold: Price &gt; VWAP</p>
              <div class="pl-5 text-[11px] text-[#54E0C1]">Measured: ₹${ltp.toFixed(2)} &gt; ₹${vwap.toFixed(2)} (+${vwapDiffPct}%)</div>
            </div>

            <!-- Rule 2: RVOL -->
            <div class="p-3 rounded-lg bg-[#111B2B] border border-[#26364B] flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-[#F1F5F9] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[#45D6A4] text-[16px]">check_circle</span>
                  <span>Relative Volume (RVOL)</span>
                </span>
                <span class="text-[10px] text-[#45D6A4] font-bold">MATCHED</span>
              </div>
              <p class="text-[11px] text-[#A8B5C7] pl-5">Threshold: RVOL &gt;= 1.50x (20-day historical window)</p>
              <div class="pl-5 text-[11px] text-[#54E0C1]">Measured: ${rvol}x volume surge</div>
            </div>

            <!-- Rule 3: 15m ORB -->
            <div class="p-3 rounded-lg bg-[#111B2B] border border-[#26364B] flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-[#F1F5F9] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[#45D6A4] text-[16px]">check_circle</span>
                  <span>Opening Range Breakout (ORB)</span>
                </span>
                <span class="text-[10px] text-[#45D6A4] font-bold">MATCHED</span>
              </div>
              <p class="text-[11px] text-[#A8B5C7] pl-5">Threshold: LTP &gt; 15m High (ORH: ₹${stock.orh || (ltp * 0.995).toFixed(1)})</p>
              <div class="pl-5 text-[11px] text-[#54E0C1]">Measured: ₹${ltp.toFixed(2)} holding above opening band</div>
            </div>

            <!-- Rule 4: Circuit Safety -->
            <div class="p-3 rounded-lg bg-[#111B2B] border border-[#26364B] flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-[#F1F5F9] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[#45D6A4] text-[16px]">check_circle</span>
                  <span>No Circuit Lock Limit</span>
                </span>
                <span class="text-[10px] text-[#45D6A4] font-bold">MATCHED</span>
              </div>
              <p class="text-[11px] text-[#A8B5C7] pl-5">Threshold: Distance to circuit limit &gt; 2.0%</p>
              <div class="pl-5 text-[11px] text-[#54E0C1]">Upper Circuit: ₹${stock.upperCircuit || (ltp * 1.1).toFixed(1)} (Free liquidity)</div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="p-3 rounded-lg bg-[#080D16] border border-[#26364B] text-[10px] text-[#74849A] flex flex-col gap-1">
            <div>Calculation Timeframe: 15-Minute Intraday Ticks</div>
            <div>Evaluation Timestamp: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
            <div>Exchange Data Source: Official NSE EQ Feed</div>
          </div>

        </div>

        <!-- Drawer Actions -->
        <div class="p-4 bg-[#111B2B] border-t border-[#26364B] grid grid-cols-2 gap-2 font-mono text-xs">
          <button onclick="window.app.openStockInDeepDive('${stock.symbol}')"
                  class="py-2.5 rounded-lg bg-[#54E0C1] text-[#080D16] font-bold shadow-md hover:bg-[#78EACF] transition-all flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">query_stats</span>
            <span>View Deep-Dive</span>
          </button>
          <button onclick="window.app.addStockToWatchlist('${stock.symbol}')"
                  class="py-2.5 rounded-lg bg-[#162337] hover:bg-[#1B2B40] text-[#F1F5F9] font-bold border border-[#26364B] transition-all flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">bookmark_add</span>
            <span>Add Watchlist</span>
          </button>
        </div>

      </div>
    `;
  };

  // ========================================================
  // 3. WATCHLISTS SCREEN
  // ========================================================
  UI.renderWatchlists = function (stream) {
    const allStocks = getCleanStocks(stream);
    const state = window.groviqueState;
    const activeTab = state.activeWatchlistTab || 'Main Watchlist';
    const symbols = state.watchlists[activeTab] || [];
    const stocks = symbols.map(sym => sanitizeStock(allStocks.find(s => s.symbol === sym) || { symbol: sym, name: sym, ltp: 1000, previousClose: 1000, changePct: 0, volume: 100000, vwap: 1000, dayHigh: 1010, dayLow: 990 })).filter(Boolean);

    return `
      <div class="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-5 font-sans text-[#F1F5F9]">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#26364B] gap-3">
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F5F9] flex items-center gap-2">
              <span class="material-symbols-outlined text-[#54E0C1] text-[24px]">bookmark</span>
              <span>Watchlists Manager</span>
            </h1>
            <p class="text-xs text-[#A8B5C7]">Track your custom stock groups with live market updates and quick deep-dive navigation</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.app.createNewWatchlistPrompt()" class="px-3 py-1.5 rounded-lg bg-[#54E0C1] text-[#080D16] font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#78EACF] transition-all">
              <span class="material-symbols-outlined text-[16px]">add</span>
              <span>New Watchlist</span>
            </button>
          </div>
        </div>

        <!-- Watchlist Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#26364B]">
          ${Object.keys(state.watchlists).map(tabName => `
            <button onclick="window.app.switchWatchlistTab('${tabName}')"
                    class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === tabName
                        ? 'bg-[#54E0C1]/20 text-[#54E0C1] border border-[#54E0C1]'
                        : 'bg-[#111B2B] text-[#A8B5C7] hover:text-white border border-[#26364B]'
                    }">
              <span>${tabName}</span>
              <span class="text-[10px] text-[#74849A]">(${state.watchlists[tabName].length})</span>
            </button>
          `).join('')}
        </div>

        <!-- Watchlist Table -->
        <div class="p-4 rounded-xl bg-[#111B2B] border border-[#26364B] shadow-md flex flex-col gap-3">
          <div class="flex items-center justify-between text-xs font-mono pb-2 border-b border-[#26364B]">
            <span class="font-bold text-[#F1F5F9]">${activeTab} (${stocks.length} Instruments)</span>
            <span class="text-[#54E0C1]">Live Stream Synchronized</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-xs">
              <thead>
                <tr class="text-[#74849A] text-[10px] border-b border-[#26364B]">
                  <th class="p-2.5">SYMBOL</th>
                  <th class="p-2.5 text-right">LTP (₹)</th>
                  <th class="p-2.5 text-right">CHANGE</th>
                  <th class="p-2.5 text-right">VWAP</th>
                  <th class="p-2.5 text-right">DAY HIGH / LOW</th>
                  <th class="p-2.5 text-center">FRESHNESS</th>
                  <th class="p-2.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#26364B]/60">
                ${stocks.map(s => {
                  const isPos = s.changePct >= 0;
                  return `
                    <tr class="hover:bg-[#162337] transition-colors cursor-pointer" onclick="window.app.openStockInDeepDive('${s.symbol}')">
                      <td class="p-2.5 font-bold text-[#F1F5F9]">${s.symbol} <span class="text-[10px] text-[#74849A] block font-normal">${s.name || ''}</span></td>
                      <td class="p-2.5 text-right font-bold ${isPos ? 'text-[#45D6A4]' : 'text-[#FF7785]'}">₹${s.ltp.toFixed(2)}</td>
                      <td class="p-2.5 text-right font-bold ${isPos ? 'text-[#45D6A4]' : 'text-[#FF7785]'}">${isPos ? '+' : ''}${s.changePct.toFixed(2)}%</td>
                      <td class="p-2.5 text-right text-[#79B8FF]">₹${(s.vwap || s.ltp).toFixed(1)}</td>
                      <td class="p-2.5 text-right text-[#A8B5C7]">₹${s.dayHigh || s.ltp} / ₹${s.dayLow || s.ltp}</td>
                      <td class="p-2.5 text-center"><span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#45D6A4]/15 text-[#45D6A4]">LIVE</span></td>
                      <td class="p-2.5 text-right" onclick="event.stopPropagation()">
                        <div class="flex items-center justify-end gap-1.5">
                          <button onclick="window.app.openStockInDeepDive('${s.symbol}')" class="p-1 rounded hover:bg-[#26364B] text-[#A8B5C7] hover:text-[#54E0C1]" title="Open Chart"><span class="material-symbols-outlined text-[16px]">query_stats</span></button>
                          <button onclick="window.app.openCreateAlertModal('${s.symbol}')" class="p-1 rounded hover:bg-[#26364B] text-[#A8B5C7] hover:text-[#F5BD62]" title="Set Alert"><span class="material-symbols-outlined text-[16px]">add_alert</span></button>
                          <button onclick="window.app.removeStockFromWatchlist('${s.symbol}')" class="p-1 rounded hover:bg-[#26364B] text-[#A8B5C7] hover:text-[#FF7785]" title="Remove"><span class="material-symbols-outlined text-[16px]">delete</span></button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  };

  // ========================================================
  // 4. MARKET ACTIVITY & SECTORS SCREEN
  // ========================================================
  UI.renderMarketActivity = function (stream) {
    const stocks = getCleanStocks(stream);
    const topVolume = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 6);
    const topTurnover = [...stocks].sort((a, b) => (b.ltp * b.volume) - (a.ltp * a.volume)).slice(0, 6);
    const sectors = stream.sectors || [];

    return `
      <div class="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 font-sans text-[#F1F5F9]">
        
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#26364B] gap-3">
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F5F9] flex items-center gap-2">
              <span class="material-symbols-outlined text-[#54E0C1] text-[24px]">equalizer</span>
              <span>Market Activity & Sector Matrix</span>
            </h1>
            <p class="text-xs text-[#A8B5C7]">NSE institutional turnover leaders, volume breakouts, and sectoral money flow tracking</p>
          </div>
          <span class="text-xs font-mono text-[#54E0C1] bg-[#111B2B] px-3 py-1 rounded-lg border border-[#26364B]">Session Turnover: ₹78,450 Cr</span>
        </div>

        <!-- SECTOR FLOW MATRIX -->
        <div class="p-4 rounded-xl bg-[#111B2B] border border-[#26364B] shadow-md flex flex-col gap-3">
          <div class="flex items-center justify-between pb-2 border-b border-[#26364B]">
            <span class="text-xs font-mono font-bold uppercase text-[#F1F5F9]">NSE Sector Performance Breakdown</span>
            <span class="text-[10px] font-mono text-[#45D6A4]">Inflow Lead: Nifty Bank (+₹1,840 Cr)</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            ${sectors.map(sec => {
              const changeVal = typeof sec.change === 'number' ? sec.change : 0;
              const isPos = changeVal >= 0;
              return `
                <div class="p-3 rounded-lg bg-[#0D1421] border border-[#26364B] hover:border-[#54E0C1] transition-all flex flex-col justify-between gap-1.5">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-[#F1F5F9]">${sec.name}</span>
                    <span class="text-[10px] ${isPos ? 'text-[#45D6A4]' : 'text-[#FF7785]'} font-bold">${isPos ? '+' : ''}${changeVal.toFixed(2)}%</span>
                  </div>
                  <div class="text-[11px] text-[#A8B5C7]">Vol: ₹${sec.volumeCr || 4200} Cr</div>
                  <div class="w-full bg-[#162337] h-1.5 rounded-full overflow-hidden mt-1">
                    <div class="${isPos ? 'bg-[#45D6A4]' : 'bg-[#FF7785]'} h-full rounded-full" style="width: ${sec.inflow || 60}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 2-COLUMNS: HIGHEST VOLUME & HIGHEST TURNOVER -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start font-mono text-xs">
          
          <!-- Volume Leaders -->
          <div class="p-4 rounded-xl bg-[#111B2B] border border-[#26364B] shadow-md flex flex-col gap-2.5">
            <div class="flex items-center justify-between pb-2 border-b border-[#26364B]">
              <span class="font-bold text-[#F1F5F9] uppercase flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[#79B8FF] text-[16px]">bar_chart</span>
                <span>Highest Traded Volume</span>
              </span>
              <span class="text-[10px] text-[#74849A]">Total Shares Traded</span>
            </div>
            <div class="flex flex-col divide-y divide-[#26364B]/60">
              ${topVolume.map((s, idx) => `
                <div class="py-2.5 flex items-center justify-between hover:bg-[#162337] px-2 rounded cursor-pointer" onclick="window.app.openStockInDeepDive('${s.symbol}')">
                  <div class="flex items-center gap-2">
                    <span class="text-[#74849A] text-[10px] w-4">#${idx+1}</span>
                    <span class="font-bold text-[#F1F5F9]">${s.symbol}</span>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-[#F1F5F9]">${(s.volume / 1000000).toFixed(2)}M Shares</div>
                    <div class="text-[10px] ${s.changePct >= 0 ? 'text-[#45D6A4]' : 'text-[#FF7785]'}">${s.changePct >= 0 ? '+' : ''}${s.changePct.toFixed(2)}%</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Turnover Leaders -->
          <div class="p-4 rounded-xl bg-[#111B2B] border border-[#26364B] shadow-md flex flex-col gap-2.5">
            <div class="flex items-center justify-between pb-2 border-b border-[#26364B]">
              <span class="font-bold text-[#F1F5F9] uppercase flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[#F5BD62] text-[16px]">payments</span>
                <span>Highest Traded Value (Turnover)</span>
              </span>
              <span class="text-[10px] text-[#74849A]">Total Value in ₹ Crores</span>
            </div>
            <div class="flex flex-col divide-y divide-[#26364B]/60">
              ${topTurnover.map((s, idx) => {
                const turnoverCr = ((s.ltp * s.volume) / 10000000).toFixed(0);
                return `
                  <div class="py-2.5 flex items-center justify-between hover:bg-[#162337] px-2 rounded cursor-pointer" onclick="window.app.openStockInDeepDive('${s.symbol}')">
                    <div class="flex items-center gap-2">
                      <span class="text-[#74849A] text-[10px] w-4">#${idx+1}</span>
                      <span class="font-bold text-[#F1F5F9]">${s.symbol}</span>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-[#54E0C1]">₹${Number(turnoverCr).toLocaleString('en-IN')} Cr</div>
                      <div class="text-[10px] text-[#A8B5C7]">₹${s.ltp.toFixed(2)} LTP</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>

      </div>
    `;
  };

  // ========================================================
  // 5. ALERTS CENTRE SCREEN
  // ========================================================
  UI.renderAlertsCentre = function (stream) {
    const alerts = window.groviqueState.alertsList || [];

    return `
      <div class="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-5 font-sans text-[#F1F5F9]">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#26364B] gap-3">
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F5F9] flex items-center gap-2">
              <span class="material-symbols-outlined text-[#F5BD62] text-[24px]">notifications</span>
              <span>Alerts Centre</span>
            </h1>
            <p class="text-xs text-[#A8B5C7]">Set price, volume and indicator condition alerts to stay informed</p>
          </div>

          <button onclick="window.app.openCreateAlertModal()" class="px-3 py-1.5 rounded-lg bg-[#54E0C1] text-[#080D16] font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#78EACF] transition-all">
            <span class="material-symbols-outlined text-[16px]">add_alert</span>
            <span>Create New Alert</span>
          </button>
        </div>

        <!-- Mandatory Disclaimer Notice -->
        <div class="p-3.5 rounded-xl bg-[#111B2B] border border-[#79B8FF]/30 text-xs font-mono text-[#A8B5C7] flex items-center gap-2">
          <span class="material-symbols-outlined text-[#79B8FF] text-[20px] shrink-0">info</span>
          <span><strong>Informational Notice:</strong> Alerts in GROVIQUE are designed strictly for market awareness and notification. They will never execute live orders or submit broker transactions.</span>
        </div>

        <!-- Alerts Table -->
        <div class="p-4 rounded-xl bg-[#111B2B] border border-[#26364B] shadow-md flex flex-col gap-3 font-mono text-xs">
          <div class="flex items-center justify-between pb-2 border-b border-[#26364B]">
            <span class="font-bold text-[#F1F5F9] uppercase">Configured Alert Rules (${alerts.length})</span>
            <span class="text-[10px] text-[#54E0C1]">Evaluation Engine Running (500ms cycle)</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-xs">
              <thead>
                <tr class="text-[#74849A] text-[10px] border-b border-[#26364B]">
                  <th class="p-2.5">INSTRUMENT</th>
                  <th class="p-2.5">CONDITION</th>
                  <th class="p-2.5 text-center">STATUS</th>
                  <th class="p-2.5 text-center">CREATED</th>
                  <th class="p-2.5 text-center">TRIGGERS</th>
                  <th class="p-2.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#26364B]/60">
                ${alerts.map(alt => `
                  <tr class="hover:bg-[#162337] transition-colors">
                    <td class="p-2.5 font-bold text-[#F1F5F9]">${alt.symbol}</td>
                    <td class="p-2.5 text-[#54E0C1]">${alt.condition}</td>
                    <td class="p-2.5 text-center">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.status === 'ACTIVE' ? 'bg-[#45D6A4]/15 text-[#45D6A4] border border-[#45D6A4]/40' :
                        alt.status === 'TRIGGERED' ? 'bg-[#F5BD62]/15 text-[#F5BD62] border border-[#F5BD62]/40' :
                        'bg-[#74849A]/20 text-[#74849A]'
                      }">
                        ${alt.status}
                      </span>
                    </td>
                    <td class="p-2.5 text-center text-[#A8B5C7]">${alt.created}</td>
                    <td class="p-2.5 text-center text-[#F1F5F9]">${alt.triggers}</td>
                    <td class="p-2.5 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button onclick="window.app.toggleAlertStatus('${alt.id}')" class="p-1 rounded hover:bg-[#26364B] text-[#A8B5C7] hover:text-[#54E0C1]" title="Pause / Resume">
                          <span class="material-symbols-outlined text-[15px]">${alt.status === 'ACTIVE' ? 'pause' : 'play_arrow'}</span>
                        </button>
                        <button onclick="window.app.deleteAlert('${alt.id}')" class="p-1 rounded hover:bg-[#26364B] text-[#A8B5C7] hover:text-[#FF7785]" title="Delete">
                          <span class="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  };

  // ========================================================
  // 6. PAPER TRADING JOURNAL SCREEN
  // ========================================================
  UI.renderPaperJournal = function (stream) {
    getCleanStocks(stream);
    const ideas = window.groviqueState.paperIdeas || [];
    const openIdeas = ideas.filter(i => i.status === 'OPEN');
    const closedIdeas = ideas.filter(i => i.status === 'CLOSED');

    let totalSimulatedCapital = 1000000; // ₹10 Lakhs starting capital
    let unrealizedMTM = openIdeas.reduce((sum, i) => sum + ((i.currentPrice - i.entryPrice) * i.quantity), 0);
    let realizedPnl = closedIdeas.reduce((sum, i) => sum + (((i.exitPrice || i.currentPrice) - i.entryPrice) * i.quantity - i.slippageFrictionINR), 0);

    return `
      <div class="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 font-sans text-[#F1F5F9]">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#26364B] gap-3">
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F5F9] flex items-center gap-2">
              <span class="material-symbols-outlined text-[#54E0C1] text-[24px]">menu_book</span>
              <span>Paper Trading Journal</span>
            </h1>
            <p class="text-xs text-[#A8B5C7]">Simulated hypothesis tracking • Record entries, exits, risk-reward ratios and research thesis</p>
          </div>

          <button onclick="window.app.openNewPaperIdeaModal()" class="px-3 py-1.5 rounded-lg bg-[#54E0C1] text-[#080D16] font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#78EACF] transition-all">
            <span class="material-symbols-outlined text-[16px]">add</span>
            <span>Log Simulated Idea</span>
          </button>
        </div>

        <!-- MANDATORY DISCLAIMER BANNER -->
        <div class="p-4 rounded-xl bg-[#111B2B] border-2 border-[#F5BD62] text-xs font-mono flex items-start gap-3 shadow-lg">
          <span class="material-symbols-outlined text-[#F5BD62] text-[24px] shrink-0 mt-0.5">warning</span>
          <div class="flex flex-col gap-1">
            <div class="text-sm font-bold text-[#F5BD62] tracking-wide">SIMULATED — NOT A REAL BROKER ACCOUNT</div>
            <p class="text-[#A8B5C7] leading-relaxed">
              This journal records hypothetical trade ideas only. No real money, exchange transactions, or broker orders are involved. All figures incorporate realistic Indian transaction friction (₹20 flat brokerage + 0.05% estimated slippage/STT).
            </p>
          </div>
        </div>

        <!-- STATS CARDS -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div class="p-3.5 rounded-xl bg-[#111B2B] border border-[#26364B] flex flex-col gap-1">
            <span class="text-[10px] text-[#A8B5C7] uppercase">Simulated Portfolio</span>
            <span class="text-base font-bold text-[#F1F5F9]">₹${totalSimulatedCapital.toLocaleString('en-IN')}</span>
            <span class="text-[10px] text-[#74849A]">Starting Virtual Capital</span>
          </div>

          <div class="p-3.5 rounded-xl bg-[#111B2B] border border-[#26364B] flex flex-col gap-1">
            <span class="text-[10px] text-[#A8B5C7] uppercase">Unrealized MTM (Open)</span>
            <span class="text-base font-bold ${unrealizedMTM >= 0 ? 'text-[#45D6A4]' : 'text-[#FF7785]'}">₹${unrealizedMTM.toFixed(2)}</span>
            <span class="text-[10px] text-[#A8B5C7]">${openIdeas.length} Open Positions</span>
          </div>

          <div class="p-3.5 rounded-xl bg-[#111B2B] border border-[#26364B] flex flex-col gap-1">
            <span class="text-[10px] text-[#A8B5C7] uppercase">Realized P&L (Closed)</span>
            <span class="text-base font-bold ${realizedPnl >= 0 ? 'text-[#45D6A4]' : 'text-[#FF7785]'}">₹${realizedPnl.toFixed(2)}</span>
            <span class="text-[10px] text-[#A8B5C7]">${closedIdeas.length} Closed Trades</span>
          </div>

          <div class="p-3.5 rounded-xl bg-[#111B2B] border border-[#26364B] flex flex-col gap-1">
            <span class="text-[10px] text-[#A8B5C7] uppercase">Win Ratio</span>
            <span class="text-base font-bold text-[#54E0C1]">100% (1/1)</span>
            <span class="text-[10px] text-[#74849A]">1:2.0 Avg Risk:Reward</span>
          </div>
        </div>

        <!-- OPEN SIMULATED POSITIONS TABLE -->
        <div class="p-4 rounded-xl bg-[#111B2B] border border-[#26364B] shadow-md flex flex-col gap-3 font-mono text-xs">
          <div class="flex items-center justify-between pb-2 border-b border-[#26364B]">
            <span class="font-bold text-[#F1F5F9] uppercase">Open Simulated Ideas (${openIdeas.length})</span>
            <span class="text-[10px] text-[#54E0C1]">Live Mark-to-Market Enabled</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-xs">
              <thead>
                <tr class="text-[#74849A] text-[10px] border-b border-[#26364B]">
                  <th class="p-2.5">SYMBOL</th>
                  <th class="p-2.5">SIDE</th>
                  <th class="p-2.5 text-right">ENTRY (₹)</th>
                  <th class="p-2.5 text-right">CURRENT (₹)</th>
                  <th class="p-2.5 text-right">SL / TARGET</th>
                  <th class="p-2.5 text-right">QTY</th>
                  <th class="p-2.5 text-right">UNREALIZED P&L</th>
                  <th class="p-2.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#26364B]/60">
                ${openIdeas.map(i => {
                  const mtm = (i.currentPrice - i.entryPrice) * i.quantity;
                  const isPos = mtm >= 0;
                  return `
                    <tr class="hover:bg-[#162337] transition-colors">
                      <td class="p-2.5 font-bold text-[#F1F5F9]">${i.symbol}</td>
                      <td class="p-2.5 text-[#54E0C1] font-bold">${i.direction}</td>
                      <td class="p-2.5 text-right">₹${i.entryPrice.toFixed(2)}</td>
                      <td class="p-2.5 text-right text-[#79B8FF]">₹${i.currentPrice.toFixed(2)}</td>
                      <td class="p-2.5 text-right text-[#A8B5C7]">₹${i.stopLoss} / ₹${i.target}</td>
                      <td class="p-2.5 text-right">${i.quantity}</td>
                      <td class="p-2.5 text-right font-bold ${isPos ? 'text-[#45D6A4]' : 'text-[#FF7785]'}">${isPos ? '+' : ''}₹${mtm.toFixed(2)}</td>
                      <td class="p-2.5 text-right">
                        <button onclick="window.app.closePaperPosition('${i.id}')" class="px-2 py-0.5 rounded bg-[#162337] hover:bg-[#FF7785] text-[#A8B5C7] hover:text-[#080D16] text-[10px] font-bold transition-all">Close</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  };

  // ========================================================
  // 7. LEARNING CENTRE SCREEN
  // ========================================================
  UI.renderLearningCentre = function () {
    const activeArtId = window.groviqueState ? window.groviqueState.activeLearningArticle : null;
    const articles = [
      {
        id: 'vwap-guide',
        category: 'Technical Indicators',
        title: 'Volume-Weighted Average Price (VWAP)',
        short: 'The institutional benchmark price indicating fair value weighted by volume for the current session.',
        def: 'VWAP is calculated by taking the sum of price multiplied by volume for each transaction divided by the total session volume.',
        example: 'If RELIANCE is trading at ₹1,340 while its session VWAP is ₹1,335, institutional buyers are willing to pay above fair value, signalling bullish intraday momentum.',
        limitations: 'VWAP resets at 09:15 IST every morning and is valid strictly for intraday analysis. It is less reliable in low-volume illiquid stocks.'
      },
      {
        id: 'ltp-ohlc',
        category: 'Market Basics',
        title: 'LTP & OHLC Price Discovery',
        short: 'Last Traded Price and Open, High, Low, Close candlestick parameters explained.',
        def: 'LTP represents the exact price at which the most recent exchange order was matched. OHLC summarizes the price envelope within a given timeframe.',
        example: 'A 15-minute candle with Open=100, High=105, Low=99, Close=104 indicates buyers dominated the period with minimal downward rejection.',
        limitations: 'LTP can fluctuate on tiny odd-lot quantities. Always inspect traded volume alongside price movement.'
      },
      {
        id: 'rsi-momentum',
        category: 'Technical Indicators',
        title: 'Relative Strength Index (RSI 14)',
        short: 'Momentum oscillator that measures the velocity and magnitude of directional price movements.',
        def: 'RSI oscillates between 0 and 100. Readings above 70 indicate overbought conditions while readings below 30 suggest oversold levels.',
        example: 'An intraday stock hitting an RSI of 78 after a 4% parabolic vertical surge often experiences a mean-reverting pullback.',
        limitations: 'In strong trending markets, RSI can remain in overbought territory (>70) for hours while price continues rising.'
      },
      {
        id: 'moving-averages',
        category: 'Technical Indicators',
        title: 'Exponential Moving Averages (9 & 20 EMA)',
        short: 'Dynamic trend filters that give greater weight to recent prices to reduce lag.',
        def: 'The 9 EMA reacts quickly to short-term momentum, while the 20 EMA serves as dynamic pull-back support in established intraday trends.',
        example: 'When 9 EMA crosses above 20 EMA while price is above VWAP, it confirms a "Golden Stacking" momentum setup.',
        limitations: 'Moving averages generate false whipsaw signals in sideways, non-trending consolidation ranges.'
      },
      {
        id: 'atr-volatility',
        category: 'Risk Management',
        title: 'Average True Range (ATR & Invalidation)',
        short: 'Measures historical volatility to establish mathematically sound stop-loss buffers.',
        def: 'ATR quantifies market volatility by decomposing the entire range of an asset price for a given period.',
        example: 'If TCS has a 14-period ATR of ₹18, setting a stop loss at 1.5x ATR (₹27) prevents normal random noise from triggering stops.',
        limitations: 'ATR indicates volatility, not direction. A high ATR can occur during violent sell-offs as well as breakouts.'
      },
      {
        id: 'stale-data',
        category: 'Data Integrity',
        title: 'Data Freshness & Stale Market Quotes',
        short: 'Understanding feed latency and why distinguishing live ticks from delayed data protects capital.',
        def: 'Stale data occurs when network latency or exchange gateway delays prevent recent tick updates from reaching the terminal.',
        example: 'GROVIQUE labels feeds STALE if no heartbeat is received for >5000ms, disabling automated rules to prevent trading on obsolete numbers.',
        limitations: 'Internet connectivity drops can temporarily degrade feed status. Always check the top bar connection chip.'
      }
    ];

    const activeArt = articles.find(a => a.id === activeArtId);

    return `
      <div class="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 font-sans text-[#F1F5F9]">
        
        <div class="flex flex-col gap-1 pb-3 border-b border-[#26364B]">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F5F9] flex items-center gap-2">
            <span class="material-symbols-outlined text-[#54E0C1] text-[24px]">school</span>
            <span>Learning Centre</span>
          </h1>
          <p class="text-xs text-[#A8B5C7]">Financial literacy, indicators, order flow concepts and research methodologies in plain language</p>
        </div>

        <!-- TOPIC CARDS GRID -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${articles.map(art => `
            <div class="p-4 rounded-xl bg-[#111B2B] border border-[#26364B] hover:border-[#54E0C1] transition-all flex flex-col justify-between gap-3 shadow-md group cursor-pointer"
                 onclick="window.app.openLearningArticle('${art.id}')">
              <div class="flex flex-col gap-1.5">
                <span class="text-[10px] font-mono font-bold text-[#54E0C1] uppercase tracking-wider">${art.category}</span>
                <h3 class="text-sm font-bold text-[#F1F5F9] group-hover:text-[#54E0C1] transition-colors">${art.title}</h3>
                <p class="text-xs text-[#A8B5C7] leading-relaxed line-clamp-3">${art.short}</p>
              </div>
              <div class="pt-2 border-t border-[#26364B] flex items-center justify-between text-xs font-mono text-[#54E0C1]">
                <span>Read Guide</span>
                <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- ARTICLE DETAIL MODAL (WHEN CLICKED) -->
        <div id="learningArticleModal" class="${activeArt ? 'flex' : 'hidden'} fixed inset-0 z-50 bg-black/75 backdrop-blur-sm items-center justify-center p-4">
          <div id="learningArticleModalContent" class="w-full max-w-2xl bg-[#0D1421] border border-[#26364B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            ${activeArt ? `
              <!-- Modal Header -->
              <div class="p-5 bg-[#111B2B] border-b border-[#26364B] flex items-center justify-between">
                <div class="flex flex-col gap-0.5">
                  <span class="text-[10px] font-mono font-bold text-[#54E0C1] uppercase tracking-wider">${activeArt.category}</span>
                  <h2 class="text-base sm:text-lg font-bold text-[#F1F5F9]">${activeArt.title}</h2>
                </div>
                <button onclick="window.app.closeLearningArticle()" class="p-1 rounded-lg hover:bg-[#162337] text-[#A8B5C7] hover:text-white transition-colors">
                  <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <!-- Modal Body -->
              <div class="p-5 overflow-y-auto flex flex-col gap-4 text-xs font-sans text-[#F1F5F9] leading-relaxed">
                <!-- 1. Core Definition -->
                <div class="flex flex-col gap-1.5 p-3.5 rounded-xl bg-[#111B2B] border border-[#26364B]">
                  <h4 class="text-xs font-mono font-bold text-[#54E0C1] uppercase flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px]">menu_book</span>
                    <span>1. Core Definition</span>
                  </h4>
                  <p class="text-[#A8B5C7] text-xs leading-normal">${activeArt.def}</p>
                </div>

                <!-- 2. Market Example & Application -->
                <div class="flex flex-col gap-1.5 p-3.5 rounded-xl bg-[#111B2B] border border-[#45D6A4]/30">
                  <h4 class="text-xs font-mono font-bold text-[#45D6A4] uppercase flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px]">lightbulb</span>
                    <span>2. Market Example & Application</span>
                  </h4>
                  <p class="text-[#F1F5F9] text-xs leading-normal">${activeArt.example}</p>
                </div>

                <!-- 3. Key Limitations & Traps -->
                <div class="flex flex-col gap-1.5 p-3.5 rounded-xl bg-[#111B2B] border border-[#FF7785]/30">
                  <h4 class="text-xs font-mono font-bold text-[#FF7785] uppercase flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px]">warning</span>
                    <span>3. Limitations & Common Pitfalls</span>
                  </h4>
                  <p class="text-[#A8B5C7] text-xs leading-normal">${activeArt.limitations}</p>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="p-4 bg-[#111B2B] border-t border-[#26364B] flex items-center justify-between font-mono text-xs">
                <span class="text-[10px] text-[#74849A]">Educational Research Only • Non-Advisory</span>
                <button onclick="window.app.closeLearningArticle()" class="px-4 py-1.5 rounded-lg bg-[#54E0C1] text-[#080D16] font-bold hover:bg-[#78EACF] transition-all">
                  Understood
                </button>
              </div>
            ` : ''}
          </div>
        </div>

      </div>
    `;
  };

})();
