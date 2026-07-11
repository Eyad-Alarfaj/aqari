import { NextResponse } from "next/server";
import { SREM, SREM_HEADERS } from "@/lib/srem";

// Current market index snapshot. Short cache so the hero number
// feels live without hammering the upstream.
export async function GET() {
  try {
    const res = await fetch(`${SREM}/Dashboard/GetMarketIndex`, {
      headers: SREM_HEADERS,
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `SREM responded ${res.status}` }, { status: 502 });
    }

    const json = await res.json();
    if (!json.IsSuccess) {
      return NextResponse.json({ error: "SREM returned an error" }, { status: 502 });
    }

    return NextResponse.json({
      index: json.Data.Index as number,
      change: json.Data.Change as number,
    });
  } catch {
    return NextResponse.json({ error: "SREM request failed" }, { status: 502 });
  }
}
