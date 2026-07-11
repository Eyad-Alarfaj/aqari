import { NextRequest, NextResponse } from "next/server";
import { SREM, SREM_HEADERS } from "@/lib/srem";

const ALLOWED = new Set(["D", "W", "M", "Y"]);

// Most-traded districts across Saudi Arabia for the given period.
// Cached 10 minutes — the ranking moves slowly.
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") ?? "W";
  if (!ALLOWED.has(period)) {
    return NextResponse.json(
      { error: "period must be D, W, M or Y" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${SREM}/Dashboard/GetTrendingDistricts`, {
      method: "POST",
      headers: { ...SREM_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ PeriodCategory: period }),
      next: { revalidate: 600 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `SREM responded ${res.status}` }, { status: 502 });
    }

    const json = await res.json();
    if (!json.IsSuccess) {
      return NextResponse.json({ error: "SREM returned an error" }, { status: 502 });
    }

    return NextResponse.json({ districts: json.Data.TrendingDistricts ?? [] });
  } catch {
    return NextResponse.json({ error: "SREM request failed" }, { status: 502 });
  }
}
