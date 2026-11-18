# Grovique Design System

## Overview

Grovique is a premium market research and observation dashboard. The design must communicate clarity, precision, trust, and control. It is not a trading execution interface.

**Brand line:** Grow with clarity. Analyze with confidence.

**Visual concept:** Quietly powerful market terminal.

**Brand motif:** Growth Signal — a minimal rising line ending in a single luminous point. The motif represents awareness and progress; it must not imply guaranteed price direction.

## 1. Colour tokens

Use these as the initial palette. Maintain contrast and use semantic colours consistently.

### Core
- `background`: `#080D16` — page background.
- `background-elevated`: `#0D1421` — sidebar / elevated page sections.
- `surface`: `#111B2B` — cards and panels.
- `surface-raised`: `#162337` — elevated cards, popovers, selected rows.
- `surface-hover`: `#1B2B40` — hover state.
- `border`: `#26364B` — subtle borders.
- `border-strong`: `#344861` — emphasized separators.

### Text
- `text-primary`: `#F1F5F9`.
- `text-secondary`: `#A8B5C7`.
- `text-muted`: `#74849A`.
- `text-inverse`: `#071018`.

### Brand and semantic
- `brand`: `#54E0C1` — primary CTA and selected accent (Growth Signal Mint).
- `brand-hover`: `#78EACF`.
- `brand-soft`: `#123B3A`.
- `positive`: `#45D6A4`.
- `negative`: `#FF7785`.
- `warning`: `#F5BD62`.
- `info`: `#79B8FF`.
- `focus`: `#9BEBDD`.

Do not use green and red as the only way to communicate status. Pair with plus/minus signs, labels, or icons.

## 2. Typography

Use Inter, Geist, or a similar clean sans-serif. Use tabular numerals for all financial values.

Suggested type scale:
- Display: 32–36 px, semibold; use sparingly.
- Page title: 24–28 px, semibold.
- Section title: 16–18 px, semibold.
- Card title: 13–14 px, medium.
- Body: 13–14 px, regular.
- Table: 12–13 px, regular; tabular numerals.
- Caption / metadata: 11–12 px, medium.
- Button: 13–14 px, semibold.

Use sentence case. Avoid shouty all-caps labels except tiny status metadata.

## 3. Layout and spacing

- Desktop frame target: 1440 × 1000.
- Tablet target: 1024 × 768.
- Mobile target: 390 × 844.
- Sidebar: 232–248 px on desktop, collapsible to icon rail.
- Top bar: 64–72 px.
- Main content max width: 1600 px.
- Main page padding: 24–32 px desktop, 20 px tablet, 16 px mobile.
- Use a 4 px spacing base: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Use a 12-column grid on wide screens with 16–20 px gutters.
- Maintain consistent alignment across cards and tables.

## 4. Shape, borders, and elevation

- Small controls: 8 px radius.
- Standard cards: 12–14 px radius.
- Large panels / modals: 16 px radius.
- Pills: fully rounded.
- Use 1 px borders for card definition.
- Prefer subtle elevation and surface contrast over large shadows.
- Avoid excessive glassmorphism, blur, glow, and gradient fills.

## 5. Iconography

Use a consistent thin-to-medium stroke icon family. Icons should be simple, recognizable, and paired with text where meaning is not obvious. Do not mix filled and outline icon styles arbitrarily.

## 6. Navigation shell

### Desktop sidebar
- Grovique mark and wordmark at top.
- Primary navigation: Overview, Scanner, Watchlists, Market Activity.
- Workspace: Alerts, Paper Journal.
- Resources: Learning Centre, Investment Calculators.
- Advanced AI: Agent Swarm Studio, RAG & MCP Studio.
- Bottom area: Settings and account.
- Active item uses a subtle brand-soft background, clear left accent, and readable text.

### Top bar
- Current page / breadcrumb.
- Global instrument search.
- Market session state.
- Connection and data-freshness indicator.
- User menu & audio toggle.

## 7. Core components

### Market status chip
States: Market Open, Pre-open, Market Closed, Status Unavailable.
Use a compact pill with icon and text.

### Feed freshness indicator
States: LIVE, STALE, DELAYED, HISTORICAL, UNAVAILABLE, DISCONNECTED.
Always show a timestamp or “Last update unavailable”. Never label an old value as live.

### Metric card
- Small label.
- Main value using tabular numerals.
- Change / comparison line.
- Source timestamp or freshness metadata.

### Data table
- Sticky header on long tables.
- Clear active-row hover.
- Right-align numeric values.
- Use tabular numerals.
- Keep symbol and exchange together.
- Include empty, loading, stale, and error states.

### Chart panel
- Clear title and selected instrument.
- Interval selector.
- Indicator controls (VWAP, EMA, RSI, MACD, ATR).
- Price axis and time axis labels.
- Volume subpanel.
- Tooltip with OHLC and timestamp.

### Filter panel
- Group related rules into collapsible sections.
- Show active filter count.
- Include Apply, Reset, and Save preset.
- Use ranges with explicit units.

### Alert row
- Instrument.
- Rule and threshold.
- Active / Triggered / Paused state.
- Created time and last trigger time.

### Toast / notification
- Brief, non-blocking, dismissible.
- Use semantic icon and clear language.

## 8. Data presentation rules

- Prices, volumes, percentages, and timestamps use tabular numerals.
- Always include `+` or `−` for directional values.
- Explicit labels for units: shares, ₹, %, minutes.
- Distinguish `LIVE`, `STALE`, `DELAYED`, `HISTORICAL`, `UNAVAILABLE`, and `DISCONNECTED`.
- Fictional data marked as sample data.
- No guarantee, certainty, or profit-promise language.

## 9. Product guardrails

- This is a research and learning workspace.
- Label paper journal `SIMULATED — NOT A REAL BROKER ACCOUNT`.
- Scanner results are candidates for further research with "Why this matched" explanation.
