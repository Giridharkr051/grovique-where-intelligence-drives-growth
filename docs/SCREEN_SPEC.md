# Grovique Screen Specifications

Use `DESIGN.md` as the visual source of truth for every screen. Keep the same shell, sidebar, top bar, type scale, card shape, and data-state treatment.

## 1. Dashboard / Overview

**Goal:** Give users a calm, glanceable summary of market conditions and their own research workspace.

### Layout
- Persistent desktop left sidebar.
- Top bar with global symbol search, market session, data connection state, and profile.
- Page heading: “Market overview” with current date/session context.
- First row: 4 index/market summary cards (NIFTY 50, SENSEX, BANK NIFTY, INDIA VIX).
- Second row: market breadth panel and top movers table (Top Gainers & Losers).
- Third row: high-volume instruments and personal watchlist.
- Lower row: saved scanner presets and recent informational alerts.

### Important components
- Market status chip (`OPEN`, `PRE-OPEN`, `CLOSED`).
- Feed freshness indicator (`LIVE`, `STALE`, `DELAYED`).
- Metric cards with tabular numerals and day range indicators.
- Compact table with symbol, LTP, change %, volume, freshness.
- Small market breadth visualization with advance/decline ratio and regime tag.

### Interactions
- Click a symbol to open Stock Detail.
- Click “Open scanner” to navigate to Scanner.
- Click a saved scan card to load that preset.
- Click a recent alert to open Alert Details.

## 2. Scanner

**Goal:** Help users narrow a defined instrument universe using transparent filters.

### Layout
- Page heading “Stock scanner”.
- Short explanatory caption: “Explore instruments that match your selected conditions.”
- Filter panel on the left or in a collapsible drawer on smaller screens.
- Results table occupying the main area.
- Active filter chips above the table.
- Result count and “Scan updated” timestamp.

### Filter groups
- Universe: exchange (NSE, BSE), segment, selected list.
- Price: LTP range and percentage-change range.
- Liquidity: volume and traded-value minimums, RVOL multiplier.
- Volatility: ATR / intraday range.
- Trend: price versus VWAP / moving average (9/20/50/200 EMA).
- Momentum: RSI / MACD with period and timeframe.

### Result table
Symbol, exchange, LTP, change %, volume, VWAP relation, RSI, matched rules, freshness.

### Explainability
Selecting a row opens a side panel:
- “Why this matched”
- Each matched rule with actual value.
- Each unmatched rule.
- Calculation timeframe / parameters.
- Input data timestamps.
- Freshness and missing-data notes.

## 3. Stock Detail

**Goal:** Put quote, chart, volume, and research context together.

### Header
- Company name, symbol, exchange.
- LTP and day change.
- Prominent data freshness state and last update time.
- Add to watchlist action.
- Create alert action.

### Main content
- Large candlestick chart.
- Volume subpanel.
- Interval selector (`1m`, `5m`, `15m`, `1d`, `1w`, `1M`).
- Indicator toggles (VWAP, 9/20 EMA, Bollinger Bands).
- OHLC summary.
- Quote details panel.
- Market depth panel (5 bids / 5 asks order book).
- Tabs: Overview, Technicals, Scanner Context, Notes.

### States
- Live quote.
- Stale quote.
- Historical-only data.
- Market closed.

## 4. Watchlists

**Goal:** Let users monitor their own selected instruments.

### Layout
- Watchlist selector and create button.
- Add-symbol search.
- Sort controls.
- Desktop table; mobile compact cards.
- Quick action buttons (Deep Dive Chart, Set Alert, Remove).

### Columns
Symbol/exchange, LTP, change, change %, volume, day high/low, freshness.

## 5. Market Activity

**Goal:** Display market-wide activity summaries for a defined universe.

### Modules
- Highest traded volume.
- Highest traded value (turnover).
- Largest percentage moves (Gainers & Losers).
- Relative-volume (RVOL) view.
- Sector performance matrix with advance/decline ratio.

## 6. Alerts Centre

**Goal:** Manage informational alerts.

### Sections
- Active alerts.
- Triggered alerts.
- Paused / expired alerts.
- Alert history.

### Alert creation modal
Instrument, condition type, threshold, reference basis, cooldown, notification preference.
*Notice: Informational only; does not execute broker orders.*

## 7. Paper Trading Journal

**Goal:** Record and review hypothetical research ideas.

### Mandatory banner
`SIMULATED — NOT A REAL BROKER ACCOUNT`

### Summary
- Open simulated ideas.
- Closed ideas.
- Hypothetical gross P&L.
- User-defined cost/slippage assumptions.

### Journal form
Instrument, direction, hypothetical entry, target, stop loss, quantity, thesis, tags, notes.

## 8. Learning Centre

**Goal:** Explain market data and indicators in simple language.

### Layout
- Searchable topic library.
- Topic cards across: Market Basics, Technical Indicators, Order Flow & Depth, Risk Rules.
- Article detail modal with definition, fictional example, and limitations.

## 9. Settings

Sections:
- Profile and security.
- Default watchlist.
- Default chart interval.
- Display density & number formatting.
- Timezone.
- Data-provider information.
- Export and delete personal data.

## 10. Additional Co-Pilot Studios

- **Investment Calculators Suite**: Comprehensive multi-asset returns (SIP, Step-Up, FD, Stocks CAGR, Bonds/SGB, Inflation & FIRE).
- **Multi-Agent Swarm Studio**: 5-agent team deliberation (Scout, Analyser, Picker, Risk, Orchestrator).
- **RAG & MCP Studio**: Gemini 2.0 context protocol and vector playbooks.
