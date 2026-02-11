import type { ExposureRow } from "./supabaseAdmin";

/**
 * MVP: percentiles are computed in-memory after fetching filtered rows.
 * 데이터 증가 시: DB에서 percentile_cont 등으로 계산하거나, 미리 집계 테이블을 두는 방식으로 개선 권장.
 */
export function computePercentiles(
  prices: number[],
  p25: number = 25,
  p50: number = 50,
  p75: number = 75
): { p25: number; p50: number; p75: number } {
  if (prices.length === 0) return { p25: 0, p50: 0, p75: 0 };
  const sorted = [...prices].sort((a, b) => a - b);
  const idx = (p: number) => Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return {
    p25: sorted[idx(p25)] ?? 0,
    p50: sorted[idx(p50)] ?? 0,
    p75: sorted[idx(p75)] ?? 0,
  };
}

/**
 * 가격 구간(bucket) 히스토그램 계산. 구간 기준은 Math.floor(price / binSize) * binSize 로 통일.
 * (프론트/서버 동일 binSize + 이 공식으로 x축 구간·막대 개수가 일치해야 함)
 */
export function computeHistogram(
  prices: number[],
  binSize: number
): { binStart: number; binEnd: number; count: number }[] {
  if (prices.length === 0) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const low = Math.floor(min / binSize) * binSize;
  const high = Math.ceil(max / binSize) * binSize;
  const bins: Map<number, number> = new Map();
  for (let b = low; b < high; b += binSize) bins.set(b, 0);
  for (const p of prices) {
    const b = Math.floor(p / binSize) * binSize;
    bins.set(b, (bins.get(b) ?? 0) + 1);
  }
  return Array.from(bins.entries())
    .sort(([a], [b]) => a - b)
    .map(([binStart, count]) => ({ binStart, binEnd: binStart + binSize, count }));
}

export function computeModeBin(
  bins: { binStart: number; binEnd: number; count: number }[]
): { binStart: number; binEnd: number; count: number } | null {
  if (bins.length === 0) return null;
  return bins.reduce((best, cur) => (cur.count > best.count ? cur : best));
}

/**
 * Timeseries: group by hour, then avg/median/count per hour.
 */
export function computeTimeseries(rows: ExposureRow[]): {
  hour: string;
  avgPrice: number;
  medianPrice: number;
  count: number;
}[] {
  const byHour = new Map<string, number[]>();
  for (const r of rows) {
    const d = new Date(r.ts);
    const hour = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:00:00Z`;
    if (!byHour.has(hour)) byHour.set(hour, []);
    byHour.get(hour)!.push(r.price_krw);
  }
  return Array.from(byHour.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, prices]) => {
      const sorted = [...prices].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
      const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
      return { hour, avgPrice: Math.round(avg), medianPrice: median, count: prices.length };
    });
}
