"use client";

import { useEffect, useRef, useState } from "react";
import {
  HttpTransportType,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import type { LiveDeal } from "@/lib/types";
import { formatArea, formatSarCompact, formatTime } from "@/lib/format";

const HUB_URL = "https://prod-srem-api-srem.moj.gov.sa/deals";
const MAX_DEALS = 30;

interface NormalizedDeal {
  id: string;
  city: string | null;
  district: string | null;
  region: string | null;
  price: number | null;
  area: number | null;
  receivedAt: Date;
}

// The stream schema is undocumented, so fields are located by key pattern
// instead of exact names — a renamed upstream field degrades one label
// to "—" instead of crashing the feed.
function pick(deal: LiveDeal, pattern: RegExp): unknown {
  const key = Object.keys(deal).find((k) => pattern.test(k));
  return key === undefined ? null : deal[key];
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

let counter = 0;

function normalize(deal: LiveDeal): NormalizedDeal {
  return {
    id: `deal-${++counter}`,
    city: asString(pick(deal, /city(?!.*code)/i)),
    district: asString(pick(deal, /district(?!.*code)|neighbou?rhood/i)),
    region: asString(pick(deal, /region(?!.*code)/i)),
    price: asNumber(pick(deal, /price|amount|value/i)),
    area: asNumber(pick(deal, /area|space/i)),
    receivedAt: new Date(),
  };
}

type Status = "connecting" | "live" | "offline";

export default function LiveDeals() {
  const [deals, setDeals] = useState<NormalizedDeal[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();

    const prepend = (raw: LiveDeal[]) => {
      setDeals((prev) =>
        [...raw.map(normalize), ...prev].slice(0, MAX_DEALS),
      );
    };

    connection.onreconnecting(() => setStatus("connecting"));
    connection.onreconnected(() => setStatus("live"));
    connection.onclose(() => setStatus("offline"));

    connection
      .start()
      .then(async () => {
        setStatus("live");
        try {
          const initial = await connection.invoke<LiveDeal[]>("GetAllDeals");
          if (Array.isArray(initial)) prepend(initial.reverse());
        } catch {
          // initial backlog is optional; the stream still works without it
        }
        connection.stream<LiveDeal>("StreamDeals").subscribe({
          next: (deal) => prepend([deal]),
          error: () => setStatus("offline"),
          complete: () => {},
        });
      })
      .catch(() => setStatus("offline"));

    return () => {
      connection.stop();
    };
  }, []);

  return (
    <section
      aria-label="الصفقات المباشرة"
      className="flex flex-col rounded-xl border border-line bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">صفقات مباشرة</h2>
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          {status === "live" && (
            <>
              <span className="relative flex size-2" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-up opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-up" />
              </span>
              بث حي من البورصة العقارية
            </>
          )}
          {status === "connecting" && "جارٍ الاتصال…"}
          {status === "offline" && "انقطع الاتصال — سيعاد تلقائياً"}
        </p>
      </div>

      {deals.length === 0 ? (
        <p className="mt-6 text-center text-sm text-ink-faint">
          {status === "offline"
            ? "تعذر الاتصال ببث الصفقات."
            : "بانتظار أول صفقة… تصل الصفقات فور توثيقها في وزارة العدل."}
        </p>
      ) : (
        <ul className="mt-3 max-h-[26rem] space-y-2 overflow-y-auto pe-1">
          {deals.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {d.district ?? "حي غير محدد"}
                  {d.city && (
                    <>
                      <span className="mx-1.5 text-ink-faint">·</span>
                      <span className="font-normal text-ink-muted">{d.city}</span>
                    </>
                  )}
                </p>
                <p className="tnum mt-0.5 text-xs text-ink-muted">
                  {formatTime(d.receivedAt)}
                  {d.area !== null && <> · {formatArea(d.area)}</>}
                </p>
              </div>
              <p className="tnum shrink-0 text-sm font-semibold text-primary">
                {d.price !== null ? formatSarCompact(d.price) : "—"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
