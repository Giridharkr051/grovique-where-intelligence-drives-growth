// GROVIQUE LIVE - Application Controller, Navigation & Event Orchestration
// Tagline: Where Intelligence Drives Growth.

class GroviqueApp {
  constructor() {
    this.currentScreen = 'live-scanner';
    this.isDrawerOpen = false;
    this.activeChart = null;

    this.init();
  }

  init() {
    // 1. Initialize audio & stream
    window.marketStream.init();

    // 2. Setup Toast container
    this.setupToastContainer();

    // 3. Setup Subscribers
    window.marketStream.subscribe((stream) => this.onMarketTick(stream));
    window.paperTradingDesk.subscribe(() => this.onTradingUpdate());
    window.alertStudio.subscribe(() => this.onAlertUpdate());

    // 4. Setup Global Keyboard Shortcuts
    this.initKeyboardShortcuts();

    // 5. Setup Global Stock Search Omnibox
    this.initStockSearch();

    // 6. Render initial view
    this.openScreen(this.currentScreen);
  }

  setupToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
      document.body.appendChild(container);
    }

    window.showAppToast = ({ title, message, type = 'info', symbol = null }) => {
      const toast = document.createElement('div');
      toast.className = `p-3.5 rounded-xl border shadow-2xl backdrop-blur-xl pointer-events-auto transition-all duration-300 transform translate-y-2 opacity-0 flex items-start gap-3 text-xs font-mono ${
        type === 'success' ? 'bg-[#111622]/95 border-[#00FF88] text-slate-100 glow-green' :
        type === 'error' ? 'bg-[#111622]/95 border-[#FF2A6D] text-slate-100 glow-magenta' :
        'bg-[#111622]/95 border-[#00F0FF] text-slate-100 glow-cyan'
      }`;

      const icon = type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'bolt');
      const iconColor = type === 'success' ? '#00FF88' : (type === 'error' ? '#FF2A6D' : '#00F0FF');

      toast.innerHTML = `
        <span class="material-symbols-outlined text-[20px] shrink-0" style="color: ${iconColor}">${icon}</span>
        <div class="flex flex-col gap-0.5 flex-1">
          <span class="font-bold text-slate-100">${title}</span>
          <span class="text-slate-300 leading-tight">${message}</span>
          ${symbol ? `
            <button onclick="window.app.openStockInDrawer('${symbol}'); this.parentElement.parentElement.remove();" class="text-[#00F0FF] underline text-[11px] font-bold text-left mt-1 hover:text-[#33f3ff]">
              Trade ${symbol} Now ➔
            </button>
          ` : ''}
        </div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-200">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      `;

      container.appendChild(toast);

      // Animate in
      setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      }, 10);

      // Auto dismiss after 5s
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 5000);
    };
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Global stock search shortcut: '/' or Ctrl+K / Cmd+K
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) {
        if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
          e.preventDefault();
          const searchInput = document.getElementById('globalStockSearchInput');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
            this.handleStockSearchFocus();
          }
          return;
        }
      }

      // Avoid shortcuts if user is typing in input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.toggleDrawer();
      } else if (e.code === 'Digit1') {
        this.openScreen('live-scanner');
      } else if (e.code === 'Digit2') {
        this.openScreen('screener-heatmap');
      } else if (e.code === 'Digit3') {
        this.openScreen('deep-dive');
      } else if (e.code === 'Digit4') {
        this.openScreen('watchlist-alerts');
      } else if (e.code === 'Digit5') {
        this.openScreen('journal-analytics');
      } else if (e.code === 'Digit6') {
        this.openScreen('news-desk');
      } else if (e.code === 'Digit7') {
        this.openScreen('backtester-lab');
      } else if (e.code === 'KeyM') {
        this.toggleMute();
      } else if (e.code === 'KeyB') {
        window.marketStream.simulateBreakingCatalyst();
      } else if (e.code === 'Escape') {
        this.closeDrawer();
        this.closeModal();
        this.closeStockSearchResults();
      }
    });
  }

  toggleMute() {
    const isMuted = window.arcadeAudio.toggleMute();
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">${isMuted ? 'volume_off' : 'volume_up'}</span>`;
      btn.title = isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)';
    }
    if (window.showAppToast) {
      window.showAppToast({
        title: isMuted ? "Arcade Audio Muted" : "Arcade Audio Enabled",
        message: isMuted ? "Sound effects silenced." : "Web Audio synthesizer active.",
        type: "info"
      });
    }
  }

  openScreen(screenId) {
    this.currentScreen = screenId;
    if (window.arcadeAudio) window.arcadeAudio.playBlip();

    // Update Sidebar Navigation state
    document.querySelectorAll('[data-path]').forEach(link => {
      const path = link.getAttribute('data-path');
      if (path === screenId) {
        link.className = "flex items-center gap-2 px-3 py-2 bg-[#00FF88] text-[#002b11] font-bold rounded-lg shadow-md transition-all";
      } else {
        link.className = "flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-[#191c22] hover:text-slate-100 transition-all";
      }
    });

    this.renderActiveScreen();

    // If Deep-Dive screen, mount Candlestick chart
    if (screenId === 'deep-dive') {
      setTimeout(() => {
        if (!this.activeChart) {
          this.activeChart = new CandlestickChart('deepDiveChart');
          window.activeChart = this.activeChart;
        }
        this.activeChart.canvas = document.getElementById('deepDiveChart');
        if (this.activeChart.canvas) {
          this.activeChart.ctx = this.activeChart.canvas.getContext('2d');
          this.activeChart.resize();
          this.activeChart.setStock(window.marketStream.getSelectedStock());
        }
      }, 50);
    }
  }

  renderActiveScreen() {
    const mainContainer = document.getElementById('mainContentArea');
    if (!mainContainer) return;

    const stream = window.marketStream;

    switch (this.currentScreen) {
      case 'live-scanner':
        mainContainer.innerHTML = UIComponents.renderCommandCenter(stream);
        break;
      case 'screener-heatmap':
        mainContainer.innerHTML = UIComponents.renderScreenerHeatmap(stream);
        break;
      case 'deep-dive':
        mainContainer.innerHTML = UIComponents.renderDeepDive(stream);
        break;
      case 'watchlist-alerts':
        mainContainer.innerHTML = UIComponents.renderWatchlistAlerts(stream);
        break;
      case 'news-desk':
        mainContainer.innerHTML = UIComponents.renderNewsDesk();
        break;
      case 'journal-analytics':
        mainContainer.innerHTML = UIComponents.renderJournalAnalytics(stream);
        break;
      case 'backtester-lab':
        mainContainer.innerHTML = UIComponents.renderBacktesterLab(stream);
        break;
      case 'user-settings':
        mainContainer.innerHTML = UIComponents.renderSettings();
        break;
      case 'sandbox-positions':
        mainContainer.innerHTML = UIComponents.renderJournalAnalytics(stream);
        this.openPositionsModal();
        break;
      default:
        mainContainer.innerHTML = UIComponents.renderCommandCenter(stream);
    }

    this.updateGlobalHeader();
  }

  updateGlobalHeader() {
    const stream = window.marketStream;
    
    // Clock & Market Status
    const cal = window.nseCalendar ? window.nseCalendar.getMarketStatus() : { isOpen: false };
    const clockEl = document.getElementById('liveClockDisplay');
    const clockDot = document.getElementById('liveClockDot');
    if (clockDot) {
      clockDot.className = cal.isOpen ? 'w-2 h-2 rounded-full bg-[#00FF88] pulse-live' : 'w-2 h-2 rounded-full bg-[#FFB800]';
    }
    if (clockEl) {
      clockEl.className = cal.isOpen ? 'font-mono text-xs text-[#00FF88] tracking-wide' : 'font-mono text-xs text-[#FFB800] tracking-wide';
      clockEl.innerText = cal.isOpen ? `● LIVE IST ${stream.getClockFormatted()}` : `● CLOSED IST ${stream.getClockFormatted()}`;
    }

    // Phase Buttons styling
    document.querySelectorAll('[data-phase-btn]').forEach(btn => {
      const phase = btn.getAttribute('data-phase-btn');
      if (phase === stream.currentPhaseKey) {
        btn.className = "px-2.5 py-1 rounded font-mono text-xs text-[#002b11] bg-[#00FF88] border border-[#00FF88] font-bold flex items-center gap-1 shadow-md";
      } else {
        btn.className = "px-2.5 py-1 rounded font-mono text-xs text-slate-400 hover:text-slate-100 hover:bg-[#191c22] transition-colors border border-transparent";
      }
    });

    // Positions badge count
    const countBadge = document.getElementById('headerPositionCount');
    if (countBadge) {
      countBadge.innerText = window.paperTradingDesk.activePositions.length.toString();
    }

    // Broker Mode Header Pill
    const brokerPill = document.getElementById('headerBrokerModePill');
    if (brokerPill && window.growwClient) {
      const isLive = window.growwClient.isLive();
      brokerPill.innerHTML = `
        <span class="w-2 h-2 rounded-full ${isLive ? 'bg-[#FFB800] pulse-live' : 'bg-[#00F0FF]'}"></span>
        <span class="font-bold">${isLive ? 'GROWW LIVE' : 'SANDBOX'}</span>
      `;
      brokerPill.className = `flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs cursor-pointer transition-all ${
        isLive ? 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800] glow-amber' : 'bg-[#191c22] text-[#00F0FF] border-[#00F0FF]/40 hover:border-[#00F0FF]'
      }`;
    }

    // Gemini AI Header Pill
    const geminiPill = document.getElementById('headerGeminiStatusPill');
    if (geminiPill && window.settingsManager) {
      const hasKey = window.settingsManager.hasGeminiKey();
      geminiPill.innerHTML = `
        <span class="material-symbols-outlined text-[15px] ${hasKey ? 'text-[#00FF88]' : 'text-slate-400'}">smart_toy</span>
        <span class="hidden sm:inline">${hasKey ? 'AI CO-PILOT' : 'SETUP AI'}</span>
      `;
    }

    // NSE Market Status & Calendar Ribbon
    if (window.nseCalendar) {
      const cal = window.nseCalendar.getMarketStatus();
      const statusText = document.getElementById('headerMarketStatusText');
      if (statusText) {
        statusText.innerText = cal.isRealWorldClosed ? cal.realReason : 'OPEN';
        statusText.className = cal.isRealWorldClosed ? 'text-[#FFB800] font-bold' : 'text-[#00FF88] font-bold';
      }
      const simPill = document.getElementById('headerSimulatorModePill');
      if (simPill) {
        simPill.className = `flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs cursor-pointer transition-all ${
          cal.inSimulatorMode
            ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF] glow-cyan'
            : 'bg-[#191c22] text-slate-400 border-slate-700 hover:text-slate-200'
        }`;
        simPill.innerHTML = `
          <span class="w-1.5 h-1.5 rounded-full ${cal.inSimulatorMode ? 'bg-[#00F0FF]' : 'bg-slate-500'}"></span>
          <span>${cal.inSimulatorMode ? 'SIMULATOR ON' : 'REAL NSE'}</span>
        `;
      }
    }
  }

  onMarketTick(stream) {
    // 1. Update Paper positions with new tick & check bracket orders
    window.paperTradingDesk.updateTickPositions(stream);

    // 2. Evaluate alert rules
    window.alertStudio.evaluateRules(stream);

    // 3. Update global header clock
    const cal = window.nseCalendar ? window.nseCalendar.getMarketStatus() : { isOpen: false };
    const clockEl = document.getElementById('liveClockDisplay');
    const clockDot = document.getElementById('liveClockDot');
    if (clockDot) {
      clockDot.className = cal.isOpen ? 'w-2 h-2 rounded-full bg-[#00FF88] pulse-live' : 'w-2 h-2 rounded-full bg-[#FFB800]';
    }
    if (clockEl) {
      clockEl.className = cal.isOpen ? 'font-mono text-xs text-[#00FF88] tracking-wide' : 'font-mono text-xs text-[#FFB800] tracking-wide';
      clockEl.innerText = cal.isOpen ? `● LIVE IST ${stream.getClockFormatted()}` : `● CLOSED IST ${stream.getClockFormatted()}`;
    }

    // 4. If current screen is Deep Dive and chart is mounted, redraw chart
    if (this.currentScreen === 'deep-dive' && this.activeChart) {
      this.activeChart.setStock(stream.getSelectedStock());
    }

    // 5. If Execution Drawer is open, refresh drawer
    if (this.isDrawerOpen) {
      this.updateDrawerContent();
    }

    // 6. Refresh active screen if on screener or command center (at throttled rate or selective updates)
    // For smooth performance, we update text nodes or re-render
    const liveTime = Date.now();
    if (!this._lastRenderTime || liveTime - this._lastRenderTime > 800) {
      this._lastRenderTime = liveTime;
      // If we are on screens that display ticking prices, re-render
      if (['live-scanner', 'screener-heatmap'].includes(this.currentScreen)) {
        this.renderActiveScreen();
      }
    }
  }

  onTradingUpdate() {
    this.updateGlobalHeader();
    if (this.currentScreen === 'journal-analytics' || this.currentScreen === 'deep-dive') {
      this.renderActiveScreen();
    }
    if (this.isDrawerOpen) {
      this.updateDrawerContent();
    }
  }

  onAlertUpdate() {
    if (this.currentScreen === 'watchlist-alerts') {
      this.renderActiveScreen();
    }
  }

  // Drawer Controls
  openStockInDrawer(symbol, setupParams = null) {
    if (symbol) window.marketStream.setSelectedStock(symbol);
    this.isDrawerOpen = true;
    this.pendingSetup = setupParams;
    const drawerEl = document.getElementById('executionDrawer');
    if (drawerEl) {
      drawerEl.classList.remove('translate-x-full');
      this.updateDrawerContent();
    }
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    const drawerEl = document.getElementById('executionDrawer');
    if (drawerEl) {
      drawerEl.classList.add('translate-x-full');
    }
  }

  toggleDrawer() {
    if (this.isDrawerOpen) {
      this.closeDrawer();
    } else {
      this.openStockInDrawer(window.marketStream.selectedSymbol);
    }
  }

  updateDrawerContent() {
    const drawerContainer = document.getElementById('drawerInnerContent');
    if (!drawerContainer) return;

    const stock = window.marketStream.getSelectedStock();
    const sizing = window.paperTradingDesk.calculateSizing(stock);
    drawerContainer.innerHTML = UIComponents.renderDrawer(stock, sizing);
  }

  openStockInDeepDive(symbol) {
    window.marketStream.setSelectedStock(symbol);
    this.openScreen('deep-dive');
  }

  updateRiskSlider(val) {
    const pct = parseFloat(val);
    window.paperTradingDesk.setRiskPercent(pct);
    const display = document.getElementById('riskPctDisplay');
    if (display) {
      const stock = window.marketStream.getSelectedStock();
      const sizing = window.paperTradingDesk.calculateSizing(stock);
      display.innerText = `${pct.toFixed(1)}% (₹${(sizing ? sizing.maxLossINR : 1000).toFixed(0)})`;
    }
    this.renderActiveScreen();
  }

  // Dual Execution Engine (Routes to Groww Live or Paper Desk based on Mode)
  async executeTrade(symbol, direction) {
    const stock = window.marketStream.stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    if (window.growwClient) {
      await window.growwClient.executeOrder(stock, direction);
      this.closeDrawer();
    } else {
      this.executePaperTrade(symbol, direction);
    }
  }

  executePaperTrade(symbol, direction) {
    const stock = window.marketStream.stocks.find(s => s.symbol === symbol);
    if (stock) {
      window.paperTradingDesk.executeOrder(stock, direction);
      this.closeDrawer();
    }
  }

  // Gemini AI Intraday Triggers
  async triggerGeminiAnalysis(symbol) {
    const stock = window.marketStream.stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    const spinner = document.getElementById(`geminiSpin-${symbol}`);
    if (spinner) spinner.classList.remove('hidden');

    try {
      if (window.geminiIntradayAdvisor) {
        await window.geminiIntradayAdvisor.getAdvice(stock, { forceRefresh: true });
        if (window.arcadeAudio) window.arcadeAudio.playAlertChime();
        this.renderActiveScreen();
        if (this.isDrawerOpen) this.updateDrawerContent();
      }
    } catch (e) {
      console.error('Error refreshing Gemini analysis:', e);
    } finally {
      if (spinner) spinner.classList.add('hidden');
    }
  }

  applyGeminiLevels(symbol) {
    const stock = window.marketStream.stocks.find(s => s.symbol === symbol);
    if (!stock || !window.geminiIntradayAdvisor) return;

    const stream = window.marketStream;
    const cacheKey = stock.symbol + '_' + (stream ? stream.currentPhaseKey : 'PRIME');
    const cached = window.geminiIntradayAdvisor.cache[cacheKey];
    const advice = cached ? cached.advice : window.geminiIntradayAdvisor.generateAlgorithmicIntradayAdvice(stock, stream, stream.getCurrentPhase(), stream.getClockFormatted());

    if (advice) {
      window.geminiIntradayAdvisor.applyLevelsToTradeTicket(advice);
      this.renderActiveScreen();
      if (this.isDrawerOpen) this.updateDrawerContent();
    }
  }

  // User Settings Actions
  setBrokerMode(mode) {
    if (window.settingsManager) {
      window.settingsManager.setGrowwMode(mode);
      this.renderActiveScreen();
      this.updateGlobalHeader();
    }
  }

  saveGrowwCredentials(e) {
    e.preventDefault();
    const clientId = document.getElementById('settingGrowwClientId').value.trim();
    const apiKey = document.getElementById('settingGrowwApiKey').value.trim();
    const apiSecret = document.getElementById('settingGrowwApiSecret').value.trim();
    const accessToken = document.getElementById('settingGrowwAccessToken').value.trim();
    const rmsMaxDailyLoss = parseFloat(document.getElementById('settingRmsMaxLoss').value) || 5000;
    const autoSquareOffTime = document.getElementById('settingAutoSquareOff').value.trim() || '15:15';

    if (window.settingsManager) {
      window.settingsManager.updateGrowwCredentials({
        clientId,
        apiKey,
        apiSecret,
        accessToken,
        rmsMaxDailyLoss,
        autoSquareOffTime
      });

      if (window.arcadeAudio) window.arcadeAudio.playBuyFill();
      if (window.showAppToast) {
        window.showAppToast({
          title: "Groww API Settings Saved",
          message: `Credentials updated for Client ID: ${clientId || 'GROWW_DEFAULT'}`,
          type: "success"
        });
      }
      this.renderActiveScreen();
    }
  }

  async testGrowwAuth() {
    if (!window.settingsManager) return;
    try {
      const result = await window.settingsManager.testGrowwConnection();
      if (window.arcadeAudio) window.arcadeAudio.playAlertChime();
      if (window.showAppToast) {
        window.showAppToast({
          title: "Groww API Connected!",
          message: `Authenticated as ${result.clientName} (Margin: ₹${result.availableMargin.toLocaleString('en-IN')})`,
          type: "success"
        });
      }
      this.renderActiveScreen();
    } catch (err) {
      if (window.arcadeAudio) window.arcadeAudio.playWarning();
      if (window.showAppToast) {
        window.showAppToast({
          title: "Groww Connection Error",
          message: err.message,
          type: "error"
        });
      }
    }
  }

  saveGeminiCredentials(e) {
    e.preventDefault();
    const apiKey = document.getElementById('settingGeminiApiKey').value.trim();
    const model = document.getElementById('settingGeminiModel').value;
    const riskProfile = document.getElementById('settingGeminiRiskProfile').value;

    if (window.settingsManager) {
      window.settingsManager.updateGeminiConfig({
        apiKey,
        model,
        riskProfile
      });

      if (window.arcadeAudio) window.arcadeAudio.playBuyFill();
      if (window.showAppToast) {
        window.showAppToast({
          title: "Gemini Config Saved",
          message: `Active Model: ${model} (${riskProfile} Style)`,
          type: "success"
        });
      }
      this.renderActiveScreen();
    }
  }

  async testGeminiApi() {
    if (!window.settingsManager) return;
    try {
      const result = await window.settingsManager.testGeminiConnection();
      if (window.arcadeAudio) window.arcadeAudio.playAlertChime();
      if (window.showAppToast) {
        window.showAppToast({
          title: "Gemini API Online!",
          message: `Verified connection in ${result.latency}ms latency`,
          type: "success"
        });
      }
      this.renderActiveScreen();
    } catch (err) {
      if (window.arcadeAudio) window.arcadeAudio.playWarning();
      if (window.showAppToast) {
        window.showAppToast({
          title: "Gemini API Error",
          message: err.message,
          type: "error"
        });
      }
    }
  }

  handleCreateRule(e) {
    e.preventDefault();
    const symbol = document.getElementById('ruleSymbol').value;
    const condition = document.getElementById('ruleCondition').value;
    const during = document.getElementById('ruleDuring').value;
    const rvolThreshold = parseFloat(document.getElementById('ruleRvol').value);

    window.alertStudio.addRule({
      symbol,
      condition,
      during,
      rvolThreshold,
      action: "CHIME_AND_TOAST"
    });
  }

  // Active Positions Modal
  openPositionsModal() {
    const desk = window.paperTradingDesk;
    const positions = desk.activePositions;

    let modal = document.getElementById('positionsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'positionsModal';
      modal.className = 'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-[#111622] border border-[#1E293B] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col font-mono text-xs">
        <div class="p-4 bg-[#191c22] border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#00F0FF] text-[20px]">account_balance_wallet</span>
            <span class="text-sm font-bold text-slate-100">Sandbox Positions Desk</span>
            <span class="px-2 py-0.5 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] text-[10px] font-bold">${positions.length} Active</span>
          </div>
          <button onclick="window.app.closeModal()" class="text-slate-400 hover:text-slate-100 p-1">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-3">
          ${positions.length === 0 ? `
            <div class="py-12 text-center text-slate-400">
              No active paper positions. Click "Sim Trade" on any stock to execute an order!
            </div>
          ` : `
            <div class="flex justify-between items-center pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <span>UNREALIZED P&L TOTAL: <span class="font-bold ${desk.getTotalUnrealizedPnl() >= 0 ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">₹${desk.getTotalUnrealizedPnl().toFixed(2)}</span></span>
              <button onclick="window.paperTradingDesk.squareOffAll()" class="px-2.5 py-1 rounded bg-[#FF2A6D]/20 text-[#FF2A6D] hover:bg-[#FF2A6D]/30 font-bold">Square Off All</button>
            </div>
            ${positions.map(p => {
              const isPnlPositive = p.unrealizedPnl >= 0;
              return `
                <div class="p-3 rounded-xl bg-[#191c22] border border-slate-800 flex items-center justify-between gap-3">
                  <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm text-slate-100">${p.symbol}</span>
                      <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${p.direction === 'BUY' ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-[#FF2A6D]/20 text-[#FF2A6D]'}">${p.direction}</span>
                      <span class="text-slate-400">${p.qty} Qty @ ₹${p.entryPrice.toFixed(2)}</span>
                    </div>
                    <span class="text-[11px] text-slate-400 mt-1">LTP: ₹${p.currentPrice.toFixed(2)} | Target: ₹${p.target} | SL: ₹${p.sl}</span>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="text-right">
                      <div class="text-sm font-bold ${isPnlPositive ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">
                        ${isPnlPositive ? '+' : ''}₹${p.unrealizedPnl.toFixed(2)}
                      </div>
                      <div class="text-[10px] font-semibold ${isPnlPositive ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">
                        ${isPnlPositive ? '+' : ''}${p.unrealizedPnlPct}%
                      </div>
                    </div>
                    <button onclick="window.paperTradingDesk.squareOffPosition('${p.id}'); window.app.openPositionsModal();"
                            class="px-3 py-1.5 rounded bg-slate-800 hover:bg-[#FF2A6D] hover:text-white text-slate-200 transition-all font-bold text-xs">
                      Square Off
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          `}
        </div>

        <div class="p-4 bg-[#191c22] border-t border-slate-800 flex items-center justify-between text-slate-400">
          <span>Paper Wallet Capital: <span class="text-[#00F0FF] font-bold">₹${desk.walletCapital.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></span>
          <button onclick="window.app.closeModal()" class="px-4 py-1.5 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">Close</button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  }

  closeModal() {
    const modal = document.getElementById('positionsModal');
    if (modal) modal.remove();
    const holidayModal = document.getElementById('nseHolidaysModalOverlay');
    if (holidayModal) holidayModal.remove();
  }

  openNSEHolidaysModal() {
    this.closeModal();
    const modalHtml = UIComponents.renderNSEHolidaysModal();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);
    if (window.arcadeAudio) window.arcadeAudio.playBlip();
  }

  switchBacktestStrategy(stratId) {
    if (window.intradayBacktestEngine) {
      window.intradayBacktestEngine.setStrategy(stratId);
      if (window.arcadeAudio) window.arcadeAudio.playBlip();
      this.renderActiveScreen();
    }
  }

  setBacktestTargetRR(rr) {
    if (window.intradayBacktestEngine) {
      window.intradayBacktestEngine.setTargetRR(rr);
      if (window.arcadeAudio) window.arcadeAudio.playBlip();
      this.renderActiveScreen();
    }
  }

  toggleBacktestSlippage() {
    if (window.intradayBacktestEngine) {
      const next = !window.intradayBacktestEngine.includeSlippage;
      window.intradayBacktestEngine.setSlippageToggle(next);
      if (window.arcadeAudio) window.arcadeAudio.playBlip();
      this.renderActiveScreen();
    }
  }

  reRunBacktest() {
    if (window.intradayBacktestEngine) {
      window.intradayBacktestEngine.runBacktest();
      if (window.arcadeAudio) window.arcadeAudio.playBlip();
      if (window.showAppToast) {
        window.showAppToast({
          title: "Strategy Backtest Re-Calculated",
          message: `Evaluated ${window.intradayBacktestEngine.latestResults.numObservations} samples across 180 days with Indian taxes and friction.`,
          type: "success"
        });
      }
      this.renderActiveScreen();
    }
  }

  // ==========================================
  // GLOBAL & WORKSPACE STOCK SEARCH METHODS
  // ==========================================
  initStockSearch() {
    this.searchHighlightedIndex = -1;
    this.workspaceHighlightedIndex = -1;

    document.addEventListener('click', (e) => {
      // Global header search container click-outside
      const globalContainer = document.getElementById('globalStockSearchContainer');
      const globalResults = document.getElementById('globalStockSearchResults');
      if (globalContainer && globalResults) {
        if (!globalContainer.contains(e.target)) {
          globalResults.classList.add('hidden');
          this.searchHighlightedIndex = -1;
        }
      }

      // Workspace search container click-outside
      const wsContainer = document.getElementById('workspaceStockSearchContainer');
      const wsResults = document.getElementById('workspaceSearchResults');
      if (wsContainer && wsResults) {
        if (!wsContainer.contains(e.target)) {
          wsResults.classList.add('hidden');
          this.workspaceHighlightedIndex = -1;
        }
      }
    });
  }

  handleStockSearchFocus() {
    const input = document.getElementById('globalStockSearchInput');
    const query = input ? input.value.trim() : '';
    if (!query) {
      const stream = window.marketStream;
      const trending = stream && stream.stocks ? stream.stocks.slice(0, 7) : [];
      this.searchHighlightedIndex = -1;
      this.renderStockSearchResults(trending, '', true);
    } else {
      this.handleStockSearch(query);
    }
  }

  handleStockSearch(query) {
    const clearBtn = document.getElementById('globalSearchClearBtn');
    const q = (query || '').trim().toLowerCase();

    if (clearBtn) {
      if (q) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }

    if (!q) {
      this.handleStockSearchFocus();
      return;
    }

    const stream = window.marketStream;
    if (!stream || !stream.stocks) return;

    // Filter stocks matching symbol, company name, or sector
    const matches = stream.stocks.filter(s =>
      s.symbol.toLowerCase().includes(q) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.sector && s.sector.toLowerCase().includes(q)) ||
      (s.subSector && s.subSector.toLowerCase().includes(q))
    );

    // Ranking: exact symbol match, prefix symbol match, score
    matches.sort((a, b) => {
      const aSym = a.symbol.toLowerCase();
      const bSym = b.symbol.toLowerCase();
      if (aSym === q) return -1;
      if (bSym === q) return 1;
      if (aSym.startsWith(q) && !bSym.startsWith(q)) return -1;
      if (!aSym.startsWith(q) && bSym.startsWith(q)) return 1;
      return b.score - a.score;
    });

    this.searchHighlightedIndex = -1;
    this.renderStockSearchResults(matches, query, false);
  }

  renderStockSearchResults(results, query = '', isTrending = false) {
    const container = document.getElementById('globalStockSearchResults');
    if (!container) return;

    if (results.length === 0 && !query) {
      container.classList.add('hidden');
      return;
    }

    let html = '';

    // Header bar
    html += `
      <div class="px-3.5 py-2.5 bg-[#111622] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
        <span class="flex items-center gap-1.5 font-bold ${isTrending ? 'text-[#FFB800]' : 'text-[#00FF88]'}">
          <span class="material-symbols-outlined text-[15px]">${isTrending ? 'local_fire_department' : 'search'}</span>
          <span>${isTrending ? 'POPULAR FRONTLINE NSE EQUITIES' : `FOUND ${results.length} STOCKS FOR "${query.toUpperCase()}"`}</span>
        </span>
        <span class="text-[10px] text-slate-400">↑↓ navigate • ↵ select</span>
      </div>
      <div class="overflow-y-auto max-h-80 flex flex-col divide-y divide-slate-800/60" id="stockSearchListGroup">
    `;

    if (results.length === 0) {
      html += `
        <div class="p-6 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-2">
          <span class="material-symbols-outlined text-slate-500 text-3xl">sentiment_dissatisfied</span>
          <div>No active watchlist stocks found matching "<span class="text-slate-200 font-bold">${query}</span>".</div>
          <div class="text-[11px] text-slate-500">You can mount this ticker directly from the official NSE India universe below:</div>
        </div>
      `;
    } else {
      results.forEach((stock, idx) => {
        const changePct = (((stock.ltp - stock.previousClose) / stock.previousClose) * 100).toFixed(2);
        const isBull = changePct >= 0;
        const isSelected = idx === this.searchHighlightedIndex;

        html += `
          <div class="p-2.5 px-3.5 hover:bg-[#191c22] transition-colors cursor-pointer flex items-center justify-between gap-3 ${isSelected ? 'bg-[#191c22] ring-1 ring-[#00FF88]/40' : ''}"
               data-stock-search-item="${idx}"
               onclick="window.app.selectStockFromSearch('${stock.symbol}')">
            
            <!-- Left: Symbol, Name & Sector -->
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-[#090B10] border border-slate-800 flex items-center justify-center shrink-0">
                <span class="font-mono text-xs font-bold text-[#00FF88]">${stock.symbol.substring(0, 2)}</span>
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-sm font-bold text-slate-100">${stock.symbol}</span>
                  <span class="text-[9px] font-mono text-[#00F0FF] bg-[#191c22] px-1 rounded border border-slate-800">NSE:EQ</span>
                  <span class="text-[10px] text-slate-400 truncate">${stock.sector}</span>
                </div>
                <span class="text-xs text-slate-400 truncate max-w-xs">${stock.name || stock.subSector}</span>
              </div>
            </div>

            <!-- Right: LTP, Change & Quick Actions -->
            <div class="flex items-center gap-3 shrink-0">
              <div class="flex flex-col items-end">
                <div class="font-mono text-xs font-bold ${isBull ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">₹${stock.ltp.toFixed(2)}</div>
                <div class="font-mono text-[10px] font-semibold ${isBull ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">${isBull ? '+' : ''}${changePct}% ${isBull ? '▲' : '▼'}</div>
              </div>
              
              <div class="hidden sm:flex items-center gap-1.5" onclick="event.stopPropagation()">
                <button type="button" onclick="window.app.openStockInDeepDive('${stock.symbol}'); window.app.closeStockSearchResults();"
                        class="px-2 py-1 rounded bg-[#090B10] hover:bg-[#00F0FF]/15 border border-slate-700 hover:border-[#00F0FF] text-[#00F0FF] font-mono text-[10px] font-bold flex items-center gap-1 transition-all" title="View Candlestick Graph">
                  <span class="material-symbols-outlined text-[13px]">candlestick_chart</span>
                  <span>Chart</span>
                </button>
                <button type="button" onclick="window.app.openStockInDrawer('${stock.symbol}'); window.app.closeStockSearchResults();"
                        class="px-2 py-1 rounded bg-[#00FF88]/15 hover:bg-[#00FF88] border border-[#00FF88]/40 hover:border-[#00FF88] text-[#00FF88] hover:text-[#090B10] font-mono text-[10px] font-bold flex items-center gap-1 transition-all" title="Trade Stock">
                  <span class="material-symbols-outlined text-[13px]">bolt</span>
                  <span>Trade</span>
                </button>
              </div>
            </div>

          </div>
        `;
      });
    }

    html += `</div>`;

    // Dynamic Option to search/mount any NSE ticker
    if (query && query.trim().length >= 2) {
      const cleanQ = query.trim().toUpperCase();
      const isAlreadyInResults = results.some(r => r.symbol === cleanQ);
      if (!isAlreadyInResults) {
        html += `
          <div class="p-2.5 px-3.5 bg-[#090B10] hover:bg-[#111622] border-t border-slate-800 transition-colors cursor-pointer flex items-center justify-between gap-2"
               onclick="window.app.selectCustomStockFromSearch('${cleanQ}')">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-[#00FF88]/15 border border-[#00FF88]/40 flex items-center justify-center text-[#00FF88] shrink-0">
                <span class="material-symbols-outlined text-[18px]">add_chart</span>
              </span>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-100">
                  <span>Search NSE India for "${cleanQ}"</span>
                  <span class="px-1.5 py-0.2 rounded bg-[#00FF88]/20 text-[#00FF88] text-[9px] font-bold font-mono">NSE VERIFIED</span>
                </div>
                <span class="text-[11px] text-slate-400">Mount live quote, multi-timeframe candlestick graph & level-2 book</span>
              </div>
            </div>
            <button type="button" class="px-2.5 py-1 rounded bg-[#00FF88] text-[#002b11] font-mono text-xs font-bold shrink-0 hover:bg-[#33ffaa] transition-colors flex items-center gap-1 shadow-md">
              <span>Mount</span>
              <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        `;
      }
    }

    container.innerHTML = html;
    container.classList.remove('hidden');
  }

  handleStockSearchKeydown(e) {
    const container = document.getElementById('globalStockSearchResults');
    if (!container || container.classList.contains('hidden')) return;

    const items = container.querySelectorAll('[data-stock-search-item]');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.searchHighlightedIndex = Math.min(items.length - 1, this.searchHighlightedIndex + 1);
      this.updateSearchHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.searchHighlightedIndex = Math.max(0, this.searchHighlightedIndex - 1);
      this.updateSearchHighlight(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.searchHighlightedIndex >= 0 && items[this.searchHighlightedIndex]) {
        items[this.searchHighlightedIndex].click();
      } else if (items.length > 0) {
        items[0].click();
      } else {
        const input = document.getElementById('globalStockSearchInput');
        if (input && input.value.trim().length >= 2) {
          this.selectCustomStockFromSearch(input.value.trim().toUpperCase());
        }
      }
    } else if (e.key === 'Escape') {
      this.closeStockSearchResults();
    }
  }

  updateSearchHighlight(items) {
    items.forEach((it, idx) => {
      if (idx === this.searchHighlightedIndex) {
        it.classList.add('bg-[#191c22]', 'ring-1', 'ring-[#00FF88]/40');
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.classList.remove('bg-[#191c22]', 'ring-1', 'ring-[#00FF88]/40');
      }
    });
  }

  selectStockFromSearch(symbol) {
    if (!symbol) return;
    window.marketStream.setSelectedStock(symbol);
    this.openScreen('deep-dive');

    // Force candlestick chart mount/render for new stock
    if (this.activeChart) {
      this.activeChart.setStock(window.marketStream.getSelectedStock());
    }

    this.closeStockSearchResults();
    this.closeWorkspaceSearchResults();

    // Sync input values
    const input = document.getElementById('globalStockSearchInput');
    if (input) input.value = symbol;
    const wsInput = document.getElementById('workspaceStockSearchInput');
    if (wsInput) wsInput.value = symbol;

    const clearBtn = document.getElementById('globalSearchClearBtn');
    if (clearBtn) clearBtn.classList.remove('hidden');

    if (window.arcadeAudio) window.arcadeAudio.playBlip();
    if (window.showAppToast) {
      window.showAppToast({
        title: `Selected ${symbol} • Candlestick Chart`,
        message: `Switched to deep-dive candlestick graph with VWAP, EMA and RSI for ${symbol}.`,
        type: 'success',
        symbol: symbol
      });
    }
  }

  selectCustomStockFromSearch(symbol) {
    if (!symbol) return;
    const stock = window.marketStream.registerCustomStock(symbol);
    if (stock) {
      this.selectStockFromSearch(stock.symbol);
    }
  }

  closeStockSearchResults() {
    const container = document.getElementById('globalStockSearchResults');
    if (container) container.classList.add('hidden');
    this.searchHighlightedIndex = -1;
  }

  clearStockSearch() {
    const input = document.getElementById('globalStockSearchInput');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('globalSearchClearBtn');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.handleStockSearchFocus();
  }

  // ==========================================
  // WORKSPACE CONTENT SEARCH METHODS
  // ==========================================
  handleWorkspaceSearchFocus() {
    const input = document.getElementById('workspaceStockSearchInput');
    const query = input ? input.value.trim() : '';
    const stream = window.marketStream;
    if (!query) {
      const trending = stream && stream.stocks ? stream.stocks.slice(0, 7) : [];
      this.workspaceHighlightedIndex = -1;
      this.renderWorkspaceSearchResults(trending, '', true);
    } else {
      this.handleWorkspaceSearch(query);
    }
  }

  handleWorkspaceSearch(query) {
    const clearBtn = document.getElementById('workspaceSearchClearBtn');
    const q = (query || '').trim().toLowerCase();

    if (clearBtn) {
      if (q) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }

    if (!q) {
      this.handleWorkspaceSearchFocus();
      return;
    }

    const stream = window.marketStream;
    if (!stream || !stream.stocks) return;

    const matches = stream.stocks.filter(s =>
      s.symbol.toLowerCase().includes(q) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.sector && s.sector.toLowerCase().includes(q)) ||
      (s.subSector && s.subSector.toLowerCase().includes(q))
    );

    matches.sort((a, b) => {
      const aSym = a.symbol.toLowerCase();
      const bSym = b.symbol.toLowerCase();
      if (aSym === q) return -1;
      if (bSym === q) return 1;
      if (aSym.startsWith(q) && !bSym.startsWith(q)) return -1;
      if (!aSym.startsWith(q) && bSym.startsWith(q)) return 1;
      return b.score - a.score;
    });

    this.workspaceHighlightedIndex = -1;
    this.renderWorkspaceSearchResults(matches, query, false);
  }

  renderWorkspaceSearchResults(results, query = '', isTrending = false) {
    const container = document.getElementById('workspaceSearchResults');
    if (!container) return;

    if (results.length === 0 && !query) {
      container.classList.add('hidden');
      return;
    }

    let html = `
      <div class="px-3.5 py-2.5 bg-[#111622] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
        <span class="flex items-center gap-1.5 font-bold ${isTrending ? 'text-[#FFB800]' : 'text-[#00FF88]'}">
          <span class="material-symbols-outlined text-[15px]">${isTrending ? 'local_fire_department' : 'search'}</span>
          <span>${isTrending ? 'POPULAR NSE EQUITIES' : `FOUND ${results.length} STOCKS FOR "${query.toUpperCase()}"`}</span>
        </span>
        <span class="text-[10px] text-slate-400">↑↓ navigate • ↵ select</span>
      </div>
      <div class="overflow-y-auto max-h-72 flex flex-col divide-y divide-slate-800/60">
    `;

    if (results.length === 0) {
      html += `
        <div class="p-6 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-2">
          <span class="material-symbols-outlined text-slate-500 text-3xl">sentiment_dissatisfied</span>
          <div>No active watchlist stocks found matching "<span class="text-slate-200 font-bold">${query}</span>".</div>
          <div class="text-[11px] text-slate-500">You can mount this ticker directly from the official NSE India universe below:</div>
        </div>
      `;
    } else {
      results.forEach((stock, idx) => {
        const changePct = (((stock.ltp - stock.previousClose) / stock.previousClose) * 100).toFixed(2);
        const isBull = changePct >= 0;
        const isSelected = idx === this.workspaceHighlightedIndex;

        html += `
          <div class="p-2.5 px-3.5 hover:bg-[#191c22] transition-colors cursor-pointer flex items-center justify-between gap-3 ${isSelected ? 'bg-[#191c22] ring-1 ring-[#00FF88]/40' : ''}"
               data-ws-search-item="${idx}"
               onclick="window.app.selectStockFromSearch('${stock.symbol}')">
            
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-[#090B10] border border-slate-800 flex items-center justify-center shrink-0">
                <span class="font-mono text-xs font-bold text-[#00FF88]">${stock.symbol.substring(0, 2)}</span>
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-mono text-sm font-bold text-slate-100">${stock.symbol}</span>
                  <span class="text-[9px] font-mono text-[#00F0FF] bg-[#191c22] px-1 rounded border border-slate-800">NSE:EQ</span>
                  <span class="text-[10px] text-slate-400 truncate">${stock.sector}</span>
                </div>
                <span class="text-xs text-slate-400 truncate max-w-xs">${stock.name || stock.subSector}</span>
              </div>
            </div>

            <div class="flex items-center gap-3 shrink-0">
              <div class="flex flex-col items-end">
                <div class="font-mono text-xs font-bold ${isBull ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">₹${stock.ltp.toFixed(2)}</div>
                <div class="font-mono text-[10px] font-semibold ${isBull ? 'text-[#00FF88]' : 'text-[#FF2A6D]'}">${isBull ? '+' : ''}${changePct}% ${isBull ? '▲' : '▼'}</div>
              </div>
              <button type="button" onclick="window.app.openStockInDeepDive('${stock.symbol}'); window.app.closeWorkspaceSearchResults();"
                      class="px-2.5 py-1 rounded bg-[#00FF88] text-[#002b11] font-mono text-xs font-bold shrink-0 hover:bg-[#33ffaa] transition-colors flex items-center gap-1 shadow-md">
                <span>Chart</span>
                <span class="material-symbols-outlined text-[13px]">query_stats</span>
              </button>
            </div>

          </div>
        `;
      });
    }

    html += `</div>`;

    if (query && query.trim().length >= 2) {
      const cleanQ = query.trim().toUpperCase();
      const isAlreadyInResults = results.some(r => r.symbol === cleanQ);
      if (!isAlreadyInResults) {
        html += `
          <div class="p-2.5 px-3.5 bg-[#090B10] hover:bg-[#111622] border-t border-slate-800 transition-colors cursor-pointer flex items-center justify-between gap-2"
               onclick="window.app.selectCustomStockFromSearch('${cleanQ}')">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-[#00FF88]/15 border border-[#00FF88]/40 flex items-center justify-center text-[#00FF88] shrink-0">
                <span class="material-symbols-outlined text-[18px]">add_chart</span>
              </span>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-100">
                  <span>Search NSE India for "${cleanQ}"</span>
                  <span class="px-1.5 py-0.2 rounded bg-[#00FF88]/20 text-[#00FF88] text-[9px] font-bold font-mono">NSE VERIFIED</span>
                </div>
                <span class="text-[11px] text-slate-400">Mount live quote & candlestick graph</span>
              </div>
            </div>
            <button type="button" class="px-2.5 py-1 rounded bg-[#00FF88] text-[#002b11] font-mono text-xs font-bold shrink-0 hover:bg-[#33ffaa] transition-colors flex items-center gap-1 shadow-md">
              <span>Mount</span>
              <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        `;
      }
    }

    container.innerHTML = html;
    container.classList.remove('hidden');
  }

  handleWorkspaceSearchKeydown(e) {
    const container = document.getElementById('workspaceSearchResults');
    if (!container || container.classList.contains('hidden')) return;

    const items = container.querySelectorAll('[data-ws-search-item]');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.workspaceHighlightedIndex = Math.min(items.length - 1, this.workspaceHighlightedIndex + 1);
      this.updateWorkspaceSearchHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.workspaceHighlightedIndex = Math.max(0, this.workspaceHighlightedIndex - 1);
      this.updateWorkspaceSearchHighlight(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.workspaceHighlightedIndex >= 0 && items[this.workspaceHighlightedIndex]) {
        items[this.workspaceHighlightedIndex].click();
      } else if (items.length > 0) {
        items[0].click();
      } else {
        const input = document.getElementById('workspaceStockSearchInput');
        if (input && input.value.trim().length >= 2) {
          this.selectCustomStockFromSearch(input.value.trim().toUpperCase());
        }
      }
    } else if (e.key === 'Escape') {
      this.closeWorkspaceSearchResults();
    }
  }

  updateWorkspaceSearchHighlight(items) {
    items.forEach((it, idx) => {
      if (idx === this.workspaceHighlightedIndex) {
        it.classList.add('bg-[#191c22]', 'ring-1', 'ring-[#00FF88]/40');
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.classList.remove('bg-[#191c22]', 'ring-1', 'ring-[#00FF88]/40');
      }
    });
  }

  closeWorkspaceSearchResults() {
    const container = document.getElementById('workspaceSearchResults');
    if (container) container.classList.add('hidden');
    this.workspaceHighlightedIndex = -1;
  }

  clearWorkspaceSearch() {
    const input = document.getElementById('workspaceStockSearchInput');
    if (input) {
      input.value = '';
      input.focus();
    }
    const clearBtn = document.getElementById('workspaceSearchClearBtn');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.handleWorkspaceSearchFocus();
  }
}

// Expose class globally and bootstrap
window.GroviqueApp = GroviqueApp;
window.PulseTradeApp = GroviqueApp;

document.addEventListener('DOMContentLoaded', () => {
  window.app = new GroviqueApp();
});
