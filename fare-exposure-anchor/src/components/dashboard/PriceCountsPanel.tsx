"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { formatPrice } from "@/lib/utils";
import type { PriceCountsData, DashboardFilters } from "./types";
import { PriceDrilldownDrawer } from "@/components/price-drilldown/PriceDrilldownDrawer";
import { Search, ChevronDown, ChevronRight, Copy } from "lucide-react";

type TopN = 20 | 50;
type SortBy = "countDesc" | "priceAsc" | "priceDesc";

interface PriceCountsPanelProps {
  data: PriceCountsData | null;
  loading: boolean;
  filters: DashboardFilters;
  anchorPrice?: number;
  totalExposures?: number;
}

export function PriceCountsPanel({
  data,
  loading,
  filters,
  anchorPrice,
  totalExposures = 0,
}: PriceCountsPanelProps) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [topN, setTopN] = useState<TopN>(50);
  const [sortBy, setSortBy] = useState<SortBy>("countDesc");
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredAndSorted = useMemo(() => {
    if (!data?.items?.length) return [];
    let list = data.items;
    if (search.trim()) {
      const term = search.trim().replace(/,/g, "");
      list = list.filter((item) =>
        String(item.price_krw).includes(term) || formatPrice(item.price_krw).replace(/,/g, "").includes(term)
      );
    }
    list = list.slice(0, topN);
    if (sortBy === "priceAsc") list = [...list].sort((a, b) => a.price_krw - b.price_krw);
    else if (sortBy === "priceDesc") list = [...list].sort((a, b) => b.price_krw - a.price_krw);
    else list = [...list].sort((a, b) => b.count - a.count);
    return list;
  }, [data?.items, search, topN, sortBy]);

  const maxCount = useMemo(() => {
    if (filteredAndSorted.length === 0) return 1;
    return Math.max(...filteredAndSorted.map((i) => i.count), 1);
  }, [filteredAndSorted]);

  const chartData = useMemo(
    () =>
      filteredAndSorted.slice(0, 15).map((i, idx) => ({
        name: `#${idx + 1}`,
        count: i.count,
      })),
    [filteredAndSorted]
  );

  const handleRowClick = (priceKRW: number) => {
    setSelectedPrice(priceKRW);
    setDrawerOpen(true);
  };

  const copyPrice = (e: React.MouseEvent, priceKRW: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(priceKRW));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-[320px] animate-pulse rounded bg-muted" />
            <div className="h-[200px] animate-pulse rounded bg-muted" />
          </div>
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
            <div className="mt-4 flex h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[140px] max-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="금액 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={topN === 20 ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setTopN(20)}
                  >
                    Top 20
                  </Button>
                  <Button
                    variant={topN === 50 ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setTopN(50)}
                  >
                    Top 50
                  </Button>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="countDesc">노출 많은 순</option>
                  <option value="priceAsc">금액 낮은 순</option>
                  <option value="priceDesc">금액 높은 순</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-1 max-h-[340px] overflow-y-auto pr-1">
                  {filteredAndSorted.map((row, i) => (
                    <button
                      type="button"
                      key={`${row.price_krw}-${i}`}
                      onClick={() => handleRowClick(row.price_krw)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/60 transition-colors group"
                    >
                      <span className="w-5 shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="h-5 rounded bg-muted/80 overflow-hidden">
                          <div
                            className="h-full rounded bg-primary/70 transition-all"
                            style={{ width: `${(row.count / maxCount) * 100}%`, minWidth: row.count > 0 ? "4px" : 0 }}
                          />
                        </div>
                      </div>
                      <span className="w-24 shrink-0 font-mono text-xs tabular-nums text-right">
                        {formatPrice(row.price_krw)}
                      </span>
                      <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">
                        {row.count.toLocaleString()}회
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => copyPrice(e, row.price_krw)}
                        title="금액 복사"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </button>
                  ))}
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 h-[200px] min-h-[200px]">
                  <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    상위 15건 분포
                  </p>
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 9 }} width={28} />
                        <Bar dataKey="count" fill="hsl(var(--primary) / 0.8)" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                행 클릭 시 해당 가격 상세(노출 비중·시간대별·최근 로그)를 드로어에서 확인할 수 있습니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <PriceDrilldownDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        priceKRW={selectedPrice}
        filters={filters}
        anchorPrice={anchorPrice}
        totalExposures={totalExposures}
      />
    </>
  );
}
