import { subHours, subDays } from "date-fns";
import type { ExposureQuery } from "./validators";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExposureRow } from "./supabaseAdmin";

export function getSinceDate(period: "24h" | "7d"): Date {
  return getSinceDateIso(period).since;
}

/** 규칙 A~E: 빈값/"all"이면 조건 적용 안 함. origin만 있으면 dest 조건 안 걸음(B). */
function isFilterValue(v: string | undefined | null): v is string {
  return typeof v === "string" && v.trim() !== "" && v.trim() !== "all";
}

export function buildExposureDebugInfo(q: ExposureQuery, since: Date, rowsLength: number): {
  appliedFilters: Record<string, unknown>;
  queryDescription: string;
  rowsCount: number;
  since: string;
} {
  const applied: Record<string, unknown> = {
    period: q.period ?? "24h",
    since: since.toISOString(),
  };
  if (isFilterValue(q.airline)) applied.airline = q.airline;
  if (isFilterValue(q.origin)) applied.origin = q.origin;
  if (isFilterValue(q.dest)) applied.dest = q.dest;
  if (isFilterValue(q.tripType)) applied.tripType = q.tripType;
  if (isFilterValue(q.channel)) applied.channel = q.channel;
  if (q.departureDate?.trim()) applied.departureDate = q.departureDate;
  if (q.arrivalDate?.trim()) applied.arrivalDate = q.arrivalDate;
  if (q.minPrice != null) applied.minPrice = q.minPrice;
  if (q.maxPrice != null) applied.maxPrice = q.maxPrice;

  const parts: string[] = [`ts >= ${since.toISOString()}`];
  if (applied.airline != null) parts.push(`airline in [${String(applied.airline)}]`);
  if (applied.origin != null) parts.push(`origin = ${applied.origin}`);
  if (applied.dest != null) parts.push(`dest = ${applied.dest}`);
  if (applied.tripType != null) parts.push(`trip_type = ${applied.tripType}`);
  if (applied.channel != null) parts.push(`channel = ${applied.channel}`);
  if (applied.departureDate != null) parts.push(`departure_date = ${applied.departureDate}`);
  if (applied.arrivalDate != null) parts.push(`arrival_date = ${applied.arrivalDate}`);
  if (applied.minPrice != null) parts.push(`price_krw >= ${applied.minPrice}`);
  if (applied.maxPrice != null) parts.push(`price_krw <= ${applied.maxPrice}`);

  return {
    appliedFilters: applied,
    queryDescription: parts.join(", "),
    rowsCount: rowsLength,
    since: since.toISOString(),
  };
}

export async function fetchFilteredExposures(
  supabase: SupabaseClient,
  q: ExposureQuery,
  columns: string = "id, ts, airline, origin, dest, trip_type, channel, session_id, search_id, result_rank, price_krw, currency, is_discounted, departure_date, arrival_date, meta"
): Promise<ExposureRow[]> {
  const period = q.period ?? "24h";
  const since = getSinceDate(period);
  let builder = supabase
    .from("exposure_events")
    .select(columns)
    .gte("ts", since.toISOString());

  if (isFilterValue(q.airline)) {
    const airlines = q.airline.split(",").map((s) => s.trim()).filter(Boolean);
    if (airlines.length === 1) builder = builder.eq("airline", airlines[0]!);
    else if (airlines.length > 1) builder = builder.in("airline", airlines);
  }
  if (isFilterValue(q.origin)) builder = builder.eq("origin", q.origin);
  if (isFilterValue(q.dest)) builder = builder.eq("dest", q.dest);
  if (isFilterValue(q.tripType)) builder = builder.eq("trip_type", q.tripType);
  if (isFilterValue(q.channel)) builder = builder.eq("channel", q.channel);
  if (q.departureDate?.trim()) builder = builder.eq("departure_date", q.departureDate.trim());
  if (q.arrivalDate?.trim()) builder = builder.eq("arrival_date", q.arrivalDate.trim());
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

  if (isFilterValue(q.airline)) {
    const airlines = q.airline.split(",").map((s) => s.trim()).filter(Boolean);
    if (airlines.length === 1) builder = builder.eq("airline", airlines[0]!);
    else if (airlines.length > 1) builder = builder.in("airline", airlines);
  }
  if (isFilterValue(q.origin)) builder = builder.eq("origin", q.origin);
  if (isFilterValue(q.dest)) builder = builder.eq("dest", q.dest);
  if (isFilterValue(q.tripType)) builder = builder.eq("trip_type", q.tripType);
  if (isFilterValue(q.channel)) builder = builder.eq("channel", q.channel);

  const { data, error } = await builder.order("ts", { ascending: false }).limit(50);
  if (error) throw error;
  return ((data ?? []) as unknown) as ByPriceRow[];
}

/** GET /api/exposures/options — 캐스케이딩 필터용 distinct 값 조회 */
export interface FilterOptionsQuery {
  airline?: string;
  origin?: string;
  dest?: string;
  tripType?: string;
  period?: "24h" | "7d";
  channel?: string;
  departureDate?: string;
  arrivalDate?: string;
}

export interface FilterOptionsResult {
  airlines: string[];
  origins: string[];
  dests: string[];
  tripTypes: string[];
  channels: string[];
  availablePairsCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyOptionsFilters(
  q: FilterOptionsQuery,
  omitKey: "airline" | "origin" | "dest" | "trip_type" | "channel"
): (builder: any) => any {
  return (builder: any) => {
    let b = builder;
    if (omitKey !== "airline" && q.airline) {
      const airlines = q.airline.split(",").map((s) => s.trim()).filter(Boolean);
      if (airlines.length === 1) b = b.eq("airline", airlines[0]!);
      else if (airlines.length > 1) b = b.in("airline", airlines);
    }
    if (omitKey !== "origin" && q.origin) b = b.eq("origin", q.origin);
    if (omitKey !== "dest" && q.dest) b = b.eq("dest", q.dest);
    if (omitKey !== "trip_type" && q.tripType) b = b.eq("trip_type", q.tripType);
    if (omitKey !== "channel" && q.channel && q.channel !== "all") b = b.eq("channel", q.channel);
    if (q.departureDate?.trim()) b = b.eq("departure_date", q.departureDate!.trim());
    if (q.arrivalDate?.trim()) b = b.eq("arrival_date", q.arrivalDate!.trim());
    return b;
  };
}

/** 기간 필터용 cutoff 계산. 서버 now 기준 UTC ISO 문자열로 통일해 DB(timestamptz)와 비교. */
export function getSinceDateIso(period: "24h" | "7d"): { since: Date; cutoffIso: string; nowIso: string } {
  const now = new Date();
  const since = period === "7d" ? subDays(now, 7) : subHours(now, 24);
  return { since, cutoffIso: since.toISOString(), nowIso: now.toISOString() };
}

export interface OptionsDebugCounts {
  totalCount: number;
  periodCount: number;
  airlineCount: number;
  odCount: number;
  finalCount: number;
  whereSummary: string;
  nowIso: string;
  cutoffIso: string;
}

/** options API debug=1 시 단계별 카운트로 원인 진단 (기간/항공사/OD 순). */
export async function getOptionsDebugCounts(
  supabase: SupabaseClient,
  q: FilterOptionsQuery
): Promise<OptionsDebugCounts> {
  const period = q.period ?? "24h";
  const { since, cutoffIso, nowIso } = getSinceDateIso(period);

  const parts: string[] = [`ts >= ${cutoffIso}`];
  if (q.airline?.trim()) parts.push(`airline = ${q.airline.trim()}`);
  if (q.origin?.trim()) parts.push(`origin = ${q.origin.trim()}`);
  if (q.dest?.trim()) parts.push(`dest = ${q.dest.trim()}`);
  if (q.tripType?.trim()) parts.push(`trip_type = ${q.tripType.trim()}`);
  if (q.channel?.trim() && q.channel !== "all") parts.push(`channel = ${q.channel.trim()}`);
  if (q.departureDate?.trim()) parts.push(`departure_date = ${q.departureDate.trim()}`);
  if (q.arrivalDate?.trim()) parts.push(`arrival_date = ${q.arrivalDate.trim()}`);
  const whereSummary = parts.join(", ");

  const basePeriod = supabase.from("exposure_events").select("id", { count: "exact", head: true }).gte("ts", cutoffIso);
  const { count: periodCount } = await basePeriod;
  const totalRes = await supabase.from("exposure_events").select("id", { count: "exact", head: true });
  const totalCount = totalRes.count ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let builder: any = supabase
    .from("exposure_events")
    .select("id", { count: "exact", head: true })
    .gte("ts", cutoffIso);
  if (q.airline?.trim()) {
    const airlines = q.airline.split(",").map((s) => s.trim()).filter(Boolean);
    if (airlines.length === 1) builder = builder.eq("airline", airlines[0]!);
    else if (airlines.length > 1) builder = builder.in("airline", airlines);
  }
  const { count: airlineCount } = await builder;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let odBuilder: any = supabase
    .from("exposure_events")
    .select("id", { count: "exact", head: true })
    .gte("ts", cutoffIso);
  if (q.airline?.trim()) {
    const airlines = q.airline.split(",").map((s) => s.trim()).filter(Boolean);
    if (airlines.length === 1) odBuilder = odBuilder.eq("airline", airlines[0]!);
    else if (airlines.length > 1) odBuilder = odBuilder.in("airline", airlines);
  }
  if (q.origin?.trim()) odBuilder = odBuilder.eq("origin", q.origin.trim());
  if (q.dest?.trim()) odBuilder = odBuilder.eq("dest", q.dest.trim());
  const { count: odCount } = await odBuilder;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalBuilder: any = supabase
    .from("exposure_events")
    .select("id", { count: "exact", head: true })
    .gte("ts", cutoffIso);
  if (q.airline?.trim()) {
    const airlines = q.airline.split(",").map((s) => s.trim()).filter(Boolean);
    if (airlines.length === 1) finalBuilder = finalBuilder.eq("airline", airlines[0]!);
    else if (airlines.length > 1) finalBuilder = finalBuilder.in("airline", airlines);
  }
  if (q.origin?.trim()) finalBuilder = finalBuilder.eq("origin", q.origin.trim());
  if (q.dest?.trim()) finalBuilder = finalBuilder.eq("dest", q.dest.trim());
  if (q.tripType?.trim()) finalBuilder = finalBuilder.eq("trip_type", q.tripType.trim());
  if (q.channel?.trim() && q.channel !== "all") finalBuilder = finalBuilder.eq("channel", q.channel.trim());
  if (q.departureDate?.trim()) finalBuilder = finalBuilder.eq("departure_date", q.departureDate.trim());
  if (q.arrivalDate?.trim()) finalBuilder = finalBuilder.eq("arrival_date", q.arrivalDate.trim());
  const { count: finalCount } = await finalBuilder;

  return {
    totalCount,
    periodCount: periodCount ?? 0,
    airlineCount: airlineCount ?? 0,
    odCount: odCount ?? 0,
    finalCount: finalCount ?? 0,
    whereSummary,
    nowIso,
    cutoffIso,
  };
}

export async function fetchFilterOptions(
  supabase: SupabaseClient,
  q: FilterOptionsQuery
): Promise<FilterOptionsResult> {
  const period = q.period ?? "24h";
  const { since } = getSinceDateIso(period);

  const runDistinct = async (
    column: "airline" | "origin" | "dest" | "trip_type" | "channel"
  ): Promise<string[]> => {
    const builder = applyOptionsFilters(q, column)(
      supabase.from("exposure_events").select(column).gte("ts", since.toISOString())
    );
    const { data, error } = await builder;
    if (error) throw error;
    const values: string[] = (data ?? [])
      .map((r: Record<string, unknown>) => r[column])
      .filter((v: unknown): v is string => typeof v === "string" && v.length > 0);
    return Array.from(new Set(values)).sort();
  };

  const runPairsCount = async (): Promise<number> => {
    let builder = supabase
      .from("exposure_events")
      .select("origin, dest")
      .gte("ts", since.toISOString());
    builder = applyOptionsFilters(q, "airline")(builder);
    if (q.airline) {
      const airlines = q.airline.split(",").map((s) => s.trim()).filter(Boolean);
      if (airlines.length === 1) builder = builder.eq("airline", airlines[0]!);
      else if (airlines.length > 1) builder = builder.in("airline", airlines);
    }
    const { data, error } = await builder;
    if (error) throw error;
    const pairs = new Set<string>((data ?? []).map((r: { origin: string; dest: string }) => `${r.origin}-${r.dest}`));
    return pairs.size;
  };

  const [airlines, origins, dests, tripTypes, channels, availablePairsCount] = await Promise.all([
    runDistinct("airline"),
    runDistinct("origin"),
    runDistinct("dest"),
    runDistinct("trip_type"),
    runDistinct("channel"),
    runPairsCount(),
  ]);

  return {
    airlines,
    origins,
    dests,
    tripTypes,
    channels,
    availablePairsCount,
  };
}
