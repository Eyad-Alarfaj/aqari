// Fetches the slow-moving SREM dashboard data (market index, index history,
// trending districts) and writes it to public/snapshot.json.
//
// Why a snapshot instead of a live proxy: the SREM WAF blocks Vercel's
// serverless egress IPs (both Node/iad1 and Edge PoPs), so a runtime proxy
// 502s in production. This data changes daily at most, so a scheduled job
// (see .github/workflows/snapshot.yml) refreshes the file from an allowed
// network and commits it. The site reads the static file — always available.

import { writeFile, mkdir } from "node:fs/promises";

const SREM = "https://prod-srem-api-srem.moj.gov.sa/api/v1";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Origin: "https://srem.moj.gov.sa",
  Referer: "https://srem.moj.gov.sa/",
};

async function getJson(url, init) {
  const res = await fetch(url, { ...init, headers: { ...HEADERS, ...init?.headers } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const json = await res.json();
  if (!json.IsSuccess) throw new Error(`${url} -> IsSuccess false`);
  return json.Data;
}

async function market() {
  const d = await getJson(`${SREM}/Dashboard/GetMarketIndex`);
  return { index: d.Index, change: d.Change };
}

async function history(category) {
  const d = await getJson(
    `${SREM}/Dashboard/GetMarketIndexByDateCategory?dateCategory=${category}`,
  );
  return d.marketIndexDtos.map((r) => ({
    date: r.CalcDate,
    index: r.MarketIndex,
    marketValue: r.MarketValue,
    indexChange: r.MarketIndexChange,
  }));
}

async function trending(period) {
  const d = await getJson(`${SREM}/Dashboard/GetTrendingDistricts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ PeriodCategory: period }),
  });
  return d.TrendingDistricts ?? [];
}

// Returns the resolved value, or null if the upstream call failed, so one
// unsupported category never sinks the whole snapshot.
async function safe(label, promise) {
  try {
    return await promise;
  } catch (e) {
    console.warn(`skip ${label}: ${e.message}`);
    return null;
  }
}

async function main() {
  const m = await market();
  const [hW, hM, hY, hAll, tD, tW, tM] = await Promise.all([
    safe("history W", history("W")),
    safe("history M", history("M")),
    safe("history Y", history("Y")),
    safe("history All", history("All")),
    safe("trending D", trending("D")),
    safe("trending W", trending("W")),
    safe("trending M", trending("M")),
  ]);

  const history_ = { W: hW, M: hM, Y: hY, All: hAll };
  const trending_ = { D: tD, W: tW, M: tM };

  const snapshot = {
    generatedAt: new Date().toISOString(),
    market: m,
    // Drop categories the upstream didn't return so the client can fall
    // back to another range instead of rendering an empty chart.
    history: Object.fromEntries(Object.entries(history_).filter(([, v]) => v)),
    trending: Object.fromEntries(Object.entries(trending_).filter(([, v]) => v)),
  };

  await mkdir("public", { recursive: true });
  await writeFile("public/snapshot.json", JSON.stringify(snapshot));
  console.log(
    `snapshot written: index ${m.index.toFixed(2)}, ` +
      `history [${Object.keys(snapshot.history).join(",")}], ` +
      `trending [${Object.keys(snapshot.trending).join(",")}]`,
  );
}

main().catch((e) => {
  console.error("snapshot failed:", e.message);
  process.exit(1);
});
