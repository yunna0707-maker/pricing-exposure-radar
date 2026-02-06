"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { SummaryData } from "./types";
import { BarChart3, Users, Anchor, Zap, Activity } from "lucide-react";

interface KpiCardsProps {
  summary: SummaryData | null;
  loading: boolean;
}

/** 노출 밀도 = 세션당 평균 노출 횟수 (uniqueSessions=0이면 0 표시) */
function getExposureDensity(summary: SummaryData): string {
  if (summary.uniqueSessions === 0) return "0.00";
  const density = summary.totalExposures / summary.uniqueSessions;
  return density.toFixed(2);
}

/** 전략적 의도: 숫자만 나열하지 않고, "그래서 무엇에 쓸지"가 보이도록 해석 문장 제공 */
export function KpiCards({ summary, loading }: KpiCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="bg-card">
            <CardContent className="pt-5">
              <div className="h-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const modeSharePct =
    summary.modeBin != null && summary.totalExposures > 0
      ? ((summary.modeBin.count / summary.totalExposures) * 100).toFixed(1)
      : null;
  const density = getExposureDensity(summary);

  const valueBlockClass = "min-h-[2.75rem] flex items-end font-semibold tabular-nums tracking-tight text-[1.5rem] leading-tight";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* 가격 노출 횟수 (Exposure Volume) */}
      <Card className="relative bg-card">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs lowercase tracking-wide text-muted-foreground">가격 노출 횟수</p>
          <div className={`mt-1 ${valueBlockClass}`}>
            {summary.totalExposures.toLocaleString()}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            선택 조건에서 가격이 노출된 총 횟수
          </p>
          <BarChart3 className="absolute right-4 top-4 h-4 w-4 text-muted-foreground/60" />
        </CardContent>
      </Card>

      {/* 도달 세션 수 (Unique Sessions / Reach) */}
      <Card className="relative bg-card">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs lowercase tracking-wide text-muted-foreground">도달 세션 수</p>
          <div className={`mt-1 ${valueBlockClass}`}>
            {summary.uniqueSessions.toLocaleString()}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            가격을 확인한 고유 세션 수
          </p>
          <Users className="absolute right-4 top-4 h-4 w-4 text-muted-foreground/60" />
        </CardContent>
      </Card>

      {/* 노출 밀도 (Exposure Density) — 파생 KPI */}
      <Card className="relative bg-card">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs lowercase tracking-wide text-muted-foreground">노출 밀도</p>
          <div className={`mt-1 ${valueBlockClass}`}>
            <span>{density}</span>
            <span className="ml-1 text-sm font-normal text-muted-foreground">회/세션</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            세션당 평균 가격 노출 횟수
          </p>
          <Activity className="absolute right-4 top-4 h-4 w-4 text-muted-foreground/60" />
        </CardContent>
      </Card>

      {/* Anchor (기준점) — primary 강조, 가격 전략 기준점 */}
      <Card className="relative border-primary/30 bg-primary/5">
        <CardContent className="pt-5 pb-5">
          <div className="text-xs tracking-wide text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
              <Anchor className="h-3 w-3" /> Anchor (기준점)
            </span>
          </div>
          <div className={`mt-1 ${valueBlockClass} font-bold text-primary`}>
            {formatPrice(summary.anchorPrice)}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            가격 전략 기준점 — 노출 중앙값
          </p>
        </CardContent>
      </Card>

      {/* 핵심 경쟁 가격대 — P25~P75 + 집중 비중 */}
      <Card className="relative bg-card">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs lowercase tracking-wide text-muted-foreground">핵심 경쟁 가격대</p>
          <div className={`mt-1 ${valueBlockClass} text-[1.25rem] flex flex-wrap items-baseline gap-x-1`}>
            <span className="whitespace-nowrap">{formatPrice(summary.p25)}</span>
            <span className="whitespace-nowrap text-muted-foreground">~</span>
            <span className="whitespace-nowrap">{formatPrice(summary.p75)}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {modeSharePct != null
              ? `전체 노출의 ${modeSharePct}%가 집중`
              : "노출의 가운데 50% 구간"}
          </p>
          <Zap className="absolute right-4 top-4 h-4 w-4 text-muted-foreground/60" />
        </CardContent>
      </Card>
    </div>
  );
}
