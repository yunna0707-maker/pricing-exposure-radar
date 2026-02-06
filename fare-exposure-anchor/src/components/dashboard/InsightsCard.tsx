"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { SummaryData } from "./types";
import { Lightbulb } from "lucide-react";

interface InsightsCardProps {
  summary: SummaryData | null;
  loading: boolean;
  /** 기간 표시용: "24h" | "7d" */
  period?: string;
}

function getPeriodLabel(period: string | undefined): string {
  return period === "7d" ? "7일" : "24시간";
}

function getExposureDensity(summary: SummaryData): string {
  if (summary.uniqueSessions === 0) return "0.00";
  return (summary.totalExposures / summary.uniqueSessions).toFixed(2);
}

/** 전략 카드: 핵심 요약 + Recommended Action — 회의실에서 바로 설명 가능한 구조 */
export function InsightsCard({ summary, loading, period }: InsightsCardProps) {
  if (loading || !summary) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const modeSharePct =
    summary.modeBin != null && summary.totalExposures > 0
      ? ((summary.modeBin.count / summary.totalExposures) * 100).toFixed(1)
      : null;
  const modeRangeText =
    summary.modeBin != null
      ? `${formatPrice(summary.modeBin.binStart)} ~ ${formatPrice(summary.modeBin.binEnd)}`
      : null;
  const periodLabel = getPeriodLabel(period);
  const density = getExposureDensity(summary);

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm font-medium text-foreground">전략 인사이트</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {modeSharePct != null && modeRangeText != null ? (
                <>현재 노출의 <span className="font-semibold tabular-nums text-foreground">{modeSharePct}%</span>가 <span className="font-medium">{modeRangeText}</span>에 집중됨</>
              ) : (
                <>Anchor(기준점) <span className="tabular-nums">{formatPrice(summary.anchorPrice)}</span> — 노출 중앙값 기준으로 가격 전략 수립</>
              )}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              최근 <span className="font-medium text-foreground">{periodLabel}</span> 동안 가격은 총 <span className="font-semibold tabular-nums text-foreground">{summary.totalExposures.toLocaleString()}회</span> 노출되었고, <span className="font-semibold tabular-nums text-foreground">{summary.uniqueSessions.toLocaleString()}개</span>의 고유 세션에 도달했습니다.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              평균 노출 밀도는 <span className="font-semibold tabular-nums text-foreground">{density}회/세션</span> 입니다.
            </p>
            <div className="rounded-md border border-primary/15 bg-background/80 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommended Action</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {modeSharePct != null && Number(modeSharePct) >= 10
                  ? `해당 구간 마진 ±0.5% 실험 우선 추천`
                  : `Anchor 구간 중심으로 마진 검토 후, 노출 비중 높은 구간부터 차등 적용`}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
