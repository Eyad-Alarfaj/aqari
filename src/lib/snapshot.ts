import type { IndexPoint, MarketSnapshot, TrendingDistrict } from "./types";

export interface Snapshot {
  generatedAt: string;
  market: MarketSnapshot;
  history: Partial<Record<"W" | "M" | "Y", IndexPoint[]>>;
  trending: Partial<Record<"D" | "W" | "M", TrendingDistrict[]>>;
}

let cache: Promise<Snapshot> | null = null;

// The whole dashboard reads one static JSON file (refreshed out-of-band by
// a scheduled job — see scripts/build-snapshot.mjs). Fetched once and shared
// across components.
export function loadSnapshot(): Promise<Snapshot> {
  if (!cache) {
    cache = fetch("/snapshot.json").then((r) => {
      if (!r.ok) throw new Error(`snapshot ${r.status}`);
      return r.json();
    });
  }
  return cache;
}
