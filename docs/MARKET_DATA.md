# Market Data & Freshness Specification

## 1. Data Integrity & Freshness States
Every price, volume, and depth data point must clearly communicate its freshness state:

1. **`LIVE`**: Active tick stream receiving updates within `< 2000ms`. Marked with a pulsing luminous mint indicator.
2. **`STALE`**: No update received for $> 5000ms$. Displayed with a warning chip and last received timestamp. Never disguised as live.
3. **`DELAYED`**: Feed delivered with standard 15-minute exchange delay. Prominently labelled.
4. **`HISTORICAL`**: Market is closed or data reflects previous day closing session.
5. **`UNAVAILABLE`**: Feed temporarily offline or instrument not subscribed.
6. **`DISCONNECTED`**: Gateway or WebSocket link severed; auto-reconnection in progress.

## 2. Market Timings (Indian Standard Time - IST)
- **09:00 - 09:08 IST**: Pre-Open Order Collection.
- **09:08 - 09:15 IST**: Pre-Open Price Matching & Discovery.
- **09:15 - 15:30 IST**: Normal Market Hours (Continuous trading on NSE / BSE).
- **15:30 - 16:00 IST**: Closing Price Determination & Post-Market Session.
- **Saturdays, Sundays & Exchange Holidays**: Market Closed (Friday state preserved).

## 3. Data Source Architecture
- **Layer 1**: Official Groww Trade API REST & WebSocket SDK (`growwapi`, `GrowwFeed`).
- **Layer 2**: Local WebSocket / SSE streaming proxy server (`server.js`).
- **Layer 3**: High-fidelity deterministic NSE L1 fallback engine for off-market simulation and weekend practice.
