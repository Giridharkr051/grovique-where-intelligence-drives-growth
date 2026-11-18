# Responsive Behaviour, UI States, and Accessibility

## 1. Responsive layout

### Desktop (1440 px and above)
- Full sidebar with labels.
- Multi-column dashboard with 12-column grid.
- Wide tables with sticky headers.
- Scanner filters in a persistent side panel.
- Stock chart with side quote panel and depth.

### Laptop / small desktop (1024–1439 px)
- Sidebar may collapse to icon rail.
- 2-column dashboard layout.
- Scanner filters collapsible into drawer.

### Tablet (768–1023 px)
- Compact navigation.
- Two-column dashboard where practical.
- Tables retain key columns and allow horizontal scroll.

### Mobile (below 768 px)
- Compact navigation drawer or bottom navigation.
- Single-column content.
- Convert complex tables to compact cards.
- Filters open in a full-height drawer.

## 2. Required UI states

### Loading
- Skeletons with dimensions similar to final content.
- Keep labels stable while values load.

### Empty
- Explain why there is no content.
- Provide one clear next action ("Add a symbol", "Create an alert").

### Error
- Direct, non-technical language with retry action.

### Stale
- Label "STALE" with last update timestamp.
- Visually distinguish from live data.

### Disconnected
- Show feed is disconnected.
- Show last successful update time.

### Delayed
- Clearly label delayed data.
- Include source/provider disclosure.

### Historical / Market Closed
- Show relevant session/date.
- Label as historical; no active tick pulses.

## 3. Accessibility & Tone
- WCAG AA contrast on dark surfaces (`#080D16` / `#111B2B`).
- Visible keyboard focus rings (`#9BEBDD`).
- Short, precise, neutral language.
- Never use color as the sole indicator; pair with +/− signs or icons.
