/**
 * Supabase exposure_events 테이블에 대량 시드 데이터 삽입
 * - .env.local 또는 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * - SEED_COUNT=50000 (기본), SEED_TRUNCATE=true 시 기존 데이터 삭제 후 삽입
 *
 * 실행: npm run seed
 * 예: SEED_COUNT=80000 SEED_TRUNCATE=true npm run seed
 */
import dotenv from "dotenv";
import { resolve } from "path";
import { checkEnv } from "./check-env";
import { testSupabase } from "./test-supabase";
import { createClient } from "@supabase/supabase-js";
import { subHours, subDays, addDays, format } from "date-fns";
import { cyan, yellow } from "colorette";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}

const supabase = createClient(url, key);

const DEFAULT_INSERT_COUNT = 50_000;
const INSERT_COUNT = Math.max(1000, parseInt(process.env.SEED_COUNT ?? String(DEFAULT_INSERT_COUNT), 10) || DEFAULT_INSERT_COUNT);
const CHUNK_SIZE = 1500;
const SEED_TRUNCATE = process.env.SEED_TRUNCATE === "true" || process.env.SEED_TRUNCATE === "1";

const AIRLINES = ["KE", "OZ", "7C", "LJ", "TW", "BX", "RS", "ZE", "SQ", "JL", "NH", "UA", "DL", "AA"];

type RouteGroup = "domestic" | "japan" | "sea" | "us";
const OD_PAIRS: { origin: string; dest: string; group: RouteGroup }[] = [
  { origin: "GMP", dest: "CJU", group: "domestic" },
  { origin: "GMP", dest: "PUS", group: "domestic" },
  { origin: "ICN", dest: "CJU", group: "domestic" },
  { origin: "ICN", dest: "PUS", group: "domestic" },
  { origin: "ICN", dest: "GMP", group: "domestic" },
  { origin: "ICN", dest: "NRT", group: "japan" },
  { origin: "ICN", dest: "KIX", group: "japan" },
  { origin: "GMP", dest: "HND", group: "japan" },
  { origin: "ICN", dest: "FUK", group: "japan" },
  { origin: "ICN", dest: "BKK", group: "sea" },
  { origin: "ICN", dest: "SIN", group: "sea" },
  { origin: "ICN", dest: "SGN", group: "sea" },
  { origin: "ICN", dest: "MNL", group: "sea" },
  { origin: "ICN", dest: "KUL", group: "sea" },
  { origin: "ICN", dest: "LAX", group: "us" },
  { origin: "ICN", dest: "SFO", group: "us" },
  { origin: "ICN", dest: "SEA", group: "us" },
];

const PRICE_CONFIG: Record<RouteGroup, { min: number; max: number; peaks: number[] }> = {
  domestic: { min: 70_000, max: 250_000, peaks: [120_000, 180_000] },
  japan: { min: 200_000, max: 650_000, peaks: [350_000, 480_000] },
  sea: { min: 300_000, max: 900_000, peaks: [450_000, 620_000, 780_000] },
  us: { min: 1_200_000, max: 2_300_000, peaks: [1_500_000, 1_900_000] },
};

const DEVICES = ["ios", "android", "desktop"] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// trip_type: OW 45%, RT 45%, MC 10%
function randomTripType(): "OW" | "RT" | "MC" {
  const r = Math.random();
  if (r < 0.45) return "OW";
  if (r < 0.9) return "RT";
  return "MC";
}

// channel: web 45%, mobile 45%, api 10%
function randomChannel(): "web" | "mobile" | "api" {
  const r = Math.random();
  if (r < 0.45) return "web";
  if (r < 0.9) return "mobile";
  return "api";
}

// 가격: 봉우리(peaks) 주변으로 삼각/정규처럼 분포
function randomPrice(group: RouteGroup): number {
  const cfg = PRICE_CONFIG[group];
  const usePeak = Math.random() < 0.6;
  if (usePeak && cfg.peaks.length > 0) {
    const peak = pick(cfg.peaks);
    const spread = Math.floor((cfg.max - cfg.min) * 0.15);
    return Math.max(cfg.min, Math.min(cfg.max, peak + randomInt(-spread, spread)));
  }
  return randomInt(cfg.min, cfg.max);
}

// ts: 최근 24h 80%, 최근 7일 20%
function randomTs(): string {
  const now = Date.now();
  const r = Math.random();
  if (r < 0.8) {
    const h = Math.random() * 24;
    return subHours(new Date(now), h).toISOString();
  }
  const d = Math.random() * 7;
  return subDays(subHours(new Date(now), Math.random() * 24), d).toISOString();
}

// departure_date: 오늘+7~45일
function randomDepartureDate(): string {
  return format(addDays(new Date(), randomInt(7, 45)), "yyyy-MM-dd");
}

// arrival_date: OW null 또는 +0~1일, RT +3~14, MC +5~20
function randomArrivalDate(departureDate: string, tripType: string): string | null {
  const dep = new Date(departureDate + "T12:00:00Z");
  if (tripType === "OW") {
    if (Math.random() < 0.3) return null;
    return randomInt(0, 1) === 0 ? departureDate : format(addDays(dep, 1), "yyyy-MM-dd");
  }
  if (tripType === "RT") {
    return format(addDays(dep, randomInt(3, 14)), "yyyy-MM-dd");
  }
  return format(addDays(dep, randomInt(5, 20)), "yyyy-MM-dd");
}

function randomStr(len: number): string {
  return Math.random().toString(36).slice(2, 2 + len);
}

type Row = {
  ts: string;
  airline: string;
  origin: string;
  dest: string;
  trip_type: string;
  channel: string;
  session_id: string;
  search_id: string;
  result_rank: number;
  price_krw: number;
  currency: string;
  is_discounted: boolean;
  departure_date: string;
  arrival_date: string | null;
  meta: Record<string, unknown>;
};

function buildSessionPool(size: number): string[] {
  const pool: string[] = [];
  for (let i = 0; i < size; i++) pool.push(`s-${randomStr(10)}`);
  return pool;
}

function generateRows(targetCount: number, sessionPool: string[]): Row[] {
  const rows: Row[] = [];
  while (rows.length < targetCount) {
    const sessionId = pick(sessionPool);
    const searchId = `q-${randomStr(10)}`;
    const size = Math.min(30, randomInt(10, 30), targetCount - rows.length);
    if (size <= 0) break;
    const route = pick(OD_PAIRS);
    const airline = pick(AIRLINES);
    const tripType = randomTripType();
    const channel = randomChannel();
    const departure_date = randomDepartureDate();
    const arrival_date = randomArrivalDate(departure_date, tripType);
    for (let r = 0; r < size; r++) {
      rows.push({
        ts: randomTs(),
        airline,
        origin: route.origin,
        dest: route.dest,
        trip_type: tripType,
        channel,
        session_id: sessionId,
        search_id: searchId,
        result_rank: r + 1,
        price_krw: randomPrice(route.group),
        currency: "KRW",
        is_discounted: Math.random() < 0.2,
        departure_date,
        arrival_date,
        meta: {
          device: pick(DEVICES),
          locale: "ko-KR",
          source: "mock-seed",
        },
      });
    }
  }
  return rows.slice(0, targetCount);
}

async function truncateIfRequested(): Promise<void> {
  if (!SEED_TRUNCATE) return;
  console.log(yellow("⚠ SEED_TRUNCATE=true: 기존 시드 데이터(currency=KRW) 삭제 후 삽입합니다."));
  const { error } = await supabase.from("exposure_events").delete().eq("currency", "KRW");
  if (error) {
    console.error("삭제 실패:", error.message);
    console.log(yellow("Supabase SQL Editor에서 수동 실행: DELETE FROM exposure_events; 또는 TRUNCATE exposure_events;"));
    process.exit(1);
  }
  console.log(cyan("기존 노출 데이터 삭제 완료."));
}

async function fetchVerificationFromDb(): Promise<void> {
  console.log(cyan("\n--- DB 검증 (삽입 후 샘플 집계, 전체는 docs/seed-verify.sql 사용) ---"));

  const PAGE = 1000;
  const byAirline: Record<string, number> = {};
  const byOd: Record<string, number> = {};
  const byTrip: Record<string, number> = {};
  const byCh: Record<string, number> = {};
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from("exposure_events")
      .select("airline, origin, dest, trip_type, channel")
      .range(offset, offset + PAGE - 1)
      .order("ts", { ascending: false });
    if (error || !data?.length) {
      hasMore = false;
      break;
    }
    for (const r of data as { airline: string; origin: string; dest: string; trip_type: string; channel: string }[]) {
      byAirline[r.airline] = (byAirline[r.airline] ?? 0) + 1;
      byOd[`${r.origin}-${r.dest}`] = (byOd[`${r.origin}-${r.dest}`] ?? 0) + 1;
      byTrip[r.trip_type] = (byTrip[r.trip_type] ?? 0) + 1;
      byCh[r.channel] = (byCh[r.channel] ?? 0) + 1;
    }
    if (data.length < PAGE) hasMore = false;
    else offset += PAGE;
    if (offset >= 50_000) hasMore = false;
  }

  const airlineTop10 = Object.entries(byAirline).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const odTop10 = Object.entries(byOd).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log(cyan("항공사별 건수 Top10:"), airlineTop10);
  console.log(cyan("노선(OD)별 건수 Top10:"), odTop10);
  console.log(cyan("trip_type 분포:"), byTrip);
  console.log(cyan("channel 분포:"), byCh);
}

async function main() {
  checkEnv();
  await testSupabase();

  await truncateIfRequested();

  const sessionPoolSize = Math.max(5000, Math.floor(INSERT_COUNT / 5));
  const sessionPool = buildSessionPool(sessionPoolSize);
  console.log(cyan(`Generating ${INSERT_COUNT} rows (sessions ~${sessionPoolSize}, chunk=${CHUNK_SIZE})...`));
  const rows = generateRows(INSERT_COUNT, sessionPool);

  let inserted = 0;
  for (let offset = 0; offset < rows.length; offset += CHUNK_SIZE) {
    const batch = rows.slice(offset, offset + CHUNK_SIZE);
    const { error } = await supabase.from("exposure_events").insert(batch);
    if (error) {
      console.error("Insert error:", error);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(cyan(`  ${inserted} / ${INSERT_COUNT}`));
  }

  await fetchVerificationFromDb();
  console.log(cyan("\nDone. Supabase SQL Editor에서 docs/seed-verify.sql 로 추가 검증 가능."));
}

main();
