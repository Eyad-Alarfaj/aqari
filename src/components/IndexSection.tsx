"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { IndexPoint, MarketSnapshot } from "@/lib/types";
import { formatDate, formatNumber, formatSarCompact } from "@/lib/format";

const CATEGORIES = [
  { key: "W", label: "أسبوع" },
  { key: "M", label: "شهر" },
  { key: "Y", label: "سنة" },
  { key: "All", label: "الكل" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

const INK_MUTED = "#5c675f";
const GRID = "#eeece4";
const GREEN = "#136f4a";

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: IndexPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div dir="rtl" className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-ink-faint">{formatDate(p.date)}</p>
      <p className="tnum mt-0.5 font-semibold">{formatNumber(p.index)}</p>
      <p className="tnum text-xs text-ink-muted">
        قيمة السوق: {formatSarCompact(p.marketValue)}
      </p>
    </div>
  );
}

export default function IndexSection() {
  const [category, setCategory] = useState<CategoryKey>("M");
  const [points, setPoints] = useState<IndexPoint[]>([]);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/market")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSnapshot)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/index-history?category=${category}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { points: IndexPoint[] }) => {
        if (!cancelled) setPoints(data.points);
      })
      .catch(() => setError(true));
    return () => {
      cancelled = true;
    };
  }, [category]);

  const latest = points.at(-1);
  // Today's point reports indexChange 0 while the day is still
  // accumulating, so walk back to the last completed daily move.
  const lastMove = [...points].reverse().find((p) => p.indexChange !== 0);
  const dayChange = lastMove?.indexChange ?? snapshot?.change ?? 0;
  const isUp = dayChange >= 0;

  return (
    <section aria-label="مؤشر البورصة العقارية">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-sm font-medium text-ink-muted">
            مؤشر البورصة العقارية اليومي
          </h1>
          <div className="mt-1 flex items-baseline gap-3">
            <p className="tnum text-4xl font-bold">
              {snapshot ? formatNumber(snapshot.index) : "—"}
            </p>
            {latest && (
              <p
                className={`tnum text-sm font-semibold ${isUp ? "text-up" : "text-down"}`}
                title="التغير عن اليوم السابق"
              >
                {isUp ? "▲" : "▼"} {formatNumber(Math.abs(dayChange))} نقطة
              </p>
            )}
          </div>
          {latest && (
            <p className="tnum mt-1 text-sm text-ink-muted">
              قيمة السوق الإجمالية: {formatSarCompact(latest.marketValue)}
            </p>
          )}
        </div>

        <div
          role="tablist"
          aria-label="الفترة الزمنية"
          className="flex rounded-lg border border-line bg-surface p-0.5"
        >
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={category === key}
              onClick={() => setCategory(key)}
              className={`rounded-md px-3 py-1 text-sm transition-colors cursor-pointer
                ${category === key ? "bg-primary font-medium text-white" : "text-ink-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-down/30 bg-down/5 px-3 py-2 text-sm">
          تعذر تحميل بيانات المؤشر — أعد تحميل الصفحة.
        </p>
      )}

      <figure className="mt-4 rounded-xl border border-line bg-surface p-4">
        {/* Recharts mis-positions the crosshair in RTL contexts, so the plot
            itself runs LTR while all labels stay Arabic. */}
        <div className="h-72" dir="ltr">
          {points.length > 1 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="index-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.14} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fill: INK_MUTED, fontSize: 12 }}
                  axisLine={{ stroke: GRID }}
                  tickLine={false}
                  interval={Math.max(1, Math.floor(points.length / 7))}
                />
                <YAxis
                  dataKey="index"
                  orientation="right"
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => formatNumber(v)}
                  tick={{ fill: INK_MUTED, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: INK_MUTED, strokeDasharray: "3 3", strokeOpacity: 0.5 }}
                />
                <Area
                  type="monotone"
                  dataKey="index"
                  stroke={GREEN}
                  strokeWidth={2}
                  fill="url(#index-fill)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </figure>
    </section>
  );
}
