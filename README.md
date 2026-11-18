# GROVIQUE LIVE ⚡
### *Where Intelligence Drives Growth.*

> **An Institutional-Grade Intraday Research, Technical Discovery & Execution Terminal for Indian Markets (NSE)**  
> Built with low-latency streaming, deterministic IST market phase state machines, official NSE India market parameters, Groww Trade API integration for live broker execution & quotes, Google Gemini AI intraday advisory co-pilot, multi-timeframe interactive candlestick charts, algorithmic position sizing, news intelligence, and Web Audio API feedback.

---

## 🌟 Key Capabilities & Architecture

### 1. 🔍 Global Stock Omnibox & Instant Deep-Dive
- Full-universe autocomplete search with responsive keyboard shortcut (`/`).
- Quick-access ticker buttons for high-liquidity market leaders (**RELIANCE**, **TCS**, **HDFCBANK**, **TATAMOTORS**, **INFY**, **SBIN**, **ITC**).
- Direct chart mounting and instant technical parameter computation on selection.

### 2. 📊 Multi-Timeframe Candlestick Charting Engine
- Interactive multi-timeframe views: **`1 min`**, **`5 min`**, **`1 day`**, **`1 month`**, **`1 year`**, **`3 year`**, **`5 year`**.
- Overlaid Cyan VWAP line, 15m Opening Range (ORH/ORL) breakout bands, and Previous Day High (PDH) markers.
- Level-2 Order Book with real-time market depth (5 bids / 5 asks) and spread analysis.

### 3. 📈 Intraday Technical Indicator Suite
- **VWAP & Dynamic VWAP Bands**: Measures price equilibrium and distance from volume-weighted average.
- **EMA Alignment**: Dual-period Exponential Moving Averages (`9 EMA` and `20 EMA`) with bullish/bearish momentum stacking.
- **RSI (14-Period)**: Relative Strength Index for real-time overbought/oversold momentum detection.
- **MACD (12, 26, 9)**: Moving Average Convergence Divergence line, signal line, and expanding/contracting histogram.
- **ATR Volatility & Invalidation SL**: Average True Range historical volatility with suggested stop-loss points.
- **Pivot Levels & Camarilla**: Standard Floor Pivots (P, R1, R2, S1, S2) and Camarilla Breakout/Reversal Bands (H4, H3, L3, L4).

### 4. 🇮🇳 100% Authentic NSE India Equities & Calendar
- Calibrated to official **NSE India** closing figures, corporate actions, stock splits, and demergers.
- Real-world exchange verification card with direct links to official NSE quotes (`https://www.nseindia.com/get-quotes/equity?symbol=...`).
- Automated holiday and weekend detection: markets are closed on Saturdays, Sundays, and public holidays with Friday closing state preserved.

### 5. 🤖 Google Gemini Intraday AI Co-Pilot
- Institutional intraday trade recommendations: Entry, Technical Invalidation Stop-Loss, and Target 1 (1:2 R:R) / Target 2 (1:3 R:R).
- **1-Click Auto-Fill**: Apply AI levels directly to the execution trade ticket.
- Connect your own Gemini API key (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`) in User Settings or utilize the built-in algorithmic engine.

### 6. 🏦 Groww Trade API Gateway & Python SDK Integration
- Dual Execution Environments:
  - `○ SANDBOX (Paper Desk)`: Real-time paper trading with simulated fills, live P&L tracking, and trading journal.
  - `● GROWW LIVE (Real Brokerage)`: Direct routing to your Groww Demat account for real intraday MIS execution with up to 5x margin.
- Strict RMS risk parameters: Maximum Intraday Daily Loss limit, Auto-Square Off alert (15:15 IST), and margin validation.
- **Official Python SDK Reference**: Comprehensive guide in [`docs/groww_python_sdk_guide.md`](docs/groww_python_sdk_guide.md).
- **Algorithmic Trading Bot**: 15m ORB + VWAP automated strategy runner in [`scripts/groww_intraday_bot.py`](scripts/groww_intraday_bot.py).

### 7. 🧠 Gemini Vector RAG Engine & Model Context Protocol (MCP)
- **Vector RAG Engine**: High-dimensional semantic embeddings via `text-embedding-004` with cosine similarity retrieval across NSE technical knowledge bases.
- **MCP Server & Client**: Standardized tools (`get_quote`, `get_technical_indicators`, `get_user_margin`, `place_order`) compliant with Model Context Protocol.
- **RAG & MCP Studio UI**: Interactive diagnostics suite in the terminal to inspect retrieved chunk context, similarity scores, and tool invocations in real time.

### 8. 🤖 Multi-Agent Swarm Intelligence Studio
- **5 Specialized Autonomous Agents**:
  1. **Agent Scout**: Global macro (crude, bond yields), domestic Indian policy (RBI liquidity, FII/DII flows), and corporate regulatory filings.
  2. **Agent Analyser**: Quantitative price action, VWAP distance, 9/20 EMA alignment, RSI(14) momentum, and L2 5-depth order book balance.
  3. **Agent Picker**: Universe screener scanning all 50 NSE stocks to rank and pick high-alpha intraday breakout opportunities.
  4. **Agent Risk**: Capital preservation officer enforcing the 1% risk limit, dynamic 5x MIS margin sizing, and mandatory 15:15 IST auto-square off.
  5. **Agent Orchestrator**: Lead Investment Strategist synthesizing agent deliberation into a consensus directive and execution ticket.
- **Interactive Terminal Studio**: Watch real-time message passing, thought logs, and 1-click execution routing to Groww Trade API.
- **Python Swarm Runner**: Standalone algorithmic script in [`scripts/multi_agent_swarm.py`](scripts/multi_agent_swarm.py).

### 9. 📰 News Intelligence & Market Catalyst Wire
- Real-time global, national, and company-specific news monitoring.
- AI-driven impact analysis: predicts potential price reaction, trade entry viability, and suggested win strategies.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
|:---|:---|
| `/` | Focus Global Stock Search Omnibox |
| `Space` | Toggle Slide-Over Co-Pilot Execution Drawer |
| `1` | Switch to Command Center |
| `2` | Switch to Screener & Heatmap |
| `3` | Switch to Deep-Dive & Charts |
| `4` | Switch to Watchlist & Alerts |
| `5` | Switch to Journal & Telemetry |
| `B` | Simulate Breaking Catalyst Event |
| `M` | Toggle Audio Synthesizer (Mute / Unmute) |
| `Esc` | Close Drawer or Modal |

---

## 💻 Quick Start

### Prerequisites
- Node.js (v18+)

### Run Locally
```bash
node server.js
```
Then open **`http://127.0.0.1:3000/`** in your browser.
