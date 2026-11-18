# Stock Scanner & Research Signals Specification

## 1. Core Philosophy
The GROVIQUE Scanner is a **transparent research and discovery tool**, not a black-box signal generator. Every result presented must be fully explainable.

## 2. Filter Dimensions
1. **Universe & Exchange**:
   - Exchanges: `NSE`, `BSE`.
   - Universes: `NIFTY 50`, `NIFTY NEXT 50`, `NIFTY MIDCAP 100`, `ALL_EQUITIES`.
2. **Price & Momentum**:
   - LTP Min/Max.
   - Day Change Percentage Range (-10% to +10%).
3. **Liquidity & Volume**:
   - Minimum Share Volume.
   - Minimum Traded Turnover (₹ Crores).
   - Relative Volume (RVOL): Ratio of current volume to 20-day historical time-matched average ($RVOL \ge 1.5x$, $2.0x$).
4. **Trend Alignment**:
   - Price vs Session VWAP: `ABOVE_VWAP`, `BELOW_VWAP`.
   - Exponential Moving Average: `9 EMA > 20 EMA`, `Price > 50 EMA`, `Price > 200 EMA`.
5. **Momentum Indicators**:
   - RSI (14-period): Oversold ($<30$), Neutral ($40-60$), Bullish Momentum ($>60$).
   - MACD: Signal line crossover, Expanding histogram.
6. **Volatility & Range**:
   - 15-Minute Opening Range Breakout: `ABOVE_ORH`, `BELOW_ORL`.
   - ATR (Average True Range).

## 3. "Why This Matched" Side Drawer Specification
When any stock row is selected:
- Slide-over panel opens titled **"Why this matched"**.
- Lists every active filter rule.
- For each rule, displays:
  - Condition Name & Description.
  - Required Threshold (e.g., $RVOL \ge 1.5x$).
  - Measured Value (e.g., $2.14x$).
  - Status Badge: `MATCHED` (Green) or `UNMATCHED` (Gray).
  - Timeframe & timestamp of evaluation.
