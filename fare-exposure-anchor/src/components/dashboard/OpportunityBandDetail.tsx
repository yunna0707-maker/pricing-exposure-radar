"use client";

import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Copy, Filter } from "lucide-react";
import { toast } from "sonner";

export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW";

export interface BandRow {
  binStart: number;
  binEnd: number;
  label: string;
  sharePct: number;
  count: number;
  priority: PriorityLevel;
  guide: string;
  rank: number;
}

interface OpportunityBandDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  band: BandRow | null;
  anchorPrice: number | null;
  totalExposures: number;
  onApplyBandFilter?: (minPrice: number, maxPrice: number) => void;
}

function getActionTemplates(priority: PriorityLevel): string[] {
  if (priority === "HIGH") {
    return [
      "마진 -0.3% A/B 테스트",
      "프로모션 쿠폰 적용 시뮬레이션",
      "경쟁 최저가 대비 갭 확인",
    ];
  }
  if (priority === "MEDIUM") {
    return [
      "마진 검토 후 필요 시 소폭 조정",
      "노출 추이 모니터링",
    ];
  }
  return ["가격 방어 구간 — 모니터링 유지"];
}

export function OpportunityBandDetail({
  open,
  onOpenChange,
  band,
  anchorPrice,
  totalExposures,
  onApplyBandFilter,
}: OpportunityBandDetailProps) {
  if (!band) return null;

  const bandMid = (band.binStart + band.binEnd) / 2;
  const deltaWon = anchorPrice != null ? bandMid - anchorPrice : null;
  const deltaPct = anchorPrice != null && anchorPrice > 0 && deltaWon != null
    ? (deltaWon / anchorPrice) * 100
    : null;

  const handleApplyFilter = () => {
    onApplyBandFilter?.(band.binStart, band.binEnd);
    onOpenChange(false);
    toast.success("가격대 필터가 적용되었습니다. 조회를 눌러 반영하세요.");
  };

  const handleCopyChecklist = () => {
    const lines = [
      `[${band.label}] 전략 체크리스트`,
      `노출 비중: ${band.sharePct.toFixed(1)}% | 우선순위: ${band.priority}`,
      ...getActionTemplates(band.priority),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("실험 체크리스트가 복사되었습니다.");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={band.label}>
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">노출 비중</dt>
                <dd className="font-semibold tabular-nums">{band.sharePct.toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">노출 수</dt>
                <dd className="font-semibold tabular-nums">{band.count.toLocaleString()}건</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">누적 비중</dt>
                <dd className="tabular-nums text-muted-foreground">상위 구간 합산 참고</dd>
              </div>
              {anchorPrice != null && deltaWon != null && deltaPct != null && (
                <div>
                  <dt className="text-xs text-muted-foreground">Anchor 대비</dt>
                  <dd className="font-medium tabular-nums">
                    {deltaWon >= 0 ? "+" : ""}{formatPrice(deltaWon)} ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%)
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">권장 액션</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
            {getActionTemplates(band.priority).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          {onApplyBandFilter && (
            <Button variant="default" size="sm" onClick={handleApplyFilter} className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              이 구간으로 필터 적용
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleCopyChecklist} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            실험 체크리스트 복사
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
