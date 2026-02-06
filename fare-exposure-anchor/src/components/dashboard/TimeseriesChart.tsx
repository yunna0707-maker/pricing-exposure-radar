"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { TimeseriesData } from "./types";

interface TimeseriesChartProps {
  data: TimeseriesData | null;
  loading: boolean;
}

/** 전략적 의도: 중앙값(Anchor) 강조 — 시간대별 차등 마진 전략 참고 */
export function TimeseriesChart({ data, loading }: TimeseriesChartProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px] animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.points.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-muted-foreground">시간대별 운임</p>
          <div className="mt-4 flex h-[260px] items-center justify-center text-muted-foreground">
            데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.points.map((p) => ({
    hour: p.hour,
    label: format(new Date(p.hour), "M/d HH:mm", { locale: ko }),
    avgPrice: p.avgPrice,
    medianPrice: p.medianPrice,
    count: p.count,
  }));

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">시간대별 운임</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          시간대별 가격 변동성 확인 → 시간대 차등 마진 전략 참고
        </p>
        <ResponsiveContainer width="100%" height={280} className="mt-4">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
            <Tooltip
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label}
              formatter={(value: number, name: string) => [
                name === "avgPrice" ? "평균 " : name === "medianPrice" ? "중앙값(Anchor) " : "",
                value.toLocaleString() + "원",
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgPrice"
              name="평균"
              stroke="hsl(var(--muted-foreground) / 0.6)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="medianPrice"
              name="중앙값 (Anchor)"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
