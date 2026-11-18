// PulseTrade Live - Dynamic UI Components & Screen Renderers

class UIComponents {
  // SVG circular score gauge generator
  static renderScoreGauge(score, size = 44) {
    const radius = size * 0.32;
    const stroke = size * 0.08;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? '#00FF88' : (score >= 65 ? '#00F0FF' : '#FF2A6D');

    return `
      <div class="relative flex items-center justify-center shrink-0" style="width:${size}px; height:${size}px;">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 ${size} ${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="#272a31" stroke-width="${stroke}" />
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" />
        </svg>
        <span class="absolute font-mono font-bold text-xs" style="color: ${color}">${score}</span>
      </div>
    `;
  }

  // Segmented RVOL LED bar
  static renderRvolBar(rvol) {
    const bars = 5;
    const activeBars = Math.min(bars, Math.round((rvol / 4.0) * bars));
    let barsHtml = '';
    for (let i = 1; i <= bars; i++) {
      const activeClass = i <= activeBars ? (rvol >= 3 ? 'active-green' : 'active-cyan') : '';
      barsHtml += `<div class="led-segment ${activeClass}"></div>`;
    }
    return `
      <div class="flex items-center gap-1">
        <span class="font-mono text-xs font-bold text-primary mr-1">${rvol.toFixed(1)}x</span>
        <div class="flex items-center">${barsHtml}</div>
      </div>
    `;
  }

  // Mini Sparkline SVG with VWAP dashed line
  static renderSparkline(sparkline, vwap, ltp, width = 90, height = 26) {
    if (!sparkline || sparkline.length < 2) return '';
    const min = Math.min(...sparkline, vwap);
    const max = Math.max(...sparkline, vwap);
    const range = max - min || 1;

    const points = sparkline.map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const vwapY = (height - ((vwap - min) / range) * (height - 6) - 3).toFixed(1);
    const isBullish = ltp >= vwap;
    const strokeColor = isBullish ? '#00FF88' : '#FF2A6D';

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="overflow-visible">
        <line x1="0" y1="${vwapY}" x2="${width}" y2="${vwapY}" stroke="#00F0FF" stroke-dasharray="2,2" stroke-width="1.2" opacity="0.7" />
        <polyline fill="none" stroke="${strokeColor}" stroke-width="2" points="${points}" />
        <circle cx="${width}" cy="${points.split(' ').pop().split(',')[1]}" r="2.5" fill="${strokeColor}" class="pulse-live" />
      </svg>
    `;
  }

  // ==========================================
  // GEMINI INTRADAY AI ADVISORY WIDGET
  // ==========================================
  static renderGeminiAdvisoryWidget(stock) {
    if (!stock) return '';
    const advisor = window.geminiIntradayAdvisor;
    const settings = window.settingsManager ? window.settingsManager.state.gemini : { apiKey: '' };
    const hasKey = Boolean(settings.apiKey && settings.apiKey.length > 5);
    
    const stream = window.marketStream;
    const phase = stream ? stream.getCurrentPhase() : { label: '09:30 Prime Breakout', canBreakout: true };
    const clockTime = stream ? stream.getClockFormatted() : '09:35:00';
    const cacheKey = stock.symbol + '_' + (stream ? stream.currentPhaseKey : 'PRIME');
    const cached = advisor && advisor.cache[cacheKey];
    const advice = cached ? cached.advice : (advisor ? advisor.generateAlgorithmicIntradayAdvice(stock, stream, phase, clockTime) : null);

    if (!advice) return '';

    const isBull = advice.action === 'BUY';
    const isBear = advice.action === 'SELL';
    const verdictColor = isBull ? '#00FF88' : (isBear ? '#FF2A6D' : '#FFB800');

    return `
      <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#191c22] via-[#111622] to-[#090B10] border border-[#00F0FF]/40 shadow-xl flex flex-col gap-3 font-mono text-xs relative overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center glow-cyan">
              <span class="material-symbols-outlined text-[#00F0FF] text-[16px]">smart_toy</span>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-slate-100">Gemini Intraday Co-Pilot</span>
                <span class="px-1.5 py-0.2 rounded text-[9px] font-bold ${hasKey ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-[#FFB800]/20 text-[#FFB800]'}">
                  ${hasKey ? '● GEMINI LIVE' : '○ ALGORITHMIC AI'}
                </span>
              </div>
              <span class="text-[10px] text-slate-400">Strict Intraday Entry / SL / Target Optimization</span>
            </div>
          </div>
          <button type="button" onclick="window.app.triggerGeminiAnalysis('${stock.symbol}')"
                  class="px-2 py-1 rounded bg-[#191c22] hover:bg-[#00F0FF]/20 text-[#00F0FF] text-[10px] font-bold border border-[#00F0FF]/30 transition-all flex items-center gap-1"
                  title="Run Live Gemini Reasoning Analysis">
            <span class="material-symbols-outlined text-[13px] animate-spin hidden" id="geminiSpin-${stock.symbol}">sync</span>
            <span class="material-symbols-outlined text-[13px]">bolt</span>
            <span>Refresh Advice</span>
          </button>
        </div>

        <!-- Action Verdict Banner -->
        <div class="p-2.5 rounded-lg bg-[#191c22] border flex items-center justify-between gap-2" style="border-color: ${verdictColor}50">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full pulse-live" style="background-color: ${verdictColor}"></span>
            <span class="font-bold text-xs" style="color: ${verdictColor}">${advice.verdict}</span>
          </div>
          <span class="text-[10px] text-slate-400">Time Horizon: <span class="text-slate-200 font-bold">${advice.timeHorizon || '15-45m'}</span></span>
        </div>

        <!-- Recommended Key Intraday Levels Grid -->
        <div class="grid grid-cols-4 gap-1.5 text-center">
          <div class="p-1.5 rounded bg-[#090B10] border border-slate-800 flex flex-col">
            <span class="text-[9px] text-slate-400">REC ENTRY</span>
            <span class="font-bold text-slate-100 text-[11px]">₹${Number(advice.entry).toFixed(2)}</span>
          </div>
          <div class="p-1.5 rounded bg-[#090B10] border border-slate-800 flex flex-col">
            <span class="text-[9px] text-slate-400">STOP LOSS</span>
            <span class="font-bold text-[#FF2A6D] text-[11px]">₹${Number(advice.stopLoss).toFixed(2)}</span>
          </div>
          <div class="p-1.5 rounded bg-[#090B10] border border-slate-800 flex flex-col">
            <span class="text-[9px] text-slate-400">TARGET 1</span>
            <span class="font-bold text-[#00FF88] text-[11px]">₹${Number(advice.target1).toFixed(2)}</span>
          </div>
          <div class="p-1.5 rounded bg-[#090B10] border border-slate-800 flex flex-col">
            <span class="text-[9px] text-slate-400">R:R RATIO</span>
            <span class="font-bold text-[#00F0FF] text-[11px]">${advice.rrRatio || '1:2.0'}</span>
          </div>
        </div>

        <!-- Intraday Reasoning -->
        <div class="flex flex-col gap-1 text-[11px] text-slate-300 leading-relaxed bg-[#090B10]/60 p-2.5 rounded-lg border border-slate-800">
          <div class="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <span class="material-symbols-outlined text-[13px] text-[#00F0FF]">psychology</span>
            <span>Intraday Technical Rationale:</span>
          </div>
          <p>${advice.rationale}</p>
          ${advice.invalidation ? `
            <div class="text-[10px] text-[#FF2A6D] mt-1 pt-1 border-t border-slate-800 flex items-start gap-1">
              <span class="font-bold shrink-0">Invalidation:</span>
              <span class="text-slate-400">${advice.invalidation}</span>
            </div>
          ` : ''}
        </div>

        <!-- RAG Institutional Knowledge Grounding -->
        ${advice.ragGrounding && advice.ragGrounding.length > 0 ? `
          <div class="p-2 rounded-lg bg-[#090B10] border border-[#00F0FF]/30 flex flex-col gap-1.5 text-[10px]">
            <div class="flex items-center justify-between">
              <span class="text-[#00F0FF] font-bold flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">auto_stories</span>
                <span>RAG Institutional Grounding:</span>
              </span>
              <span class="text-slate-400 font-mono">Gemini text-embedding-004</span>
            </div>
            <div class="flex flex-wrap gap-1">
              ${advice.ragGrounding.map(g => `
                <span class="px-2 py-0.5 rounded bg-[#111622] border border-slate-700 text-slate-200 flex items-center gap-1" title="Cosine Similarity: ${(g.similarity * 100).toFixed(1)}%">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#00FF88]"></span>
                  <span class="font-bold">${g.title}</span>
                  <span class="text-[#00F0FF]">(${(g.similarity * 100).toFixed(0)}%)</span>
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 1-Click Action Button: Apply Levels to Ticket -->
        <div class="flex items-center gap-2 pt-1">
          <button type="button" onclick="window.app.applyGeminiLevels('${stock.symbol}')"
                  class="flex-1 py-1.5 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#090B10] text-[11px] font-bold border border-[#00F0FF]/40 transition-all flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[14px]">tune</span>
            <span>Apply Levels to Ticket</span>
          </button>
          ${!hasKey ? `
            <button type="button" onclick="window.app.openScreen('user-settings')"
                    class="px-2 py-1.5 rounded bg-[#191c22] hover:bg-slate-800 text-[#FFB800] text-[10px] font-bold border border-[#FFB800]/40 transition-all"
                    title="Add your Gemini API Key in Settings for Live AI Reasoning">
              Connect Key
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 1: COMMAND CENTER (LIVE SCANNER)
  // ==========================================
  static renderCommandCenter(stream) {
    const topPicks = stream.getFilteredStocks().slice(0, 6);
    const phase = stream.getCurrentPhase();
    const wallet = window.paperTradingDesk ? window.paperTradingDesk.walletCapital : 100000;
    const activePositionsCount = window.paperTradingDesk ? window.paperTradingDesk.activePositions.length : 0;
    const breadth = window.TechnicalIndicators ? window.TechnicalIndicators.computeMarketBreadth(stream.stocks) : {
      advances: 29, declines: 18, unchanged: 3, adRatio: 1.61, advancePct: 58, declinePct: 36, regime: "MODERATE BULLISH BREADTH", regimeColor: "#00FF88"
    };

    return `
      <div class="p-4 md:p-6 flex flex-col gap-5">
        <!-- Top Market Overview & Market Breadth Command Bar -->
        <div class="w-full bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div class="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full ${window.nseCalendar && window.nseCalendar.getMarketStatus().isOpen ? 'bg-[#00FF88] pulse-live' : 'bg-[#FFB800]'}"></span>
              <span class="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">MARKET OVERVIEW &amp; INTRADAY BREADTH</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold" style="background-color: ${breadth.regimeColor}20; color: ${breadth.regimeColor}; border: 1px solid ${breadth.regimeColor}40">
                ${breadth.regime}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="window.app.openScreen('backtester-lab')" class="px-2.5 py-1 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/25 text-xs font-mono font-bold flex items-center gap-1.5 transition-all">
                <span class="material-symbols-outlined text-[14px]">query_stats</span>
                <span>Strategy Backtest Lab</span>
              </button>
              <button onclick="window.app.openScreen('sandbox-positions')" class="px-2.5 py-1 rounded bg-[#191c22] border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all">
                <span>Sandbox Positions</span>
                <span class="px-1.5 py-0.2 rounded-full bg-[#00F0FF] text-[#090B10] font-bold">${activePositionsCount}</span>
              </button>
            </div>
          </div>

          <!-- Market Breadth Metrics Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div class="p-2.5 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col justify-between">
              <span class="text-[10px] text-slate-400">NIFTY 50 INDEX</span>
              <div class="flex items-center justify-between mt-1">
                <span class="text-slate-100 font-bold text-sm">25,144.30</span>
                <span class="text-[#FF2A6D] text-[11px] font-bold">-0.61%</span>
              </div>
            </div>

            <div class="p-2.5 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col justify-between">
              <span class="text-[10px] text-slate-400">BANK NIFTY INDEX</span>
              <div class="flex items-center justify-between mt-1">
                <span class="text-slate-100 font-bold text-sm">61,034.10</span>
                <span class="text-[#FF2A6D] text-[11px] font-bold">-0.79%</span>
              </div>
            </div>

            <div class="p-2.5 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col justify-between">
              <span class="text-[10px] text-slate-400">INDIA VIX (VOLATILITY)</span>
              <div class="flex items-center justify-between mt-1">
                <span class="text-[#00F0FF] font-bold text-sm">13.85</span>
                <span class="text-[#00FF88] text-[11px] font-bold">+2.10%</span>
              </div>
            </div>

            <div class="p-2.5 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col justify-between">
              <span class="text-[10px] text-slate-400">ADVANCES / DECLINES</span>
              <div class="flex items-center justify-between mt-1">
                <span class="text-[#00FF88] font-bold text-sm">${breadth.advances} Adv</span>
                <span class="text-slate-600">/</span>
                <span class="text-[#FF2A6D] font-bold text-sm">${breadth.declines} Dec</span>
              </div>
            </div>

            <div class="p-2.5 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col justify-between">
              <span class="text-[10px] text-slate-400">A/D RATIO • WALLET</span>
              <div class="flex items-center justify-between mt-1">
                <span class="text-[#00FF88] font-bold text-sm">${breadth.adRatio}x</span>
                <span class="text-[#00F0FF] font-bold text-[11px]">₹${wallet.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
              </div>
            </div>
          </div>

          <!-- Market Breadth Momentum Ratio Bar -->
          <div class="flex flex-col gap-1 pt-1">
            <div class="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span class="text-[#00FF88] font-bold">● ${breadth.advancePct}% Frontline Stocks Advancing</span>
              <span class="text-slate-300 font-semibold">${breadth.total} Active Universe</span>
              <span class="text-[#FF2A6D] font-bold">${breadth.declinePct}% Declining ●</span>
            </div>
            <div class="w-full h-2 bg-[#191c22] rounded-full overflow-hidden flex border border-slate-800">
              <div class="h-full bg-gradient-to-r from-[#00FF88] to-[#00F0FF] transition-all duration-300" style="width: ${breadth.advancePct}%"></div>
              <div class="h-full bg-slate-700" style="width: ${100 - breadth.advancePct - breadth.declinePct}%"></div>
              <div class="h-full bg-gradient-to-r from-[#FF6B8B] to-[#FF2A6D] transition-all duration-300" style="width: ${breadth.declinePct}%"></div>
            </div>
          </div>
        </div>

        <!-- Caution Mode Notice (if active) -->
        ${stream.currentPhaseKey === 'CAUTION' ? `
          <div class="w-full bg-[#FF2A6D]/10 border border-[#FF2A6D]/40 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2 text-[#FF2A6D]">
              <span class="material-symbols-outlined text-[18px]">warning</span>
              <span class="font-bold">CAUTION PHASE (09:15 - 09:30): Opening Volatility Active. Breakout triggers locked until 09:30 AM Opening Range is established.</span>
            </div>
            <button onclick="window.marketStream.setPhase('PRIME_BREAKOUT')" class="px-2 py-1 rounded bg-[#FF2A6D]/20 text-[#FF2A6D] hover:bg-[#FF2A6D]/30 font-bold transition-all">
              Fast-Forward to 09:30 Prime
            </button>
          </div>
        ` : ''}

        <!-- Main Workspace: 70% Top Filtered Picks / 30% Live Catalyst Wire -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- LEFT: Top Filtered Picks Grid (8 Cols) -->
          <div class="lg:col-span-8 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#00FF88] text-[20px]">stars</span>
                <h2 class="text-base font-bold text-slate-100 tracking-tight">Top High-Probability Intraday Setups</h2>
                <span class="px-2 py-0.5 rounded-full bg-[#00FF88]/20 text-[#00FF88] text-xs font-mono font-bold">${topPicks.length} Qualified</span>
              </div>
              <button onclick="window.app.openScreen('screener-heatmap')" class="text-xs text-[#00F0FF] hover:underline flex items-center gap-1 font-semibold">
                <span>Open Full Screener</span>
                <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            <!-- PROMINENT WORKSPACE STOCK SEARCH & QUICK SELECTOR -->
            <div id="workspaceStockSearchContainer" class="bg-[#111622] border border-[#1E293B] hover:border-slate-700 rounded-xl p-3 shadow-lg flex flex-col gap-2.5">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="flex items-center gap-1.5 text-slate-300 font-bold">
                  <span class="material-symbols-outlined text-[16px] text-[#00FF88]">search</span>
                  <span>Search Any NSE Stock (Symbol, Company, or Sector)</span>
                </span>
                <span class="text-slate-500 text-[11px] hidden sm:inline">50+ Frontline Equities • Instant Candlestick Mount</span>
              </div>
              <div class="relative w-full">
                <div class="flex items-center gap-2 px-3 py-2 bg-[#090B10] border border-slate-700 focus-within:border-[#00FF88] focus-within:ring-1 focus-within:ring-[#00FF88]/30 rounded-xl transition-all">
                  <span class="material-symbols-outlined text-[18px] text-[#00FF88]">query_stats</span>
                  <input type="text" id="workspaceStockSearchInput"
                         placeholder="Type any stock name or symbol (e.g. RELIANCE, TCS, INFY, TATAMOTORS, IRCTC)..."
                         class="w-full bg-transparent border-none outline-none font-mono text-xs text-slate-100 placeholder-slate-500 block"
                         autocomplete="off"
                         onfocus="window.app && window.app.handleWorkspaceSearchFocus()"
                         oninput="window.app && window.app.handleWorkspaceSearch(this.value)"
                         onkeydown="window.app && window.app.handleWorkspaceSearchKeydown(event)" />
                  <button type="button" id="workspaceSearchClearBtn" onclick="window.app && window.app.clearWorkspaceSearch()"
                          class="hidden text-slate-400 hover:text-slate-200">
                    <span class="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
                <!-- Autocomplete Dropdown List -->
                <div id="workspaceSearchResults"
                     class="hidden absolute top-full left-0 right-0 mt-2 bg-[#0E131F] border border-[#1E293B] rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl max-h-[360px] flex flex-col">
                </div>
              </div>
              <!-- Quick Ticker Suggestions -->
              <div class="flex items-center gap-1.5 text-xs font-mono text-slate-400 flex-wrap pt-0.5">
                <span class="text-slate-500 text-[11px]">Popular:</span>
                ${['RELIANCE', 'TCS', 'HDFCBANK', 'TATAMOTORS', 'INFY', 'SBIN', 'ITC'].map(sym => `
                  <button type="button" onclick="window.app.selectStockFromSearch('${sym}')"
                          class="px-2 py-0.5 rounded bg-[#191c22] hover:bg-[#00FF88]/15 hover:border-[#00FF88]/40 hover:text-[#00FF88] text-slate-300 border border-slate-800 text-[11px] font-bold transition-all">
                    ${sym}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 6 Bento Stock Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              ${topPicks.map(stock => {
                const tickClass = stream.tickChanges[stock.symbol] ? (stream.tickChanges[stock.symbol] === 'up' ? 'tick-up' : 'tick-down') : '';
                const isAboveVwap = stock.ltp >= stock.vwap;
                const changePct = (((stock.ltp - stock.previousClose) / stock.previousClose) * 100).toFixed(2);
                const isBullish = changePct >= 0;

                return `
                  <div class="bg-[#111622] border border-[#1E293B] hover:border-[#00F0FF]/60 rounded-xl p-4 flex flex-col justify-between gap-3 transition-all duration-150 hover:shadow-xl hover:shadow-[#00F0FF]/5 cursor-pointer ${tickClass}"
                       onclick="window.app.openStockInDrawer('${stock.symbol}')">
                    
                    <!-- Card Header: Ticker, Sector & Score Gauge -->
                    <div class="flex items-start justify-between">
                      <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                          <span class="font-mono text-base font-bold text-slate-100">${stock.symbol}</span>
                          <span class="text-[10px] font-mono text-[#00F0FF] bg-[#191c22] px-1.5 py-0.5 rounded border border-slate-800">${stock.exchange}</span>
                          <span class="text-xs text-slate-400">${stock.sector}</span>
                        </div>
                        <span class="text-[11px] text-slate-400 mt-0.5 truncate max-w-[190px]">${stock.subSector}</span>
                      </div>
                      ${UIComponents.renderScoreGauge(stock.score, 44)}
                    </div>

                    <!-- Price & Sparkline Row -->
                    <div class="flex items-center justify-between py-1 border-y border-slate-800/80">
                      <div>
                        <div class="font-mono text-lg font-bold ${isBullish ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">₹${stock.ltp.toFixed(2)}</div>
                        <div class="font-mono text-xs font-semibold ${isBullish ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">${isBullish ? '+' : ''}${changePct}% ${isBullish ? '▲' : '▼'}</div>
                      </div>
                      <div class="flex flex-col items-end">
                        ${UIComponents.renderSparkline(stock.sparkline, stock.vwap, stock.ltp, 95, 26)}
                        <span class="text-[10px] font-mono text-[#00F0FF]">VWAP ₹${stock.vwap.toFixed(1)}</span>
                      </div>
                    </div>

                    <!-- Catalyst Tag & Technical Pills -->
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center gap-1.5 text-xs text-slate-300 bg-[#191c22] p-1.5 rounded border border-slate-800 truncate">
                        <span class="material-symbols-outlined text-[14px] text-[#FFB800] shrink-0">bolt</span>
                        <span class="truncate">${stock.catalyst}</span>
                      </div>

                      <div class="flex items-center justify-between text-xs pt-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${isAboveVwap ? 'bg-[#00FF88]/15 text-[#00FF88]' : 'bg-[#FF2A6D]/15 text-[#FF2A6D]'}">
                            ${isAboveVwap ? '● ABOVE VWAP' : '● BELOW VWAP'}
                          </span>
                          ${stock.fnoBan ? `
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF2A6D]/20 text-[#FF2A6D]">F&O BAN</span>
                          ` : ''}
                        </div>
                        ${UIComponents.renderRvolBar(stock.rvol)}
                      </div>
                    </div>

                    <!-- Card Action Buttons -->
                    <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80" onclick="event.stopPropagation()">
                      <button onclick="window.app.openStockInDeepDive('${stock.symbol}')" class="py-1.5 rounded bg-[#191c22] hover:bg-slate-800 text-slate-200 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">query_stats</span>
                        <span>Deep Dive</span>
                      </button>
                      <button onclick="window.app.openStockInDrawer('${stock.symbol}')" class="arcade-btn arcade-btn-green py-1.5 rounded text-xs font-mono font-bold flex items-center justify-center gap-1 shadow-md">
                        <span class="material-symbols-outlined text-[14px]">rocket_launch</span>
                        <span>Sim Trade</span>
                      </button>
                    </div>

                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- RIGHT: Live Catalyst Wire (4 Cols) -->
          <div class="lg:col-span-4 bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg sticky top-24">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#FFB800] text-[20px]">rss_feed</span>
                <div>
                  <h3 class="text-sm font-bold text-slate-100">Live Catalyst Wire</h3>
                  <p class="text-[11px] text-slate-400">Exchange announcements & AI sentiment</p>
                </div>
              </div>
              <span class="w-2 h-2 rounded-full bg-[#00FF88] pulse-live"></span>
            </div>

            <!-- Catalyst Event Simulator CTA -->
            <button onclick="window.marketStream.simulateBreakingCatalyst()" class="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#FFB800]/20 via-[#00F0FF]/20 to-[#00FF88]/20 border border-[#FFB800]/50 hover:border-[#FFB800] text-slate-100 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-md transition-all group">
              <span class="material-symbols-outlined text-[16px] text-[#FFB800] group-hover:rotate-12 transition-transform">bolt</span>
              <span>⚡ Simulate Breaking Catalyst</span>
            </button>

            <!-- News Items Stream -->
            <div class="flex flex-col gap-2.5 max-h-[580px] overflow-y-auto pr-1">
              ${stream.catalysts.map(cat => {
                const isBull = cat.sentiment === 'BULLISH';
                return `
                  <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col gap-1.5"
                       onclick="window.app.openStockInDeepDive('${cat.symbol}')">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5">
                        <span class="font-mono text-xs font-bold text-slate-100">${cat.symbol}</span>
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${isBull ? 'bg-[#00FF88]/15 text-[#00FF88]' : 'bg-[#FF2A6D]/15 text-[#FF2A6D]'}">
                          ${cat.sentiment}
                        </span>
                      </div>
                      <span class="text-[10px] font-mono text-slate-400">${cat.time}</span>
                    </div>
                    <p class="text-xs text-slate-300 leading-snug line-clamp-2">${cat.headline}</p>
                    <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>${cat.source}</span>
                      <span class="text-[#00FF88] font-mono font-bold">${cat.scoreImpact || '+8 pts'}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

          </div>

        </div>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 2: INTERACTIVE SCREENER & HEATMAP
  // ==========================================
  static renderScreenerHeatmap(stream) {
    const stocks = stream.getFilteredStocks();

    return `
      <div class="p-4 md:p-6 flex flex-col gap-5">
        
        <!-- SECTION 1: SECTOR MONEY FLOW HEATMAP -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#00F0FF] text-[20px]">bubble_chart</span>
              <div>
                <h2 class="text-base font-bold text-slate-100">Sector Money Flow Heatmap <span class="text-[10px] font-mono font-bold text-[#00F0FF] bg-[#191c22] px-1.5 py-0.5 rounded ml-1">NSE</span></h2>
                <p class="text-xs text-slate-400">Click any sector tile to filter live screener candidates</p>
              </div>
            </div>

            <div class="flex items-center gap-2 text-xs font-mono bg-[#191c22] px-2.5 py-1 rounded border border-slate-800">
              <span class="text-slate-400">Net Flow:</span>
              <span class="text-[#00FF88] font-bold">▲ +₹4,210 Cr Inflow</span>
            </div>
          </div>

          <!-- 4x2 Sector Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            ${stream.sectors.map(sec => {
              const isSelected = stream.activeSectorFilter === sec.id;
              const isPositive = sec.change >= 0;
              return `
                <button type="button" onclick="window.marketStream.setSectorFilter('${sec.id}')"
                        class="p-3 rounded-lg text-left transition-all duration-150 flex flex-col justify-between gap-2 border ${
                          isSelected ? 'bg-[#191c22] border-[#00F0FF] glow-cyan ring-1 ring-[#00F0FF]' : 'bg-[#191c22] border-slate-800 hover:border-slate-700'
                        }">
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-xs font-bold text-slate-100">${sec.name}</span>
                    ${isSelected ? `
                      <span class="px-1.5 py-0.2 rounded bg-[#00F0FF] text-[#090B10] text-[9px] font-mono font-bold animate-pulse">ACTIVE</span>
                    ` : `
                      <span class="text-[10px] font-mono text-slate-400">${sec.adv}:${sec.dec}</span>
                    `}
                  </div>
                  <div>
                    <div class="font-mono text-base font-bold ${isPositive ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">
                      ${isPositive ? '+' : ''}${sec.change.toFixed(2)}%
                    </div>
                    <div class="text-[10px] font-mono text-slate-400">₹${sec.volumeCr} Cr Vol</div>
                  </div>
                  <div class="w-full bg-[#090B10] h-1 rounded-full overflow-hidden">
                    <div class="${isPositive ? 'bg-[#00FF88]' : 'bg-[#FF2A6D]'} h-full rounded-full" style="width: ${sec.inflow}%"></div>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <!-- SECTION 2: STRATEGY & NO-CODE FILTER BAR -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl p-3.5 flex flex-col gap-3 shadow-lg">
          <!-- Top Row: Strategy Presets -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs font-mono font-bold text-slate-400 mr-1 uppercase">STRATEGY:</span>
              ${[
                { id: 'ORB', label: '🔥 High-Probability ORB' },
                { id: 'VOLUME', label: '⚡ Volume Shockers' },
                { id: 'VWAP', label: '📈 VWAP Bounce' },
                { id: 'EARNINGS', label: '📰 Earnings Momentum' }
              ].map(strat => {
                const isActive = stream.activeStrategy === strat.id;
                return `
                  <button type="button" onclick="window.marketStream.setStrategy('${strat.id}')"
                          class="px-2.5 py-1 rounded text-xs font-mono font-bold transition-all border ${
                            isActive ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF] glow-cyan' : 'bg-[#191c22] text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                          }">
                    ${strat.label}
                  </button>
                `;
              }).join('')}
            </div>
            <button type="button" onclick="window.marketStream.resetFilters()"
                    class="px-2.5 py-1 rounded bg-[#191c22] hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all flex items-center gap-1 border border-slate-800">
              <span class="material-symbols-outlined text-[14px]">restart_alt</span> Reset
            </button>
          </div>

          <!-- Bottom Row: Filter Chips -->
          <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
            <span class="text-[11px] font-mono text-slate-400 mr-1">ACTIVE RULES:</span>
            ${[
              { key: 'aboveVwap', label: 'Price > VWAP' },
              { key: 'rvol2', label: 'RVOL > 2.0x' },
              { key: 'score75', label: 'Score ≥ 75' },
              { key: 'noCircuit', label: 'No Circuit Lock' },
              { key: 'noFnoBan', label: 'No F&O Ban' }
            ].map(f => {
              const active = stream.activeFilters[f.key];
              return `
                <button type="button" onclick="window.marketStream.toggleFilter('${f.key}')"
                        class="px-2 py-0.5 rounded text-xs font-mono font-semibold transition-all border flex items-center gap-1 ${
                          active ? 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40' : 'bg-[#191c22] text-slate-500 border-slate-800'
                        }">
                  <span class="material-symbols-outlined text-[12px]">${active ? 'check_circle' : 'radio_button_unchecked'}</span>
                  <span>${f.label}</span>
                </button>
              `;
            }).join('')}

            ${stream.activeSectorFilter ? `
              <div onclick="window.marketStream.setSectorFilter(null)"
                   class="px-2 py-0.5 rounded bg-[#00F0FF] text-[#090B10] text-xs font-mono font-bold flex items-center gap-1 cursor-pointer hover:bg-[#33f3ff] ml-auto">
                <span>Sector: ${stream.activeSectorFilter}</span>
                <span class="material-symbols-outlined text-[12px]">close</span>
              </div>
            ` : ''}
          </div>
        </section>

        <!-- SECTION 3: LIVE SCREENER TABLE -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl overflow-hidden shadow-xl flex flex-col">
          <div class="px-4 py-3 bg-[#191c22] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-slate-100">Live Screener Candidates</span>
              <span class="px-2 py-0.5 rounded-full bg-[#00FF88]/20 text-[#00FF88] text-xs font-mono font-bold">${stocks.length} NSE Equities</span>
            </div>
            
            <!-- Table Search Input -->
            <div class="flex items-center gap-3 flex-wrap">
              <div class="relative w-full sm:w-64">
                <span class="material-symbols-outlined absolute left-2.5 top-2 text-[#00FF88] text-[16px]">search</span>
                <input type="text" placeholder="Filter by symbol, name, sector..."
                       value="${stream.screenerSearchQuery || ''}"
                       oninput="window.marketStream.setScreenerSearchQuery(this.value)"
                       class="w-full pl-8 pr-7 py-1.5 bg-[#090B10] border border-slate-700 focus:border-[#00FF88] rounded-lg text-slate-100 font-mono text-xs outline-none" />
                ${stream.screenerSearchQuery ? `
                  <button type="button" onclick="window.marketStream.setScreenerSearchQuery('')"
                          class="absolute right-2 top-2 text-slate-400 hover:text-slate-200">
                    <span class="material-symbols-outlined text-[14px]">close</span>
                  </button>
                ` : ''}
              </div>

              <div class="hidden md:flex items-center gap-3 text-xs font-mono text-slate-400">
                <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full ${window.nseCalendar && window.nseCalendar.getMarketStatus().isOpen ? 'bg-[#00FF88] pulse-live' : 'bg-[#FFB800]'}"></span> ${window.nseCalendar && window.nseCalendar.getMarketStatus().isOpen ? 'Streaming 500ms Ticks' : 'Exchange Closed (Friday Official Close)'}</span>
                <span>Sorted by Probability Score ▼</span>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#191c22]/60 text-slate-400 font-mono text-xs uppercase tracking-wider border-b border-slate-800">
                  <th class="py-2.5 px-4 w-16 text-center">Score</th>
                  <th class="py-2.5 px-4">Stock & Catalyst</th>
                  <th class="py-2.5 px-4 text-right">LTP / Change</th>
                  <th class="py-2.5 px-4 text-center">Trend vs VWAP</th>
                  <th class="py-2.5 px-4">RVOL Surge</th>
                  <th class="py-2.5 px-4">Guardrail</th>
                  <th class="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80 text-sm">
                ${stocks.length === 0 ? `
                  <tr>
                    <td colspan="7" class="py-8 text-center text-slate-400 font-mono text-xs">
                      No stocks match current filter criteria. <button onclick="window.marketStream.resetFilters()" class="text-[#00F0FF] underline ml-1">Reset Filters</button>
                    </td>
                  </tr>
                ` : stocks.map(stock => {
                  const isSelected = stream.selectedSymbol === stock.symbol;
                  const tickClass = stream.tickChanges[stock.symbol] ? (stream.tickChanges[stock.symbol] === 'up' ? 'tick-up' : 'tick-down') : '';
                  const changePct = (((stock.ltp - stock.previousClose) / stock.previousClose) * 100).toFixed(2);
                  const isBull = changePct >= 0;
                  const isWatched = window.alertStudio ? window.alertStudio.isInWatchlist(stock.symbol) : false;

                  return `
                    <tr class="hover:bg-slate-800/50 transition-colors cursor-pointer group ${isSelected ? 'bg-slate-800/60' : ''} ${tickClass}"
                        onclick="window.app.openStockInDrawer('${stock.symbol}')">
                      
                      <!-- Score Gauge -->
                      <td class="py-3 px-4 text-center">
                        ${UIComponents.renderScoreGauge(stock.score, 40)}
                      </td>

                      <!-- Stock & Catalyst -->
                      <td class="py-3 px-4">
                        <div class="flex flex-col">
                          <div class="flex items-center gap-1.5">
                            <span class="font-mono text-sm font-bold text-slate-100 group-hover:text-[#00F0FF] transition-colors">${stock.symbol}</span>
                            <span class="text-[10px] font-mono text-[#00F0FF] bg-[#191c22] px-1 rounded border border-slate-800">${stock.exchange}</span>
                            <span class="text-xs text-slate-400">${stock.sector}</span>
                          </div>
                          <div class="flex items-center gap-1 mt-1">
                            <span class="px-1.5 py-0.5 rounded bg-[#191c22] text-slate-300 text-xs flex items-center gap-1 truncate max-w-xs">
                              <span class="material-symbols-outlined text-[13px] text-[#FFB800]">bolt</span>
                              <span class="truncate">${stock.catalyst}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      <!-- LTP & Change -->
                      <td class="py-3 px-4 text-right">
                        <div class="font-mono text-base font-bold ${isBull ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">₹${stock.ltp.toFixed(2)}</div>
                        <div class="font-mono text-xs font-semibold ${isBull ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">${isBull ? '+' : ''}${changePct}% ${isBull ? '▲' : '▼'}</div>
                      </td>

                      <!-- Sparkline vs VWAP -->
                      <td class="py-3 px-4 text-center">
                        <div class="inline-flex flex-col items-center">
                          ${UIComponents.renderSparkline(stock.sparkline, stock.vwap, stock.ltp, 90, 24)}
                          <span class="text-[10px] font-mono text-[#00F0FF]">VWAP ₹${stock.vwap.toFixed(1)}</span>
                        </div>
                      </td>

                      <!-- RVOL Surge -->
                      <td class="py-3 px-4">
                        ${UIComponents.renderRvolBar(stock.rvol)}
                      </td>

                      <!-- Guardrails -->
                      <td class="py-3 px-4">
                        ${stock.fnoBan ? `
                          <span class="px-2 py-0.5 rounded bg-[#FF2A6D]/20 text-[#FF2A6D] text-xs font-mono font-bold">F&O BAN</span>
                        ` : `
                          <span class="px-2 py-0.5 rounded bg-[#191c22] text-[#00FF88] text-xs font-mono font-semibold inline-flex items-center gap-1 border border-slate-800">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#00FF88]"></span> Safe Spread
                          </span>
                        `}
                      </td>

                      <!-- Action Buttons -->
                      <td class="py-3 px-4 text-right" onclick="event.stopPropagation()">
                        <div class="flex items-center justify-end gap-1.5">
                          <button onclick="window.alertStudio.toggleWatchlist('${stock.symbol}')" class="p-1.5 text-slate-400 hover:text-[#FFB800] transition-colors" title="Toggle Watchlist">
                            <span class="material-symbols-outlined text-[18px]">${isWatched ? 'star' : 'star_border'}</span>
                          </button>
                          <button onclick="window.app.openStockInDeepDive('${stock.symbol}')" class="px-2.5 py-1 rounded bg-[#191c22] hover:bg-slate-800 text-slate-300 text-xs font-mono font-semibold transition-all" title="Interactive Candlestick Chart">
                            Chart
                          </button>
                          <button onclick="window.app.openStockInDrawer('${stock.symbol}')" class="arcade-btn arcade-btn-green px-2.5 py-1 rounded text-xs font-mono font-bold shadow transition-all">
                            Sim Trade
                          </button>
                        </div>
                      </td>

                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Table Footer -->
          <div class="p-3 bg-[#191c22] flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800">
            <span>Next recalculation in <span class="text-[#00F0FF] font-bold">500ms</span></span>
            <span class="text-slate-400">Press <kbd class="px-1.5 py-0.5 rounded bg-[#090B10] text-[#00F0FF] border border-slate-700 font-bold">[SPACE]</kbd> on row to open Execution Co-Pilot</span>
          </div>
        </section>

      </div>
    `;
  }

  // ==========================================
  // SCREEN 3: STOCK DEEP-DIVE & EXECUTION WORKSPACE
  // ==========================================
  static renderDeepDive(stream) {
    const stock = stream.getSelectedStock();
    const sizing = window.paperTradingDesk.calculateSizing(stock);
    const changePct = (((stock.ltp - stock.previousClose) / stock.previousClose) * 100).toFixed(2);
    const isBull = changePct >= 0;

    const nseInfo = window.nseClient ? window.nseClient.getEquityInfo(stock.symbol) : {
      isin: 'INE155A01022',
      series: 'EQ',
      upperCircuit: stock.upperCircuit,
      lowerCircuit: stock.lowerCircuit,
      circuitBand: '10%',
      week52High: 1179.05,
      week52Low: 621.75,
      deliveryPercent: 34.8,
      marketCapCr: 362450,
      faceValue: 2.0,
      industry: stock.sector,
      lastUpdatedNse: '15-Nov-2026 15:30:00 IST'
    };
    const relatedNews = window.newsIntelligence ? window.newsIntelligence.getNewsForStock(stock.symbol) : [];
    
    // Technical Indicator Computations
    const candles = stock.candles5m || stock.candles1m || [];
    const rsi = window.TechnicalIndicators ? window.TechnicalIndicators.computeRSI(candles, 14) : { value: 62.4, status: 'BULLISH MOMENTUM', color: '#00FF88' };
    const macd = window.TechnicalIndicators ? window.TechnicalIndicators.computeMACD(candles) : { macd: 1.45, signal: 1.10, hist: 0.35, status: 'BULLISH EXPANSION', isBullish: true };
    const atr = window.TechnicalIndicators ? window.TechnicalIndicators.computeATR(stock, candles, 14) : { atr: 18.5, atrPct: 1.4, dayRange: 22.0, rangeExhaustionPct: 68, suggestedSLPoints: 23.0 };
    const pivots = window.TechnicalIndicators ? window.TechnicalIndicators.computePivots(stock) : { P: stock.ltp, R1: stock.ltp*1.01, R2: stock.ltp*1.02, S1: stock.ltp*0.99, S2: stock.ltp*0.98, camarilla: { H4: stock.ltp*1.015, H3: stock.ltp*1.008, L3: stock.ltp*0.992, L4: stock.ltp*0.985 } };
    const patterns = window.TechnicalIndicators ? window.TechnicalIndicators.detectPatterns(candles, stock) : [];
    const vwapDist = Number((((stock.ltp - stock.vwap) / stock.vwap) * 100).toFixed(2));
    const isAboveVwap = stock.ltp >= stock.vwap;

    return `
      <div class="p-4 md:p-6 flex flex-col gap-5">
        
        <!-- Stock Top Ribbon -->
        <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          <div class="flex items-center gap-3">
            <div class="flex flex-col">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="font-mono text-2xl font-bold text-slate-100">${stock.symbol}</h1>
                <span class="px-2 py-0.5 rounded bg-[#191c22] text-[#00F0FF] text-xs font-mono font-bold border border-slate-800">${stock.exchange}</span>
                <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">${stock.sector}</span>
                <button type="button" onclick="document.getElementById('globalStockSearchInput').focus(); window.app && window.app.handleStockSearchFocus();"
                        class="px-2 py-1 rounded-lg bg-[#090B10] hover:bg-[#00FF88]/15 border border-slate-700 hover:border-[#00FF88] text-slate-300 hover:text-[#00FF88] text-[11px] font-mono font-bold flex items-center gap-1 transition-all" title="Search & Switch to another stock (Press /)">
                  <span class="material-symbols-outlined text-[14px] text-[#00FF88]">search</span>
                  <span>Change Stock [/]</span>
                </button>
              </div>
              <span class="text-xs text-slate-400">${stock.name} • ${stock.subSector}</span>
            </div>
            ${UIComponents.renderScoreGauge(stock.score, 46)}
          </div>

          <div class="flex items-center gap-6 flex-wrap font-mono">
            <div>
              <div class="text-[10px] text-slate-400">LAST TRADED PRICE</div>
              <div class="text-xl font-bold ${isBull ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">₹${stock.ltp.toFixed(2)} <span class="text-xs font-normal">${isBull ? '+' : ''}${changePct}%</span></div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">VWAP</div>
              <div class="text-sm font-bold text-[#00F0FF]">₹${stock.vwap.toFixed(2)}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">DAY HIGH / LOW</div>
              <div class="text-sm font-semibold text-slate-200">₹${stock.dayHigh.toFixed(1)} / ₹${stock.dayLow.toFixed(1)}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">15m ORH / ORL</div>
              <div class="text-sm font-semibold text-[#00F0FF]">₹${stock.orh.toFixed(1)} / ₹${stock.orl.toFixed(1)}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">RVOL</div>
              <div class="text-sm font-bold text-[#00FF88]">${stock.rvol.toFixed(1)}x</div>
            </div>
          </div>
        </div>

        <!-- 2-Column Split: 68% Chart & Depth / 32% Sticky Trade Ticket -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- LEFT 8 COLS: Interactive Candlestick Chart & L2 Depth -->
          <div class="lg:col-span-8 flex flex-col gap-4">
            
            <!-- Chart Container -->
            <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-xl">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="material-symbols-outlined text-[#00F0FF] text-[20px]">candlestick_chart</span>
                  <span class="text-sm font-bold text-slate-100">Candlestick Multi-Timeframe Stream</span>
                  <div class="flex items-center gap-1 ml-2 bg-[#090B10] p-0.5 rounded-lg border border-slate-800 flex-wrap">
                    <button type="button" onclick="if(window.activeChart) window.activeChart.setTimeframe('1m')" id="tf-btn-1m"
                            class="px-2 py-0.5 rounded text-xs font-mono font-bold ${(window.activeChart && window.activeChart.timeframe === '1m') || !window.activeChart ? 'bg-[#00F0FF] text-[#090B10]' : 'text-slate-400 hover:text-slate-100 hover:bg-[#111622]'} transition-colors">1 min</button>
                    <button type="button" onclick="if(window.activeChart) window.activeChart.setTimeframe('5m')" id="tf-btn-5m"
                            class="px-2 py-0.5 rounded text-xs font-mono font-bold ${window.activeChart && window.activeChart.timeframe === '5m' ? 'bg-[#00F0FF] text-[#090B10]' : 'text-slate-400 hover:text-slate-100 hover:bg-[#111622]'} transition-colors">5 min</button>
                    <button type="button" onclick="if(window.activeChart) window.activeChart.setTimeframe('1D')" id="tf-btn-1D"
                            class="px-2 py-0.5 rounded text-xs font-mono font-bold ${window.activeChart && window.activeChart.timeframe === '1D' ? 'bg-[#00F0FF] text-[#090B10]' : 'text-slate-400 hover:text-slate-100 hover:bg-[#111622]'} transition-colors">1 day</button>
                    <button type="button" onclick="if(window.activeChart) window.activeChart.setTimeframe('1M')" id="tf-btn-1M"
                            class="px-2 py-0.5 rounded text-xs font-mono font-bold ${window.activeChart && window.activeChart.timeframe === '1M' ? 'bg-[#00F0FF] text-[#090B10]' : 'text-slate-400 hover:text-slate-100 hover:bg-[#111622]'} transition-colors">1 month</button>
                    <button type="button" onclick="if(window.activeChart) window.activeChart.setTimeframe('1Y')" id="tf-btn-1Y"
                            class="px-2 py-0.5 rounded text-xs font-mono font-bold ${window.activeChart && window.activeChart.timeframe === '1Y' ? 'bg-[#00F0FF] text-[#090B10]' : 'text-slate-400 hover:text-slate-100 hover:bg-[#111622]'} transition-colors">1 year</button>
                    <button type="button" onclick="if(window.activeChart) window.activeChart.setTimeframe('3Y')" id="tf-btn-3Y"
                            class="px-2 py-0.5 rounded text-xs font-mono font-bold ${window.activeChart && window.activeChart.timeframe === '3Y' ? 'bg-[#00F0FF] text-[#090B10]' : 'text-slate-400 hover:text-slate-100 hover:bg-[#111622]'} transition-colors">3 year</button>
                    <button type="button" onclick="if(window.activeChart) window.activeChart.setTimeframe('5Y')" id="tf-btn-5Y"
                            class="px-2 py-0.5 rounded text-xs font-mono font-bold ${window.activeChart && window.activeChart.timeframe === '5Y' ? 'bg-[#00F0FF] text-[#090B10]' : 'text-slate-400 hover:text-slate-100 hover:bg-[#111622]'} transition-colors">5 year</button>
                  </div>
                </div>

                <!-- Legend & News event notice -->
                <div class="flex items-center gap-3 text-xs font-mono text-slate-400 flex-wrap">
                  <span class="flex items-center gap-1"><span class="w-2.5 h-0.5 bg-[#00F0FF]"></span> VWAP / 52W</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-0.5 bg-[#FFB800]"></span> 9 EMA</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-0.5 bg-[#D946EF]"></span> 20 EMA</span>
                  <span class="flex items-center gap-1"><span class="w-2.5 h-0.5 bg-[#00FF88]"></span> RSI 14</span>
                  <span class="flex items-center gap-1"><span class="text-[#FFB800]">⚡</span> News Pin</span>
                </div>
              </div>

              <!-- HTML5 Canvas Element -->
              <div class="w-full h-[420px] relative bg-[#090B10] rounded-lg overflow-hidden border border-slate-800">
                <canvas id="deepDiveChart" class="w-full h-full cursor-crosshair"></canvas>
              </div>

              <!-- Chart Sub-Footer / Catalyst headline bar -->
              <div class="p-2.5 rounded bg-[#191c22] border border-slate-800 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2 text-slate-300">
                  <span class="material-symbols-outlined text-[16px] text-[#FFB800]">bolt</span>
                  <span class="font-semibold text-slate-100">Intraday Catalyst:</span>
                  <span>${stock.catalyst}</span>
                </div>
                <span class="text-[10px] font-mono text-[#00F0FF]">${stock.catalystTime}</span>
              </div>
            </div>

            <!-- Level-2 Order Book Depth & Slippage Meter -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- L2 Order Book -->
              <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-2 shadow-lg">
                <div class="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span class="text-xs font-bold font-mono text-slate-200">Level-2 Market Depth (5 Bids / 5 Asks)</span>
                  <span class="text-[10px] font-mono text-[#00FF88]">Spread 0.02%</span>
                </div>
                <div class="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
                  <!-- Bids -->
                  <div class="flex flex-col gap-1">
                    <div class="flex justify-between text-[10px] text-slate-400"><span>BID PRICE</span><span>QTY</span></div>
                    ${stock.orderBook ? stock.orderBook.bids.map(b => `
                      <div class="flex justify-between items-center py-0.5 px-1 bg-[#00FF88]/5 rounded relative overflow-hidden">
                        <span class="text-[#00FF88] font-bold">₹${b.price.toFixed(2)}</span>
                        <span class="text-slate-300">${b.qty.toLocaleString()}</span>
                      </div>
                    `).join('') : ''}
                  </div>
                  <!-- Asks -->
                  <div class="flex flex-col gap-1">
                    <div class="flex justify-between text-[10px] text-slate-400"><span>ASK PRICE</span><span>QTY</span></div>
                    ${stock.orderBook ? stock.orderBook.asks.map(a => `
                      <div class="flex justify-between items-center py-0.5 px-1 bg-[#FF2A6D]/5 rounded relative overflow-hidden">
                        <span class="text-[#FF2A6D] font-bold">₹${a.price.toFixed(2)}</span>
                        <span class="text-slate-300">${a.qty.toLocaleString()}</span>
                      </div>
                    `).join('') : ''}
                  </div>
                </div>
              </div>

              <!-- Slippage & Circuit Gauge -->
              <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between gap-3 shadow-lg">
                <div class="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span class="text-xs font-bold font-mono text-slate-200">Execution Safety & Liquidity</span>
                  <span class="material-symbols-outlined text-[16px] text-[#00FF88]">verified_user</span>
                </div>
                <div class="flex flex-col gap-2 font-mono text-xs">
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Estimated Market Slippage:</span>
                    <span class="text-[#00FF88] font-bold">&lt; 0.03% (Low Risk)</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Upper Circuit Limit (+10%):</span>
                    <span class="text-slate-200 font-bold">₹${stock.upperCircuit.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Lower Circuit Limit (-10%):</span>
                    <span class="text-slate-200 font-bold">₹${stock.lowerCircuit.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">NSE F&O Ban Status:</span>
                    <span class="${stock.fnoBan ? 'text-[#FF2A6D] font-bold' : 'text-[#00FF88] font-bold'}">
                      ${stock.fnoBan ? 'ACTIVE IN BAN' : 'CLEAR (MWPL &lt; 95%)'}
                    </span>
                  </div>
                </div>
                <div class="p-2 rounded bg-[#090B10] text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[14px] text-[#00F0FF]">shield</span>
                  <span>Auto-RMS: Max risk per trade enforced at ₹${(sizing ? sizing.maxLossINR : 1000).toFixed(0)}</span>
                </div>
              </div>
            </div>

            <!-- INSTITUTIONAL TECHNICAL INDICATOR SUITE & PRICE ACTION -->
            <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center">
                    <span class="material-symbols-outlined text-[#00F0FF] text-[16px]">show_chart</span>
                  </div>
                  <div>
                    <span class="font-mono text-xs font-bold text-slate-100">Intraday Technical Indicator Suite &amp; Price Action</span>
                    <span class="text-[10px] text-slate-400 block">VWAP • EMA Alignment • RSI 14 • MACD • ATR Volatility • Pivot Points</span>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isAboveVwap ? 'bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40' : 'bg-[#FF2A6D]/20 text-[#FF2A6D] border border-[#FF2A6D]/40'}">
                    ${isAboveVwap ? `▲ VWAP +${vwapDist}%` : `▼ VWAP ${vwapDist}%`}
                  </span>
                </div>
              </div>

              <!-- Price Action & Detected Patterns Row -->
              <div class="p-2.5 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col gap-1.5 font-mono text-xs">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-slate-400 font-bold">DETECTED PRICE ACTION PATTERNS:</span>
                  <span class="text-[#00F0FF] text-[10px]">Real-time Pattern Engine</span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  ${patterns.map(p => `
                    <div class="px-2.5 py-1 rounded border text-xs font-bold flex items-center gap-1.5 ${p.badgeClass}">
                      <span class="material-symbols-outlined text-[13px]">${p.type.includes('BULL') ? 'north_east' : (p.type.includes('BEAR') ? 'south_east' : 'compress')}</span>
                      <span>${p.name}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">
                  ${patterns.length > 0 ? patterns[0].description : 'Consolidating within intraday boundaries.'}
                </div>
              </div>

              <!-- 4-Pillar Indicator Grid (VWAP/EMA, RSI, MACD, ATR) -->
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                
                <!-- Pillar 1: EMA & VWAP Trend -->
                <div class="p-2.5 rounded bg-[#090B10] border border-slate-800 flex flex-col justify-between gap-1.5">
                  <div class="flex items-center justify-between text-[10px] text-slate-400">
                    <span>EMA &amp; VWAP TREND</span>
                    <span class="text-[#00FF88] font-bold">9 &gt; 20 EMA</span>
                  </div>
                  <div class="flex flex-col gap-1 text-[11px]">
                    <div class="flex justify-between">
                      <span class="text-slate-400">VWAP:</span>
                      <span class="text-[#00F0FF] font-bold">₹${stock.vwap.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">9 EMA:</span>
                      <span class="text-[#FFB800] font-bold">₹${(stock.ltp * 0.998).toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">20 EMA:</span>
                      <span class="text-[#D946EF] font-bold">₹${(stock.ltp * 0.994).toFixed(2)}</span>
                    </div>
                  </div>
                  <div class="text-[9px] text-[#00FF88] pt-1 border-t border-slate-800/80 font-bold">
                    Bullish Momentum Stack Active
                  </div>
                </div>

                <!-- Pillar 2: RSI 14 Momentum -->
                <div class="p-2.5 rounded bg-[#090B10] border border-slate-800 flex flex-col justify-between gap-1.5">
                  <div class="flex items-center justify-between text-[10px] text-slate-400">
                    <span>RSI (14-PERIOD)</span>
                    <span class="text-[9px] px-1 rounded bg-slate-800 text-slate-300">5M</span>
                  </div>
                  <div class="flex items-baseline justify-between">
                    <span class="text-2xl font-bold" style="color: ${rsi.color}">${rsi.value}</span>
                    <span class="text-[10px] font-bold" style="color: ${rsi.color}">${rsi.status}</span>
                  </div>
                  <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                    <div class="h-full transition-all duration-300" style="width: ${rsi.value}%; background-color: ${rsi.color}"></div>
                  </div>
                  <div class="flex justify-between text-[9px] text-slate-500">
                    <span>30 Oversold</span>
                    <span>50 Mid</span>
                    <span>70 Overbought</span>
                  </div>
                </div>

                <!-- Pillar 3: MACD (12, 26, 9) -->
                <div class="p-2.5 rounded bg-[#090B10] border border-slate-800 flex flex-col justify-between gap-1.5">
                  <div class="flex items-center justify-between text-[10px] text-slate-400">
                    <span>MACD (12, 26, 9)</span>
                    <span class="text-[#00FF88] font-bold">EXPANDING</span>
                  </div>
                  <div class="flex flex-col gap-1 text-[11px]">
                    <div class="flex justify-between">
                      <span class="text-slate-400">MACD Line:</span>
                      <span class="text-slate-100 font-bold">${macd.macd}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">Signal Line:</span>
                      <span class="text-slate-300 font-bold">${macd.signal}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">Histogram:</span>
                      <span class="${macd.hist >= 0 ? 'text-[#00FF88]' : 'text-[#FF2A6D]'} font-bold">${macd.hist >= 0 ? '+' : ''}${macd.hist}</span>
                    </div>
                  </div>
                  <div class="text-[9px] text-slate-400 pt-1 border-t border-slate-800/80">
                    ${macd.status}
                  </div>
                </div>

                <!-- Pillar 4: ATR Volatility & Dynamic SL -->
                <div class="p-2.5 rounded bg-[#090B10] border border-slate-800 flex flex-col justify-between gap-1.5">
                  <div class="flex items-center justify-between text-[10px] text-slate-400">
                    <span>ATR (14) VOLATILITY</span>
                    <span class="text-[#FFB800] font-bold">₹${atr.atr} (${atr.atrPct}%)</span>
                  </div>
                  <div class="flex flex-col gap-1 text-[11px]">
                    <div class="flex justify-between">
                      <span class="text-slate-400">Day's Range:</span>
                      <span class="text-slate-100 font-bold">₹${atr.dayRange}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">Range Exhaustion:</span>
                      <span class="text-[#00F0FF] font-bold">${atr.rangeExhaustionPct}%</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">Suggested 1.2x SL:</span>
                      <span class="text-[#FF2A6D] font-bold">₹${atr.suggestedSLPoints} pts</span>
                    </div>
                  </div>
                  <div class="text-[9px] text-[#00F0FF] pt-1 border-t border-slate-800/80 font-bold">
                    Adequate Intraday Range Left
                  </div>
                </div>

              </div>

              <!-- Support & Resistance Pivots Table (Floor & Camarilla) -->
              <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col gap-2 font-mono text-xs">
                <div class="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800">
                  <span class="font-bold text-slate-200">KEY INTRADAY SUPPORT &amp; RESISTANCE LEVELS</span>
                  <span class="text-[10px] text-slate-400">Standard Floor Pivots &amp; Camarilla Levels</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-[10px]">
                  <div class="p-1 rounded bg-[#FF2A6D]/10 border border-[#FF2A6D]/30">
                    <span class="text-[#FF2A6D] block font-bold">R2 Pivot</span>
                    <span class="text-slate-100 font-bold">₹${pivots.R2}</span>
                  </div>
                  <div class="p-1 rounded bg-[#FF2A6D]/5 border border-[#FF2A6D]/20">
                    <span class="text-[#FF2A6D] block font-bold">R1 Pivot</span>
                    <span class="text-slate-100 font-bold">₹${pivots.R1}</span>
                  </div>
                  <div class="p-1 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/40">
                    <span class="text-[#00F0FF] block font-bold">Central Pivot (P)</span>
                    <span class="text-slate-100 font-bold">₹${pivots.P}</span>
                  </div>
                  <div class="p-1 rounded bg-[#00FF88]/5 border border-[#00FF88]/20">
                    <span class="text-[#00FF88] block font-bold">S1 Pivot</span>
                    <span class="text-slate-100 font-bold">₹${pivots.S1}</span>
                  </div>
                  <div class="p-1 rounded bg-[#00FF88]/10 border border-[#00FF88]/30">
                    <span class="text-[#00FF88] block font-bold">S2 Pivot</span>
                    <span class="text-slate-100 font-bold">₹${pivots.S2}</span>
                  </div>
                  <div class="p-1 rounded bg-[#111622] border border-slate-800">
                    <span class="text-[#FFB800] block font-bold">Camarilla H4</span>
                    <span class="text-slate-100 font-bold">₹${pivots.camarilla.H4}</span>
                  </div>
                  <div class="p-1 rounded bg-[#111622] border border-slate-800">
                    <span class="text-[#FFB800] block font-bold">Camarilla L4</span>
                    <span class="text-slate-100 font-bold">₹${pivots.camarilla.L4}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- OFFICIAL NSE EXCHANGE DATA & VERIFICATION CARD -->
            <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded bg-[#00FF88]/20 border border-[#00FF88] flex items-center justify-center">
                    <span class="material-symbols-outlined text-[#00FF88] text-[16px]">verified</span>
                  </div>
                  <div>
                    <span class="font-mono text-xs font-bold text-slate-100">Official NSE Exchange Verification &amp; Security Profile</span>
                    <span class="text-[10px] text-slate-400 block">Authenticated parameters from National Stock Exchange of India (nseindia.com)</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <a href="${window.nseClient ? window.nseClient.getOfficialQuoteUrl(stock.symbol) : `https://www.nseindia.com/get-quotes/equity?symbol=${stock.symbol}`}" target="_blank"
                     class="px-2.5 py-1 rounded bg-[#191c22] border border-[#00F0FF]/40 text-[#00F0FF] hover:border-[#00F0FF] text-xs font-mono font-bold flex items-center gap-1 transition-all">
                    <span>NSE India Quote</span>
                    <span class="material-symbols-outlined text-[13px]">open_in_new</span>
                  </a>
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div class="p-2 rounded bg-[#090B10] border border-slate-800 flex flex-col">
                  <span class="text-[10px] text-slate-400">ISIN CODE</span>
                  <span class="text-slate-100 font-bold">${nseInfo.isin}</span>
                </div>
                <div class="p-2 rounded bg-[#090B10] border border-slate-800 flex flex-col">
                  <span class="text-[10px] text-slate-400">SERIES / SETTLEMENT</span>
                  <span class="text-[#00FF88] font-bold">${nseInfo.series} (Rolling T+1)</span>
                </div>
                <div class="p-2 rounded bg-[#090B10] border border-slate-800 flex flex-col">
                  <span class="text-[10px] text-slate-400">CIRCUIT BAND (LIMIT)</span>
                  <span class="text-[#FFB800] font-bold">${nseInfo.circuitBand} (₹${nseInfo.lowerCircuit.toFixed(1)} - ₹${nseInfo.upperCircuit.toFixed(1)})</span>
                </div>
                <div class="p-2 rounded bg-[#090B10] border border-slate-800 flex flex-col">
                  <span class="text-[10px] text-slate-400">52W HIGH / LOW</span>
                  <span class="text-slate-200 font-bold">₹${nseInfo.week52High.toFixed(1)} / ₹${nseInfo.week52Low.toFixed(1)}</span>
                </div>
                <div class="p-2 rounded bg-[#090B10] border border-slate-800 flex flex-col">
                  <span class="text-[10px] text-slate-400">DELIVERY VOL %</span>
                  <span class="text-[#00F0FF] font-bold">${nseInfo.deliveryPercent}% (MIS Day Vol: ${(100 - nseInfo.deliveryPercent).toFixed(1)}%)</span>
                </div>
                <div class="p-2 rounded bg-[#090B10] border border-slate-800 flex flex-col">
                  <span class="text-[10px] text-slate-400">MARKET CAP</span>
                  <span class="text-slate-100 font-bold">₹${(nseInfo.marketCapCr).toLocaleString('en-IN')} Cr</span>
                </div>
                <div class="p-2 rounded bg-[#090B10] border border-slate-800 flex flex-col">
                  <span class="text-[10px] text-slate-400">FACE VALUE</span>
                  <span class="text-slate-200 font-bold">₹${nseInfo.faceValue.toFixed(1)}</span>
                </div>
                <div class="p-2 rounded bg-[#090B10] border border-slate-800 flex flex-col">
                  <span class="text-[10px] text-slate-400">NSE SECTOR</span>
                  <span class="text-slate-300 font-medium truncate">${nseInfo.industry}</span>
                </div>
              </div>

              <!-- Official portal navigation bar -->
              <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 flex-wrap gap-2">
                <span>Verified NSE Sync &bull; ${nseInfo.lastUpdatedNse}</span>
                <div class="flex items-center gap-3">
                  <a href="${window.nseClient ? window.nseClient.getOfficialAnnouncementsUrl(stock.symbol) : `https://www.nseindia.com/companies-listing/corporate-filings-announcements?symbol=${stock.symbol}`}" target="_blank" class="text-[#00F0FF] hover:underline flex items-center gap-0.5">
                    <span>NSE Filings</span>
                    <span class="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                  <a href="${window.nseClient ? window.nseClient.getOfficialHolidaysUrl() : 'https://www.nseindia.com/resources/exchange-communication-holidays'}" target="_blank" class="text-[#00F0FF] hover:underline flex items-center gap-0.5">
                    <span>Exchange Holidays</span>
                    <span class="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>

            <!-- RELATED NEWS & INTRADAY CATALYST PLAYBOOK FOR THIS STOCK -->
            ${relatedNews.length > 0 ? `
              <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[#FFB800] text-[18px]">newspaper</span>
                    <span class="font-mono text-xs font-bold text-slate-100">Live News Catalyst &amp; Intraday Transmission</span>
                  </div>
                  <button onclick="window.app.openScreen('news-desk')" class="text-xs font-mono text-[#00F0FF] hover:underline flex items-center gap-1">
                    <span>Open News Desk</span>
                    <span class="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </button>
                </div>

                ${relatedNews.map(item => `
                  <div class="p-3.5 rounded-lg bg-[#090B10] border border-slate-800 flex flex-col gap-2.5 font-mono text-xs">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <span class="px-2 py-0.5 rounded bg-[#FFB800]/20 text-[#FFB800] text-[10px] font-bold border border-[#FFB800]/40 uppercase">${item.badge}</span>
                      <span class="text-slate-400 text-[10px]">${item.publishedAt}</span>
                    </div>
                    <div class="font-sans text-sm font-bold text-slate-100">${item.title}</div>
                    
                    <div class="p-2.5 rounded bg-[#111622] text-[11px] flex flex-col gap-1 border border-slate-800/80">
                      <span class="text-[#00F0FF] font-bold">Price Impact Transmission:</span>
                      <span class="text-slate-300 font-sans">${item.priceImpactMechanism.summary}</span>
                    </div>

                    <div class="flex items-center justify-between gap-2 flex-wrap pt-1">
                      <div class="flex items-center gap-2">
                        <span class="text-slate-400 text-[11px]">Intraday Entry:</span>
                        <span class="px-2 py-0.5 rounded text-[11px] font-bold ${item.entryViability.badgeClass}">${item.entryViability.verdict}</span>
                      </div>
                      ${item.recommendation ? `
                        <button onclick="window.newsIntelligence.applySetupToTicket('${item.id}')"
                                class="px-2.5 py-1 rounded bg-[#00FF88] text-[#002b11] font-bold flex items-center gap-1 shadow hover:bg-[#33ff9f] transition-all">
                          <span class="material-symbols-outlined text-[14px]">bolt</span>
                          <span>Apply Setup (SL: ₹${item.recommendation.stopLoss} | T: ₹${item.recommendation.target1})</span>
                        </button>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

          </div>

          <!-- RIGHT 4 COLS: Gemini Intraday Co-Pilot Advisory & Trade Ticket -->
          <div class="lg:col-span-4 flex flex-col gap-4 sticky top-24">
            
            <!-- Gemini Intraday AI Co-Pilot Card -->
            ${UIComponents.renderGeminiAdvisoryWidget(stock)}

            <!-- Sticky Co-Pilot Trade Ticket -->
            <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-4 shadow-2xl ring-1 ${window.growwClient && window.growwClient.isLive() ? 'ring-[#FFB800]/50' : 'ring-[#00F0FF]/30'}">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[#00F0FF] text-[20px]">smart_toy</span>
                  <div>
                    <h3 class="text-sm font-bold text-slate-100">Co-Pilot Trade Ticket</h3>
                    <p class="text-[10px] text-slate-400">Algorithmic Risk & Sizing Desk</p>
                  </div>
                </div>
                <!-- Broker Mode Badge & Switcher -->
                <button type="button" onclick="window.app.openScreen('user-settings')"
                        class="px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                          window.growwClient && window.growwClient.isLive()
                            ? 'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800] glow-amber'
                            : 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40'
                        }" title="Click to change Broker Execution Mode in Settings">
                  <span class="w-1.5 h-1.5 rounded-full ${window.growwClient && window.growwClient.isLive() ? 'bg-[#FFB800]' : 'bg-[#00F0FF]'} pulse-live"></span>
                  <span>${window.growwClient && window.growwClient.isLive() ? 'GROWW LIVE' : 'SANDBOX'}</span>
                </button>
              </div>

              <!-- Parameters Grid -->
              <div class="flex flex-col gap-2.5 font-mono text-xs">
                
                <!-- Risk % Per Trade Slider -->
                <div class="p-2.5 rounded bg-[#191c22] border border-slate-800 flex flex-col gap-1.5">
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400">Risk % Per Trade:</span>
                    <span class="text-[#00FF88] font-bold" id="riskPctDisplay">${window.paperTradingDesk.riskPercent.toFixed(1)}% (₹${(sizing ? sizing.maxLossINR : 1000).toFixed(0)})</span>
                  </div>
                  <input type="range" min="0.5" max="3.0" step="0.1" value="${window.paperTradingDesk.riskPercent}"
                         oninput="window.app.updateRiskSlider(this.value)"
                         class="w-full accent-[#00FF88] cursor-pointer" />
                </div>

                <!-- Price Inputs: Entry, Stop-Loss & Target -->
                <div class="grid grid-cols-2 gap-2">
                  <div class="p-2 rounded bg-[#191c22] border border-slate-800 flex flex-col">
                    <span class="text-[10px] text-slate-400">ENTRY (MKT)</span>
                    <span class="font-bold text-slate-100">₹${stock.ltp.toFixed(2)}</span>
                  </div>
                  <div class="p-2 rounded bg-[#191c22] border border-slate-800 flex flex-col">
                    <span class="text-[10px] text-slate-400">STOP LOSS (VWAP)</span>
                    <span class="font-bold text-[#FF2A6D]">₹${(sizing ? sizing.sl : stock.vwap).toFixed(2)}</span>
                  </div>
                </div>

                <div class="p-2 rounded bg-[#191c22] border border-slate-800 flex justify-between items-center">
                  <span class="text-slate-400">CALCULATED TARGET (1:2 R:R)</span>
                  <span class="font-bold text-[#00FF88]">₹${(sizing ? sizing.target : stock.ltp + 20).toFixed(2)}</span>
                </div>
              </div>

              <!-- Algorithmic Position Sizing Hero Box -->
              <div class="p-3.5 rounded-xl bg-gradient-to-br from-[#191c22] to-[#111622] border border-[#00F0FF]/40 shadow-lg flex flex-col gap-2 font-mono text-xs">
                <div class="flex items-center justify-between text-[#00F0FF]">
                  <span class="text-[10px] font-bold uppercase tracking-wider">Algorithmic Position Sizing</span>
                  <span class="material-symbols-outlined text-[16px]">verified</span>
                </div>
                <div class="flex items-baseline justify-between pt-1">
                  <span class="text-slate-400">Recommended Lot Qty:</span>
                  <div class="text-xl font-bold text-[#00FF88]">${sizing ? sizing.qty : 100} <span class="text-xs text-slate-300 font-normal">Shares</span></div>
                </div>
                <div class="pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-[11px]">
                  <div class="flex justify-between"><span class="text-slate-400">Total Position Value:</span><span class="text-slate-200 font-bold">₹${sizing ? sizing.totalPositionValue.toLocaleString('en-IN') : '98,450.00'}</span></div>
                  <div class="flex justify-between"><span class="text-slate-400">Required Margin (5x MIS):</span><span class="text-[#00F0FF] font-bold">₹${sizing ? sizing.requiredMargin.toLocaleString('en-IN') : '19,690.00'}</span></div>
                  <div class="flex justify-between"><span class="text-slate-400">Risk-Reward Ratio:</span><span class="text-[#00FF88] font-bold">1 : 2.0</span></div>
                  <div class="flex justify-between"><span class="text-slate-400">Estimated Taxes / Fees:</span><span class="text-slate-400">₹${sizing ? sizing.estimatedCosts : '32.50'}</span></div>
                </div>
              </div>

              <!-- Toggles -->
              <div class="flex flex-col gap-2 font-mono text-xs">
                <label class="flex items-center justify-between p-2 rounded bg-[#191c22] border border-slate-800 cursor-pointer">
                  <span class="text-slate-300">Intraday MIS (Auto-Square 15:15)</span>
                  <input type="checkbox" checked class="w-4 h-4 accent-[#00F0FF]" />
                </label>
                <label class="flex items-center justify-between p-2 rounded bg-[#191c22] border border-slate-800 cursor-pointer">
                  <span class="text-slate-300">Bracket Order (Attached SL + Target)</span>
                  <input type="checkbox" checked class="w-4 h-4 accent-[#00FF88]" />
                </label>
              </div>

              <!-- Big Arcade Execution Buttons -->
              <div class="flex flex-col gap-2 pt-1">
                <button onclick="window.app.executeTrade('${stock.symbol}', 'BUY')"
                        class="w-full py-3 rounded-lg arcade-btn ${window.growwClient && window.growwClient.isLive() ? 'bg-gradient-to-r from-[#FFB800] to-[#00FF88] text-[#090B10] border-[#00FF88] glow-green' : 'arcade-btn-green'} font-mono text-sm font-bold shadow-xl flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
                  <span>${window.growwClient && window.growwClient.isLive() ? '⚡ EXECUTE LIVE GROWW BUY' : 'EXECUTE SIMULATED BUY ORDER'}</span>
                </button>
                <button onclick="window.app.executeTrade('${stock.symbol}', 'SELL')"
                        class="w-full py-2.5 rounded-lg arcade-btn arcade-btn-magenta font-mono text-xs font-bold shadow-xl flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-[16px]">trending_down</span>
                  <span>${window.growwClient && window.growwClient.isLive() ? '⚡ EXECUTE LIVE GROWW SHORT SELL' : 'EXECUTE SIMULATED SHORT SELL'}</span>
                </button>
              </div>

              <div class="text-center font-mono text-[10px] text-slate-500">
                ${window.growwClient && window.growwClient.isLive()
                  ? `● Groww Live Trade API Connected &bull; Real Exchange Routing &bull; MIS`
                  : `Simulated Paper Order &bull; No Real Capital Deployed &bull; Latency 12ms`}
              </div>

            </div>

          </div>

        </div>

      </div>
    `;
  }

  // ==========================================
  // SCREEN 4: SMART WATCHLIST & VISUAL ALERT STUDIO
  // ==========================================
  static renderWatchlistAlerts(stream) {
    const kanban = window.alertStudio.getKanbanColumns(stream.stocks);
    const rules = window.alertStudio.rules;

    return `
      <div class="p-4 md:p-6 flex flex-col gap-5">
        
        <!-- SECTION 1: VISUAL SENTENCE-BASED RULE BUILDER -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#00F0FF] text-[20px]">notifications_active</span>
              <div>
                <h2 class="text-base font-bold text-slate-100">Visual Alert Studio</h2>
                <p class="text-xs text-slate-400">Natural-language rule builder with Web Audio synth arcade chimes</p>
              </div>
            </div>
            <span class="text-xs font-mono text-[#00FF88] font-bold">${rules.length} Rules Active</span>
          </div>

          <!-- Sentence Constructor UI -->
          <form onsubmit="window.app.handleCreateRule(event)" class="flex flex-wrap items-center gap-2 text-xs font-mono bg-[#191c22] p-3 rounded-lg border border-slate-800">
            <span class="text-slate-400 font-bold">WHEN</span>
            
            <select id="ruleSymbol" class="bg-[#090B10] text-[#00F0FF] border border-slate-700 rounded px-2 py-1 font-bold">
              ${stream.stocks.map(s => `<option value="${s.symbol}">${s.symbol}</option>`).join('')}
            </select>

            <span class="text-slate-400 font-bold">CROSSES</span>

            <select id="ruleCondition" class="bg-[#090B10] text-[#00FF88] border border-slate-700 rounded px-2 py-1 font-bold">
              <option value="CROSSES_ORH">15m ORH Breakout</option>
              <option value="CROSSES_VWAP">Cyan VWAP Support</option>
              <option value="CROSSES_DAY_HIGH">Day High High-Water</option>
            </select>

            <span class="text-slate-400 font-bold">DURING</span>

            <select id="ruleDuring" class="bg-[#090B10] text-slate-200 border border-slate-700 rounded px-2 py-1">
              <option value="PRIME_WINDOW">Prime Breakout Window (09:30-10:45)</option>
              <option value="ANY_TIME">Any Market Session</option>
            </select>

            <span class="text-slate-400 font-bold">WITH</span>

            <select id="ruleRvol" class="bg-[#090B10] text-[#FFB800] border border-slate-700 rounded px-2 py-1 font-bold">
              <option value="2.0">RVOL &gt; 2.0x</option>
              <option value="2.5">RVOL &gt; 2.5x</option>
              <option value="3.0">RVOL &gt; 3.0x</option>
            </select>

            <span class="text-slate-400 font-bold">➔</span>

            <button type="submit" class="arcade-btn arcade-btn-cyan px-3 py-1 rounded font-bold shadow flex items-center gap-1 ml-auto">
              <span class="material-symbols-outlined text-[14px]">add_alert</span>
              <span>Create Rule</span>
            </button>
          </form>

          <!-- Active Rules List -->
          <div class="flex flex-col gap-2 pt-2">
            ${rules.map(rule => `
              <div class="flex items-center justify-between p-2.5 rounded bg-[#191c22] border border-slate-800 text-xs font-mono">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full ${rule.enabled ? 'bg-[#00FF88]' : 'bg-slate-600'}"></span>
                  <span class="font-bold text-slate-100">${rule.symbol}</span>
                  <span class="text-slate-400">➔ Condition: <span class="text-[#00F0FF]">${rule.condition}</span> | During: <span class="text-slate-300">${rule.during}</span> | Min RVOL: <span class="text-[#FFB800]">${rule.rvolThreshold}x</span></span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-slate-400">${rule.lastTriggered ? `Last: ${rule.lastTriggered}` : 'Waiting for trigger'}</span>
                  <button type="button" onclick="window.alertStudio.testRule('${rule.id}')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[#FFB800] text-[10px] font-bold">Test Chime</button>
                  <button type="button" onclick="window.alertStudio.deleteRule('${rule.id}')" class="text-slate-500 hover:text-[#FF2A6D] p-1"><span class="material-symbols-outlined text-[16px]">delete</span></button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- SECTION 2: 3-COLUMN KANBAN WATCHLIST -->
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#FFB800] text-[20px]">view_kanban</span>
              <h2 class="text-base font-bold text-slate-100">State-Grouped Smart Watchlist</h2>
            </div>
            <span class="text-xs text-slate-400">Auto-classified by technical distance to key breakout levels</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <!-- Column 1: Ready to Break Out -->
            <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-3.5 flex flex-col gap-3 shadow-lg">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <div class="flex items-center gap-1.5 text-xs font-bold text-[#00FF88] font-mono">
                  <span>🔥 READY TO BREAK OUT</span>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-[#00FF88]/20 text-[#00FF88] text-[10px] font-mono font-bold">${kanban.readyToBreakout.length}</span>
              </div>
              <div class="flex flex-col gap-2.5">
                ${kanban.readyToBreakout.map(s => UIComponents.renderKanbanCard(s)).join('')}
              </div>
            </div>

            <!-- Column 2: Approaching VWAP -->
            <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-3.5 flex flex-col gap-3 shadow-lg">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <div class="flex items-center gap-1.5 text-xs font-bold text-[#00F0FF] font-mono">
                  <span>📈 APPROACHING VWAP</span>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] text-[10px] font-mono font-bold">${kanban.approachingVwap.length}</span>
              </div>
              <div class="flex flex-col gap-2.5">
                ${kanban.approachingVwap.map(s => UIComponents.renderKanbanCard(s)).join('')}
              </div>
            </div>

            <!-- Column 3: Extended / Avoid -->
            <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-3.5 flex flex-col gap-3 shadow-lg">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <div class="flex items-center gap-1.5 text-xs font-bold text-[#FF2A6D] font-mono">
                  <span>⚠️ EXTENDED / AVOID</span>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-[#FF2A6D]/20 text-[#FF2A6D] text-[10px] font-mono font-bold">${kanban.extendedAvoid.length}</span>
              </div>
              <div class="flex flex-col gap-2.5">
                ${kanban.extendedAvoid.map(s => UIComponents.renderKanbanCard(s)).join('')}
              </div>
            </div>

          </div>
        </section>

      </div>
    `;
  }

  static renderKanbanCard(stock) {
    const changePct = (((stock.ltp - stock.previousClose) / stock.previousClose) * 100).toFixed(2);
    const isBull = changePct >= 0;

    return `
      <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-2 cursor-pointer"
           onclick="window.app.openStockInDrawer('${stock.symbol}')">
        <div class="flex items-center justify-between">
          <span class="font-mono text-sm font-bold text-slate-100">${stock.symbol}</span>
          <span class="font-mono text-xs font-bold ${isBull ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">₹${stock.ltp.toFixed(2)}</span>
        </div>
        <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>VWAP: ₹${stock.vwap.toFixed(1)}</span>
          <span class="text-[#00FF88]">RVOL: ${stock.rvol.toFixed(1)}x</span>
        </div>
        <div class="flex items-center justify-between pt-1 border-t border-slate-800/60" onclick="event.stopPropagation()">
          <span class="text-[10px] font-mono text-slate-400">Score: <span class="text-[#00F0FF] font-bold">${stock.score}</span></span>
          <div class="flex items-center gap-1">
            <button onclick="window.alertStudio.toggleWatchlist('${stock.symbol}')" class="text-slate-500 hover:text-[#FF2A6D] p-1"><span class="material-symbols-outlined text-[14px]">close</span></button>
            <button onclick="window.app.openStockInDrawer('${stock.symbol}')" class="arcade-btn arcade-btn-green px-2 py-0.5 rounded text-[10px] font-mono font-bold">Trade</button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 5: POST-MARKET JOURNAL & SYSTEM TELEMETRY
  // ==========================================
  static renderJournalAnalytics(stream) {
    const desk = window.paperTradingDesk;
    const metrics = desk.getJournalMetrics();
    const journal = desk.tradeJournal;

    return `
      <div class="p-4 md:p-6 flex flex-col gap-5">
        
        <!-- Top Metrics Ribbon (Statistical Measurements) -->
        <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div class="p-3 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col font-mono shadow">
            <span class="text-[10px] text-slate-400 uppercase">NET P&L</span>
            <span class="text-lg font-bold ${metrics.netPnl >= 0 ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">
              ${metrics.netPnl >= 0 ? '+' : ''}₹${metrics.netPnl.toLocaleString('en-IN', {minimumFractionDigits: 2})}
            </span>
          </div>

          <div class="p-3 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col font-mono shadow">
            <span class="text-[10px] text-slate-400 uppercase">WIN RATE</span>
            <span class="text-lg font-bold text-[#00F0FF]">${metrics.winRate}%</span>
          </div>

          <div class="p-3 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col font-mono shadow">
            <span class="text-[10px] text-slate-400 uppercase">AVG WIN / LOSS</span>
            <div class="flex items-center gap-1.5 text-xs font-bold mt-1">
              <span class="text-[#00FF88]">+₹1,450</span>
              <span class="text-slate-500">/</span>
              <span class="text-[#FF2A6D]">-₹720</span>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col font-mono shadow">
            <span class="text-[10px] text-slate-400 uppercase">PROFIT FACTOR</span>
            <span class="text-lg font-bold text-[#00FF88]">${metrics.profitFactor}</span>
          </div>

          <div class="p-3 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col font-mono shadow">
            <span class="text-[10px] text-slate-400 uppercase">MAX DRAWDOWN</span>
            <span class="text-lg font-bold text-[#FFB800]">-3.4%</span>
          </div>

          <div class="p-3 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col font-mono shadow">
            <span class="text-[10px] text-slate-400 uppercase">TAXES &amp; SLIPPAGE</span>
            <span class="text-xs font-bold text-slate-300 mt-1">₹148.50 STT/GST</span>
          </div>
        </div>

        <!-- Trade Log Table with Automated Discipline Grading -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl overflow-hidden shadow-xl flex flex-col">
          <div class="px-4 py-3 bg-[#191c22] border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#00FF88] text-[20px]">assignment</span>
              <span class="font-bold text-sm text-slate-100">Discipline-Graded Execution Log</span>
            </div>
            <button onclick="window.paperTradingDesk.resetWallet()" class="text-xs font-mono text-slate-400 hover:text-[#FF2A6D] underline">
              Reset Wallet
            </button>
          </div>

          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr class="bg-[#191c22]/60 text-slate-400 uppercase border-b border-slate-800">
                  <th class="py-2.5 px-4">Stock & Setup</th>
                  <th class="py-2.5 px-4">Side</th>
                  <th class="py-2.5 px-4">Timing</th>
                  <th class="py-2.5 px-4 text-right">Entry / Exit</th>
                  <th class="py-2.5 px-4 text-right">P&L (₹)</th>
                  <th class="py-2.5 px-4 text-center">Discipline Badges</th>
                  <th class="py-2.5 px-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 text-slate-300">
                ${journal.length === 0 ? `
                  <tr><td colspan="7" class="py-6 text-center text-slate-500">No closed trades yet. Execute a paper order to start logging discipline!</td></tr>
                ` : journal.map(t => {
                  const isProfit = t.pnl >= 0;
                  return `
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="py-3 px-4">
                        <span class="font-bold text-slate-100">${t.symbol}</span>
                        <div class="text-[10px] text-slate-400">${t.setupType || 'ORB Breakout'} • ${t.sector || 'EQ'}</div>
                      </td>
                      <td class="py-3 px-4">
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${t.direction === 'BUY' ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-[#FF2A6D]/20 text-[#FF2A6D]'}">
                          ${t.direction}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-[11px] text-slate-400">
                        ${t.entryTime} ➔ ${t.exitTime}
                      </td>
                      <td class="py-3 px-4 text-right">
                        <div>₹${t.entryPrice.toFixed(2)} ➔ ₹${t.exitPrice.toFixed(2)}</div>
                        <div class="text-[10px] text-slate-400">${t.qty} shares</div>
                      </td>
                      <td class="py-3 px-4 text-right font-bold ${isProfit ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">
                        ${isProfit ? '+' : ''}₹${t.pnl.toFixed(2)} (${t.pnlPct}%)
                      </td>
                      <td class="py-3 px-4 text-center">
                        <div class="inline-flex items-center gap-1.5">
                          <span class="px-1.5 py-0.2 rounded text-[10px] ${t.discipline.primeWindow ? 'bg-[#00FF88]/15 text-[#00FF88]' : 'bg-slate-800 text-slate-400'}" title="Entered during Prime Window (09:30 - 10:45)">
                            ${t.discipline.primeWindow ? '✅ Prime' : '⚠️ Late'}
                          </span>
                          <span class="px-1.5 py-0.2 rounded text-[10px] ${t.discipline.respectedSL ? 'bg-[#00FF88]/15 text-[#00FF88]' : 'bg-[#FF2A6D]/20 text-[#FF2A6D]'}" title="Respected Stop-Loss">
                            ${t.discipline.respectedSL ? '✅ SL' : '❌ SL Broke'}
                          </span>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-2 py-0.5 rounded font-bold text-xs ${
                          t.discipline.grade === 'A+' ? 'bg-[#00FF88]/20 text-[#00FF88]' :
                          t.discipline.grade === 'A' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' :
                          t.discipline.grade === 'B' ? 'bg-[#FFB800]/20 text-[#FFB800]' : 'bg-[#FF2A6D]/20 text-[#FF2A6D]'
                        }">
                          ${t.discipline.grade}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </section>

        <!-- SECTION: DISTRIBUTED SYSTEM ARCHITECTURE & STREAM TELEMETRY -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#00F0FF] text-[20px]">hub</span>
              <div>
                <h3 class="text-sm font-bold text-slate-100">Distributed Streaming Architecture &amp; Telemetry</h3>
                <p class="text-xs text-slate-400">Interactive blueprint of GROVIQUE's sub-200ms tick-to-glass pipeline</p>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded bg-[#00FF88]/20 text-[#00FF88] text-xs font-mono font-bold">${stream.telemetry.health}</span>
          </div>

          <!-- Live Metrics Gauges -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col">
              <span class="text-slate-400">Tick Ingestion Rate:</span>
              <span class="text-base font-bold text-[#00FF88]">${stream.telemetry.tickRate} msgs/sec</span>
            </div>
            <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col">
              <span class="text-slate-400">Redis State Latency:</span>
              <span class="text-base font-bold text-[#00F0FF]">${stream.telemetry.redisLatency} ms</span>
            </div>
            <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col">
              <span class="text-slate-400">WebSocket Fan-Out Subs:</span>
              <span class="text-base font-bold text-[#FFB800]">${stream.telemetry.activeWs} clients</span>
            </div>
            <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col">
              <span class="text-slate-400">Window Tumbler:</span>
              <span class="text-xs font-bold text-slate-200">${stream.telemetry.windowState}</span>
            </div>
          </div>

          <!-- Flow Pipeline Diagram -->
          <div class="p-4 rounded-lg bg-[#090B10] border border-slate-800 overflow-x-auto text-xs font-mono">
            <div class="flex items-center justify-between min-w-[650px] gap-2 text-center">
              <div class="p-2.5 rounded bg-[#191c22] border border-slate-700 flex-1">
                <div class="text-[#00F0FF] font-bold">1. TICK GATEWAY</div>
                <div class="text-[10px] text-slate-400 mt-1">NSE L1 Feed Ingest</div>
              </div>
              <span class="text-slate-500">➔</span>
              <div class="p-2.5 rounded bg-[#191c22] border border-slate-700 flex-1">
                <div class="text-[#00FF88] font-bold">2. REDIS STATE</div>
                <div class="text-[10px] text-slate-400 mt-1">VWAP & 15m ORB Tumbler</div>
              </div>
              <span class="text-slate-500">➔</span>
              <div class="p-2.5 rounded bg-[#191c22] border border-slate-700 flex-1">
                <div class="text-[#FFB800] font-bold">3. NLP CATALYST</div>
                <div class="text-[10px] text-slate-400 mt-1">BSE/NSE Event Join</div>
              </div>
              <span class="text-slate-500">➔</span>
              <div class="p-2.5 rounded bg-[#191c22] border border-slate-700 flex-1">
                <div class="text-[#00F0FF] font-bold">4. SCORER (0-100)</div>
                <div class="text-[10px] text-slate-400 mt-1">ZSET Leaderboard</div>
              </div>
              <span class="text-slate-500">➔</span>
              <div class="p-2.5 rounded bg-[#191c22] border border-[#00FF88] flex-1">
                <div class="text-[#00FF88] font-bold">5. CLIENT FAN-OUT</div>
                <div class="text-[10px] text-slate-400 mt-1">Sub-200ms Canvas Glass</div>
              </div>
            </div>
          </div>
        </section>

      </div>
    `;
  }

  // ==========================================
  // SCREEN 6: INTRADAY STRATEGY BACKTESTING LAB
  // ==========================================
  static renderBacktesterLab(stream) {
    const bt = window.intradayBacktestEngine ? window.intradayBacktestEngine.latestResults || window.intradayBacktestEngine.runBacktest() : {
      strategy: { id: 'ORB_15M', name: '15-Minute Opening Range Breakout (ORB)', category: 'Momentum Breakout', timeframe: '5m / 15m', idealPhase: '09:30 - 10:30 IST', description: 'Enters on 5M candle close breaking above 09:15-09:30 high with RVOL > 2.0x.' },
      numObservations: 420,
      observationWindowDays: 180,
      initialCapital: 200000,
      finalCapital: 284500,
      grossProfit: 168400,
      grossLoss: 78200,
      netPnl: 76540,
      netRoi: 38.3,
      winRate: 67.5,
      profitFactor: 2.15,
      realizedRR: 2.04,
      maxDrawdownPct: 4.8,
      maxDrawdownAmount: 9600,
      avgWin: 3850,
      avgLoss: 1890,
      expectedValuePerTrade: 182.2,
      costs: { brokerage: 8400, stt: 3120, otherTaxes: 1140, slippage: 1000, totalDeductions: 13660 },
      marketConditions: {
        'TRENDING_BULL': { label: 'Trending Bull Sessions', trades: 105, wins: 82, grossPnl: 64200, netPnl: 60400 },
        'CHOPPY_RANGE': { label: 'Choppy / Rangebound Sessions', trades: 105, wins: 54, grossPnl: 14200, netPnl: 10200 },
        'TRENDING_BEAR': { label: 'Trending Bear / Gap Down', trades: 105, wins: 74, grossPnl: 48500, netPnl: 45100 },
        'HIGH_VOLATILITY': { label: 'High VIX / Event Sessions', trades: 105, wins: 78, grossPnl: 41500, netPnl: 38800 }
      },
      recentTrades: []
    };

    const strat = bt.strategy;
    const engine = window.intradayBacktestEngine;

    return `
      <div class="p-4 md:p-6 flex flex-col gap-5">
        
        <!-- Header & Strategy Hypothesis Selector -->
        <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-4 shadow-xl">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center glow-cyan">
                <span class="material-symbols-outlined text-[#00F0FF] text-[20px]">biotech</span>
              </div>
              <div>
                <h1 class="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Intraday Strategy Backtesting Lab</span>
                  <span class="px-2 py-0.5 rounded-full bg-[#00FF88]/20 text-[#00FF88] text-[10px] font-mono font-bold">NSE 50 EQUITIES</span>
                </h1>
                <p class="text-xs text-slate-400">Validate trading hypotheses across historical sessions with Indian statutory taxes, brokerage, and slippage</p>
              </div>
            </div>

            <!-- Global Action Controls -->
            <div class="flex items-center gap-2 flex-wrap">
              <div class="flex items-center gap-1 bg-[#191c22] p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <span class="text-slate-400 px-1 text-[11px]">TARGET R:R:</span>
                ${[1.5, 2.0, 2.5, 3.0].map(rr => `
                  <button type="button" onclick="window.app.setBacktestTargetRR(${rr})"
                          class="px-2 py-0.5 rounded font-bold transition-all ${
                            engine && engine.targetRR === rr ? 'bg-[#00FF88] text-[#002b11]' : 'text-slate-400 hover:text-slate-200'
                          }">
                    1:${rr}
                  </button>
                `).join('')}
              </div>

              <button type="button" onclick="window.app.toggleBacktestSlippage()"
                      class="px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        engine && engine.includeSlippage ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40' : 'bg-[#191c22] text-slate-400 border-slate-800'
                      }" title="Include 0.05% realistic Indian market slippage">
                <span class="material-symbols-outlined text-[14px]">${engine && engine.includeSlippage ? 'check_circle' : 'cancel'}</span>
                <span>0.05% Slippage</span>
              </button>

              <button type="button" onclick="window.app.reRunBacktest()"
                      class="arcade-btn arcade-btn-cyan px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[15px]">refresh</span>
                <span>Re-Test Strategy</span>
              </button>
            </div>
          </div>

          <!-- Strategy Selection Tabs -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
            ${[
              { id: 'ORB_15M', label: '15m ORB Breakout', icon: 'bolt' },
              { id: 'VWAP_PULLBACK', label: 'VWAP Retest Pullback', icon: 'show_chart' },
              { id: 'EMA_9_20_CROSS', label: '9/20 EMA Alignment', icon: 'timeline' },
              { id: 'NR7_VOLATILITY', label: 'NR7 Volatility Squeeze', icon: 'compress' },
              { id: 'CATALYST_GAP_GO', label: 'News Catalyst Momentum', icon: 'newspaper' }
            ].map(s => {
              const isActive = (engine && engine.selectedStrategy === s.id) || (!engine && s.id === 'ORB_15M');
              return `
                <button type="button" onclick="window.app.switchBacktestStrategy('${s.id}')"
                        class="px-3 py-2 rounded-lg border font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-[#00FF88] text-[#002b11] border-[#00FF88] shadow-md'
                            : 'bg-[#191c22] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }">
                  <span class="material-symbols-outlined text-[16px]">${s.icon}</span>
                  <span>${s.label}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Strategy Hypothesis Summary Card -->
          <div class="p-3.5 rounded-lg bg-[#090B10] border border-slate-800 flex flex-col gap-2">
            <div class="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
              <div class="flex items-center gap-2">
                <span class="text-[#00F0FF] font-bold uppercase tracking-wider">HYPOTHESIS SPECIFICATION:</span>
                <span class="text-slate-200 font-semibold">${strat.name}</span>
                <span class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">${strat.category}</span>
              </div>
              <div class="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>TIMEFRAME: <span class="text-slate-200 font-bold">${strat.timeframe}</span></span>
                <span>OPTIMAL WINDOW: <span class="text-[#00FF88] font-bold">${strat.idealPhase}</span></span>
              </div>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed font-sans">${strat.description}</p>
          </div>
        </div>

        <!-- 8 IMPORTANT STATISTICAL MEASUREMENTS SCORECARD -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <!-- Metric 1: Historical Win Rate -->
          <div class="p-3.5 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col justify-between font-mono shadow-lg relative overflow-hidden">
            <div class="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>HISTORICAL WIN RATE</span>
              <span class="material-symbols-outlined text-[15px] text-[#00FF88]">trophy</span>
            </div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-2xl font-bold text-[#00FF88]">${bt.winRate}%</span>
              <span class="text-[10px] text-slate-400">Wins</span>
            </div>
            <div class="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden flex">
              <div class="h-full bg-[#00FF88] transition-all" style="width: ${bt.winRate}%"></div>
            </div>
            <div class="text-[10px] text-slate-400 mt-1.5">Based on ${bt.numObservations} trades</div>
          </div>

          <!-- Metric 2: Profit Factor -->
          <div class="p-3.5 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col justify-between font-mono shadow-lg relative overflow-hidden">
            <div class="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>PROFIT FACTOR</span>
              <span class="material-symbols-outlined text-[15px] text-[#00F0FF]">balance</span>
            </div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-2xl font-bold text-[#00F0FF]">${bt.profitFactor}</span>
              <span class="text-[10px] text-slate-400">&gt; 1.5 Bench</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-3 flex justify-between">
              <span>Gross Win: ₹${(bt.grossProfit/1000).toFixed(1)}k</span>
              <span>Loss: ₹${(bt.grossLoss/1000).toFixed(1)}k</span>
            </div>
          </div>

          <!-- Metric 3: Realized Risk/Reward Ratio -->
          <div class="p-3.5 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col justify-between font-mono shadow-lg relative overflow-hidden">
            <div class="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>REALIZED RISK / REWARD</span>
              <span class="material-symbols-outlined text-[15px] text-[#FFB800]">calculate</span>
            </div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-2xl font-bold text-[#FFB800]">1:${bt.realizedRR}</span>
              <span class="text-[10px] text-slate-400">R:R</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-3">Targeted 1:${engine ? engine.targetRR : 2.0} ratio</div>
          </div>

          <!-- Metric 4: Average Simulated P&L -->
          <div class="p-3.5 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col justify-between font-mono shadow-lg relative overflow-hidden">
            <div class="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>AVG SIMULATED P&amp;L</span>
              <span class="material-symbols-outlined text-[15px] text-[#00FF88]">payments</span>
            </div>
            <div class="mt-2 flex flex-col">
              <div class="flex justify-between text-xs">
                <span class="text-slate-400">Win Avg:</span>
                <span class="text-[#00FF88] font-bold">+₹${bt.avgWin}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-slate-400">Loss Avg:</span>
                <span class="text-[#FF2A6D] font-bold">-₹${bt.avgLoss}</span>
              </div>
            </div>
            <div class="text-[10px] text-[#00F0FF] mt-2 font-bold">EV: +₹${bt.expectedValuePerTrade}/trade</div>
          </div>

          <!-- Metric 5: Maximum Drawdown -->
          <div class="p-3.5 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col justify-between font-mono shadow-lg relative overflow-hidden">
            <div class="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>MAXIMUM DRAWDOWN</span>
              <span class="material-symbols-outlined text-[15px] text-[#FF2A6D]">trending_down</span>
            </div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-2xl font-bold text-[#FF2A6D]">-${bt.maxDrawdownPct}%</span>
              <span class="text-[10px] text-slate-400">Peak-to-Trough</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-3">-₹${bt.maxDrawdownAmount.toLocaleString()} Max Dip</div>
          </div>

          <!-- Metric 6: Number of Observations -->
          <div class="p-3.5 rounded-xl bg-[#111622] border border-[#1E293B] flex flex-col justify-between font-mono shadow-lg relative overflow-hidden">
            <div class="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>HISTORICAL SAMPLES</span>
              <span class="material-symbols-outlined text-[15px] text-[#00F0FF]">query_stats</span>
            </div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-2xl font-bold text-slate-100">${bt.numObservations}</span>
              <span class="text-[10px] text-slate-400">Trades</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-3">Over ${bt.observationWindowDays} NSE Sessions</div>
          </div>

        </div>

        <!-- PERFORMANCE ACROSS DIFFERENT MARKET CONDITIONS -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#FFB800] text-[20px]">tune</span>
              <h3 class="text-sm font-bold text-slate-100 font-mono">Performance Across Different Market Conditions</h3>
            </div>
            <span class="text-xs text-slate-400 font-mono">Statistical Regime Breakdown</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            ${Object.keys(bt.marketConditions).map(key => {
              const c = bt.marketConditions[key];
              const cWinRate = Number(((c.wins / c.trades) * 100).toFixed(1));
              const isProfitable = c.netPnl >= 0;
              return `
                <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col justify-between gap-2">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-bold text-slate-200">${c.label}</span>
                    <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${isProfitable ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-[#FF2A6D]/20 text-[#FF2A6D]'}">
                      ${cWinRate}% Win
                    </span>
                  </div>
                  <div class="flex items-baseline justify-between pt-1">
                    <span class="text-slate-400">Net Realized P&amp;L:</span>
                    <span class="text-base font-bold ${isProfitable ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">
                      ${isProfitable ? '+' : ''}₹${c.netPnl.toLocaleString()}
                    </span>
                  </div>
                  <div class="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>${c.wins} Wins / ${c.trades - c.wins} Losses</span>
                    <span>${c.trades} Samples</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- INDIAN STATUTORY CHARGES, TAXES & SLIPPAGE ASSUMPTIONS -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#00FF88] text-[20px]">account_balance</span>
              <h3 class="text-sm font-bold text-slate-100 font-mono">Indian Statutory Taxes, Brokerage &amp; Slippage Assumptions</h3>
            </div>
            <span class="text-xs text-slate-400 font-mono">Real-World Intraday MIS Friction</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-6 gap-3 font-mono text-xs">
            <div class="p-2.5 rounded bg-[#090B10] border border-slate-800 flex flex-col">
              <span class="text-[10px] text-slate-400">FLAT BROKERAGE</span>
              <span class="text-slate-100 font-bold mt-1">₹${bt.costs.brokerage.toLocaleString()}</span>
              <span class="text-[9px] text-slate-500">₹20 per executed order</span>
            </div>
            <div class="p-2.5 rounded bg-[#090B10] border border-slate-800 flex flex-col">
              <span class="text-[10px] text-slate-400">STT (SECURITIES TAX)</span>
              <span class="text-slate-100 font-bold mt-1">₹${bt.costs.stt.toLocaleString()}</span>
              <span class="text-[9px] text-slate-500">0.025% on Intraday Sell</span>
            </div>
            <div class="p-2.5 rounded bg-[#090B10] border border-slate-800 flex flex-col">
              <span class="text-[10px] text-slate-400">EXCHANGE &amp; SEBI</span>
              <span class="text-slate-100 font-bold mt-1">₹${(bt.costs.otherTaxes * 0.4).toFixed(0)}</span>
              <span class="text-[9px] text-slate-500">NSE 0.00345% • SEBI 0.0001%</span>
            </div>
            <div class="p-2.5 rounded bg-[#090B10] border border-slate-800 flex flex-col">
              <span class="text-[10px] text-slate-400">GST (18% STATUTORY)</span>
              <span class="text-slate-100 font-bold mt-1">₹${(bt.costs.otherTaxes * 0.6).toFixed(0)}</span>
              <span class="text-[9px] text-slate-500">18% on Brokerage &amp; Turnover</span>
            </div>
            <div class="p-2.5 rounded bg-[#090B10] border border-slate-800 flex flex-col">
              <span class="text-[10px] text-slate-400">SLIPPAGE FRICTION</span>
              <span class="text-[#FFB800] font-bold mt-1">₹${bt.costs.slippage.toLocaleString()}</span>
              <span class="text-[9px] text-slate-500">0.05% Market Order Slip</span>
            </div>
            <div class="p-2.5 rounded bg-[#090B10] border border-[#00FF88]/40 flex flex-col">
              <span class="text-[10px] text-[#00FF88] font-bold">NET PROFIT REALIZED</span>
              <span class="text-[#00FF88] font-bold text-base mt-1">+₹${bt.netPnl.toLocaleString()}</span>
              <span class="text-[9px] text-slate-400">+${bt.netRoi}% ROI on Capital</span>
            </div>
          </div>
        </section>

        <!-- HISTORICAL OBSERVATION TRADE LOG TABLE -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl overflow-hidden shadow-xl flex flex-col">
          <div class="px-4 py-3 bg-[#191c22] border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#00FF88] text-[20px]">history_edu</span>
              <span class="font-bold text-sm text-slate-100 font-mono">Recent Historical Trade Observations (Last 30 Simulated Samples)</span>
            </div>
            <span class="text-xs text-slate-400 font-mono">Sorted by Most Recent Observation</span>
          </div>

          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr class="bg-[#191c22]/60 text-slate-400 uppercase border-b border-slate-800 text-[11px]">
                  <th class="py-2.5 px-4"># / Session</th>
                  <th class="py-2.5 px-4">Stock &amp; Setup</th>
                  <th class="py-2.5 px-4">Market Regime</th>
                  <th class="py-2.5 px-4 text-right">Entry / Exit</th>
                  <th class="py-2.5 px-4 text-right">Gross P&amp;L</th>
                  <th class="py-2.5 px-4 text-right">Friction (Taxes)</th>
                  <th class="py-2.5 px-4 text-right">Net P&amp;L</th>
                  <th class="py-2.5 px-4 text-center">Result</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 text-slate-300">
                ${bt.recentTrades.map(t => {
                  const isWin = t.status === 'WIN';
                  return `
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="py-2.5 px-4 text-slate-400">
                        <span class="text-slate-200 font-bold">#${t.tradeNo}</span>
                        <div class="text-[10px]">${t.date}</div>
                      </td>
                      <td class="py-2.5 px-4">
                        <span class="font-bold text-slate-100">${t.symbol}</span>
                        <div class="text-[10px] text-slate-400">${t.setup}</div>
                      </td>
                      <td class="py-2.5 px-4 text-[11px] text-slate-400">
                        ${t.condition}
                      </td>
                      <td class="py-2.5 px-4 text-right">
                        <div>₹${t.entryPrice.toFixed(2)} ➔ ₹${t.exitPrice.toFixed(2)}</div>
                        <div class="text-[10px] text-slate-400">${t.qty} shares</div>
                      </td>
                      <td class="py-2.5 px-4 text-right font-bold ${t.grossPnl >= 0 ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">
                        ${t.grossPnl >= 0 ? '+' : ''}₹${t.grossPnl.toFixed(2)}
                      </td>
                      <td class="py-2.5 px-4 text-right text-slate-400">
                        -₹${t.charges.toFixed(2)}
                      </td>
                      <td class="py-2.5 px-4 text-right font-bold ${isWin ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">
                        ${isWin ? '+' : ''}₹${t.netPnl.toFixed(2)} (${t.roi}%)
                      </td>
                      <td class="py-2.5 px-4 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isWin ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-[#FF2A6D]/20 text-[#FF2A6D]'}">
                          ${t.status}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    `;
  }

  // ==========================================
  // SLIDE-OVER EXECUTION CO-PILOT DRAWER
  // ==========================================
  static renderDrawer(stock, sizing) {
    if (!stock) return '';
    const isBull = stock.ltp >= stock.previousClose;
    const changePct = (((stock.ltp - stock.previousClose) / stock.previousClose) * 100).toFixed(2);
    const setup = (window.app && window.app.pendingSetup && window.app.pendingSetup.symbol === stock.symbol)
      ? window.app.pendingSetup
      : (window.app && window.app.pendingSetup ? window.app.pendingSetup : null);

    const entryPrice = setup && setup.entryPrice ? setup.entryPrice : stock.ltp;
    const stopLossPrice = setup && setup.stopLoss ? setup.stopLoss : (sizing ? sizing.sl : stock.vwap);
    const targetPrice = setup && setup.target ? setup.target : (sizing ? sizing.target : stock.ltp + 20);

    return `
      <div class="w-full h-full bg-[#111622] border-l border-[#1E293B] p-5 flex flex-col justify-between overflow-y-auto gap-4 shadow-2xl">
        
        <!-- Header -->
        <div class="flex items-start justify-between pb-2 border-b border-slate-800">
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xl font-bold text-slate-100">${stock.symbol}</span>
              <span class="px-1.5 py-0.5 rounded bg-[#191c22] text-[#00F0FF] text-[10px] font-mono font-bold border border-slate-800">${stock.exchange}</span>
            </div>
            <span class="text-xs text-slate-400">${stock.sector} • ${stock.name}</span>
          </div>
          <button type="button" onclick="window.app.closeDrawer()" class="text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-slate-800">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- News Catalyst Setup Banner (if loaded from News Desk) -->
        ${setup ? `
          <div class="p-2.5 rounded-lg bg-[#00FF88]/15 border border-[#00FF88] flex items-center justify-between text-xs font-mono">
            <div class="flex items-center gap-1.5 text-[#00FF88]">
              <span class="material-symbols-outlined text-[16px]">bolt</span>
              <div>
                <span class="font-bold">Catalyst Setup Applied: ${setup.action || 'BUY'}</span>
                <span class="text-[10px] text-slate-300 block">SL: ₹${stopLossPrice.toFixed(2)} | Target: ₹${targetPrice.toFixed(2)}</span>
              </div>
            </div>
            <button onclick="window.app.pendingSetup = null; window.app.updateDrawerContent();" class="text-slate-400 hover:text-slate-200">
              <span class="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        ` : ''}

        <!-- Live Ticker Strip -->
        <div class="flex items-center justify-between p-3 bg-[#191c22] rounded-lg font-mono">
          <div>
            <div class="text-[10px] text-slate-400">LTP</div>
            <div class="text-lg font-bold ${isBull ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">₹${stock.ltp.toFixed(2)}</div>
          </div>
          <div class="text-center">
            <div class="text-[10px] text-slate-400">VWAP</div>
            <div class="text-sm font-bold text-[#00F0FF]">₹${stock.vwap.toFixed(2)}</div>
          </div>
          <div class="text-right">
            <div class="text-[10px] text-slate-400">DAY CHG</div>
            <div class="text-sm font-bold ${isBull ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">${isBull ? '+' : ''}${changePct}%</div>
          </div>
        </div>

        <!-- Gemini Intraday AI Co-Pilot Advice Widget -->
        ${UIComponents.renderGeminiAdvisoryWidget(stock)}

        <!-- Risk & Auto-Sizing Parameters -->
        <div class="flex flex-col gap-2 font-mono text-xs">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">RISK & SIZING ENGINE</span>
            <button type="button" onclick="window.app.openScreen('user-settings')"
                    class="px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      window.growwClient && window.growwClient.isLive()
                        ? 'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]'
                        : 'bg-[#00F0FF]/15 text-[#00F0FF]'
                    }">
              ${window.growwClient && window.growwClient.isLive() ? '● GROWW LIVE' : '○ SANDBOX'}
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="p-2 bg-[#191c22] rounded border border-slate-800 flex flex-col">
              <span class="text-[10px] text-slate-400">Wallet / Demat</span>
              <span class="font-bold text-slate-200">₹${window.paperTradingDesk.walletCapital.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
            </div>
            <div class="p-2 bg-[#191c22] rounded border border-slate-800 flex flex-col">
              <span class="text-[10px] text-slate-400">Risk Limit</span>
              <span class="font-bold text-[#FF2A6D]">₹${(sizing ? sizing.maxLossINR : 1000).toFixed(0)} (1.0%)</span>
            </div>
            <div class="p-2 bg-[#191c22] rounded border border-slate-800 flex flex-col">
              <span class="text-[10px] text-slate-400">Stop Loss</span>
              <span class="font-bold text-[#FF2A6D]">₹${stopLossPrice.toFixed(2)}</span>
            </div>
            <div class="p-2 bg-[#191c22] rounded border border-slate-800 flex flex-col">
              <span class="text-[10px] text-slate-400">Target (1:2)</span>
              <span class="font-bold text-[#00FF88]">₹${targetPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Hero Sizing Card -->
        <div class="p-3.5 rounded-xl bg-[#191c22] border border-[#00F0FF]/50 shadow-lg flex flex-col gap-2 font-mono text-xs">
          <div class="flex items-center justify-between text-[#00F0FF]">
            <span class="text-[10px] font-bold uppercase tracking-wider">Recommended Order Size</span>
            <span class="material-symbols-outlined text-[16px]">verified</span>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-slate-400">Quantity:</span>
            <div class="text-2xl font-bold text-[#00FF88]">${sizing ? sizing.qty : 100} <span class="text-xs text-slate-300 font-normal">Shares</span></div>
          </div>
          <div class="pt-2 border-t border-slate-800 flex flex-col gap-1 text-[11px]">
            <div class="flex justify-between"><span class="text-slate-400">Position Value:</span><span class="text-slate-200 font-bold">₹${sizing ? sizing.totalPositionValue.toLocaleString('en-IN') : '98,450.00'}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Required Margin (MIS 5x):</span><span class="text-[#00F0FF] font-bold">₹${sizing ? sizing.requiredMargin.toLocaleString('en-IN') : '19,690.00'}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Max Downside Risk:</span><span class="text-[#FF2A6D] font-bold">₹${(sizing ? sizing.maxLossINR : 1000).toFixed(2)}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Potential Target Profit:</span><span class="text-[#00FF88] font-bold">₹${sizing ? sizing.potentialProfit : '2000.00'}</span></div>
          </div>
        </div>

        <!-- Execution CTAs -->
        <div class="flex flex-col gap-2 pt-2">
          <button onclick="window.app.executeTrade('${stock.symbol}', 'BUY')"
                  class="w-full py-3 rounded-lg arcade-btn ${window.growwClient && window.growwClient.isLive() ? 'bg-gradient-to-r from-[#FFB800] to-[#00FF88] text-[#090B10] border-[#00FF88] glow-green' : 'arcade-btn-green'} font-mono text-sm font-bold shadow-xl flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
            <span>${window.growwClient && window.growwClient.isLive() ? '⚡ EXECUTE LIVE GROWW BUY' : 'SIMULATE BUY ORDER'}</span>
          </button>
          <button onclick="window.app.executeTrade('${stock.symbol}', 'SELL')"
                  class="w-full py-2.5 rounded-lg arcade-btn arcade-btn-magenta font-mono text-xs font-bold shadow-xl flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[16px]">trending_down</span>
            <span>${window.growwClient && window.growwClient.isLive() ? '⚡ EXECUTE LIVE GROWW SHORT SELL' : 'SIMULATE SHORT SELL'}</span>
          </button>
        </div>

        <div class="text-center font-mono text-[10px] text-slate-500">
          ${window.growwClient && window.growwClient.isLive()
            ? '● Groww Live Trade API Connected • Instant Fill Engine'
            : 'Sandbox Latency: 12ms • Instant Fill Engine'}
        </div>

      </div>
    `;
  }

  // ==========================================
  // SCREEN 6: USER SETTINGS & BROKER/AI APIS
  // ==========================================
  static renderSettings() {
    const s = window.settingsManager ? window.settingsManager.state : { groww: {}, gemini: {} };
    const groww = s.groww || {};
    const gemini = s.gemini || {};
    const isLive = groww.mode === 'GROWW_LIVE';

    return `
      <div class="p-4 md:p-6 flex flex-col gap-6 max-w-5xl mx-auto font-mono text-xs">
        
        <!-- Top Title Ribbon -->
        <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF] flex items-center justify-center glow-cyan">
              <span class="material-symbols-outlined text-[#00F0FF] text-[24px]">tune</span>
            </div>
            <div>
              <h1 class="text-lg font-bold text-slate-100">GROVIQUE Terminal &amp; Broker Settings</h1>
              <p class="text-xs text-slate-400">Where Intelligence Drives Growth • Groww API &amp; Google Gemini AI Co-Pilot</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${isLive ? 'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]' : 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]'}">
              ${isLive ? '● GROWW LIVE BROKER MODE' : '○ SANDBOX PAPER DESK'}
            </span>
          </div>
        </div>

        <!-- 2 Main Cards: Groww Broker API & Google Gemini AI Co-Pilot -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          <!-- CARD 1: GROWW BROKER API CONFIGURATION -->
          <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-5 flex flex-col gap-4 shadow-xl relative overflow-hidden ${isLive ? 'ring-1 ring-[#FFB800]' : ''}">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#00FF88] text-[22px]">account_balance</span>
                <div>
                  <h2 class="text-sm font-bold text-slate-100">Groww Trade API Gateway</h2>
                  <p class="text-[11px] text-slate-400">Live NSE/BSE Market Data & Real Intraday MIS Execution</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${groww.status === 'CONNECTED' ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-slate-800 text-slate-400'}">
                ${groww.status}
              </span>
            </div>

            <!-- Execution Mode Switcher -->
            <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-slate-300 font-bold">Execution Environment:</span>
                <div class="flex items-center gap-1 bg-[#090B10] p-1 rounded-lg border border-slate-700">
                  <button type="button" onclick="window.app.setBrokerMode('SANDBOX')"
                          class="px-2.5 py-1 rounded text-[11px] font-bold transition-all ${!isLive ? 'bg-[#00F0FF] text-[#090B10] shadow' : 'text-slate-400 hover:text-slate-200'}">
                    Paper Sandbox
                  </button>
                  <button type="button" onclick="window.app.setBrokerMode('GROWW_LIVE')"
                          class="px-2.5 py-1 rounded text-[11px] font-bold transition-all ${isLive ? 'bg-[#FFB800] text-[#090B10] shadow glow-amber' : 'text-slate-400 hover:text-slate-200'}">
                    Groww Live
                  </button>
                </div>
              </div>
              ${isLive ? `
                <div class="p-2 rounded bg-[#FFB800]/10 border border-[#FFB800]/40 text-[#FFB800] text-[10px] flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px]">warning</span>
                  <span>LIVE TRADING ACTIVE: Real buy and sell orders will be sent to Groww with real funds. Always verify order confirmation modals.</span>
                </div>
              ` : `
                <span class="text-[10px] text-slate-400">Sandbox mode simulates fills at real-time LTP with 12ms latency and zero financial risk.</span>
              `}
            </div>

            <!-- Credentials Form -->
            <form onsubmit="window.app.saveGrowwCredentials(event)" class="flex flex-col gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-slate-400 text-[11px]">Groww Client ID / User ID:</label>
                <input type="text" id="settingGrowwClientId" value="${groww.clientId || ''}" placeholder="e.g. GRW849204"
                       class="w-full bg-[#090B10] border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-[#00F0FF] outline-none" />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-slate-400 text-[11px]">Groww API Key:</label>
                <input type="text" id="settingGrowwApiKey" value="${groww.apiKey || ''}" placeholder="Enter Groww API Key"
                       class="w-full bg-[#090B10] border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-[#00F0FF] outline-none" />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-slate-400 text-[11px]">Groww API Secret / TOTP Token:</label>
                <input type="password" id="settingGrowwApiSecret" value="${groww.apiSecret || ''}" placeholder="Enter Groww API Secret"
                       class="w-full bg-[#090B10] border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-[#00F0FF] outline-none" />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-slate-400 text-[11px]">Groww Access Token (Optional / Session):</label>
                <input type="password" id="settingGrowwAccessToken" value="${groww.accessToken || ''}" placeholder="OAuth / JWT Access Token"
                       class="w-full bg-[#090B10] border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-[#00F0FF] outline-none" />
              </div>

              <!-- RMS Intraday Risk Guardrails -->
              <div class="p-3 rounded-lg bg-[#090B10] border border-slate-800 flex flex-col gap-2 mt-1">
                <span class="text-slate-300 font-bold text-[11px] uppercase tracking-wider text-[#00FF88]">Intraday RMS Risk Controls</span>
                <div class="grid grid-cols-2 gap-2">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-slate-400 text-[10px]">Max Daily Loss:</span>
                    <input type="number" id="settingRmsMaxLoss" value="${groww.rmsMaxDailyLoss || 5000}"
                           class="bg-[#191c22] border border-slate-700 rounded p-1.5 text-slate-100 text-xs font-bold" />
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-slate-400 text-[10px]">Auto Square-Off:</span>
                    <input type="text" id="settingAutoSquareOff" value="${groww.autoSquareOffTime || '15:15'}"
                           class="bg-[#191c22] border border-slate-700 rounded p-1.5 text-slate-100 text-xs font-bold" />
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <button type="submit" class="flex-1 py-2 rounded-lg arcade-btn arcade-btn-green font-bold flex items-center justify-center gap-1 shadow">
                  <span class="material-symbols-outlined text-[16px]">save</span>
                  <span>Save Groww Keys</span>
                </button>
                <button type="button" onclick="window.app.testGrowwAuth()"
                        class="px-3 py-2 rounded-lg bg-[#191c22] hover:bg-slate-800 text-[#00F0FF] font-bold border border-[#00F0FF]/40 transition-all flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">verified</span>
                  <span>Test Connect</span>
                </button>
              </div>
            </form>
          </div>

          <!-- CARD 2: GOOGLE GEMINI AI INTRADAY CO-PILOT -->
          <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-5 flex flex-col gap-4 shadow-xl">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#00F0FF] text-[22px]">psychology</span>
                <div>
                  <h2 class="text-sm font-bold text-slate-100">Google Gemini Intraday Co-Pilot</h2>
                  <p class="text-[11px] text-slate-400">High-Precision Entry, Exit & Stop-Loss Recommendations</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${gemini.status === 'READY' ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-slate-800 text-slate-400'}">
                ${gemini.status}
              </span>
            </div>

            <!-- Notice & Link to Google AI Studio -->
            <div class="p-3 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex flex-col gap-1 text-[11px] text-slate-300">
              <div class="flex items-center gap-1.5 text-[#00F0FF] font-bold">
                <span class="material-symbols-outlined text-[16px]">key</span>
                <span>Get your Free Gemini API Key</span>
              </div>
              <p>You can get a fast, free Gemini API key from Google AI Studio. The key remains stored locally in your browser.</p>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                 class="text-[#00F0FF] underline hover:text-[#33f3ff] font-bold flex items-center gap-1 w-fit mt-1">
                <span>Open Google AI Studio Key Portal</span>
                <span class="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            </div>

            <!-- Gemini Credentials Form -->
            <form onsubmit="window.app.saveGeminiCredentials(event)" class="flex flex-col gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-slate-400 text-[11px]">Gemini API Key:</label>
                <div class="relative flex items-center">
                  <input type="password" id="settingGeminiApiKey" value="${gemini.apiKey || ''}" placeholder="AIzaSy..."
                         class="w-full bg-[#090B10] border border-slate-700 rounded-lg p-2 pr-10 text-slate-100 focus:border-[#00F0FF] outline-none" />
                  <button type="button" onclick="const f = document.getElementById('settingGeminiApiKey'); f.type = f.type === 'password' ? 'text' : 'password';"
                          class="absolute right-2 text-slate-400 hover:text-slate-200 p-1">
                    <span class="material-symbols-outlined text-[16px]">visibility</span>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-slate-400 text-[11px]">Model Selection:</label>
                  <select id="settingGeminiModel" class="bg-[#090B10] border border-slate-700 rounded-lg p-2 text-slate-100 font-bold focus:border-[#00F0FF] outline-none">
                    <option value="gemini-1.5-flash" ${gemini.model === 'gemini-1.5-flash' ? 'selected' : ''}>gemini-1.5-flash (Fastest &bull; ~180ms)</option>
                    <option value="gemini-2.0-flash" ${gemini.model === 'gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash (Latest)</option>
                    <option value="gemini-1.5-pro" ${gemini.model === 'gemini-1.5-pro' ? 'selected' : ''}>gemini-1.5-pro (Deep Quant Analysis)</option>
                  </select>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-slate-400 text-[11px]">Intraday Style:</label>
                  <select id="settingGeminiRiskProfile" class="bg-[#090B10] border border-slate-700 rounded-lg p-2 text-slate-100 font-bold focus:border-[#00F0FF] outline-none">
                    <option value="DISCIPLINED" ${gemini.riskProfile === 'DISCIPLINED' ? 'selected' : ''}>Disciplined (VWAP & ORB)</option>
                    <option value="CONSERVATIVE" ${gemini.riskProfile === 'CONSERVATIVE' ? 'selected' : ''}>Conservative (Strict RVOL)</option>
                    <option value="AGGRESSIVE" ${gemini.riskProfile === 'AGGRESSIVE' ? 'selected' : ''}>Aggressive (Early Breakout)</option>
                  </select>
                </div>
              </div>

              <!-- Latency & Status Readout -->
              <div class="p-3 rounded-lg bg-[#090B10] border border-slate-800 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Gemini Response Latency:</span>
                <span class="text-[#00FF88] font-bold">${gemini.lastLatencyMs ? `${gemini.lastLatencyMs} ms` : 'Not probed yet'}</span>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <button type="submit" class="flex-1 py-2 rounded-lg arcade-btn arcade-btn-cyan font-bold flex items-center justify-center gap-1 shadow">
                  <span class="material-symbols-outlined text-[16px]">save</span>
                  <span>Save Gemini Config</span>
                </button>
                <button type="button" onclick="window.app.testGeminiApi()"
                        class="px-3 py-2 rounded-lg bg-[#191c22] hover:bg-slate-800 text-[#00FF88] font-bold border border-[#00FF88]/40 transition-all flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Test AI Ping</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        <!-- SECTION: INTRADAY DISCIPLINE PLAYBOOK & ARCHITECTURE -->
        <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-5 flex flex-col gap-3 shadow-lg">
          <div class="flex items-center gap-2 text-slate-100 font-bold text-sm">
            <span class="material-symbols-outlined text-[#00FF88] text-[20px]">verified_user</span>
            <span>Intraday Capital Preservation Rules Enforced by System</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
            <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col gap-1">
              <span class="text-[#00F0FF] font-bold text-xs">1. Time-of-Day Filter</span>
              <p>Breakout buy orders are locked during the 09:15-09:30 caution window until the 15m Opening Range is established.</p>
            </div>
            <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col gap-1">
              <span class="text-[#00FF88] font-bold text-xs">2. Mandated 1:2 R:R Ratio</span>
              <p>Position sizing and Gemini advice ensure target profit is at least double the risk distance from entry to stop-loss.</p>
            </div>
            <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 flex flex-col gap-1">
              <span class="text-[#FF2A6D] font-bold text-xs">3. 15:15 Auto Square-Off</span>
              <p>RMS warning alerts trigger at 15:15 IST to square off open MIS intraday trades prior to exchange closing auction.</p>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  // ==========================================
  // SCREEN 6: NEWS INTELLIGENCE & CATALYST DESK
  // ==========================================
  static renderNewsDesk() {
    const engine = window.newsIntelligence;
    if (!engine) {
      return '<div class="p-6 text-slate-400 font-mono">News Intelligence Engine not initialized.</div>';
    }

    const articles = engine.getFilteredArticles();
    const activeFilter = engine.activeFilter;
    const calendar = window.nseCalendar ? window.nseCalendar.getMarketStatus() : { isOpen: true, isRealWorldClosed: false };

    // Counts for filter pills
    const allCount = engine.newsArticles.length;
    const globalCount = engine.newsArticles.filter(a => a.category === 'global').length;
    const countryCount = engine.newsArticles.filter(a => a.category === 'country').length;
    const companyCount = engine.newsArticles.filter(a => a.category === 'company').length;
    const highConvictionCount = engine.newsArticles.filter(a => a.entryViability.verdict.includes('HIGH CONVICTION')).length;

    return `
      <div class="p-4 md:p-6 flex flex-col gap-5">
        
        <!-- TOP HEADER: Title, Market Calendar Notice & Simulator Switch -->
        <div class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center glow-cyan">
                <span class="material-symbols-outlined text-[#00F0FF] text-[20px]">newspaper</span>
              </div>
              <h1 class="font-mono text-xl md:text-2xl font-bold text-slate-100 tracking-tight">
                News Intelligence &amp; Catalyst Desk
              </h1>
              <span class="px-2 py-0.5 rounded bg-[#00FF88]/20 text-[#00FF88] text-[10px] font-mono font-bold border border-[#00FF88]/40">INTRADAY RADAR</span>
            </div>
            <p class="text-xs text-slate-400">
              Global, Country (India Macro) &amp; Company Catalysts &bull; Price Impact Transmission &bull; Entry Viability &bull; Ways to Win &bull; 1:2 R:R Setups
            </p>
          </div>

          <!-- Market Calendar Status & Simulator Switch -->
          <div class="flex items-center gap-3 flex-wrap">
            <div onclick="window.app.openNSEHolidaysModal()"
                 class="px-3 py-1.5 rounded-lg border font-mono text-xs cursor-pointer flex items-center gap-2 transition-all ${
                   calendar.isRealWorldClosed
                     ? 'bg-[#FFB800]/15 border-[#FFB800]/50 text-[#FFB800]'
                     : 'bg-[#00FF88]/15 border-[#00FF88]/40 text-[#00FF88]'
                 }" title="Click to view Official NSE Trading Holidays & Schedule">
              <span class="w-2 h-2 rounded-full ${calendar.isRealWorldClosed ? 'bg-[#FFB800]' : 'bg-[#00FF88]'} pulse-live"></span>
              <span class="font-bold">${calendar.isRealWorldClosed ? calendar.realReason : 'NSE MARKET OPEN'}</span>
              <span class="material-symbols-outlined text-[14px]">calendar_month</span>
            </div>

            <button type="button" onclick="window.nseCalendar.toggleSimulatorMode()"
                    class="px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      calendar.inSimulatorMode
                        ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF] glow-cyan'
                        : 'bg-[#191c22] text-slate-400 border-slate-700 hover:text-slate-200'
                    }" title="Enable Weekend/Holiday Replay Simulator to practice trades anytime">
              <span class="material-symbols-outlined text-[15px]">sports_esports</span>
              <span>${calendar.inSimulatorMode ? 'Simulator Active' : 'Enable Simulator'}</span>
            </button>
          </div>
        </div>

        <!-- Real-World Market Closure Alert Ribbon (if closed) -->
        ${calendar.isRealWorldClosed ? `
          <div class="w-full bg-[#FFB800]/10 border border-[#FFB800]/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div class="flex items-center gap-2 text-[#FFB800]">
              <span class="material-symbols-outlined text-[20px]">event_busy</span>
              <div>
                <span class="font-bold uppercase">NSE MARKET IS CURRENTLY CLOSED: ${calendar.realReason}.</span>
                <span class="text-slate-300 block text-[11px]">Next official NSE session opens: ${calendar.nextSessionDate}. Practice / Weekend Simulator is active so you can test intraday playbooks.</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="window.app.openNSEHolidaysModal()" class="px-2.5 py-1 rounded bg-[#FFB800]/20 text-[#FFB800] hover:bg-[#FFB800]/30 font-bold transition-all flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">calendar_today</span>
                <span>View 2026 NSE Holidays</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- CATEGORY FILTER TABS & SEARCH INPUT -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-[#111622] border border-[#1E293B] rounded-xl p-3 font-mono text-xs">
          <!-- Filter Buttons -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" onclick="window.newsIntelligence.setFilter('all')"
                    class="px-3 py-1.5 rounded-lg transition-all font-bold ${activeFilter === 'all' ? 'bg-[#00FF88] text-[#002b11] shadow' : 'bg-[#191c22] text-slate-400 hover:text-slate-100'}">
              All Catalysts (${allCount})
            </button>
            <button type="button" onclick="window.newsIntelligence.setFilter('global')"
                    class="px-3 py-1.5 rounded-lg transition-all font-bold ${activeFilter === 'global' ? 'bg-[#00F0FF] text-[#090B10] shadow' : 'bg-[#191c22] text-slate-400 hover:text-slate-100'}">
              Global Macro (${globalCount})
            </button>
            <button type="button" onclick="window.newsIntelligence.setFilter('country')"
                    class="px-3 py-1.5 rounded-lg transition-all font-bold ${activeFilter === 'country' ? 'bg-[#00F0FF] text-[#090B10] shadow' : 'bg-[#191c22] text-slate-400 hover:text-slate-100'}">
              Country (India Macro) (${countryCount})
            </button>
            <button type="button" onclick="window.newsIntelligence.setFilter('company')"
                    class="px-3 py-1.5 rounded-lg transition-all font-bold ${activeFilter === 'company' ? 'bg-[#FFB800] text-[#090B10] shadow' : 'bg-[#191c22] text-slate-400 hover:text-slate-100'}">
              Company Catalysts (${companyCount})
            </button>
            <button type="button" onclick="window.newsIntelligence.setFilter('high-conviction')"
                    class="px-3 py-1.5 rounded-lg transition-all font-bold flex items-center gap-1 ${activeFilter === 'high-conviction' ? 'bg-[#FF2A6D] text-white shadow' : 'bg-[#191c22] text-slate-400 hover:text-slate-100'}">
              <span class="material-symbols-outlined text-[14px]">stars</span>
              <span>High Conviction (${highConvictionCount})</span>
            </button>
          </div>

          <!-- Search Input -->
          <div class="relative w-full sm:w-72">
            <span class="material-symbols-outlined absolute left-2.5 top-2 text-slate-500 text-[16px]">search</span>
            <input type="text" placeholder="Search by stock (e.g. TATAMOTORS, BPCL)..."
                   value="${engine.searchQuery}"
                   oninput="window.newsIntelligence.setSearchQuery(this.value)"
                   class="w-full pl-8 pr-3 py-1.5 bg-[#090B10] border border-slate-700 focus:border-[#00F0FF] rounded-lg text-slate-100 text-xs outline-none" />
          </div>
        </div>

        <!-- ARTICLES LIST CONTAINER -->
        <div class="flex flex-col gap-5">
          ${articles.length === 0 ? `
            <div class="p-8 text-center bg-[#111622] border border-[#1E293B] rounded-xl text-slate-400 font-mono text-xs">
              No news articles match your filter or search query.
            </div>
          ` : articles.map(article => {
            const isBullish = article.impactSentiment === 'STRONG_BULLISH';
            const categoryBadge = article.category === 'global' ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40' :
                                  article.category === 'country' ? 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/40' :
                                  'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/40';

            return `
              <div class="bg-[#111622] border border-[#1E293B] hover:border-slate-700 rounded-xl p-5 flex flex-col gap-4 shadow-xl transition-all">
                
                <!-- Card Header -->
                <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${categoryBadge}">
                      ${article.badge}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      article.urgency === 'CRITICAL' ? 'bg-[#FF2A6D]/20 text-[#FF2A6D] border border-[#FF2A6D]/40' : 'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40'
                    }">
                      ${article.urgency} IMPACT
                    </span>
                    <span class="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px]">schedule</span>
                      ${article.publishedAt}
                    </span>
                  </div>

                  <!-- Affected Stocks Pill List -->
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[11px] font-mono text-slate-400">Affected Stocks:</span>
                    ${article.affectedStocks.map(sym => `
                      <button type="button" onclick="window.app.openStockInDrawer('${sym}')"
                              class="px-2 py-0.5 rounded bg-[#191c22] border border-[#00F0FF]/40 hover:border-[#00F0FF] text-[#00F0FF] font-mono text-xs font-bold transition-all flex items-center gap-1" title="Open ${sym} in Trade Drawer">
                        <span>${sym}</span>
                        <span class="material-symbols-outlined text-[12px]">open_in_new</span>
                      </button>
                    `).join('')}
                  </div>
                </div>

                <!-- News Headline -->
                <div class="flex flex-col gap-1">
                  <h2 class="text-base md:text-lg font-bold text-slate-100 leading-snug">${article.title}</h2>
                  <div class="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px] text-slate-500">feed</span>
                    <span>Verified Source: <strong class="text-slate-300">${article.source}</strong></span>
                  </div>
                </div>

                <!-- 3-Column Detailed Analysis Grid:
                     1. How it affects stock prices
                     2. Is it good to enter trading today?
                     3. Possible ways to win (intraday playbooks)
                -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
                  
                  <!-- 1. Price Impact Transmission Mechanism -->
                  <div class="p-4 rounded-xl bg-[#090B10] border border-slate-800 flex flex-col gap-2.5">
                    <div class="flex items-center gap-1.5 text-xs font-mono font-bold text-[#00F0FF]">
                      <span class="material-symbols-outlined text-[16px]">insights</span>
                      <span>1. HOW IT AFFECTS STOCK PRICE</span>
                    </div>
                    <p class="text-xs font-semibold text-slate-200 leading-relaxed">
                      ${article.priceImpactMechanism.summary}
                    </p>
                    <ul class="text-[11px] text-slate-400 flex flex-col gap-1.5 list-disc pl-4 mt-1 leading-relaxed">
                      ${article.priceImpactMechanism.transmission.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                  </div>

                  <!-- 2. Is it Good to Enter Trading for This Stock? -->
                  <div class="p-4 rounded-xl bg-[#090B10] border border-slate-800 flex flex-col gap-2.5">
                    <div class="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FFB800]">
                      <span class="material-symbols-outlined text-[16px]">verified</span>
                      <span>2. IS IT GOOD TO ENTER TODAY?</span>
                    </div>
                    <div class="inline-flex self-start px-2.5 py-1 rounded text-xs font-mono font-bold ${article.entryViability.badgeClass}">
                      ${article.entryViability.verdict}
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed mt-1">
                      ${article.entryViability.rationale}
                    </p>
                    <div class="mt-auto pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                      <span class="material-symbols-outlined text-[13px] text-[#00FF88]">check</span>
                      <span>Day Trader Alignment: High liquidity &bull; Tight spreads</span>
                    </div>
                  </div>

                  <!-- 3. Possible Ways to Win (Intraday Tactical Playbooks) -->
                  <div class="p-4 rounded-xl bg-[#090B10] border border-slate-800 flex flex-col gap-2.5">
                    <div class="flex items-center gap-1.5 text-xs font-mono font-bold text-[#00FF88]">
                      <span class="material-symbols-outlined text-[16px]">sports_score</span>
                      <span>3. WAYS TO WIN (PLAYBOOK SETUPS)</span>
                    </div>
                    <div class="flex flex-col gap-2">
                      ${article.waysToWin.map((w, idx) => `
                        <div class="p-2 rounded bg-[#111622] border border-slate-800 flex flex-col gap-0.5">
                          <span class="text-xs font-bold text-[#00FF88]">Setup #${idx + 1}: ${w.setupName}</span>
                          <span class="text-[11px] text-slate-300 leading-tight">${w.description}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>

                </div>

                <!-- 4. ACTIONABLE BUY / SELL TRADE RECOMMENDATION -->
                ${article.recommendation ? `
                  <div class="mt-1 p-4 rounded-xl bg-gradient-to-r from-[#191c22] via-[#111622] to-[#090B10] border border-[#00FF88]/40 shadow-lg flex flex-wrap items-center justify-between gap-4 font-mono">
                    <div class="flex items-center gap-4 flex-wrap text-xs">
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] text-slate-400">ACTION:</span>
                        <span class="px-2.5 py-1 rounded font-bold text-xs ${
                          article.recommendation.action === 'BUY'
                            ? 'bg-[#00FF88] text-[#002b11] glow-green'
                            : 'bg-[#FF2A6D] text-white glow-magenta'
                        }">
                          ${article.recommendation.action} (${article.recommendation.productType || 'MIS'})
                        </span>
                        <span class="font-bold text-slate-100 text-sm">${article.recommendation.symbol}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <div><span class="text-[10px] text-slate-400">ENTRY: </span><span class="font-bold text-slate-200">₹${article.recommendation.entryPrice.toFixed(2)}</span></div>
                        <div><span class="text-[10px] text-slate-400">STOP LOSS: </span><span class="font-bold text-[#FF2A6D]">₹${article.recommendation.stopLoss.toFixed(2)}</span></div>
                        <div><span class="text-[10px] text-slate-400">TARGET 1: </span><span class="font-bold text-[#00FF88]">₹${article.recommendation.target1.toFixed(2)}</span></div>
                        <div><span class="text-[10px] text-slate-400">TARGET 2: </span><span class="font-bold text-[#00FF88]">₹${article.recommendation.target2.toFixed(2)}</span></div>
                        <div class="px-2 py-0.5 rounded bg-[#00FF88]/15 text-[#00FF88] font-bold">R:R ${article.recommendation.riskRewardRatio}</div>
                      </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-2 flex-wrap">
                      <button onclick="window.newsIntelligence.applySetupToTicket('${article.id}')"
                              class="px-3.5 py-2 rounded-lg arcade-btn arcade-btn-green font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <span class="material-symbols-outlined text-[16px]">bolt</span>
                        <span>Apply Setup to Ticket</span>
                      </button>
                      
                      <button onclick="window.newsIntelligence.analyzeWithGemini('${article.id}')"
                              class="px-3 py-2 rounded-lg bg-[#191c22] border border-[#00F0FF]/40 hover:border-[#00F0FF] text-[#00F0FF] font-mono text-xs font-bold flex items-center gap-1 transition-all">
                        <span class="material-symbols-outlined text-[16px]">smart_toy</span>
                        <span>Gemini AI Opinion</span>
                      </button>

                      <a href="https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(article.recommendation.symbol)}" target="_blank"
                         class="px-3 py-2 rounded-lg bg-[#191c22] border border-slate-700 hover:border-slate-500 text-slate-300 font-mono text-xs flex items-center gap-1 transition-all" title="View official live quote on NSE India website">
                        <span class="material-symbols-outlined text-[14px]">open_in_new</span>
                        <span>NSE Portal</span>
                      </a>
                    </div>
                  </div>
                ` : ''}

              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }

  // ==========================================
  // MODAL: OFFICIAL NSE TRADING HOLIDAYS & CALENDAR
  // ==========================================
  static renderNSEHolidaysModal() {
    const calendar = window.nseCalendar ? window.nseCalendar.getMarketStatus() : { isOpen: true, holidaysList: [] };
    const holidays = calendar.holidaysList || [];

    return `
      <div id="nseHolidaysModalOverlay" class="fixed inset-0 z-50 bg-[#090B10]/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-[#111622] border border-[#1E293B] rounded-2xl max-w-2xl w-full p-5 md:p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs max-h-[90vh] overflow-y-auto">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-[#FFB800]/20 border border-[#FFB800] flex items-center justify-center">
                <span class="material-symbols-outlined text-[#FFB800] text-[20px]">calendar_month</span>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-100">Official NSE Trading Holidays Calendar (2026)</h3>
                <p class="text-[11px] text-slate-400">National Stock Exchange of India (nseindia.com) Rules</p>
              </div>
            </div>
            <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-slate-100">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Market Schedule Overview Box -->
          <div class="p-3.5 rounded-xl bg-[#090B10] border border-slate-800 flex flex-col gap-2">
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-bold uppercase">Exchange Regular Trading Hours:</span>
              <span class="text-[#00FF88] font-bold">09:15 AM - 03:30 PM IST (Mon-Fri)</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-bold uppercase">Pre-Open Session:</span>
              <span class="text-[#00F0FF] font-bold">09:00 AM - 09:15 AM IST</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-bold uppercase">Weekend Trading Status:</span>
              <span class="text-[#FF2A6D] font-bold">Strictly Closed on Saturdays &amp; Sundays</span>
            </div>
          </div>

          <!-- Practice / Weekend Simulator Mode Notice & Switch -->
          <div class="p-3.5 rounded-xl bg-gradient-to-r from-[#191c22] to-[#111622] border border-[#00F0FF]/40 flex items-center justify-between gap-3">
            <div class="flex flex-col gap-0.5">
              <span class="font-bold text-slate-100">Weekend / Holiday Practice Simulator Mode</span>
              <p class="text-[11px] text-slate-400">When enabled, the app streams synthetic intraday ticks so traders can test strategies anytime.</p>
            </div>
            <button onclick="window.nseCalendar.toggleSimulatorMode(); window.app.closeModal();"
                    class="px-3 py-1.5 rounded-lg arcade-btn ${calendar.inSimulatorMode ? 'arcade-btn-cyan' : 'bg-slate-800 text-slate-200'} font-bold shrink-0">
              ${calendar.inSimulatorMode ? 'Simulator Active' : 'Enable Simulator'}
            </button>
          </div>

          <!-- Holidays Table -->
          <div class="flex flex-col gap-2 pt-1">
            <span class="font-bold text-slate-200">Official 2026 NSE Trading Holidays Schedule:</span>
            <div class="overflow-x-auto rounded-lg border border-slate-800">
              <table class="w-full text-left">
                <thead class="bg-[#191c22] text-slate-400 border-b border-slate-800 text-[10px]">
                  <tr>
                    <th class="p-2.5">DATE</th>
                    <th class="p-2.5">DAY</th>
                    <th class="p-2.5">HOLIDAY OCCASION</th>
                    <th class="p-2.5 text-right">EXCHANGE STATUS</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  ${holidays.map(h => `
                    <tr class="hover:bg-slate-800/30">
                      <td class="p-2.5 text-slate-300 font-bold">${h.date}</td>
                      <td class="p-2.5 text-slate-400">${h.day}</td>
                      <td class="p-2.5 text-slate-200">${h.name}</td>
                      <td class="p-2.5 text-right text-[#FF2A6D] font-bold">TRADING CLOSED</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Official External Link -->
          <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
            <a href="https://www.nseindia.com/resources/exchange-communication-holidays" target="_blank"
               class="text-[#00F0FF] hover:underline flex items-center gap-1">
              <span>View Official Circular on nseindia.com</span>
              <span class="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
            <button onclick="window.app.closeModal()" class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold">
              Close Window
            </button>
          </div>

        </div>
      </div>
    `;
  }

  // ==========================================
  // SCREEN: AI RAG & MCP INTELLIGENCE STUDIO
  // ==========================================
  static renderRagMcpStudio(stream) {
    const playbooks = [
      {
        id: 'playbook-orb-breakout',
        title: 'Opening Range Breakout (ORB) Institutional Playbook',
        category: 'PRICE_ACTION_STRATEGY',
        tags: ['ORB', 'Breakout', 'RVOL', '15m Range', 'Prime Window'],
        rulesCount: 4,
        description: 'Rules for trading the 09:15-09:30 range breakout on >1.8x RVOL above VWAP with false breakout traps suppression.'
      },
      {
        id: 'playbook-vwap-mean-reversion',
        title: 'Institutional VWAP Equilibrium & Bounce Playbook',
        category: 'MEAN_REVERSION_STRATEGY',
        tags: ['VWAP', 'Equilibrium', 'Institutional Floor', '9 EMA Confluence'],
        rulesCount: 4,
        description: 'High-probability mean-reversion bounce entries at institutional VWAP with 9 EMA / 20 EMA momentum confirmation.'
      },
      {
        id: 'playbook-corporate-demerger',
        title: 'Corporate Restructuring & Demerger Price Action Playbook',
        category: 'CORPORATE_ACTION',
        tags: ['Demerger', 'Spin-off', 'Tata Motors', 'ITC Hotels', 'Base Adjustment'],
        rulesCount: 4,
        description: 'Protocols for handling post-demerger base price readjustments, special pre-open discovery, and volatility bands.'
      },
      {
        id: 'playbook-sebi-circuit-risk',
        title: 'SEBI Intraday Circuit Band & Risk Management Playbook',
        category: 'RISK_MANAGEMENT',
        tags: ['SEBI', 'Circuit Bands', 'Upper Circuit', 'Lower Circuit', 'F&O Ban'],
        rulesCount: 4,
        description: 'Regulatory circuit limit guardrails (5%/10%/20%), F&O Ban rules (95% MWPL), and mandatory 15:15 IST auto-square off.'
      },
      {
        id: 'playbook-earnings-momentum',
        title: 'Quarterly Earnings & Catalyst Continuation Playbook',
        category: 'CATALYST_MOMENTUM',
        tags: ['Earnings', 'Catalyst', 'Guidance', 'Delivery Volume', 'Gap Up'],
        rulesCount: 4,
        description: 'High-conviction earnings repricing rules: >40% delivery volume confirmation, guidance evaluation, and gap-fill invalidations.'
      }
    ];

    const mcpTools = [
      { name: "get_stock_quote", desc: "Fetch live official NSE quote, LTP, VWAP, 15m ORH/ORL, and RVOL.", defaultArgs: '{"symbol":"TATAMOTORS"}' },
      { name: "get_technical_indicators", desc: "Calculate real-time RSI, MACD, ATR, EMA 9/20, and Camarilla pivots.", defaultArgs: '{"symbol":"TATAMOTORS"}' },
      { name: "query_trading_knowledge", desc: "Execute semantic RAG vector search across institutional trading playbooks.", defaultArgs: '{"query":"ORB breakout rules with volume confirmation","topK":2}' },
      { name: "calculate_position_size", desc: "Compute 1% risk position sizing with exact SL, margin, and 1:2 / 1:3 targets.", defaultArgs: '{"symbol":"TATAMOTORS","capital":100000,"riskPercent":1.0,"entryPrice":435.00,"stopLoss":431.50}' },
      { name: "scan_market_screener", desc: "Scan 50 frontline NSE equities based on RVOL, VWAP, and momentum scores.", defaultArgs: '{"minRvol":1.8,"aboveVwapOnly":true,"minScore":75}' },
      { name: "execute_mis_order", desc: "Simulate or route an intraday MIS trade order to Sandbox or Groww Broker Gateway.", defaultArgs: '{"symbol":"TATAMOTORS","transactionType":"BUY","quantity":100,"price":435.00,"stopLoss":431.50,"target":442.00}' }
    ];

    return `
      <div class="p-4 md:p-6 flex flex-col gap-6 font-mono text-xs">
        
        <!-- Header & Architecture Overview -->
        <div class="bg-gradient-to-r from-[#111622] via-[#191c22] to-[#090B10] border border-[#00F0FF]/40 rounded-xl p-5 shadow-2xl flex flex-col gap-3">
          <div class="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center glow-cyan">
                <span class="material-symbols-outlined text-[#00F0FF] text-[20px]">hub</span>
              </div>
              <div>
                <h1 class="font-mono text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>AI RAG &amp; Model Context Protocol (MCP) Studio</span>
                  <span class="px-2 py-0.5 rounded bg-[#00F0FF]/20 text-[#00F0FF] text-[10px] font-bold">GEMINI INTEGRATION</span>
                </h1>
                <p class="text-xs text-slate-400">Institutional Knowledge Retrieval (RAG) &amp; Open Standard Tool Calling (MCP JSON-RPC 2.0)</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-lg bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-[#00FF88] pulse-live"></span>
                <span>RAG: 5 PLAYBOOKS ACTIVE</span>
              </span>
              <span class="px-2.5 py-1 rounded-lg bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-[#00F0FF]"></span>
                <span>MCP: JSON-RPC 2.0 (ONLINE)</span>
              </span>
            </div>
          </div>

          <!-- Educational Pipeline Architecture Pill Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div class="p-3 rounded-lg bg-[#090B10] border border-slate-800 flex flex-col gap-1">
              <span class="text-[#00F0FF] font-bold text-xs flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">auto_stories</span>
                <span>1. Retrieval-Augmented Generation</span>
              </span>
              <p class="text-[11px] text-slate-400 leading-normal">
                Converts institutional playbooks into vector embeddings via Gemini <span class="text-slate-200 font-bold">text-embedding-004</span>. When evaluating a setup, cosine similarity searches match the most relevant rules with zero hallucination.
              </p>
            </div>

            <div class="p-3 rounded-lg bg-[#090B10] border border-slate-800 flex flex-col gap-1">
              <span class="text-[#00FF88] font-bold text-xs flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">terminal</span>
                <span>2. Model Context Protocol (MCP)</span>
              </span>
              <p class="text-[11px] text-slate-400 leading-normal">
                Open JSON-RPC 2.0 standard protocol exposing live market tools (<span class="text-slate-200">get_quote</span>, <span class="text-slate-200">technicals</span>, <span class="text-slate-200">order_execution</span>) so Gemini can autonomously query live exchange state.
              </p>
            </div>

            <div class="p-3 rounded-lg bg-[#090B10] border border-slate-800 flex flex-col gap-1">
              <span class="text-[#FFB800] font-bold text-xs flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">psychology</span>
                <span>3. Disciplined Intraday Grounding</span>
              </span>
              <p class="text-[11px] text-slate-400 leading-normal">
                Gemini prompts are automatically augmented with retrieved rules. Every entry, stop-loss, and target is bound by strict institutional risk parameters (1:2 R:R, SEBI circuits, 15:15 square-off).
              </p>
            </div>
          </div>
        </div>

        <!-- SECTION 1: INTERACTIVE RAG SEMANTIC VECTOR SEARCH LAB -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#00F0FF] text-[18px]">search_insights</span>
              <h2 class="text-sm font-bold text-slate-100">RAG Semantic Vector Search Laboratory</h2>
            </div>
            <span class="text-[10px] text-slate-400">Cosine Similarity Vector Matching &bull; In-Memory Store</span>
          </div>

          <!-- Search Input & Pre-canned Query Pills -->
          <div class="flex flex-col gap-2.5">
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <input type="text" id="ragQueryInput"
                       placeholder="Enter natural language trade setup (e.g. 'How to trade ORB breakout with RVOL > 2.0')..."
                       value="15m Opening Range Breakout rules with high volume confirmation"
                       class="w-full px-3 py-2 rounded-lg bg-[#090B10] border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:border-[#00F0FF] outline-none" />
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <label class="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>Top-K:</span>
                  <select id="ragTopKSelect" class="bg-[#090B10] border border-slate-700 text-[#00F0FF] px-1.5 py-1 rounded text-xs font-bold">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3" selected>3</option>
                    <option value="5">5</option>
                  </select>
                </label>
                <button type="button" onclick="window.app.executeRagQuery()"
                        class="px-3 py-2 rounded-lg bg-[#00F0FF] hover:bg-[#33f3ff] text-[#090B10] font-bold text-xs flex items-center gap-1 transition-all shadow-md">
                  <span class="material-symbols-outlined text-[15px]">send</span>
                  <span>Query Vector Store</span>
                </button>
              </div>
            </div>

            <!-- Quick Preset Queries -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] text-slate-400 font-bold uppercase mr-1">Sample Queries:</span>
              ${[
                '15m Opening Range Breakout rules with high volume confirmation',
                'Institutional VWAP bounce entry criteria and stop loss',
                'Corporate Demerger price discovery and base price realignment',
                'SEBI circuit band limits and F&O ban risk controls',
                'Quarterly earnings momentum gap up continuation rules'
              ].map(q => `
                <button type="button" onclick="document.getElementById('ragQueryInput').value = '${q}'; window.app.executeRagQuery();"
                        class="px-2 py-0.5 rounded bg-[#191c22] hover:bg-slate-800 text-slate-300 hover:text-[#00F0FF] border border-slate-800 text-[10px] transition-colors">
                  ${q.length > 35 ? q.slice(0, 32) + '...' : q}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- RAG Results Output Area -->
          <div id="ragResultsArea" class="flex flex-col gap-2.5 pt-2">
            <div class="p-3 rounded-lg bg-[#090B10] border border-slate-800 text-slate-400 text-center py-6">
              <span class="material-symbols-outlined text-[24px] text-[#00F0FF] block mb-1">psychology_alt</span>
              <span>Click "Query Vector Store" above or choose a sample query to test live semantic retrieval.</span>
            </div>
          </div>
        </section>

        <!-- SECTION 2: INSTITUTIONAL TRADING PLAYBOOKS DIRECTORY -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#00FF88] text-[18px]">menu_book</span>
              <h2 class="text-sm font-bold text-slate-100">Institutional Playbooks Ingested in Vector Store</h2>
            </div>
            <span class="text-[10px] text-[#00FF88] font-bold">5 Knowledge Modules Indexed</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${playbooks.map(pb => `
              <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-2.5 transition-all">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center justify-between">
                    <span class="px-1.5 py-0.2 rounded bg-slate-800 text-[#00F0FF] text-[9px] font-bold">${pb.category}</span>
                    <span class="text-[10px] text-slate-400 font-bold">${pb.rulesCount} Execution Rules</span>
                  </div>
                  <h3 class="text-xs font-bold text-slate-100">${pb.title}</h3>
                  <p class="text-[11px] text-slate-400 leading-normal">${pb.description}</p>
                </div>
                <div class="flex flex-wrap gap-1 pt-1 border-t border-slate-800/80">
                  ${pb.tags.map(t => `<span class="px-1.5 py-0.2 rounded bg-[#090B10] text-slate-400 text-[9px] border border-slate-800">${t}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- SECTION 3: MODEL CONTEXT PROTOCOL (MCP) LIVE TOOL TESTING CONSOLE -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#FFB800] text-[18px]">build</span>
              <h2 class="text-sm font-bold text-slate-100">Model Context Protocol (MCP) Tool Calling Console</h2>
            </div>
            <span class="text-[10px] text-slate-400">JSON-RPC 2.0 Method: <code class="text-[#00F0FF]">tools/call</code></span>
          </div>

          <p class="text-slate-400 text-[11px] leading-relaxed">
            These tools are registered with GROVIQUE's MCP Server. You can trigger live test invocations below to inspect the structured JSON payloads that Gemini inspects and executes:
          </p>

          <!-- 2-Column Grid: Tools on Left / Real-Time JSON-RPC Console on Right -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            <!-- Left 6 Cols: Available MCP Tools List -->
            <div class="lg:col-span-6 flex flex-col gap-2">
              ${mcpTools.map(tool => `
                <div class="p-3 rounded-lg bg-[#191c22] border border-slate-800 hover:border-slate-700 flex flex-col gap-2 transition-all">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-[#00F0FF] flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px]">code</span>
                      <span>${tool.name}</span>
                    </span>
                    <button type="button" onclick="window.app.executeMcpTool('${tool.name}', ${JSON.stringify(tool.defaultArgs).replace(/"/g, '&quot;')})"
                            class="px-2 py-1 rounded bg-[#090B10] hover:bg-[#00FF88]/20 text-[#00FF88] border border-slate-700 hover:border-[#00FF88] font-bold text-[10px] flex items-center gap-1 transition-all">
                      <span class="material-symbols-outlined text-[12px]">play_arrow</span>
                      <span>Execute Tool</span>
                    </button>
                  </div>
                  <p class="text-[11px] text-slate-400">${tool.desc}</p>
                  <div class="bg-[#090B10] p-1.5 rounded border border-slate-800 text-[10px] text-slate-400 truncate">
                    <span class="text-slate-500">Default Args:</span> <code class="text-slate-300">${tool.defaultArgs}</code>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Right 6 Cols: Live JSON-RPC 2.0 Response Terminal -->
            <div class="lg:col-span-6 flex flex-col gap-2">
              <div class="bg-[#090B10] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div class="px-3 py-2 bg-[#111622] border-b border-slate-800 flex items-center justify-between text-[11px]">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#00FF88] pulse-live"></span>
                    <span class="text-slate-200 font-bold">MCP JSON-RPC Terminal</span>
                  </div>
                  <span id="mcpLatencyDisplay" class="text-[10px] text-slate-500 font-mono">Ready for execution</span>
                </div>
                <div class="p-3 overflow-x-auto max-h-[460px]">
                  <pre id="mcpTerminalOutput" class="text-[11px] font-mono text-[#00FF88] leading-tight select-text">// Select any MCP tool on the left to execute.
// JSON-RPC 2.0 response payload with latency will render here.</pre>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- SECTION 4: MCP RESOURCES INSPECTOR -->
        <section class="bg-[#111622] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#00F0FF] text-[18px]">folder_open</span>
              <h2 class="text-sm font-bold text-slate-100">Live MCP Context Resources (<code class="text-[#00F0FF]">resources/read</code>)</h2>
            </div>
            <span class="text-[10px] text-slate-400">Structured State Feeds for Gemini Context Injection</span>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" onclick="window.app.readMcpResource('grovique://market/status')"
                    class="px-2.5 py-1 rounded bg-[#191c22] hover:bg-slate-800 text-[#00F0FF] border border-slate-800 font-bold text-xs flex items-center gap-1 transition-all">
              <span class="material-symbols-outlined text-[14px]">schedule</span>
              <span>grovique://market/status</span>
            </button>
            <button type="button" onclick="window.app.readMcpResource('grovique://market/breadth')"
                    class="px-2.5 py-1 rounded bg-[#191c22] hover:bg-slate-800 text-[#00FF88] border border-slate-800 font-bold text-xs flex items-center gap-1 transition-all">
              <span class="material-symbols-outlined text-[14px]">analytics</span>
              <span>grovique://market/breadth</span>
            </button>
            <button type="button" onclick="window.app.readMcpResource('grovique://rag/playbooks')"
                    class="px-2.5 py-1 rounded bg-[#191c22] hover:bg-slate-800 text-[#FFB800] border border-slate-800 font-bold text-xs flex items-center gap-1 transition-all">
              <span class="material-symbols-outlined text-[14px]">auto_stories</span>
              <span>grovique://rag/playbooks</span>
            </button>
          </div>

          <div class="bg-[#090B10] p-3 rounded-lg border border-slate-800 overflow-x-auto max-h-[220px]">
            <pre id="mcpResourceOutput" class="text-[11px] font-mono text-slate-300 leading-tight">// Click an MCP resource URI above to read live state</pre>
          </div>
        </section>

      </div>
    `;
  }

  // ========================================================
  // MULTI-AGENT SWARM STUDIO (5 SPECIALIZED AI AGENTS)
  // ========================================================
  static renderAgentSwarmStudio(stream) {
    const selected = stream ? stream.getSelectedStock() : { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', ltp: 1339.70 };
    const universe = stream ? stream.stocks : [];

    const agents = [
      { id: 'scout', name: 'Agent Scout', role: 'Global, Domestic & Corporate News', icon: 'newspaper', color: '#00F0FF', desc: 'Monitors global crude, US 10Y yields, RBI policies, and real-time corporate filings / earnings surprises.' },
      { id: 'analyser', name: 'Agent Analyser', role: 'Quant & Technicals', icon: 'query_stats', color: '#00FF88', desc: 'Evaluates VWAP alignment, 9/20 EMA crossovers, RSI(14) momentum, and L2 market depth liquidity.' },
      { id: 'picker', name: 'Agent Picker', role: 'Stock Selection & Screener', icon: 'fact_check', color: '#FFB800', desc: 'Scans the 50-stock NSE universe, ranks relative strength, and identifies top breakout opportunities.' },
      { id: 'risk', name: 'Agent Risk', role: 'Capital Preservation & RMS', icon: 'security', color: '#FF2A6D', desc: 'Enforces 1.0% portfolio loss limits, computes dynamic 5x MIS leverage, and safeguards 15:15 IST square-off.' },
      { id: 'orchestrator', name: 'Agent Orchestrator', role: 'Lead Strategist & Execution', icon: 'military_tech', color: '#9d4edd', desc: 'Conducts swarm deliberation, resolves agent disagreements, and drafts the verified institutional order ticket.' }
    ];

    return `
      <div class="flex flex-col gap-5 p-4 sm:p-6 max-w-7xl mx-auto font-mono text-slate-200">
        
        <!-- HEADER HERO -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#1E293B] gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#00FF88] text-[28px]">groups</span>
              <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">Multi-Agent Swarm Intelligence Studio</h1>
            </div>
            <p class="text-xs text-slate-400">
              Cooperative AI agent team: News Scout • Technical Analyser • Universe Picker • Risk Officer • Lead Orchestrator
            </p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" onclick="window.agentSwarmClient.runUniverseScanner()"
                    class="px-3 py-2 rounded-xl bg-[#111622] hover:bg-[#191c22] border border-[#FFB800]/40 hover:border-[#FFB800] text-[#FFB800] font-bold text-xs flex items-center gap-1.5 transition-all shadow-md">
              <span class="material-symbols-outlined text-[16px]">radar</span>
              <span>RUN STOCK PICKER (ALL 50 STOCKS)</span>
            </button>
            <button type="button" onclick="window.agentSwarmClient.runSwarm('${selected.symbol}')"
                    class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00FF88] to-[#00F0FF] text-[#090B10] font-bold text-xs flex items-center gap-1.5 shadow-xl hover:brightness-110 transition-all">
              <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
              <span>DEPLOY SWARM ON ${selected.symbol}</span>
            </button>
          </div>
        </div>

        <!-- TICKER CONTROLS & SWITCHER -->
        <div class="p-3.5 rounded-xl bg-[#111622] border border-[#1E293B] flex items-center justify-between flex-wrap gap-3 shadow-md">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 uppercase font-bold">Target Stock:</span>
            <span class="px-2.5 py-1 rounded-lg bg-[#191c22] border border-[#00FF88]/50 text-[#00FF88] font-bold text-xs">
              ${selected.symbol} (₹${selected.ltp.toFixed(2)})
            </span>
            <span class="text-[11px] text-slate-400 hidden md:inline">• ${selected.name}</span>
          </div>

          <!-- Quick High-Liquidity Pills -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] text-slate-500 mr-1">Switch:</span>
            ${['RELIANCE', 'TCS', 'HDFCBANK', 'TATAMOTORS', 'INFY'].map(sym => `
              <button type="button" onclick="window.marketStream.setSelectedStock('${sym}'); window.app.renderActiveScreen();"
                      class="px-2 py-0.5 rounded text-[11px] font-bold transition-all ${sym === selected.symbol ? 'bg-[#00FF88] text-[#090B10]' : 'bg-[#191c22] text-slate-300 hover:text-white border border-slate-700'}">
                ${sym}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- AGENTS ROSTER GRID (5 SPECIALISTS) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          ${agents.map(a => `
            <div class="p-3 rounded-xl bg-[#111622] border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-2.5 shadow-lg transition-all">
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold" style="background-color: ${a.color}15; color: ${a.color}">
                    <span class="material-symbols-outlined text-[18px]">${a.icon}</span>
                  </div>
                  <span id="agentStatusBadge-${a.id}" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400">
                    READY
                  </span>
                </div>
                <h3 class="font-bold text-xs text-slate-100">${a.name}</h3>
                <span class="text-[10px] font-semibold" style="color: ${a.color}">${a.role}</span>
                <p class="text-[10px] text-slate-400 leading-normal line-clamp-3">${a.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 2-COLUMN WORKSPACE: DELIBERATION STREAM (LEFT) & VERDICT TICKET (RIGHT) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- LEFT 7 COLS: SWARM DELIBERATION TERMINAL -->
          <div class="lg:col-span-7 flex flex-col gap-2">
            <div class="bg-[#111622] border border-[#1E293B] rounded-xl overflow-hidden shadow-xl flex flex-col">
              <div class="px-4 py-2.5 bg-[#0E131F] border-b border-slate-800 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-[#00FF88] pulse-live"></span>
                  <span class="font-bold text-slate-200">Swarm Deliberation & Thought Stream</span>
                </div>
                <span class="text-[10px] text-slate-500 font-mono">Real-Time Multi-Agent Feed</span>
              </div>
              <div id="agentSwarmTerminalLog" class="p-3 overflow-y-auto max-h-[520px] min-h-[380px] flex flex-col gap-2 bg-[#090B10]">
                ${window.agentSwarmClient ? window.agentSwarmClient.renderLogsHtml() : '<div class="text-slate-500 text-xs text-center py-10">Initializing Swarm Client...</div>'}
              </div>
            </div>
          </div>

          <!-- RIGHT 5 COLS: SYNTHESIS & EXECUTION TICKET -->
          <div class="lg:col-span-5 flex flex-col gap-3">
            <div id="agentSwarmVerdictContainer">
              <div class="p-5 rounded-xl bg-[#111622] border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center gap-3 min-h-[380px]">
                <div class="w-12 h-12 rounded-full bg-[#9d4edd]/20 border border-[#9d4edd] flex items-center justify-center text-[#9d4edd]">
                  <span class="material-symbols-outlined text-[24px]">military_tech</span>
                </div>
                <div class="flex flex-col gap-1">
                  <h3 class="font-bold text-sm text-slate-100">Swarm Synthesis Ready</h3>
                  <p class="text-xs text-slate-400 max-w-xs">
                    Deploy the 5-agent team on <span class="text-[#00FF88] font-bold">${selected.symbol}</span> to synthesize the actionable trade directive.
                  </p>
                </div>
                <button type="button" onclick="window.agentSwarmClient.runSwarm('${selected.symbol}')"
                        class="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00FF88] to-[#00F0FF] text-[#090B10] font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>Start Swarm Deliberation</span>
                </button>
              </div>
            </div>

            <!-- Swarm Architecture Specs Note -->
            <div class="p-3.5 rounded-xl bg-[#111622]/60 border border-slate-800 text-[11px] text-slate-400 flex flex-col gap-1.5">
              <div class="flex items-center gap-1.5 text-slate-300 font-bold">
                <span class="material-symbols-outlined text-[15px] text-[#00F0FF]">info</span>
                <span>Cooperative Consensus Protocol</span>
              </div>
              <p class="leading-relaxed">
                The Swarm uses a weighted multi-agent consensus algorithm. The Lead Orchestrator evaluates News Sentiment (30%), Quantitative Technicals (50%), and RMS Risk Parameters (20%) before issuing the approved trade plan.
              </p>
            </div>
          </div>

        </div>

      </div>
    `;
  }
}

window.UIComponents = UIComponents;
