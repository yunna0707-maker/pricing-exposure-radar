"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { HistogramData } from "./types";
import type { SummaryData } from "./types";
import { Percent } from "lucide-react";

interface MarginStrategyCardProps {
  histogram: HistogramData | null;
  summary: SummaryData | null;
  loading: boolean;
}

/** 전략 우선순위: High(≥10%) / Medium(5~10%) / Low(<5%) */
function getPriority(sharePct: number): "High" | "Medium" | "Low" {
  if (sharePct >= 10) return "High";
  if (sharePct >= 5) return "Medium";
  return "Low";
}

/** 전략 가이드 문장 — Actionable */
function getStrategyGuide(sharePct: number): string {
  if (sharePct >= 10) return "이 구간은 노출 비중이 높아 마진 미세 조정 실험 우선";
  if (sharePct >= 5) return "참고 구간 — 필요 시 마진 검토";
  return "노출은 낮지만 가격 방어 구간";
}

export function MarginStrategyCard({ histogram, summary, loading }: MarginStrategyCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-[260px] animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!histogram || !summary || histogram.bins.length === 0 || summary.totalExposures === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-muted-foreground">
            가격대별 이익율 전략 수립 참고
          </p>
          <div className="mt-4 flex h-[180px] items-center justify-center text-muted-foreground">
            데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = summary.totalExposures;
  const rows = histogram.bins.map((b) => {
    const sharePct = total > 0 ? (b.count / total) * 100 : 0;
    return {
      label: `${formatPrice(b.binStart)} ~ ${formatPrice(b.binEnd)}`,
      sharePct,
      priority: getPriority(sharePct),
      guide: getStrategyGuide(sharePct),
    };
  });

  const badgeClass = (p: "High" | "Medium" | "Low") => {
    if (p === "High") return "bg-strategy-accent/15 text-strategy-accent";
    if (p === "Medium") return "bg-primary/15 text-primary";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">
          가격대별 이익율 전략 수립 참고
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          노출 비중이 높은 가격대에 이익율(마진율) 차등 적용 시 참고
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4">가격대</th>
                <th className="pb-2 pr-4">노출 비중 (%)</th>
                <th className="pb-2 pr-4">전략 우선순위</th>
                <th className="pb-2">전략 가이드</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2.5 pr-4 font-mono text-xs tabular-nums">{row.label}</td>
                  <td className="py-2.5 pr-4 font-semibold tabular-nums">{row.sharePct.toFixed(1)}%</td>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${badgeClass(row.priority)}`}>
                      {row.priority}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs leading-relaxed text-muted-foreground">
                    {row.guide}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
