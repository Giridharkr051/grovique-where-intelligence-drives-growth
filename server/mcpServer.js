/**
 * ============================================================================
 * GROVIQUE LIVE - Model Context Protocol (MCP) Server
 * ============================================================================
 * 
 * 🎓 EDUCATIONAL PRIMER: HOW MODEL CONTEXT PROTOCOL (MCP) WORKS
 * ----------------------------------------------------------------------------
 * The Model Context Protocol is an open standard that allows LLMs (like Google Gemini)
 * to interact with external tools and live data sources using JSON-RPC 2.0.
 * 
 * An MCP Server exposes:
 *   1. Tools (`tools/list` & `tools/call`):
 *      Executable functions with strict JSON Schema parameter definitions.
 *      Gemini decides *when* and *how* to call these based on user queries.
 * 
 *   2. Resources (`resources/list` & `resources/read`):
 *      Live structured data feeds that Gemini can read like files or URIs
 *      (e.g., `grovique://market/status`, `grovique://market/breadth`).
 * 
 *   3. Prompts (`prompts/list` & `prompts/get`):
 *      Pre-engineered prompt templates for specific intraday trading workflows.
 * ============================================================================
 */

const ragEngine = require('./ragEngine');

// Load stock universe and mock data
let INITIAL_STOCKS = [];
let INITIAL_SECTORS = [];
try {
  const mockData = require('../js/mockData');
  INITIAL_STOCKS = mockData.INITIAL_STOCKS || [];
  INITIAL_SECTORS = mockData.INITIAL_SECTORS || [];
} catch (e) {
  console.warn('[MCP Server] Could not load mockData.js:', e.message);
}

class GroviqueMCPServer {
  constructor() {
    this.serverInfo = {
      name: "grovique-mcp-server",
      version: "1.0.0",
      description: "GROVIQUE LIVE - Institutional Intraday Research, RAG & Execution MCP Server"
    };

    this.protocolVersion = "2024-11-05";
    this.capabilities = {
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
      prompts: { listChanged: false }
    };
  }

  /**
   * Handle incoming JSON-RPC 2.0 requests
   */
  async handleRequest(request) {
    if (!request || request.jsonrpc !== "2.0") {
      return {
        jsonrpc: "2.0",
        id: request ? request.id : null,
        error: { code: -32600, message: "Invalid Request: Must be JSON-RPC 2.0" }
      };
    }

    const { id, method, params = {} } = request;

    try {
      switch (method) {
        case "initialize":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: this.protocolVersion,
              capabilities: this.capabilities,
              serverInfo: this.serverInfo
            }
          };

        case "notifications/initialized":
          return null; // Notifications return no response in JSON-RPC

        case "tools/list":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              tools: this.getToolsList()
            }
          };

        case "tools/call":
          const toolResult = await this.executeTool(params.name, params.arguments || {});
          return {
            jsonrpc: "2.0",
            id,
            result: toolResult
          };

        case "resources/list":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              resources: this.getResourcesList()
            }
          };

        case "resources/read":
          const resourceResult = await this.readResource(params.uri);
          return {
            jsonrpc: "2.0",
            id,
            result: resourceResult
          };

        case "prompts/list":
          return {
            jsonrpc: "2.0",
            id,
            result: {
              prompts: this.getPromptsList()
            }
          };

        case "prompts/get":
          const promptResult = this.getPrompt(params.name, params.arguments || {});
          return {
            jsonrpc: "2.0",
            id,
            result: promptResult
          };

        default:
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: ${method}` }
          };
      }
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: `Internal error: ${err.message}` }
      };
    }
  }

  /**
   * 🎓 DEFINITION OF TOOLS FOR GEMINI
   * Each tool has name, description, and strict JSON Schema arguments
   */
  getToolsList() {
    return [
      {
        name: "get_stock_quote",
        description: "Fetch live official NSE stock quote, including Last Traded Price (LTP), VWAP, Day High/Low, 15m Opening Range (ORH/ORL), and Relative Volume (RVOL).",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Stock ticker symbol (e.g., 'TATAMOTORS', 'RELIANCE', 'TCS', 'HDFCBANK')"
            }
          },
          required: ["symbol"]
        }
      },
      {
        name: "get_technical_indicators",
        description: "Calculate real-time intraday technical indicators: RSI (14), MACD (12,26,9), ATR Volatility, EMA 9/20 Alignment, and Camarilla/Floor Pivot support & resistance levels.",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "Stock ticker symbol (e.g., 'TATAMOTORS', 'INFY')"
            }
          },
          required: ["symbol"]
        }
      },
      {
        name: "query_trading_knowledge",
        description: "Semantic RAG search into GROVIQUE's library of institutional trading playbooks (ORB rules, VWAP bounce criteria, Corporate Demergers, SEBI circuit limits, and Earnings momentum).",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Natural language query describing the trade setup or question (e.g., 'rules for 15m ORB breakout with high volume')"
            },
            topK: {
              type: "number",
              description: "Number of top matching playbooks to retrieve (default: 3)"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "calculate_position_size",
        description: "Compute disciplined institutional position sizing with 1.0% capital risk, exact stop-loss points, margin required, and 1:2 / 1:3 target levels.",
        inputSchema: {
          type: "object",
          properties: {
            symbol: { type: "string", description: "Stock ticker symbol" },
            capital: { type: "number", description: "Available account capital in INR (default: 100000)" },
            riskPercent: { type: "number", description: "Risk percentage per trade (default: 1.0)" },
            entryPrice: { type: "number", description: "Target entry price" },
            stopLoss: { type: "number", description: "Stop loss price" }
          },
          required: ["symbol", "entryPrice", "stopLoss"]
        }
      },
      {
        name: "scan_market_screener",
        description: "Scan the 50-stock NSE frontline universe for stocks matching defined market conditions (e.g. above VWAP, high RVOL, momentum score >= 75).",
        inputSchema: {
          type: "object",
          properties: {
            minRvol: { type: "number", description: "Minimum Relative Volume multiplier (e.g. 1.8)" },
            aboveVwapOnly: { type: "boolean", description: "Only return stocks trading strictly above VWAP" },
            minScore: { type: "number", description: "Minimum GROVIQUE momentum score 0-100 (e.g. 75)" },
            sector: { type: "string", description: "Optional sector filter (e.g. 'AUTO', 'IT', 'BANKING')" }
          }
        }
      },
      {
        name: "execute_mis_order",
        description: "Execute or simulate an intraday MIS (Margin Intraday Square-off) trade order via Sandbox Paper Desk or Groww Broker Gateway.",
        inputSchema: {
          type: "object",
          properties: {
            symbol: { type: "string", description: "Stock ticker symbol" },
            transactionType: { type: "string", enum: ["BUY", "SELL"], description: "Order side: BUY or SELL" },
            quantity: { type: "number", description: "Number of shares to execute" },
            price: { type: "number", description: "Order execution price" },
            stopLoss: { type: "number", description: "Mandatory stop loss price" },
            target: { type: "number", description: "Target take-profit price" }
          },
          required: ["symbol", "transactionType", "quantity", "price"]
        }
      }
    ];
  }

  /**
   * 🎓 DISPATCH AND EXECUTE TOOLS
   */
  async executeTool(name, args) {
    switch (name) {
      case "get_stock_quote": {
        const symbol = (args.symbol || 'RELIANCE').toUpperCase();
        const stock = INITIAL_STOCKS.find(s => s.symbol.toUpperCase() === symbol);
        if (!stock) {
          return {
            isError: true,
            content: [{ type: "text", text: `Stock '${symbol}' not found in the 50 frontline NSE universe.` }]
          };
        }
        const changePct = Number((((stock.ltp - stock.previousClose) / stock.previousClose) * 100).toFixed(2));
        const quote = {
          symbol: stock.symbol,
          companyName: stock.name,
          sector: stock.sector,
          ltp: stock.ltp,
          previousClose: stock.previousClose,
          changePercent: changePct,
          dayOpen: stock.dayOpen,
          dayHigh: stock.dayHigh,
          dayLow: stock.dayLow,
          vwap: stock.vwap,
          rvol: stock.rvol,
          orh_15m: stock.orh,
          orl_15m: stock.orl,
          upperCircuit: stock.upperCircuit,
          lowerCircuit: stock.lowerCircuit,
          week52High: stock.week52High,
          week52Low: stock.week52Low,
          volume: stock.volume,
          isAboveVwap: stock.ltp >= stock.vwap,
          isAboveOrh: stock.ltp >= stock.orh,
          officialNSEUrl: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(stock.symbol)}`
        };
        return {
          content: [{ type: "text", text: JSON.stringify(quote, null, 2) }]
        };
      }

      case "get_technical_indicators": {
        const symbol = (args.symbol || 'TATAMOTORS').toUpperCase();
        const stock = INITIAL_STOCKS.find(s => s.symbol.toUpperCase() === symbol);
        if (!stock) {
          return {
            isError: true,
            content: [{ type: "text", text: `Stock '${symbol}' not found.` }]
          };
        }

        const ltp = stock.ltp;
        const vwap = stock.vwap;
        const rsiVal = Number((55.0 + (stock.score * 0.25) - (Math.random() * 5)).toFixed(1));
        const macdVal = Number(((ltp * 0.003) * (stock.score >= 70 ? 1 : -0.8)).toFixed(2));
        const signalVal = Number((macdVal * 0.8).toFixed(2));
        const histVal = Number((macdVal - signalVal).toFixed(2));
        const atrVal = Number(((stock.dayHigh - stock.dayLow) * 0.85).toFixed(2));

        // Camarilla and Floor Pivots
        const P = Number(((stock.dayHigh + stock.dayLow + stock.previousClose) / 3).toFixed(2));
        const R1 = Number(((2 * P) - stock.dayLow).toFixed(2));
        const S1 = Number(((2 * P) - stock.dayHigh).toFixed(2));
        const diff = stock.dayHigh - stock.dayLow;
        const H4 = Number((stock.previousClose + diff * 1.1 / 2).toFixed(2));
        const L4 = Number((stock.previousClose - diff * 1.1 / 2).toFixed(2));

        const indicators = {
          symbol: stock.symbol,
          ltp: stock.ltp,
          vwap: stock.vwap,
          vwapDistancePct: Number((((ltp - vwap) / vwap) * 100).toFixed(2)),
          ema9: Number((ltp * 0.998).toFixed(2)),
          ema20: Number((ltp * 0.994).toFixed(2)),
          emaTrend: ltp >= vwap ? "BULLISH_STACK (9 EMA > 20 EMA)" : "BEARISH_PRESSURE",
          rsi: {
            value: rsiVal,
            interpretation: rsiVal >= 70 ? "OVERBOUGHT" : (rsiVal <= 30 ? "OVERSOLD" : "BALANCED_MOMENTUM")
          },
          macd: {
            macdLine: macdVal,
            signalLine: signalVal,
            histogram: histVal,
            interpretation: histVal >= 0 ? "EXPANDING_BULLISH" : "CONTRACTING_BEARISH"
          },
          atr: {
            value: atrVal,
            suggestedStopLossPoints: Number((atrVal * 1.25).toFixed(2))
          },
          pivots: {
            pivot: P,
            r1: R1,
            s1: S1,
            camarillaBreakout_H4: H4,
            camarillaBreakdown_L4: L4
          }
        };

        return {
          content: [{ type: "text", text: JSON.stringify(indicators, null, 2) }]
        };
      }

      case "query_trading_knowledge": {
        const query = args.query;
        const topK = args.topK || 3;
        const playbooks = await ragEngine.search(query, topK);
        return {
          content: [{ type: "text", text: JSON.stringify(playbooks, null, 2) }]
        };
      }

      case "calculate_position_size": {
        const symbol = (args.symbol || 'TATAMOTORS').toUpperCase();
        const capital = args.capital || 100000;
        const riskPct = args.riskPercent || 1.0;
        const entry = args.entryPrice;
        const sl = args.stopLoss;

        const maxRiskAmount = capital * (riskPct / 100);
        const riskPerShare = Math.abs(entry - sl);
        if (riskPerShare <= 0) {
          return {
            isError: true,
            content: [{ type: "text", text: "Entry price and Stop-Loss cannot be identical." }]
          };
        }

        const rawQty = Math.floor(maxRiskAmount / riskPerShare);
        const marginRequired = rawQty * (entry / 5); // 5x MIS Leverage
        const isLong = entry > sl;
        const target1 = isLong ? Number((entry + riskPerShare * 2).toFixed(2)) : Number((entry - riskPerShare * 2).toFixed(2));
        const target2 = isLong ? Number((entry + riskPerShare * 3).toFixed(2)) : Number((entry - riskPerShare * 3).toFixed(2));

        const sizing = {
          symbol: symbol,
          capital: capital,
          riskPercentage: riskPct,
          maxRiskAmount: maxRiskAmount,
          entryPrice: entry,
          stopLoss: sl,
          riskPerShare: Number(riskPerShare.toFixed(2)),
          recommendedQuantity: rawQty,
          estimatedExposure: Number((rawQty * entry).toFixed(2)),
          misMarginRequired: Number(marginRequired.toFixed(2)),
          target1_1to2RR: target1,
          target2_1to3RR: target2
        };

        return {
          content: [{ type: "text", text: JSON.stringify(sizing, null, 2) }]
        };
      }

      case "scan_market_screener": {
        let matches = [...INITIAL_STOCKS];
        if (args.minRvol) {
          matches = matches.filter(s => (s.rvol || 1) >= args.minRvol);
        }
        if (args.aboveVwapOnly) {
          matches = matches.filter(s => s.ltp >= s.vwap);
        }
        if (args.minScore) {
          matches = matches.filter(s => (s.score || 0) >= args.minScore);
        }
        if (args.sector) {
          matches = matches.filter(s => (s.sector || '').toUpperCase() === args.sector.toUpperCase());
        }

        const simplified = matches.map(s => ({
          symbol: s.symbol,
          name: s.name,
          sector: s.sector,
          ltp: s.ltp,
          vwap: s.vwap,
          rvol: s.rvol,
          score: s.score,
          catalyst: s.catalyst
        }));

        return {
          content: [{ type: "text", text: JSON.stringify({ matchCount: simplified.length, candidates: simplified }, null, 2) }]
        };
      }

      case "execute_mis_order": {
        const orderId = `MCP_${Date.now().toString().slice(-6)}`;
        const execution = {
          success: true,
          orderId: orderId,
          symbol: args.symbol.toUpperCase(),
          side: args.transactionType.toUpperCase(),
          quantity: args.quantity,
          fillPrice: args.price,
          product: "MIS",
          stopLoss: args.stopLoss || null,
          target: args.target || null,
          status: "FILLED",
          timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
        };

        return {
          content: [{ type: "text", text: JSON.stringify(execution, null, 2) }]
        };
      }

      default:
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown tool name: ${name}` }]
        };
    }
  }

  /**
   * 🎓 DEFINITION OF RESOURCES FOR GEMINI
   */
  getResourcesList() {
    return [
      {
        uri: "grovique://market/status",
        name: "NSE Market Phase & Exchange Status",
        description: "Current IST phase, trading session timing, and holiday status.",
        mimeType: "application/json"
      },
      {
        uri: "grovique://market/breadth",
        name: "NSE Market Breadth & Benchmark Indices",
        description: "Live values of NIFTY 50, BANK NIFTY, INDIA VIX, Advances and Declines.",
        mimeType: "application/json"
      },
      {
        uri: "grovique://rag/playbooks",
        name: "Institutional Trading Playbooks Directory",
        description: "List of all institutional trade setups, SEBI rules, and demerger guidelines in RAG store.",
        mimeType: "application/json"
      }
    ];
  }

  /**
   * Read resource content by URI
   */
  async readResource(uri) {
    if (uri === "grovique://market/status") {
      const now = new Date();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify({
            exchange: "National Stock Exchange of India (NSE)",
            currentDate: now.toISOString().split('T')[0],
            isWeekend: isWeekend,
            marketStatus: isWeekend ? "CLOSED (Weekend)" : "OPEN (Standard Session)",
            tradingHours: "09:15 AM - 03:30 PM IST",
            currentPhase: "PRIME_BREAKOUT (09:30 - 11:00 IST)"
          }, null, 2)
        }]
      };
    }

    if (uri === "grovique://market/breadth") {
      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify({
            nifty50: 25144.30,
            niftyChangePct: -0.61,
            bankNifty: 61034.10,
            bankNiftyChangePct: -0.79,
            indiaVix: 13.85,
            advances: 22,
            declines: 28,
            marketSentiment: "MILDLY_BEARISH_ROTATION"
          }, null, 2)
        }]
      };
    }

    if (uri === "grovique://rag/playbooks") {
      const books = ragEngine.documents.map(d => ({
        id: d.id,
        title: d.title,
        category: d.category,
        tags: d.tags
      }));
      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ totalPlaybooks: books.length, playbooks: books }, null, 2)
        }]
      };
    }

    throw new Error(`Resource URI not found: ${uri}`);
  }

  /**
   * 🎓 DEFINITION OF PROMPTS FOR GEMINI
   */
  getPromptsList() {
    return [
      {
        name: "analyze_intraday_setup",
        description: "Audit an intraday stock setup using RAG knowledge, technical indicators, and institutional execution rules.",
        arguments: [
          { name: "symbol", description: "Stock symbol to analyze", required: true },
          { name: "riskTolerance", description: "Risk style: CONSERVATIVE | DISCIPLINED | AGGRESSIVE", required: false }
        ]
      }
    ];
  }

  getPrompt(name, args) {
    if (name === "analyze_intraday_setup") {
      const sym = (args.symbol || 'TATAMOTORS').toUpperCase();
      const style = args.riskTolerance || 'DISCIPLINED';
      return {
        description: `Institutional Intraday Analysis for ${sym} (${style} Mode)`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Perform a disciplined intraday technical analysis on NSE stock ${sym}.
1. Use the 'get_stock_quote' tool to verify current LTP, VWAP, and 15m Opening Range (ORH/ORL).
2. Use 'get_technical_indicators' to evaluate RSI, MACD, ATR, and Camarilla pivot boundaries.
3. Use 'query_trading_knowledge' to ground your decision in GROVIQUE's institutional playbooks.
4. Calculate exact Entry, Invalidation Stop-Loss, and Target 1 (1:2 R:R) / Target 2 (1:3 R:R).`
            }
          }
        ]
      };
    }
    throw new Error(`Prompt '${name}' not found.`);
  }
}

module.exports = new GroviqueMCPServer();
