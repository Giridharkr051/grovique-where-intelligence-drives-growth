// GROVIQUE LIVE - Client-side RAG & Model Context Protocol (MCP) Client
// Connects the terminal UI to backend Vector RAG searches and MCP JSON-RPC 2.0 tool execution

class RagMcpClient {
  constructor() {
    this.tools = [];
    this.resources = [];
    this.playbooks = [];
    this.lastMcpExecution = null;
    this.listeners = [];
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

  /**
   * 🎓 Send JSON-RPC 2.0 request to GROVIQUE MCP Server
   */
  async sendMcpRequest(method, params = {}) {
    try {
      const payload = {
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params
      };

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`MCP HTTP error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(`MCP Error [${data.error.code}]: ${data.error.message}`);
      }

      return data.result;
    } catch (err) {
      console.warn(`[RagMcpClient] MCP request '${method}' failed:`, err);
      throw err;
    }
  }

  /**
   * Fetch all registered MCP Tools
   */
  async listTools() {
    try {
      const res = await this.sendMcpRequest("tools/list");
      this.tools = res.tools || [];
      return this.tools;
    } catch (e) {
      return [];
    }
  }

  /**
   * Execute an MCP Tool by name
   */
  async callTool(name, args = {}) {
    const startTime = performance.now();
    try {
      const res = await this.sendMcpRequest("tools/call", {
        name,
        arguments: args
      });
      const latencyMs = Number((performance.now() - startTime).toFixed(1));
      
      let parsedContent = null;
      if (res && res.content && res.content[0] && res.content[0].text) {
        try {
          parsedContent = JSON.parse(res.content[0].text);
        } catch (e) {
          parsedContent = res.content[0].text;
        }
      }

      this.lastMcpExecution = {
        tool: name,
        args,
        result: parsedContent || res,
        latencyMs,
        timestamp: new Date().toLocaleTimeString('en-IN')
      };
      this.notify();
      return this.lastMcpExecution;
    } catch (err) {
      this.lastMcpExecution = {
        tool: name,
        args,
        error: err.message,
        latencyMs: Number((performance.now() - startTime).toFixed(1)),
        timestamp: new Date().toLocaleTimeString('en-IN')
      };
      this.notify();
      throw err;
    }
  }

  /**
   * Fetch live MCP Resources
   */
  async listResources() {
    try {
      const res = await this.sendMcpRequest("resources/list");
      this.resources = res.resources || [];
      return this.resources;
    } catch (e) {
      return [];
    }
  }

  /**
   * Read MCP Resource content
   */
  async readResource(uri) {
    try {
      const res = await this.sendMcpRequest("resources/read", { uri });
      return res;
    } catch (e) {
      throw e;
    }
  }

  /**
   * 🎓 Query RAG Vector Store with a Natural Language Query
   */
  async queryRAG(query, topK = 3) {
    try {
      const settings = window.settingsManager ? window.settingsManager.state.gemini : { apiKey: '' };
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          topK,
          apiKey: settings.apiKey || ''
        })
      });

      if (!res.ok) throw new Error('RAG query request failed');
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('[RagMcpClient] RAG query failed:', err);
      // Fallback
      return {
        query,
        matchCount: 0,
        results: [],
        formattedContext: 'RAG retrieval unavailable offline.'
      };
    }
  }

  /**
   * Fetch full directory of institutional playbooks
   */
  async getPlaybooks() {
    try {
      const res = await fetch('/api/rag/playbooks');
      if (!res.ok) throw new Error('Failed to fetch playbooks');
      const data = await res.json();
      this.playbooks = data.playbooks || [];
      return this.playbooks;
    } catch (e) {
      return [];
    }
  }
}

// Instantiate globally
if (typeof window !== 'undefined') {
  window.ragMcpClient = new RagMcpClient();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RagMcpClient;
}
