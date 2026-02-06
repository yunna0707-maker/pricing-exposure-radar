"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { formatPrice } from "@/lib/utils";
import type { RecentItem } from "./types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface RecentTableProps {
  items: RecentItem[];
  loading: boolean;
}

/** 보조 정보 — 접기/펼치기 가능, 정보 위계상 하단 */
export function RecentTable({ items, loading }: RecentTableProps) {
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-24 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted">
      <CardContent className="pt-6 pb-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-xs uppercase tracking-wide text-muted-foreground">보조 정보</span>
          <span className="text-sm font-medium text-muted-foreground">
            최근 노출 로그 (최대 30건)
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {open && (
          <div className="mt-4 overflow-x-auto">
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-2">시각</th>
                    <th className="pb-2 pr-2">노선</th>
                    <th className="pb-2 pr-2">출발일</th>
                    <th className="pb-2 pr-2">도착일</th>
                    <th className="pb-2 pr-2">채널</th>
                    <th className="pb-2 pr-2">순위</th>
                    <th className="pb-2">운임</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-1.5 pr-2 font-mono text-xs tabular-nums">
                        {format(new Date(r.ts), "MM/dd HH:mm", { locale: ko })}
                      </td>
                      <td className="py-1.5 pr-2">
                        {r.airline} {r.origin}→{r.dest} {r.trip_type}
                      </td>
                      <td className="py-1.5 pr-2 font-mono text-xs">{r.departure_date ?? "—"}</td>
                      <td className="py-1.5 pr-2 font-mono text-xs">{r.arrival_date ?? "—"}</td>
                      <td className="py-1.5 pr-2">{r.channel}</td>
                      <td className="py-1.5 pr-2 tabular-nums">{r.result_rank + 1}</td>
                      <td className="py-1.5 font-medium tabular-nums">{formatPrice(r.price_krw)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
