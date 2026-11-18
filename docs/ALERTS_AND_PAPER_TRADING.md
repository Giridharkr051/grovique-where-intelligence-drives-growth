# Alerts & Paper Trading Journal Specification

## 1. Alerts Centre
- **Informational Notice**: Alerts are strictly educational notifications to aid research. Grovique will NEVER automatically place real orders on broker accounts based on alerts.
- **Alert Types**:
  - Price Cross Above / Below (e.g. `RELIANCE >= ₹1350`).
  - Percentage Move (e.g. `TCS +2.5% intraday`).
  - Relative Volume Surge (e.g. `RVOL >= 2.0x`).
  - Technical Indicator Trigger (e.g. `Price crosses above VWAP`, `RSI(14) > 65`).
- **States**: `Active`, `Triggered`, `Paused`, `Expired`.

---

## 2. Paper Trading Journal

### Mandatory High-Visibility Banner
```
⚠️ SIMULATED — NOT A REAL BROKER ACCOUNT
This journal records hypothetical research ideas only. No real money or exchange orders are involved.
```

### Journal Record Schema
- **Instrument**: Symbol and exchange (e.g. `RELIANCE [NSE:EQ]`).
- **Direction**: Long (Hypothetical Buy) or Short (Hypothetical Sell).
- **Hypothetical Entry Price**: Recorded at moment of creation.
- **Target & Stop Loss**: User-defined levels for risk-reward ratio evaluation.
- **Quantity**: Sized based on simulated capital.
- **Research Thesis**: Detailed notes explaining rationale (e.g. *15m ORB breakout with >1.8x volume and VWAP support*).
- **Friction Modelling**: Realistic Indian transaction friction applied (₹20 flat brokerage + 0.05% slippage and STT).
- **Hypothetical P&L**: Calculated dynamically based on live market price.
