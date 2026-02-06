"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import type { DashboardFilters } from "@/components/dashboard/types";
import type { ByPriceResponse } from "@/lib/validators";

interface PriceDrilldownPanelProps {
  priceKRW: number;
  filters: DashboardFilters;
  anchorPrice?: number;
  onLoaded?: (priceKRW: number, recentTimes: string[]) => void;
  /** 테이블 행 바로 아래에 삽입될 때 상단 여백 제거 */
  embedded?: boolean;
}

function buildQueryParams(
  priceKRW: number,
  filters: DashboardFilters,
  anchorPrice?: number
): string {
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

export function PriceDrilldownPanel({
  priceKRW,
  filters,
  anchorPrice,
  onLoaded,
  embedded,
}: PriceDrilldownPanelProps) {
  const rootClass = embedded ? "rounded-lg border border-border/80 bg-muted/30 p-4" : "mt-4 rounded-lg border border-border/80 bg-muted/30 p-4";
  const [data, setData] = useState<ByPriceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const q = buildQueryParams(priceKRW, filters, anchorPrice);
    fetch(`/api/exposures/by-price?${q}`)
      .then((res) => {
        if (!res.ok) return res.json().then((b) => Promise.reject(new Error((b as { error?: string }).error ?? res.statusText)));
        return res.json() as Promise<ByPriceResponse>;
      })
      .then((body) => {
        if (cancelled) return;
        setData(body);
        const recentTimes = body.events.slice(0, 3).map((e) => format(new Date(e.ts), "HH:mm", { locale: ko }));
        onLoadedRef.current?.(priceKRW, recentTimes);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [priceKRW, filters.airline, filters.origin, filters.dest, filters.tripType, filters.period, filters.channel, anchorPrice]);

  if (loading) {
    return (
      <div className={rootClass}>
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive ${embedded ? "" : "mt-4"}`}>
        {error}
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className={`rounded-lg border border-border/80 bg-muted/30 p-6 text-center text-sm text-muted-foreground ${embedded ? "" : "mt-4"}`}>
        선택한 가격의 노출 로그가 없습니다.
      </div>
    );
  }

  const diffText =
    data.diffFromAnchor != null && data.diffPct != null
      ? `${data.diffFromAnchor >= 0 ? "+" : ""}${formatPrice(data.diffFromAnchor)} (${data.diffPct >= 0 ? "+" : ""}${data.diffPct}%)`
      : null;

  const chartData = data.hourBins.map((b) => ({ name: b.hour, count: b.count }));

  return (
    <div className={rootClass}>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold text-foreground">{formatPrice(data.priceKRW)}</span>
        <span className="text-muted-foreground">총 {data.total.toLocaleString()}회 노출</span>
        {data.anchorPrice != null && diffText != null && (
          <span className="text-muted-foreground">
            Anchor 대비 {diffText}
          </span>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">시간대별 노출 분포</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => (v.length > 10 ? v.slice(11) : v)}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <RechartsTooltip
                  formatter={(value: number) => [value, "노출"]}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">최근 노출 로그 (최대 50건)</p>
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
              {data.events.map((e, i) => (
                <tr key={`${e.ts}-${e.search_id}-${i}`} className="border-b last:border-0">
                  <td className="py-1.5 pr-3 font-mono text-xs">
                    {format(new Date(e.ts), "yyyy-MM-dd HH:mm", { locale: ko })}
                  </td>
                  <td className="py-1.5 pr-3">{e.channel}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{e.result_rank}</td>
                  <td className="py-1.5 truncate font-mono text-xs text-muted-foreground" title={e.search_id}>
                    {e.search_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
