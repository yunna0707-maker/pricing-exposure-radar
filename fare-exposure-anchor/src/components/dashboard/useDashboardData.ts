"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardFilters, SummaryData, HistogramData, TimeseriesData, RecentItem, PriceCountsData } from "./types";

/** state 기준으로 쿼리 생성. 빈 값은 param에 포함하지 않음. period는 기본값 24h이므로 보통 존재 */
function buildQuery(f: DashboardFilters, addDebug = false): string {
  const p = new URLSearchParams();
  if (f.period?.trim()) p.set("period", f.period.trim());
  if (f.airline?.trim()) p.set("airline", f.airline.trim());
  if (f.origin?.trim()) p.set("origin", f.origin.trim());
  if (f.dest?.trim()) p.set("dest", f.dest.trim());
  if (f.tripType?.trim()) p.set("tripType", f.tripType.trim());
  if (f.channel?.trim() && f.channel !== "all") p.set("channel", f.channel.trim());
  if (f.departureDate?.trim()) p.set("departureDate", f.departureDate.trim());
  if (f.arrivalDate?.trim()) p.set("arrivalDate", f.arrivalDate.trim());
  if (f.minPrice != null) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice != null) p.set("maxPrice", String(f.maxPrice));
  if (addDebug) p.set("debug", "1");
  return p.toString();
}

export function useDashboardData(
  filters: DashboardFilters,
  histogramBinSize: number = 10000,
  options?: { debug?: boolean }
) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [histogram, setHistogram] = useState<HistogramData | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [priceCounts, setPriceCounts] = useState<PriceCountsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDebug, setLastDebug] = useState<Record<string, unknown> | null>(null);
  const [lastHistogramDebug, setLastHistogramDebug] = useState<Record<string, unknown> | null>(null);

  const fetchAll = useCallback(async () => {
    const q = buildQuery(filters, options?.debug);
    // histogram API는 binSize를 query param으로 받음. 구간 크기 변경 시 부모에서 refetch 호출해야 차트가 갱신됨.
    const histQuery = `${q}&binSize=${histogramBinSize}`;
    const base = `/api/exposures`;
    setLoading(true);
    setError(null);
    setLastDebug(null);
    setLastHistogramDebug(null);
    try {
      const [summaryRes, histRes, tsRes, recentRes, priceCountsRes] = await Promise.all([
        fetch(`${base}/summary?${q}`, { cache: "no-store" }),
        fetch(`${base}/histogram?${histQuery}`, { cache: "no-store" }),
        fetch(`${base}/timeseries?${q}`, { cache: "no-store" }),
        fetch(`${base}/recent?${q}`, { cache: "no-store" }),
        fetch(`${base}/price-counts?${q}`, { cache: "no-store" }),
      ]);

      const errText = async (res: Response): Promise<string> => {
        const text = await res.text();
        try {
          const j = JSON.parse(text) as { error?: string };
          return j.error ?? text;
        } catch {
          return text;
        }
      };

      if (!summaryRes.ok) throw new Error(await errText(summaryRes));
      if (!histRes.ok) throw new Error(await errText(histRes));
      if (!tsRes.ok) throw new Error(await errText(tsRes));
      if (!recentRes.ok) throw new Error(await errText(recentRes));
      if (!priceCountsRes.ok) throw new Error(await errText(priceCountsRes));

      const [s, h, t, r, pc] = await Promise.all([
        summaryRes.json(),
        histRes.json(),
        tsRes.json(),
        recentRes.json(),
        priceCountsRes.json(),
      ]);
      setSummary(s);
      setHistogram(h);
      setTimeseries(t);
      setRecent(r.items ?? []);
      setPriceCounts(pc);
      if (s?.debug) setLastDebug(s.debug);
      if (h?.debug) setLastHistogramDebug(h.debug as Record<string, unknown>);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      if (msg === "Failed to fetch" || msg === "Failed to load") {
        setError(
          "API에 연결할 수 없습니다. 아래를 순서대로 확인하세요.\n\n" +
          "1) fare-exposure-anchor 폴더에서 터미널로 npm run dev 또는 npm run dev:all 실행\n" +
          "2) 브라우저 주소가 http://localhost:3000 (또는 터미널에 표시된 주소)인지 확인\n" +
          "3) .env.local에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 있는지 확인"
        );
      } else {
        setError(msg);
      }
      setSummary(null);
      setHistogram(null);
      setTimeseries(null);
      setRecent([]);
      setPriceCounts(null);
    } finally {
      setLoading(false);
    }
  }, [filters, histogramBinSize, options?.debug]);

  const clearData = useCallback(() => {
    setSummary(null);
    setHistogram(null);
    setTimeseries(null);
    setRecent([]);
    setPriceCounts(null);
    setLoading(false);
    setError(null);
    setLastDebug(null);
    setLastHistogramDebug(null);
  }, []);

  return {
    summary,
    histogram,
    timeseries,
    recent,
    priceCounts,
    loading,
    error,
    refetch: fetchAll,
    clearData,
    lastDebug,
    lastHistogramDebug,
    buildQueryString: (withDebug = false) => buildQuery(filters, withDebug),
  };
}
