# Copy-Ready Prompts for Stitch

Use `DESIGN.md` as the shared design-system source. Generate the Dashboard first, then use the relevant prompt below for each additional screen. Keep the same navigation shell, tokens, typography, and component patterns across all outputs.

## Prompt 1 — Dashboard

```text
Create the Grovique Dashboard / Market Overview screen as a high-fidelity desktop
web dashboard, with responsive tablet and mobile adaptations.

Use the Grovique DESIGN.md exactly. The visual direction is a premium, quietly
powerful market terminal: deep blue-black background (#080D16), layered charcoal-blue
surfaces (#111B2B), fine borders (#26364B), refined sans-serif typography, tabular numerals,
and restrained mint accents (#54E0C1). Use the Growth Signal brand motif sparingly.

Include: left sidebar navigation; top bar with global stock search, market session
status, feed connection/freshness status, and profile; page title; index summary
cards; market breadth panel; top movers table; high-volume instruments; personal
watchlist; saved scanner presets; and recent informational alerts.

Use realistic but fictional sample data and clearly mark it as sample. Every
quote row must show a timestamp or freshness state. Make the hierarchy excellent:
the most important market values should be easy to scan in seconds. Avoid clutter,
large gradients, crypto-casino neon, and any buy/sell order buttons.
```

## Prompt 2 — Stock Scanner

```text
Create the Grovique Stock Scanner screen. Reuse the exact sidebar, top bar,
typography, colours, spacing, and components from the existing Grovique Dashboard.

The screen should feel like a professional analytics workspace. Put configurable
filters in a left panel with collapsible groups: instrument universe, price and
change, liquidity and volume, volatility, trend context, and momentum context.
Show active filter chips, Apply, Reset, and Save Preset controls.

The results table should include symbol, exchange, LTP, change %, volume, VWAP
relation, RSI with timeframe, matched rules, and data freshness. Include a side
drawer titled “Why this matched” that lists each matched and unmatched condition,
the actual measured value, timeframe/parameters, and data timestamps.

Use fictional sample values. Do not call the results recommendations or winners.
Do not create win-probability scores, guaranteed-profit labels, or order buttons.
Include empty, loading, and stale-data states.
```

## Prompt 3 — Stock Detail

```text
Create the Grovique Stock Detail screen using the established Grovique design
system and navigation shell.

The header should show company name, ticker, exchange, LTP, absolute/percentage
change, and a clearly visible freshness label with last-update time. Add secondary
actions for Add to Watchlist and Create Alert.

The main area should be dominated by a clean candlestick chart with volume,
timeframe selector, crosshair tooltip, and optional VWAP / EMA / RSI / MACD
controls. Include a compact OHLC summary, quote details panel, and tabs for
Overview, Technicals, Scanner Context, and Notes. A market-depth panel may appear
only as a clearly labelled data module.
```

## Prompt 4 — Watchlists

```text
Create the Grovique Watchlists screen with the same established design system.
Include a watchlist selector, create-watchlist action, add-symbol search, sorting,
and a clean dense desktop table that becomes readable compact cards on mobile.
```

## Prompt 5 — Market Activity

```text
Create a Grovique Market Activity screen consistent with the rest of the product.
Show ranked tables for highest traded volume, highest traded value, largest
percentage moves, and relative volume only when a valid time-matched baseline
exists. Include exchange/universe and time-window selectors.
```

## Prompt 6 — Alerts

```text
Create the Grovique Alerts screen using the existing design system. Divide the
page into Active, Triggered, Paused, and Expired alerts. Each alert row should show
instrument, condition, threshold, state, created time, and last trigger time.
```

## Prompt 7 — Paper Journal

```text
Create the Grovique Paper Journal screen. Reuse the same design system. Place a
high-visibility but tasteful banner at the top reading:
“SIMULATED — NOT A REAL BROKER ACCOUNT”.
```

## Prompt 8 — Learning Centre

```text
Create the Grovique Learning Centre as a clean editorial area inside the same
financial analytics product. Keep the shared sidebar and top bar. Include topic
search, category filters, readable learning cards, and an article detail layout.
```

## Prompt 9 — Settings

```text
Create the Grovique Settings screen in the established design system. Use a
simple settings navigation with sections for profile/security, default watchlist,
default chart interval, display density, theme, timezone, number formatting,
notification preferences, data-provider information, and personal data export
or deletion.
```
