"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Users } from "lucide-react";

interface VisitSummary {
  pageviews: number;
  uniqueVisitors: number;
}

interface VisitKpiCardsProps {
  period: string;
}

export function VisitKpiCards({ period }: VisitKpiCardsProps) {
  const [data, setData] = useState<VisitSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const p = period === "7d" ? "7d" : "24h";
    fetch(`/api/visits/summary?period=${p}&path=/dashboard`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then((d: VisitSummary) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const valueBlockClass =
    "min-h-[2.75rem] flex items-end font-semibold tabular-nums tracking-tight text-[1.5rem] leading-tight";

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-card">
          <CardContent className="pt-5">
            <div className="h-24 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-5">
            <div className="h-24 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="relative bg-card">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs lowercase tracking-wide text-muted-foreground">방문 수 (Pageviews)</p>
            <div className={`mt-1 ${valueBlockClass}`}>—</div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">데이터를 불러올 수 없습니다</p>
            <Eye className="absolute right-4 top-4 h-4 w-4 text-muted-foreground/60" />
          </CardContent>
        </Card>
        <Card className="relative bg-card">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs lowercase tracking-wide text-muted-foreground">방문자 수 (Unique)</p>
            <div className={`mt-1 ${valueBlockClass}`}>—</div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">데이터를 불러올 수 없습니다</p>
            <Users className="absolute right-4 top-4 h-4 w-4 text-muted-foreground/60" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="relative bg-card">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs lowercase tracking-wide text-muted-foreground">방문 수 (Pageviews)</p>
          <div className={`mt-1 ${valueBlockClass}`}>{data.pageviews.toLocaleString()}</div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            선택 기간 내 대시보드 조회 횟수
          </p>
          <Eye className="absolute right-4 top-4 h-4 w-4 text-muted-foreground/60" />
        </CardContent>
      </Card>
      <Card className="relative bg-card">
        <CardContent className="pt-5 pb-5">
          <p className="text-xs lowercase tracking-wide text-muted-foreground">방문자 수 (Unique)</p>
          <div className={`mt-1 ${valueBlockClass}`}>{data.uniqueVisitors.toLocaleString()}</div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            선택 기간 내 고유 방문자 수 (근사치)
          </p>
          <Users className="absolute right-4 top-4 h-4 w-4 text-muted-foreground/60" />
        </CardContent>
      </Card>
    </div>
  );
}
