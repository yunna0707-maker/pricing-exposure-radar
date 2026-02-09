"use client";

import { useState, useEffect, useRef } from "react";
import { defaultFilters, getMissingFilterLabels, type DashboardFilters } from "@/components/dashboard/types";
import { FilterCard } from "@/components/dashboard/FilterCard";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { VisitKpiCards } from "@/components/dashboard/VisitKpiCards";
import { HistogramChart } from "@/components/dashboard/HistogramChart";
import { PriceCountCard } from "@/components/dashboard/PriceCountCard";
import { OpportunityBandsPanel } from "@/components/dashboard/OpportunityBandsPanel";
import { TimeseriesChart } from "@/components/dashboard/TimeseriesChart";
import { InsightsCard } from "@/components/dashboard/InsightsCard";
import { RecentTable } from "@/components/dashboard/RecentTable";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { trackPageView } from "@/lib/visitTracker";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

/** 마케팅/가격 전략 의사결정 도구 — Actionable, Strategy-first, Highlight the battleground price zone */
const HISTOGRAM_BIN_SIZES = [10000, 20000, 30000, 40000, 50000] as const;

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [histogramBinSize, setHistogramBinSize] = useState(10000);
  const justQueriedRef = useRef(false);
  const { summary, histogram, timeseries, recent, priceCounts, loading, error, refetch } =
    useDashboardData(filters, histogramBinSize);

  const handleQuery = () => {
    const missing = getMissingFilterLabels(filters);
    if (missing.length > 0) {
      toast.warning("다음 조건을 선택해 주세요.", {
        description: `누락: ${missing.join(", ")}`,
      });
      return;
    }
    justQueriedRef.current = true;
    refetch();
  };

  useEffect(() => {
    if (!loading && justQueriedRef.current) {
      justQueriedRef.current = false;
      if (!error && summary != null && summary.totalExposures === 0) {
        toast.info("해당 조건에 부합하는 데이터가 없습니다.");
      }
    }
  }, [loading, error, summary]);

  useEffect(() => {
    trackPageView("/dashboard");
  }, []);

  return (
    <div className="min-h-screen bg-background-soft">
      <div className="container mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            가격 노출 기준점
          </h1>
          <p className="text-sm text-muted-foreground">
            어떤 가격대에 마진을 써야 하는지 — 노출 분포 기준점으로 전략 수립
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <pre className="whitespace-pre-wrap text-sm">{error}</pre>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              다시 시도
            </Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-4">
            <FilterCard filters={filters} onFiltersChange={setFilters} />
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleQuery}
              disabled={loading}
            >
              <Search className="mr-2 h-4 w-4" />
              조회
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </aside>

          <main className="space-y-6">
            <VisitKpiCards period={filters.period} />
            <KpiCards summary={summary} loading={loading} />
            <HistogramChart
              data={histogram}
              summary={summary}
              loading={loading}
              binSize={histogramBinSize}
              onBinSizeChange={setHistogramBinSize}
              binSizeOptions={HISTOGRAM_BIN_SIZES}
            />
            <PriceCountCard
              data={priceCounts}
              loading={loading}
              filters={filters}
              anchorPrice={summary?.anchorPrice}
              totalExposures={summary?.totalExposures}
            />
            <OpportunityBandsPanel
              histogram={histogram}
              summary={summary}
              loading={loading}
              onApplyBandFilter={(minPrice, maxPrice) => setFilters((prev) => ({ ...prev, minPrice, maxPrice }))}
            />
            <TimeseriesChart data={timeseries} loading={loading} />
            <InsightsCard summary={summary} loading={loading} period={filters.period} />
            <RecentTable items={recent} loading={loading} />
          </main>
        </div>
      </div>
    </div>
  );
}
