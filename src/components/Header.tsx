export default function Header() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white"
            aria-hidden="true"
          >
            ع
          </span>
          <div>
            <p className="text-lg font-bold leading-tight">عقاري</p>
            <p className="text-xs text-ink-faint leading-tight">نبض سوق العقار السعودي</p>
          </div>
        </div>
        <a
          href="https://srem.moj.gov.sa"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
        >
          المصدر: البورصة العقارية — وزارة العدل
        </a>
      </div>
    </header>
  );
}
