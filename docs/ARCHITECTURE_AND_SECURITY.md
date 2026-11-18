# Architecture, Security & Acceptance Specification

## 1. System Architecture
```
┌────────────────────────────────────────────────────────┐
│               GROVIQUE Frontend Client                 │
│    (HTML5 / Tailwind CSS / Vanilla JS / Canvas Chart)  │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│  Node.js Static & API Proxy  │ │  Gemini Vector RAG & MCP Svr │
│       (server.js)            │ │      (server/mcpServer.js)   │
└──────────────┬───────────────┘ └──────────────┬───────────────┘
               │                                │
               └───────────────┬────────────────┘
                               ▼
┌────────────────────────────────────────────────────────┐
│               Data Adapters & Brokers                  │
│       • Groww Trading API (api.groww.in)               │
│       • NSE India Historical & L1 Engine               │
│       • Multi-Agent Swarm Deliberation Pipeline        │
└────────────────────────────────────────────────────────┘
```

## 2. Security Standards
- **Token Isolation**: Broker API tokens and Gemini API keys are entered by the user in settings, stored in `localStorage` or encrypted session memory, and never hardcoded in version control.
- **Data Privacy**: Personal watchlists, trading journal entries, and notes are client-side sandboxed.
- **Read-Only Defaults**: Platform operates in safe educational simulation mode by default.

## 3. Acceptance Criteria Checklist
- [x] Responsive layout across 1440px desktop, tablet, and mobile.
- [x] Visual consistency matching `DESIGN.md` tokens (`#080D16`, `#111B2B`, `#54E0C1`).
- [x] All 9 core screens + 3 advanced studios connected and navigable.
- [x] Explainable stock scanner with "Why this matched" side drawer.
- [x] Prominent `SIMULATED — NOT A REAL BROKER ACCOUNT` banner in Paper Journal.
- [x] Learning Centre topic library with definition, example, and limitations.
- [x] Investment Calculators suite covering SIP, FD, Stock CAGR, Bonds, and Inflation.
