// All numerals render as Latin digits (ar-SA defaults to Eastern Arabic
// numerals, which read as less "dashboard-like" for financial data).
const sar = new Intl.NumberFormat("ar", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 0,
  numberingSystem: "latn",
});

const num = new Intl.NumberFormat("ar", {
  maximumFractionDigits: 2,
  numberingSystem: "latn",
});

export function formatSar(value: number): string {
  return sar.format(value);
}

export function formatNumber(value: number): string {
  return num.format(value);
}

/** 1_514_051_425_995 → "1.51 تريليون ريال" */
export function formatSarCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${num.format(value / 1e12)} تريليون ريال`;
  if (abs >= 1e9) return `${num.format(value / 1e9)} مليار ريال`;
  if (abs >= 1e6) return `${num.format(value / 1e6)} مليون ريال`;
  if (abs >= 1e3) return `${num.format(value / 1e3)} ألف ريال`;
  return sar.format(value);
}

export function formatArea(sqm: number): string {
  return `${num.format(sqm)} م²`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar", {
    day: "numeric",
    month: "short",
    numberingSystem: "latn",
  });
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("ar", {
    hour: "numeric",
    minute: "2-digit",
    numberingSystem: "latn",
  });
}
