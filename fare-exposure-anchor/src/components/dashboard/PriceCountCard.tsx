"use client";

import { useState, useCallback, Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { PriceDrilldownPanel } from "@/components/price-drilldown/PriceDrilldownPanel";
import type { PriceCountsData } from "./types";
import type { DashboardFilters } from "./types";

interface PriceCountCardProps {
  data: PriceCountsData | null;
  loading: boolean;
  filters?: DashboardFilters;
  anchorPrice?: number;
}

/** 툴팁용 캐시: priceKRW -> 최근 노출 시각 2~3개 */
const recentTimesCache = new Map<number, { recentTimes: string[] }>();

/** 전략 툴 톤: 동일 금액 노출 횟수 = 경쟁 가격 포인트 파악 */
export function PriceCountCard({ data, loading, filters, anchorPrice }: PriceCountCardProps) {
  const [open, setOpen] = useState(true);
  const [selectedPriceKRW, setSelectedPriceKRW] = useState<number | null>(null);

  const handleRowClick = useCallback((priceKRW: number) => {
    if (!filters) return;
    setSelectedPriceKRW((prev) => (prev === priceKRW ? null : priceKRW));
  }, [filters]);

  const handleDrilldownLoaded = useCallback((priceKRW: number, recentTimes: string[]) => {
    recentTimesCache.set(priceKRW, { recentTimes });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-[280px] animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center gap-2 text-left"
          >
            {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            <p className="text-sm font-medium text-muted-foreground">동일 금액별 노출 횟수</p>
          </button>
          {open && (
            <>
              <p className="mt-0.5 text-xs text-muted-foreground">같은 금액이 노출된 횟수 (상위 50개)</p>
              <div className="mt-4 flex h-[200px] items-center justify-center text-muted-foreground">
                데이터가 없습니다.
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 text-left"
        >
          {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          <p className="text-sm font-medium text-muted-foreground">동일 금액별 노출 횟수</p>
        </button>
        {open && (
          <>
            <p className="mt-0.5 text-xs text-muted-foreground">
              노출 횟수 많은 순 (상위 50개) — 경쟁 가격 포인트 파악
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4">순위</th>
                    <th className="pb-2 pr-4">금액</th>
                    <th className="pb-2">노출 횟수</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row, i) => {
                    const cached = recentTimesCache.get(row.price_krw);
                    const tooltipText = cached?.recentTimes?.length
                      ? `최근 노출: ${cached.recentTimes.join(", ")} / 총 ${row.count}회`
                      : `총 ${row.count}회`;
                    const isSelected = selectedPriceKRW === row.price_krw;
                    return (
                      <Fragment key={`${row.price_krw}-${i}`}>
                        <tr
                          className={`border-b cursor-pointer transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-muted/50"} ${i === data.items.length - 1 && !isSelected ? "last:border-b-0" : ""}`}
                          onClick={() => handleRowClick(row.price_krw)}
                          title={tooltipText}
                        >
                          <td className="py-2 pr-4 font-medium text-muted-foreground">{i + 1}</td>
                          <td className="py-2 pr-4 font-mono">{formatPrice(row.price_krw)}</td>
                          <td className="py-2 font-semibold tabular-nums">{row.count.toLocaleString()}회</td>
                        </tr>
                        {filters && isSelected && (
                          <tr className={i === data.items.length - 1 ? "last:border-b-0" : ""}>
                            <td colSpan={3} className={`align-top bg-muted/20 p-0 ${i === data.items.length - 1 ? "" : "border-b"}`}>
                              <div className="px-1 pt-3 pb-2">
                                <PriceDrilldownPanel
                                  priceKRW={selectedPriceKRW}
                                  filters={filters}
                                  anchorPrice={anchorPrice}
                                  onLoaded={handleDrilldownLoaded}
                                  embedded
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
