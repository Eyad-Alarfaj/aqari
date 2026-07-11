import Header from "@/components/Header";
import IndexSection from "@/components/IndexSection";
import TrendingDistricts from "@/components/TrendingDistricts";
import LiveDeals from "@/components/LiveDeals";

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <IndexSection />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <LiveDeals />
          <TrendingDistricts />
        </div>
      </main>
      <footer className="border-t border-line py-4 text-center text-xs text-ink-faint">
        عقاري — مشروع مفتوح المصدر من إياد العرفج · البيانات من البورصة العقارية (وزارة العدل)
      </footer>
    </>
  );
}
