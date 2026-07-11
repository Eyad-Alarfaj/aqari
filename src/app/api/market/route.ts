import { NextResponse } from "next/server";

const SREM = "https://prod-srem-api-srem.moj.gov.sa/api/v1";

// Current market index snapshot. Short cache so the hero number
// feels live without hammering the upstream.
export async function GET() {
  const res = await fetch(`${SREM}/Dashboard/GetMarketIndex`, {
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
}
