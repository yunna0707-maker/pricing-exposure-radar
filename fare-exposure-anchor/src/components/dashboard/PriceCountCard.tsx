"use client";

import type { PriceCountsData, DashboardFilters } from "./types";
import { PriceCountsPanel } from "./PriceCountsPanel";

interface PriceCountCardProps {
  data: PriceCountsData | null;
  loading: boolean;
  filters?: DashboardFilters;
  anchorPrice?: number;
  totalExposures?: number;
}

/** 동일 금액별 노출 횟수: 랭킹+진행바 리스트 + 행 클릭 시 드로어 상세 */
export function PriceCountCard({
  data,
  loading,
  filters = { airline: "", origin: "", dest: "", tripType: "", period: "24h", channel: "all", departureDate: "", arrivalDate: "" },
  anchorPrice,
  totalExposures = 0,
}: PriceCountCardProps) {
  return (
    <PriceCountsPanel
      data={data}
      loading={loading}
      filters={filters}
      anchorPrice={anchorPrice}
      totalExposures={totalExposures}
    />
  );
}
