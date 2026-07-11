import { NextRequest, NextResponse } from "next/server";
import { SREM, SREM_HEADERS } from "@/lib/srem";

// Edge runtime so the request egresses from Vercel's edge network rather
// than AWS us-east, whose IPs the SREM WAF blocks.
export const runtime = "edge";

const ALLOWED = new Set(["W", "M", "Y", "All"]);

interface SremIndexRow {
  CalcDate: string;
  MarketValue: number;
  MarketIndex: number;
  MarketIndexChange: number;
}

// Daily market-index history from the Ministry of Justice real-estate
// exchange (SREM). Public anonymous endpoint; cached 10 minutes because
// the index is recalculated daily.
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? "M";
  if (!ALLOWED.has(category)) {
    return NextResponse.json(
      { error: "category must be W, M, Y or All" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${SREM}/Dashboard/GetMarketIndexByDateCategory?dateCategory=${category}`,
      { headers: SREM_HEADERS, next: { revalidate: 600 } },
    );
    if (!res.ok) {
      return NextResponse.json({ error: `SREM responded ${res.status}` }, { status: 502 });
    }

    const json = await res.json();
    if (!json.IsSuccess) {
      return NextResponse.json({ error: "SREM returned an error" }, { status: 502 });
    }

    const points = (json.Data.marketIndexDtos as SremIndexRow[]).map((row) => ({
      date: row.CalcDate,
      index: row.MarketIndex,
      marketValue: row.MarketValue,
      indexChange: row.MarketIndexChange,
    }));

    return NextResponse.json({ points });
  } catch {
    return NextResponse.json({ error: "SREM request failed" }, { status: 502 });
  }
}
