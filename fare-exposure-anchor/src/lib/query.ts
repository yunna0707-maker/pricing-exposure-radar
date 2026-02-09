import { subHours, subDays } from "date-fns";
import type { ExposureQuery } from "./validators";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExposureRow } from "./supabaseAdmin";

export function getSinceDate(period: "24h" | "7d"): Date {
  if (period === "7d") return subDays(new Date(), 7);
  return subHours(new Date(), 24);
}

export async function fetchFilteredExposures(
  supabase: SupabaseClient,
  q: ExposureQuery,
  columns: string = "id, ts, airline, origin, dest, trip_type, channel, session_id, search_id, result_rank, price_krw, currency, is_discounted, departure_date, arrival_date, meta"
): Promise<ExposureRow[]> {
  const since = getSinceDate(q.period);
  let builder = supabase
    .from("exposure_events")
    .select(columns)
    .gte("ts", since.toISOString());

  if (q.airline) {
    const airlines = q.airline.split(",").map((s) => s.trim()).filter(Boolean);
    if (airlines.length === 1) builder = builder.eq("airline", airlines[0]!);
    else if (airlines.length > 1) builder = builder.in("airline", airlines);
  }
  if (q.origin) builder = builder.eq("origin", q.origin);
  if (q.dest) builder = builder.eq("dest", q.dest);
  if (q.tripType) builder = builder.eq("trip_type", q.tripType);
  if (q.channel) builder = builder.eq("channel", q.channel);
  if (q.departureDate && q.departureDate.trim() !== "") builder = builder.eq("departure_date", q.departureDate);
  if (q.arrivalDate && q.arrivalDate.trim() !== "") builder = builder.eq("arrival_date", q.arrivalDate);
  if (q.minPrice != null) builder = builder.gte("price_krw", q.minPrice);
  if (q.maxPrice != null) builder = builder.lte("price_krw", q.maxPrice);

  const { data, error } = await builder.order("ts", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown) as ExposureRow[];
}

export interface ByPriceRow {
  ts: string;
  channel: string;
  result_rank: number;
  search_id: string;
  session_id: string;
  price_krw: number;
}

export type ByPriceQueryInput = Pick<ExposureQuery, "airline" | "origin" | "dest" | "tripType" | "period"> & {
  priceKRW: number;
  channel?: string;
};

export async function fetchExposuresByPrice(
  supabase: SupabaseClient,
  q: ByPriceQueryInput
): Promise<ByPriceRow[]> {
  const since = getSinceDate(q.period);
  let builder = supabase
    .from("exposure_events")
    .select("ts, channel, result_rank, search_id, session_id, price_krw")
    .gte("ts", since.toISOString())
    .eq("price_krw", q.priceKRW);

  if (q.airline) {
    const airlines = q.airline.split(",").map((s) => s.trim()).filter(Boolean);
    if (airlines.length === 1) builder = builder.eq("airline", airlines[0]!);
    else if (airlines.length > 1) builder = builder.in("airline", airlines);
  }
  if (q.origin) builder = builder.eq("origin", q.origin);
  if (q.dest) builder = builder.eq("dest", q.dest);
  if (q.tripType) builder = builder.eq("trip_type", q.tripType);
  if (q.channel && q.channel !== "all") builder = builder.eq("channel", q.channel);

  const { data, error } = await builder.order("ts", { ascending: false }).limit(50);
  if (error) throw error;
  return ((data ?? []) as unknown) as ByPriceRow[];
}
