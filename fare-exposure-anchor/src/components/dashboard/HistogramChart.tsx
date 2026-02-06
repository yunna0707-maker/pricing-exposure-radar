"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import type { HistogramData } from "./types";
import type { SummaryData } from "./types";

interface HistogramChartProps {
  data: HistogramData | null;
  summary: SummaryData | null;
  loading: boolean;
  binSize: number;
  onBinSizeChange: (value: number) => void;
  binSizeOptions: readonly number[];
}

function binSizeLabel(value: number): string {
  if (value >= 10000 && value < 100000) return `${value / 10000}만원`;
  return formatPrice(value);
}

/** 전략적 의도: Hot Zone(최빈 구간) 강조, Anchor 기준선으로 "어디가 전쟁터인지" 한눈에 */
export function HistogramChart({ data, summary, loading, binSize, onBinSizeChange, binSizeOptions }: HistogramChartProps) {
  const hasData = data && data.bins.length > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">
          노출이 가장 집중된 가격대 (경쟁이 가장 치열한 구간)
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>구간 크기:</span>
          <Select value={String(binSize)} onValueChange={(v) => onBinSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-[7rem]" aria-label="구간 크기 선택">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {binSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {binSizeLabel(size)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>· 굵은 세로선 = Anchor(기준점)</span>
        </div>

        {loading && (
          <div className="mt-4 h-[320px] animate-pulse rounded bg-muted" />
        )}

        {!loading && !hasData && (
          <div className="mt-4 flex h-[280px] items-center justify-center text-muted-foreground">
            데이터가 없습니다.
          </div>
        )}

        {!loading && hasData && (() => {
          const total = summary?.totalExposures ?? 0;
          const anchorPrice = summary?.anchorPrice ?? 0;
          const modeBin = summary?.modeBin ?? null;

          const chartData = data!.bins.map((b) => ({
            name: `${formatPrice(b.binStart)} ~ ${formatPrice(b.binEnd)}`,
            count: b.count,
            binStart: b.binStart,
            binEnd: b.binEnd,
            sharePct: total > 0 ? (b.count / total) * 100 : 0,
            isModeBin: modeBin != null && b.binStart === modeBin.binStart && b.binEnd === modeBin.binEnd,
          }));

          const BAR_PRIMARY = "hsl(var(--primary))";
          const BAR_NEUTRAL = "hsl(var(--muted-foreground) / 0.35)";
          const anchorBinName = chartData.find((d) => anchorPrice >= d.binStart && anchorPrice < d.binEnd)?.name;

          return (
        <ResponsiveContainer width="100%" height={300} className="mt-4">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 72 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            {anchorBinName != null && (
              <ReferenceLine
                x={anchorBinName}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              angle={-40}
              textAnchor="end"
              interval={0}
              height={72}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as { name: string; count: number; sharePct: number };
                return (
                  <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
                    <p className="font-medium">{p?.name}</p>
                    <p className="tabular-nums text-muted-foreground">
                      {p?.count?.toLocaleString()}건 · 노출 비중 <span className="font-semibold text-foreground">{p?.sharePct?.toFixed(1)}%</span>
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isModeBin ? BAR_PRIMARY : BAR_NEUTRAL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
          );
        })()}
      </CardContent>
    </Card>
  );
}
