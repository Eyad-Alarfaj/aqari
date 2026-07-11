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

**Official data, no scraping.** All three data sources are anonymous public
endpoints of the SREM platform (they appear in the app bundle's anonymous
whitelist). REST calls are proxied through Next.js route handlers with
server-side caching (60s for the index snapshot, 10min for history and
trending) so any number of visitors produces a constant upstream load. The
SignalR stream connects browser-to-source directly — deals are public data
and proxying a WebSocket through a serverless platform would add cost and
latency for nothing.

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
src/
├── app/
│   ├── page.tsx                  # Dashboard (single page)
│   └── api/
│       ├── market/route.ts       # Index snapshot, 60s cache
│       ├── index-history/route.ts# Daily index history, 10min cache
│       └── trending/route.ts     # Trending districts, 10min cache
├── components/
│   ├── IndexSection.tsx          # Hero number + area chart + range tabs
│   ├── LiveDeals.tsx             # SignalR live deals feed
│   ├── TrendingDistricts.tsx     # Ranked district list + period tabs
│   └── Header.tsx
└── lib/
    ├── format.ts                 # SAR/area/date formatting (Arabic, latn digits)
    └── types.ts
```

## Roadmap

- [ ] Per-city drilldown (GetTrendingDistricts supports per-city results)
- [ ] Deal-size distribution chart from the live stream
- [ ] English locale

---

بناء **إياد العرفج** · البيانات من [البورصة العقارية](https://srem.moj.gov.sa) — وزارة العدل
