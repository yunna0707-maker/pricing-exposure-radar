"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { DashboardFilters } from "@/components/dashboard/types";
import type { ByPriceResponse } from "@/lib/validators";
import { Copy, Loader2 } from "lucide-react";

function buildQueryParams(priceKRW: number, filters: DashboardFilters, anchorPrice?: number): string {
  const p = new URLSearchParams();
  p.set("priceKRW", String(priceKRW));
  p.set("period", filters.period);
  p.set("airline", filters.airline);
  p.set("origin", filters.origin);
  p.set("dest", filters.dest);
  p.set("tripType", filters.tripType);
  if (filters.channel && filters.channel !== "all") p.set("channel", filters.channel);
  if (anchorPrice != null && anchorPrice > 0) p.set("anchorPrice", String(anchorPrice));
  return p.toString();
}

export interface PriceDrilldownDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceKRW: number | null;
  filters: DashboardFilters;
  anchorPrice?: number;
  totalExposures?: number;
}

export function PriceDrilldownDrawer({
  open,
  onOpenChange,
  priceKRW,
  filters,
  anchorPrice,
  totalExposures = 0,
}: PriceDrilldownDrawerProps) {
  const [data, setData] = useState<ByPriceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyPrice = useCallback(() => {
    if (priceKRW == null) return;
    navigator.clipboard.writeText(String(priceKRW));
  }, [priceKRW]);

  useEffect(() => {
    if (!open || priceKRW == null) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const q = buildQueryParams(priceKRW, filters, anchorPrice);
    fetch(`/api/exposures/by-price?${q}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) return res.json().then((b) => Promise.reject(new Error((b as { error?: string }).error ?? res.statusText)));
        return res.json() as Promise<ByPriceResponse>;
      })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, priceKRW, filters.airline, filters.origin, filters.dest, filters.tripType, filters.period, filters.channel, anchorPrice]);

  const sharePct = data && totalExposures > 0 ? ((data.total / totalExposures) * 100).toFixed(2) : null;
  const avgRank = data && data.events.length > 0
    ? (data.events.reduce((s, e) => s + e.result_rank, 0) / data.events.length).toFixed(1)
    : null;
  const firstSeen = data && data.events.length > 0 ? data.events[data.events.length - 1]?.ts : null;
  const lastSeen = data && data.events.length > 0 ? data.events[0]?.ts : null;
  const recent30 = data ? data.events.slice(0, 30) : [];
  const chartData = data?.hourBins.map((b) => ({ name: b.hour, count: b.count })) ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={priceKRW != null ? formatPrice(priceKRW) : "가격 상세"}>
      <div className="space-y-4">
        {priceKRW != null && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyPrice} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              금액 복사
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            <Card>
              <CardContent className="pt-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">총 노출</dt>
                    <dd className="font-semibold tabular-nums">{data.total.toLocaleString()}회</dd>
                  </div>
                  {sharePct != null && (
                    <div>
                      <dt className="text-xs text-muted-foreground">비중</dt>
                      <dd className="font-semibold tabular-nums">{sharePct}%</dd>
                    </div>
                  )}
                  {avgRank != null && (
                    <div>
                      <dt className="text-xs text-muted-foreground">평균 순위</dt>
                      <dd className="font-semibold tabular-nums">{avgRank}</dd>
                    </div>
                  )}
                  {firstSeen && (
                    <div>
                      <dt className="text-xs text-muted-foreground">최초 노출</dt>
                      <dd className="truncate font-mono text-xs">{format(new Date(firstSeen), "MM/dd HH:mm", { locale: ko })}</dd>
                    </div>
                  )}
                  {lastSeen && (
                    <div>
                      <dt className="text-xs text-muted-foreground">최근 노출</dt>
                      <dd className="truncate font-mono text-xs">{format(new Date(lastSeen), "MM/dd HH:mm", { locale: ko })}</dd>
                    </div>
                  )}
                  {data.diffFromAnchor != null && data.anchorPrice != null && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Anchor 대비</dt>
                      <dd className="text-xs">
                        {data.diffFromAnchor >= 0 ? "+" : ""}{formatPrice(data.diffFromAnchor)} ({data.diffPct != null ? (data.diffPct >= 0 ? "+" : "") + data.diffPct + "%" : ""})
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {chartData.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <p className="mb-3 text-xs font-medium text-muted-foreground">시간대별 노출 (24h)</p>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} tickFormatter={(v) => (v.length > 10 ? v.slice(11) : v)} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 9 }} width={24} />
                        <RechartsTooltip formatter={(value: number) => [value, "노출"]} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-4">
                <p className="mb-3 text-xs font-medium text-muted-foreground">최근 노출 로그 (최대 30건)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="pb-2 pr-3">시각</th>
                        <th className="pb-2 pr-3">채널</th>
                        <th className="pb-2 pr-3">순위</th>
                        <th className="pb-2">search_id</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent30.map((e, i) => (
                        <tr key={`${e.ts}-${e.search_id}-${i}`} className="border-b last:border-0">
                          <td className="py-1.5 pr-3 font-mono text-xs">{format(new Date(e.ts), "MM-dd HH:mm", { locale: ko })}</td>
                          <td className="py-1.5 pr-3">{e.channel}</td>
                          <td className="py-1.5 pr-3 tabular-nums">{e.result_rank}</td>
                          <td className="truncate font-mono text-xs text-muted-foreground max-w-[120px]" title={e.search_id}>{e.search_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Sheet>
  );
}
