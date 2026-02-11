"use client";

import { useState, useEffect, useRef } from "react";
import { defaultFilters, validateFilters, isRequiredFiltersReady, isFiltersAtDefault, type DashboardFilters } from "@/components/dashboard/types";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Search, Bug } from "lucide-react";
import { toast } from "sonner";

/** 마케팅/가격 전략 의사결정 도구 — Actionable, Strategy-first, Highlight the battleground price zone */
const HISTOGRAM_BIN_SIZES = [10000, 20000, 30000, 40000, 50000] as const;

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [histogramBinSize, setHistogramBinSize] = useState(10000);
  const [debugOn, setDebugOn] = useState(false);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const justQueriedRef = useRef(false);
  const {
    summary,
    histogram,
    timeseries,
    recent,
    priceCounts,
    loading,
    error,
    refetch,
    clearData,
    lastDebug,
    lastHistogramDebug,
    buildQueryString,
  } = useDashboardData(filters, histogramBinSize, { debug: debugOn });

  const isReady = isRequiredFiltersReady(filters);
  const isDirty = !isFiltersAtDefault(filters);
  const hasData = Boolean(summary);
  const showEmptyState = !isReady || (!loading && summary === null && !error);

  useEffect(() => {
    if (debugOn) {
      fetch("/api/health", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then(setHealth)
        .catch(() => setHealth(null));
      if (isReady) refetch();
    } else {
      setHealth(null);
    }
  }, [debugOn]);

  // 구간 크기(binSize) 변경 시 이미 조회된 데이터가 있으면 재요청하여 히스토그램 즉시 반영.
  // 원인: refetch는 '조회' 클릭 시에만 호출되어, 드롭다운만 바꿀 경우 이전 binSize로 받은 histogram이 그대로 남음.
  useEffect(() => {
    if (summary != null) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- summary/refetch 제외 시 binSize 변경 시에만 실행
  }, [histogramBinSize]);

  const handleQuery = () => {
    const missing = validateFilters(filters);
    if (missing.length > 0) {
      toast.warning("다음 조건을 선택해 주세요.", {
        description: `누락: ${missing.join(", ")}`,
      });
      return;
    }
    justQueriedRef.current = true;
    refetch();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    clearData();
    toast.info("필터와 데이터를 초기화했습니다.");
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
              onClick={handleReset}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              초기화
            </Button>
          </aside>

          <main className="space-y-6">
            {!isReady && (
              <p className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                필수 조건(항공사, 출발, 도착, 편도/왕복, 기간)을 선택한 뒤 <strong>조회</strong>를 눌러 주세요.
              </p>
            )}
            <VisitKpiCards period={filters.period} />
            {showEmptyState ? (
              <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  {!isReady ? "조건을 선택해 주세요." : "조회 버튼을 눌러 데이터를 불러오세요."}
                </p>
              </div>
            ) : (
              <>
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
              </>
            )}

            {/* 디버그 보기: NEXT_PUBLIC_DEBUG=true 일 때만 표시 (운영 배포에서는 숨김) */}
            {process.env.NEXT_PUBLIC_DEBUG === "true" && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={debugOn}
                    onChange={(e) => setDebugOn(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Bug className="h-4 w-4" />
                  디버그 보기
                </label>
                {debugOn && (
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">진단 정보</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div>
                        <div className="font-medium text-muted-foreground">1) 현재 필터 state</div>
                        <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                          {JSON.stringify(filters, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">2) 호출 API URL (summary + debug=1)</div>
                        <p className="mt-1 break-all font-mono">
                          /api/exposures/summary?{buildQueryString(true)}
                        </p>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">2-1) 히스토그램 구간 크기 (binSize)</div>
                        <p className="mt-1 text-muted-foreground">
                          현재 적용: <span className="font-mono font-medium text-foreground">{histogramBinSize.toLocaleString()}원</span>
                          {lastHistogramDebug != null && typeof lastHistogramDebug.appliedBinSize === "number" && (
                            <> · API 응답 appliedBinSize: {String(lastHistogramDebug.appliedBinSize)}</>
                          )}
                        </p>
                        {lastHistogramDebug != null && (
                          <p className="mt-0.5 font-mono text-muted-foreground">
                            minPrice={String(lastHistogramDebug.minPrice ?? "—")} / maxPrice={String(lastHistogramDebug.maxPrice ?? "—")} / totalBuckets={String(lastHistogramDebug.totalBuckets ?? "—")}
                          </p>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">3) API 응답 debug / count</div>
                        {lastDebug ? (
                          <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                            {JSON.stringify(lastDebug, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-muted-foreground">조회 후 표시 (디버그 보기 ON 상태로 조회 필요)</p>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">4) /api/health 요약</div>
                        {health ? (
                          <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                            {JSON.stringify(
                              {
                                ok: health.ok,
                                totalCount: (health.exposure_events as { totalCount?: number })?.totalCount,
                                last7dCount: (health.exposure_events as { last7dCount?: number })?.last7dCount,
                                airlineTop5: (health.exposure_events as { airlineTop20?: { airline: string; count: number }[] })?.airlineTop20?.slice(0, 5),
                              },
                              null,
                              2
                            )}
                          </pre>
                        ) : (
                          <p className="text-muted-foreground">로딩 중…</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
