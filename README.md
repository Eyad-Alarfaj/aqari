# عقاري — نبض سوق العقار السعودي

Live dashboard for the Saudi real-estate market, powered by official Ministry
of Justice data from the Real Estate Exchange (SREM). Watch actual property
deals stream in **as they are notarized**, track the daily market index, and
see which districts are trading the most.

Arabic-first, fully RTL. Built with Next.js 16, TypeScript, Tailwind CSS 4,
Recharts, and SignalR.

<!-- screenshot: docs/screenshot.png (added after first deploy) -->

## Features

- **بث الصفقات المباشر (Live deals feed)** — a SignalR WebSocket stream from
  the Ministry of Justice pushes every real-estate deal the moment it is
  registered: district, city, area in m², and price. Not polling — an actual
  push stream.
- **مؤشر البورصة العقارية (Market index)** — the daily index with
  week/month/year/all-time history and total market value (≈ 1.5 trillion SAR),
  rendered as an interactive area chart.
- **الأحياء الأكثر تداولاً (Trending districts)** — the most-traded districts
  across the Kingdom by deal count, total value, and total area, switchable
  between day/week/month.

## Architecture decisions

**Two data paths, because the WAF forced it.** The live deals stream is a
SignalR WebSocket that connects browser-to-source directly and works
everywhere. The dashboard REST endpoints (index, history, trending) are a
different story: SREM's WAF blocks Vercel's serverless egress IPs — both the
Node runtime (AWS `iad1`) and the Edge runtime (Vercel PoPs) get a reset or a
tarpit, even with browser-like headers. The same requests succeed from a
residential or GitHub-runner IP.

Since that data changes daily at most, it doesn't need a runtime fetch. A
GitHub Action (`.github/workflows/snapshot.yml`) runs `scripts/build-snapshot.mjs`
every 6 hours from an allowed network, writes `public/snapshot.json`, and
commits it — which triggers a Vercel redeploy with fresh data. The client
reads that one static file, so the index and trending sections are always
available and never depend on a blocked request. Live deals stay real-time.

**Defensive stream parsing.** The deals stream schema is undocumented, so
fields are located by key pattern (`/price|amount/i`, `/district/i`, …)
instead of exact names. If the ministry renames a field, one label degrades
to "—" instead of the whole feed crashing.

**RTL-first, not RTL-patched.** The document runs `dir="rtl"` with IBM Plex
Sans Arabic, and only the chart plot area is flipped back to LTR (Recharts
mis-positions its crosshair inside RTL containers). All numerals are forced
to Latin digits (`numberingSystem: "latn"`) for a financial-dashboard feel,
with compact Arabic units (ألف / مليون / مليار / تريليون ريال).

**Today's index change is a trap.** The API reports `indexChange: 0` for the
current day while it accumulates, which would render a misleading "▲ 0". The
hero walks back to the last completed daily move instead.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4, custom light theme, no UI kit |
| Charts | Recharts |
| Live data | @microsoft/signalr (WebSocket stream) |
| Data source | SREM — Saudi Ministry of Justice (public endpoints) |

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. No API keys — the endpoints are public.

## Project structure

```
├── .github/workflows/snapshot.yml # Cron job: refresh public/snapshot.json
├── scripts/build-snapshot.mjs     # Fetches SREM dashboard data → snapshot
├── public/snapshot.json           # Index + history + trending (committed)
└── src/
    ├── app/
    │   └── page.tsx               # Dashboard (single page)
    ├── components/
    │   ├── IndexSection.tsx       # Hero number + area chart + range tabs
    │   ├── LiveDeals.tsx          # SignalR live deals feed
    │   ├── TrendingDistricts.tsx  # Ranked district list + period tabs
    │   └── Header.tsx
    └── lib/
        ├── snapshot.ts            # Loads + caches public/snapshot.json
        ├── format.ts              # SAR/area/date formatting (Arabic, latn digits)
        └── types.ts
```

## Roadmap

- [ ] Per-city drilldown (GetTrendingDistricts supports per-city results)
- [ ] Deal-size distribution chart from the live stream
- [ ] English locale

---

بناء **إياد العرفج** · البيانات من [البورصة العقارية](https://srem.moj.gov.sa) — وزارة العدل
