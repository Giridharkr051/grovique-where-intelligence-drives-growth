// Multi-Agent Swarm Client for GROVIQUE LIVE
// Handles real-time agent dispatch, message passing visualization, thought stream, and execution ticket synthesis.

class AgentSwarmClient {
  constructor() {
    this.agents = [
      { id: "scout", name: "Agent Scout", role: "Macro & Corporate News", avatar: "newspaper", color: "#00F0FF", status: "READY" },
      { id: "analyser", name: "Agent Analyser", role: "Price Action & Quant", avatar: "query_stats", color: "#00FF88", status: "READY" },
      { id: "picker", name: "Agent Picker", role: "Stock Selection & Alpha", avatar: "fact_check", color: "#FFB800", status: "READY" },
      { id: "risk", name: "Agent Risk", role: "Capital Preservation & RMS", avatar: "security", color: "#FF2A6D", status: "READY" },
      { id: "orchestrator", name: "Agent Orchestrator", role: "Lead Synthesis & Order", avatar: "military_tech", color: "#9d4edd", status: "READY" }
    ];

    this.activeLog = [];
    this.latestPipelineResult = null;
    this.isRunning = false;
    this.currentPhase = "IDLE";
  }

  logMessage(agentId, role, text, type = "info") {
    const agent = this.agents.find(a => a.id === agentId) || { name: agentId, color: "#00FF88", avatar: "smart_toy" };
    this.activeLog.push({
      agentId,
      agentName: agent.name,
      agentRole: role,
      avatar: agent.avatar,
      color: agent.color,
      text,
      type,
      time: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })
    });
    this.notifyUi();
  }

  notifyUi() {
    const logContainer = document.getElementById('agentSwarmTerminalLog');
    if (logContainer) {
      logContainer.innerHTML = this.renderLogsHtml();
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }

  renderLogsHtml() {
    if (this.activeLog.length === 0) {
      return `
        <div class="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs p-6 text-center">
          <span class="material-symbols-outlined text-[36px] mb-2 text-slate-600">groups</span>
          <span>Multi-Agent Swarm is standing by.</span>
          <span class="text-[10px] text-slate-600 mt-1">Select a stock and click "Deploy Multi-Agent Swarm" to start cooperative analysis.</span>
        </div>
      `;
    }

    return this.activeLog.map(msg => `
      <div class="p-2.5 rounded-lg bg-[#0E131F] border border-slate-800/80 flex flex-col gap-1 font-mono text-xs animate-fadeIn">
        <div class="flex items-center justify-between text-[10px]">
          <div class="flex items-center gap-1.5 font-bold" style="color: ${msg.color}">
            <span class="material-symbols-outlined text-[13px]">${msg.avatar}</span>
            <span>${msg.agentName}</span>
            <span class="text-slate-500">• ${msg.agentRole}</span>
          </div>
          <span class="text-slate-500">${msg.time} IST</span>
        </div>
        <div class="text-slate-200 text-[11px] leading-relaxed pl-5 whitespace-pre-line border-l-2 ml-1" style="border-color: ${msg.color}40">
          ${msg.text}
        </div>
      </div>
    `).join('');
  }

  async runSwarm(symbol) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.activeLog = [];
    symbol = (symbol || window.marketStream.selectedSymbol || 'RELIANCE').toUpperCase();

    if (window.arcadeAudio) window.arcadeAudio.playBlip();

    this.logMessage("orchestrator", "Lead Strategist", `🎯 Initiating autonomous multi-agent pipeline for ${symbol}...`, "highlight");

    const apiKey = window.settingsManager ? window.settingsManager.geminiApiKey : "";

    // Step 1: Scout
    this.setAgentStatus("scout", "WORKING");
    this.logMessage("scout", "Macro & News", `Scanning global crude, US 10Y yields, RBI liquidity, and latest corporate filings for ${symbol}...`);

    try {
      const res = await fetch('/api/agents/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, apiKey })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      this.latestPipelineResult = data;

      // Simulate staggered cooperative deliberation visualization
      await new Promise(r => setTimeout(r, 400));
      this.setAgentStatus("scout", "COMPLETE");
      this.logMessage("scout", "Macro & News", `✓ Intelligence report ready: Sentiment is ${data.scoutReport.sentimentLabel} (Score: ${data.scoutReport.sentimentScore}).\n${data.scoutReport.summary}`);

      // Step 2: Analyser
      await new Promise(r => setTimeout(r, 400));
      this.setAgentStatus("analyser", "WORKING");
      this.logMessage("analyser", "Price Action & Quant", `Evaluating VWAP distance (${data.analyserReport.metrics.vwapDistancePct}%), 9/20 EMA alignment, and RSI(${data.analyserReport.metrics.rsi14})...`);

      await new Promise(r => setTimeout(r, 500));
      this.setAgentStatus("analyser", "COMPLETE");
      this.logMessage("analyser", "Price Action & Quant", `✓ Setup Classified: ${data.analyserReport.setupType} (Conviction: ${data.analyserReport.conviction}%).\n${data.analyserReport.verdict}`);

      // Step 3: Stock Picker
      await new Promise(r => setTimeout(r, 400));
      this.setAgentStatus("picker", "WORKING");
      this.logMessage("picker", "Universe Screener", `Cross-referencing ${symbol} against 50-stock NSE universe for relative strength and volume expansion...`);

      await new Promise(r => setTimeout(r, 400));
      this.setAgentStatus("picker", "COMPLETE");
      const topSymbols = data.pickerReport.topPicks.map(p => `${p.symbol} (${p.alphaScore} pts)`).join(', ');
      this.logMessage("picker", "Universe Screener", `✓ Universe Scanned (${data.pickerReport.totalScanned} stocks). Top Sector Alpha Leaders: ${topSymbols}.`);

      // Step 4: Risk Officer
      await new Promise(r => setTimeout(r, 400));
      this.setAgentStatus("risk", "WORKING");
      this.logMessage("risk", "Capital Preservation", `Validating 1.0% portfolio risk rule, computing 5x MIS margin, and checking 15:15 IST auto-square off...`);

      await new Promise(r => setTimeout(r, 400));
      this.setAgentStatus("risk", "COMPLETE");
      const sz = data.riskReport.sizing;
      this.logMessage("risk", "Capital Preservation", `✓ Risk Approved: Size ${sz.shares} shares @ ₹${sz.entryPrice.toFixed(2)} | SL: ₹${sz.stopLossPrice.toFixed(2)} | Target: ₹${sz.targetPrice.toFixed(2)} | Margin: ₹${sz.requiredMarginINR.toLocaleString('en-IN')} (5x MIS).`);

      // Step 5: Orchestrator Synthesis
      await new Promise(r => setTimeout(r, 500));
      this.setAgentStatus("orchestrator", "WORKING");
      this.logMessage("orchestrator", "Lead Strategist", `Synthesizing inputs from Scout, Analyser, Picker, and Risk Officer into executable order directive...`);

      await new Promise(r => setTimeout(r, 600));
      this.setAgentStatus("orchestrator", "COMPLETE");
      this.logMessage("orchestrator", "Lead Strategist", `🚀 ${data.orchestratorReport.directive}`, "directive");

      if (window.arcadeAudio) window.arcadeAudio.playAlertChime();
      if (window.showAppToast) {
        window.showAppToast({
          title: "Multi-Agent Consensus Reached!",
          message: `Swarm approved ${data.orchestratorReport.action} on ${symbol} with ${data.orchestratorReport.convictionScore}% conviction.`,
          type: "success"
        });
      }

    } catch (err) {
      this.logMessage("orchestrator", "Error", `❌ Swarm pipeline failed: ${err.message}`, "error");
      if (window.arcadeAudio) window.arcadeAudio.playWarning();
    } finally {
      this.isRunning = false;
      this.renderResultCards();
    }
  }

  async runUniverseScanner() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.activeLog = [];

    this.setAgentStatus("picker", "WORKING");
    this.logMessage("picker", "Stock Selection", "📡 Scanning entire 50-stock NSE universe for Opening Range breakouts and volume surges...");

    try {
      const res = await fetch('/api/agents/picker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: window.settingsManager?.geminiApiKey || "" })
      });
      const data = await res.json();
      this.setAgentStatus("picker", "COMPLETE");

      this.logMessage("picker", "Stock Selection", `✓ Finished ranking ${data.totalScanned} stocks!`);
      data.topPicks.forEach((p, idx) => {
        this.logMessage("picker", `Top Pick #${idx+1}`, `⭐ ${p.symbol} - ${p.name} | Alpha: ${p.alphaScore}/100 | ${p.pattern} | Catalyst: ${p.catalyst}`);
      });

      if (window.arcadeAudio) window.arcadeAudio.playAlertChime();
    } catch (e) {
      this.logMessage("picker", "Error", `Scanner failed: ${e.message}`, "error");
    } finally {
      this.isRunning = false;
    }
  }

  setAgentStatus(agentId, status) {
    const agent = this.agents.find(a => a.id === agentId);
    if (agent) agent.status = status;
    const badge = document.getElementById(`agentStatusBadge-${agentId}`);
    if (badge) {
      if (status === "WORKING") {
        badge.className = "px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800] animate-pulse";
        badge.innerText = "WORKING...";
      } else if (status === "COMPLETE") {
        badge.className = "px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]";
        badge.innerText = "CONSENSUS";
      } else {
        badge.className = "px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400";
        badge.innerText = "READY";
      }
    }
  }

  renderResultCards() {
    const container = document.getElementById('agentSwarmVerdictContainer');
    if (!container || !this.latestPipelineResult) return;

    const res = this.latestPipelineResult;
    const orch = res.orchestratorReport;
    const risk = res.riskReport.sizing;

    container.innerHTML = `
      <div class="p-4 rounded-xl bg-[#0E131F] border border-[#9d4edd]/50 shadow-2xl flex flex-col gap-3 font-mono">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#9d4edd] text-[22px]">military_tech</span>
            <span class="text-xs uppercase font-bold text-slate-200">SWARM SYNTHESIZED DIRECTIVE</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88] font-bold text-xs">
            ${orch.convictionScore}% CONVICTION
          </span>
        </div>

        <div class="p-3 rounded-lg bg-[#141A29] border border-slate-800 text-slate-200 text-xs leading-relaxed">
          ${orch.directive}
        </div>

        <!-- Execution Ticket Details -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div class="p-2 rounded bg-[#111622] border border-slate-800 flex flex-col">
            <span class="text-[10px] text-slate-400">Action & Ticker</span>
            <span class="font-bold text-[#00FF88]">${orch.executionTicket.action} ${orch.executionTicket.symbol}</span>
          </div>
          <div class="p-2 rounded bg-[#111622] border border-slate-800 flex flex-col">
            <span class="text-[10px] text-slate-400">Position Size (5x MIS)</span>
            <span class="font-bold text-slate-100">${risk.shares} Qty (₹${risk.requiredMarginINR.toLocaleString('en-IN')})</span>
          </div>
          <div class="p-2 rounded bg-[#111622] border border-slate-800 flex flex-col">
            <span class="text-[10px] text-slate-400">Stop Loss</span>
            <span class="font-bold text-[#FF2A6D]">₹${risk.stopLossPrice.toFixed(2)}</span>
          </div>
          <div class="p-2 rounded bg-[#111622] border border-slate-800 flex flex-col">
            <span class="text-[10px] text-slate-400">Target (1:2 R:R)</span>
            <span class="font-bold text-[#00FF88]">₹${risk.targetPrice.toFixed(2)}</span>
          </div>
        </div>

        <!-- Action Button -->
        <div class="pt-1 flex gap-2">
          <button onclick="window.agentSwarmClient.sendToExecutionDrawer()"
                  class="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#9d4edd] to-[#00F0FF] text-[#090B10] font-bold text-xs shadow-lg hover:brightness-110 flex items-center justify-center gap-1.5 transition-all">
            <span class="material-symbols-outlined text-[16px]">send</span>
            <span>SEND TO LIVE EXECUTION TICKET (GROWW / PAPER)</span>
          </button>
        </div>
      </div>
    `;
  }

  sendToExecutionDrawer() {
    if (!this.latestPipelineResult) return;
    const ticket = this.latestPipelineResult.orchestratorReport.executionTicket;
    const risk = this.latestPipelineResult.riskReport.sizing;

    if (window.app) {
      window.app.openStockInDrawer(ticket.symbol, {
        direction: ticket.action,
        entryPrice: risk.entryPrice,
        stopLoss: risk.stopLossPrice,
        target: risk.targetPrice,
        quantity: risk.shares
      });
      if (window.showAppToast) {
        window.showAppToast({
          title: "Order Ticket Pre-Filled!",
          message: `Swarm parameters for ${ticket.symbol} transferred to Execution Drawer.`,
          type: "success"
        });
      }
    }
  }
}

window.agentSwarmClient = new AgentSwarmClient();
