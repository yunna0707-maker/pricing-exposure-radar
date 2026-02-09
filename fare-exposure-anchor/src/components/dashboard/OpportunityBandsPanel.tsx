"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { HistogramData, SummaryData } from "./types";
import { OpportunityBandDetail, type BandRow } from "./OpportunityBandDetail";
import { ChevronDown, ChevronRight, Info } from "lucide-react";

/** Priority: HIGH if share >= 10% OR rank <= 2; MEDIUM if share >= 6%; else LOW */
function getPriority(sharePct: number, rank: number): BandRow["priority"] {
  if (sharePct >= 10 || rank <= 2) return "HIGH";
  if (sharePct >= 6) return "MEDIUM";
  return "LOW";
}

function getGuide(priority: BandRow["priority"]): string {
  if (priority === "HIGH") return "마진 실험 우선";
  if (priority === "MEDIUM") return "마진 검토 참고";
  return "방어 구간";
}

type SortBy = "shareDesc" | "priceAsc";
type ViewFilter = "all" | "top5" | "top10" | "highOnly";

interface OpportunityBandsPanelProps {
  histogram: HistogramData | null;
  summary: SummaryData | null;
  loading: boolean;
  onApplyBandFilter?: (minPrice: number, maxPrice: number) => void;
}

export function OpportunityBandsPanel({
  histogram,
  summary,
  loading,
  onApplyBandFilter,
}: OpportunityBandsPanelProps) {
  const [open, setOpen] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("shareDesc");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [selectedBand, setSelectedBand] = useState<BandRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const rows = useMemo(() => {
    if (!histogram || !summary || histogram.bins.length === 0 || summary.totalExposures === 0) return [];
    const total = summary.totalExposures;
    return histogram.bins.map((b, i) => {
      const sharePct = (b.count / total) * 100;
      const priority = getPriority(sharePct, i + 1);
      return {
        binStart: b.binStart,
        binEnd: b.binEnd,
        label: `${formatPrice(b.binStart)} ~ ${formatPrice(b.binEnd)}`,
        sharePct,
        count: b.count,
        priority,
        guide: getGuide(priority),
        rank: i + 1,
      };
    });
  }, [histogram, summary]);

  const filteredAndSorted = useMemo(() => {
    let list = [...rows];
    if (sortBy === "priceAsc") list.sort((a, b) => a.binStart - b.binStart);
    else list.sort((a, b) => b.sharePct - a.sharePct);

    if (viewFilter === "top5") list = list.slice(0, 5);
    else if (viewFilter === "top10") list = list.slice(0, 10);
    else if (viewFilter === "highOnly") list = list.filter((r) => r.priority === "HIGH");
    return list;
  }, [rows, sortBy, viewFilter]);

  const maxShare = useMemo(() => Math.max(...rows.map((r) => r.sharePct), 0.01), [rows]);
  const topBand = rows.length > 0 ? rows[0]! : null;
  const top3Sum = useMemo(() => rows.slice(0, 3).reduce((s, r) => s + r.sharePct, 0), [rows]);
  const highCount = useMemo(() => rows.filter((r) => r.priority === "HIGH").length, [rows]);

  const handleRowClick = (band: BandRow) => {
    setSelectedBand(band);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!histogram || !summary || rows.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center gap-2 text-left"
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <p className="text-sm font-medium text-muted-foreground">가격대별 이익율 전략 수립 참고</p>
          </button>
          {open && (
            <div className="mt-4 flex h-[180px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const badgeClass = (p: BandRow["priority"]) => {
    if (p === "HIGH") return "bg-strategy-accent/15 text-strategy-accent";
    if (p === "MEDIUM") return "bg-primary/15 text-primary";
    return "bg-muted text-muted-foreground";
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 text-left"
            >
              {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              <p className="text-sm font-medium text-muted-foreground">가격대별 이익율 전략 수립 참고</p>
            </button>
            <span
              className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              onMouseEnter={() => setTooltipOpen(true)}
              onMouseLeave={() => setTooltipOpen(false)}
              title="우선순위: HIGH = 비중 10% 이상 또는 상위 2위 이내 / MEDIUM = 6% 이상 / LOW = 그 외"
            >
              <Info className="h-3.5 w-3.5" />
              {tooltipOpen && (
                <span className="absolute right-0 top-full z-10 mt-1 w-56 rounded border bg-popover px-2 py-1.5 text-[10px] text-muted-foreground shadow-md">
                  HIGH: 비중 10% 이상 또는 상위 2위 · MEDIUM: 6% 이상 · LOW: 그 외
                </span>
              )}
            </span>
          </div>
          {open && (
            <>
              <p className="mt-0.5 text-xs text-muted-foreground">
                노출 비중이 높은 가격대에 이익율(마진율) 차등 적용 시 참고
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {topBand && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    가장 집중: {topBand.label}
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Top 3 합산 {top3Sum.toFixed(1)}%
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  HIGH {highCount}개
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">정렬</span>
                <Button
                  variant={sortBy === "shareDesc" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSortBy("shareDesc")}
                >
                  비중 높은 순
                </Button>
                <Button
                  variant={sortBy === "priceAsc" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSortBy("priceAsc")}
                >
                  가격대 순
                </Button>
                <span className="ml-2 text-[10px] text-muted-foreground uppercase tracking-wide">보기</span>
                <Button
                  variant={viewFilter === "all" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setViewFilter("all")}
                >
                  전체
                </Button>
                <Button
                  variant={viewFilter === "top10" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setViewFilter("top10")}
                >
                  Top 10
                </Button>
                <Button
                  variant={viewFilter === "top5" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setViewFilter("top5")}
                >
                  Top 5
                </Button>
                <Button
                  variant={viewFilter === "highOnly" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setViewFilter("highOnly")}
                >
                  HIGH만
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {filteredAndSorted.map((band) => (
                  <button
                    type="button"
                    key={`${band.binStart}-${band.binEnd}`}
                    onClick={() => handleRowClick(band)}
                    className="flex w-full items-center gap-3 rounded-lg border bg-card p-2.5 text-left transition-colors hover:bg-muted/60"
                  >
                    <span className="w-28 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {band.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${Math.min(100, (band.sharePct / maxShare) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums">
                      {band.sharePct.toFixed(1)}%
                    </span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${badgeClass(band.priority)}`}>
                      {band.priority}
                    </span>
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                      {band.guide}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <OpportunityBandDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        band={selectedBand}
        anchorPrice={summary?.anchorPrice ?? null}
        totalExposures={summary?.totalExposures ?? 0}
        onApplyBandFilter={onApplyBandFilter}
      />
    </>
  );
}
