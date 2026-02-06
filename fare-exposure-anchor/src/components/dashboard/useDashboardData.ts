"use client";

import { useState, useEffect, useCallback } from "react";
import { getMissingFilterLabels, type DashboardFilters, type SummaryData, type HistogramData, type TimeseriesData, type RecentItem, type PriceCountsData } from "./types";

function buildQuery(f: DashboardFilters): string {
  const p = new URLSearchParams();
  if (f.airline) p.set("airline", f.airline);
  if (f.origin) p.set("origin", f.origin);
  if (f.dest) p.set("dest", f.dest);
  if (f.tripType) p.set("tripType", f.tripType);
  if (f.period) p.set("period", f.period);
  if (f.channel && f.channel !== "all") p.set("channel", f.channel);
  if (f.departureDate?.trim()) p.set("departureDate", f.departureDate);
  if (f.arrivalDate?.trim()) p.set("arrivalDate", f.arrivalDate);
  return p.toString();
}

export function useDashboardData(filters: DashboardFilters, histogramBinSize: number = 10000) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [histogram, setHistogram] = useState<HistogramData | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [priceCounts, setPriceCounts] = useState<PriceCountsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (getMissingFilterLabels(filters).length > 0) {
      setSummary(null);
      setHistogram(null);
      setTimeseries(null);
      setRecent([]);
      setPriceCounts(null);
      setError(null);
      setLoading(false);
      return;
    }
    const q = buildQuery(filters);
    const histQuery = `${q}&binSize=${histogramBinSize}`;
    const base = `/api/exposures`;
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, histRes, tsRes, recentRes, priceCountsRes] = await Promise.all([
        fetch(`${base}/summary?${q}`),
        fetch(`${base}/histogram?${histQuery}`),
        fetch(`${base}/timeseries?${q}`),
        fetch(`${base}/recent?${q}`),
        fetch(`${base}/price-counts?${q}`),
      ]);

      async function errText(res: Response): Promise<string> {
        const text = await res.text();
        try {
          const j = JSON.parse(text) as { error?: string };
          return j.error ?? text;
        } catch {
          return text;
        }
      }

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
  }, [filters.airline, filters.origin, filters.dest, filters.tripType, filters.period, filters.channel, filters.departureDate, filters.arrivalDate, histogramBinSize]);

  useEffect(() => {
    const missing = getMissingFilterLabels(filters);
    if (missing.length > 0) {
      setSummary(null);
      setHistogram(null);
      setTimeseries(null);
      setRecent([]);
      setPriceCounts(null);
      setError(null);
      setLoading(false);
      return;
    }
    fetchAll();
  }, [filters, fetchAll]);

  return { summary, histogram, timeseries, recent, priceCounts, loading, error, refetch: fetchAll };
}
