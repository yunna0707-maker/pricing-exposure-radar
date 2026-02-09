export interface DashboardFilters {
  airline: string;
  origin: string;
  dest: string;
  tripType: string;
  period: string;
  channel: string;
  departureDate: string;
  arrivalDate: string;
  /** 가격대 구간 필터 (이 구간으로 필터 적용 시 설정) */
  minPrice?: number;
  maxPrice?: number;
}

export const defaultFilters: DashboardFilters = {
  airline: "",
  origin: "",
  dest: "",
  tripType: "",
  period: "",
  channel: "",
  departureDate: "",
  arrivalDate: "",
};

/** 날짜 제외, 조회 시 필수로 검증할 필터 키와 한글 라벨 */
const REQUIRED_FILTER_LABELS: { key: keyof DashboardFilters; label: string }[] = [
  { key: "airline", label: "항공사" },
  { key: "origin", label: "출발" },
  { key: "dest", label: "도착" },
  { key: "tripType", label: "편도/왕복" },
  { key: "period", label: "기간" },
  { key: "channel", label: "채널" },
];

/** 날짜를 제외한 필터 값 누락 시 누락된 항목 라벨 목록 반환 */
export function getMissingFilterLabels(f: DashboardFilters): string[] {
  return REQUIRED_FILTER_LABELS.filter(({ key }) => {
    const v = f[key];
    return typeof v !== "string" || !v.trim();
  }).map(({ label }) => label);
}

export interface SummaryData {
  totalExposures: number;
  uniqueSessions: number;
  p25: number;
  p50: number;
  p75: number;
  anchorPrice: number;
  modeBin: { binStart: number; binEnd: number; count: number } | null;
}

export interface HistogramData {
  binSize: number;
  bins: { binStart: number; binEnd: number; count: number }[];
}

export interface TimeseriesData {
  interval: string;
  points: { hour: string; avgPrice: number; medianPrice: number; count: number }[];
}

export interface RecentItem {
  id: string;
  ts: string;
  airline: string;
  origin: string;
  dest: string;
  trip_type: string;
  channel: string;
  result_rank: number;
  price_krw: number;
  is_discounted: boolean;
  departure_date: string | null;
  arrival_date: string | null;
}

/** 동일 금액별 노출 횟수 (노출한 금액이 그대로 N번 나온 횟수) */
export interface PriceCountItem {
  price_krw: number;
  count: number;
}

export interface PriceCountsData {
  items: PriceCountItem[];
}
