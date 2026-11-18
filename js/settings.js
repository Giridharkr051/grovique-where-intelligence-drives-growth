// PulseTrade Live - User Settings & Broker/AI Credentials Manager

class SettingsManager {
  constructor() {
    this.storageKey = 'pulsetrade_user_settings';
    this.state = this.loadSettings();
    this.listeners = [];
  }

  loadSettings() {
    const defaults = {
      // Groww API Credentials & Mode
      groww: {
        apiKey: '',
        apiSecret: '',
        accessToken: '',
        clientId: '',
        mode: 'SANDBOX', // 'SANDBOX' (Paper Desk) or 'GROWW_LIVE' (Real Brokerage)
        status: 'UNCONFIGURED', // 'UNCONFIGURED' | 'CONNECTED' | 'ERROR'
        accountName: 'Groww Demo Account',
        availableMargin: 245000.00,
        rmsMaxDailyLoss: 5000.00,
        defaultProductType: 'MIS', // Intraday Margin Intraday Square-off
        autoSquareOffTime: '15:15'
      },
      // Google Gemini API Configuration
      gemini: {
        apiKey: '',
        model: 'gemini-1.5-flash', // 'gemini-1.5-flash' | 'gemini-2.0-flash' | 'gemini-1.5-pro'
        status: 'UNCONFIGURED', // 'UNCONFIGURED' | 'READY' | 'ERROR'
        autoAnalyzeOnSelect: true,
        riskProfile: 'DISCIPLINED', // 'CONSERVATIVE' | 'DISCIPLINED' | 'AGGRESSIVE'
        lastLatencyMs: null
      },
      // Terminal Preferences
      terminal: {
        soundVolume: 0.8,
        soundEnabled: true,
        tickIntervalMs: 600,
        theme: 'arcade-dark'
      }
    };

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          groww: { ...defaults.groww, ...(parsed.groww || {}) },
          gemini: { ...defaults.gemini, ...(parsed.gemini || {}) },
          terminal: { ...defaults.terminal, ...(parsed.terminal || {}) }
        };
      }
    } catch (e) {
      console.warn('Could not read user settings from localStorage:', e);
    }
    return defaults;
  }

  saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }
    this.notify();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.state));
  }

  // Groww helpers
  isGrowwLive() {
    return this.state.groww.mode === 'GROWW_LIVE';
  }

  setGrowwMode(mode) {
    this.state.groww.mode = mode;
    this.saveSettings();
    if (window.arcadeAudio) window.arcadeAudio.playBlip();
    if (window.showAppToast) {
      window.showAppToast({
        title: `BROKER MODE: ${mode}`,
        message: mode === 'GROWW_LIVE'
          ? 'CAUTION: Real Groww execution enabled. Live orders will hit exchange!'
          : 'Switched to Paper Trading Sandbox. Zero capital risk.',
        type: mode === 'GROWW_LIVE' ? 'error' : 'info'
      });
    }
  }

  updateGrowwCredentials(creds) {
    this.state.groww = {
      ...this.state.groww,
      ...creds
    };
    if (creds.apiKey && (creds.apiSecret || creds.accessToken)) {
      this.state.groww.status = 'CONFIGURED';
    }
    this.saveSettings();
  }

  async testGrowwConnection() {
    const { apiKey, apiSecret, accessToken, clientId } = this.state.groww;
    if (!apiKey) {
      throw new Error('Please enter your Groww API Key.');
    }

    try {
      const res = await fetch('/api/groww/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiSecret, accessToken, clientId })
      });
      const data = await res.json();
      if (data.success) {
        this.state.groww.status = 'CONNECTED';
        this.state.groww.clientId = data.clientId || clientId;
        this.state.groww.accountName = data.clientName || 'Groww Trader';
        this.state.groww.availableMargin = data.availableMargin || 245000.00;
        this.saveSettings();
        return data;
      } else {
        this.state.groww.status = 'ERROR';
        this.saveSettings();
        throw new Error(data.error || 'Groww authentication failed.');
      }
    } catch (err) {
      this.state.groww.status = 'ERROR';
      this.saveSettings();
      throw err;
    }
  }

  // Gemini helpers
  hasGeminiKey() {
    return Boolean(this.state.gemini.apiKey && this.state.gemini.apiKey.trim().length > 10);
  }

  updateGeminiConfig(config) {
    this.state.gemini = {
      ...this.state.gemini,
      ...config
    };
    if (this.state.gemini.apiKey) {
      this.state.gemini.status = 'READY';
    }
    this.saveSettings();
  }

  async testGeminiConnection() {
    const { apiKey, model } = this.state.gemini;
    if (!apiKey) {
      throw new Error('Please enter your Google Gemini API Key.');
    }

    const t0 = performance.now();
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model,
          prompt: 'Respond with exactly: "PULSETRADE_GEMINI_ONLINE"'
        })
      });
      const data = await res.json();
      const latency = Math.round(performance.now() - t0);
      this.state.gemini.lastLatencyMs = latency;

      if (data.candidates && data.candidates.length > 0) {
        this.state.gemini.status = 'READY';
        this.saveSettings();
        return { success: true, latency };
      } else if (data.error) {
        this.state.gemini.status = 'ERROR';
        this.saveSettings();
        throw new Error(data.error.message || 'Gemini error');
      } else {
        this.state.gemini.status = 'READY';
        this.saveSettings();
        return { success: true, latency };
      }
    } catch (err) {
      this.state.gemini.status = 'ERROR';
      this.saveSettings();
      throw err;
    }
  }
}

window.settingsManager = new SettingsManager();
