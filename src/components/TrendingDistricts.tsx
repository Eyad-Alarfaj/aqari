"use client";

import { useEffect, useState } from "react";
import type { TrendingDistrict } from "@/lib/types";
import { formatArea, formatNumber, formatSarCompact } from "@/lib/format";

const PERIODS = [
  { key: "D", label: "اليوم" },
  { key: "W", label: "الأسبوع" },
  { key: "M", label: "الشهر" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

export default function TrendingDistricts() {
  const [period, setPeriod] = useState<PeriodKey>("W");
  const [districts, setDistricts] = useState<TrendingDistrict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/trending?period=${period}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { districts: TrendingDistrict[] }) => {
        if (cancelled) return;
        setDistricts(data.districts);
        setError(false);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <section
      aria-label="الأحياء الأكثر تداولاً"
      className="rounded-xl border border-line bg-surface p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">الأحياء الأكثر تداولاً</h2>
        <div role="tablist" aria-label="الفترة" className="flex rounded-lg bg-surface-2 p-0.5">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={period === key}
              onClick={() => setPeriod(key)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors cursor-pointer
                ${period === key ? "bg-surface font-medium shadow-sm" : "text-ink-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-ink-muted">
          تعذر تحميل البيانات.
        </p>
      )}

      <ol className="mt-3 space-y-2">
        {loading
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="h-16 animate-pulse rounded-lg bg-surface-2" />
            ))
          : districts.map((d, i) => (
              <li
                key={`${d.DistrictCode}-${d.CityCode}`}
                className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5"
              >
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {d.DistrictName}
                    <span className="mx-1.5 text-ink-faint">·</span>
                    <span className="font-normal text-ink-muted">
                      {d.CityName} — {d.RegionName}
                    </span>
                  </p>
                  <p className="tnum mt-0.5 text-xs text-ink-muted">
                    {formatNumber(d.TotalCount)} صفقة · {formatArea(d.TotalArea)}
                  </p>
                </div>
                <p className="tnum shrink-0 text-sm font-semibold text-primary">
                  {formatSarCompact(d.TotalPrice)}
                </p>
              </li>
            ))}
      </ol>
    </section>
  );
}
