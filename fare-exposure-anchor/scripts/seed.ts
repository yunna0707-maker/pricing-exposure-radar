/**
 * Supabase에 노출 이벤트 더미 50,000건 삽입
 * 실행: npm run seed
 * 실행 전 check-env 및 Supabase 연결 테스트 자동 수행
 *
 * "Could not find the 'arrival_date' column" 오류 시:
 * Supabase SQL Editor에서 supabase/migrations/20250205000000_add_departure_arrival_dates.sql 실행
 */
import dotenv from "dotenv";
import { resolve } from "path";
import { checkEnv } from "./check-env";
import { testSupabase } from "./test-supabase";
import { createClient } from "@supabase/supabase-js";
import { subHours, subDays, addDays, format } from "date-fns";
import { cyan } from "colorette";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) process.exit(1);

const supabase = createClient(url, key);

const BATCH = 1000;
const TOTAL = 50_000;

// 노선별 가격 중심 (KRW): ICN-LAX 고가, ICN-NRT 중가, GMP-CJU 저가, MC 다구간
const ROUTES = [
  { airline: "OZ", origin: "ICN", dest: "LAX", trip_type: "RT", base: 1_550_000, spread: 80_000 },
  { airline: "OZ", origin: "ICN", dest: "NRT", trip_type: "RT", base: 1_200_000, spread: 100_000 },
  { airline: "OZ", origin: "GMP", dest: "CJU", trip_type: "RT", base: 180_000, spread: 40_000 },
  { airline: "OZ", origin: "ICN", dest: "LAX", trip_type: "OW", base: 900_000, spread: 60_000 },
  { airline: "KE", origin: "ICN", dest: "LAX", trip_type: "RT", base: 1_520_000, spread: 90_000 },
  { airline: "OZ", origin: "ICN", dest: "BKK", trip_type: "MC", base: 1_800_000, spread: 120_000 },
  { airline: "KE", origin: "ICN", dest: "SIN", trip_type: "MC", base: 1_650_000, spread: 100_000 },
] as const;

const CHANNELS = ["web", "mobile", "api"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// 최근 24시간에 더 몰리도록: 70%는 24h, 30%는 7일 이내
function randomTs(): Date {
  const now = Date.now();
  const r = Math.random();
  if (r < 0.7) {
    const h = Math.random() * 24;
    return subHours(new Date(now), h);
  }
  const d = Math.random() * 7;
  return subDays(subHours(new Date(now), Math.random() * 24), d);
}

// 가상 출발일: 오늘 ~ 60일 후
function randomDepartureDate(): string {
  const days = randomInt(0, 60);
  return format(addDays(new Date(), days), "yyyy-MM-dd");
}

// 가상 도착일: 편도(OW)는 출발일 또는 +1일, 왕복(RT/MC)은 출발일 + 3~14일
function randomArrivalDate(departureDate: string, tripType: string): string {
  const dep = new Date(departureDate + "T12:00:00Z");
  if (tripType === "OW") {
    return randomInt(0, 1) === 0 ? departureDate : format(addDays(dep, 1), "yyyy-MM-dd");
  }
  const daysOut = randomInt(3, 14);
  return format(addDays(dep, daysOut), "yyyy-MM-dd");
}

function generateRow(index: number) {
  const route = pick(ROUTES);
  const noise = randomInt(-route.spread, route.spread);
  const price = Math.max(50_000, route.base + noise);
  const ts = randomTs();
  const sessionId = `s-${Math.random().toString(36).slice(2, 12)}`;
  const searchId = `q-${Math.random().toString(36).slice(2, 12)}`;
  const departure_date = randomDepartureDate();
  const arrival_date = randomArrivalDate(departure_date, route.trip_type);
  return {
    ts: ts.toISOString(),
    airline: route.airline,
    origin: route.origin,
    dest: route.dest,
    trip_type: route.trip_type,
    channel: pick(CHANNELS),
    session_id: sessionId,
    search_id: searchId,
    result_rank: randomInt(0, 19),
    price_krw: price,
    currency: "KRW",
    is_discounted: Math.random() < 0.2,
    departure_date,
    arrival_date,
    meta: {},
  };
}

async function main() {
  checkEnv();
  await testSupabase();

  console.log(cyan(`Inserting ${TOTAL} exposure events in batches of ${BATCH}...`));
  let inserted = 0;
  for (let offset = 0; offset < TOTAL; offset += BATCH) {
    const batch = Array.from({ length: Math.min(BATCH, TOTAL - offset) }, (_, i) =>
      generateRow(offset + i)
    );
    const { error } = await supabase.from("exposure_events").insert(batch);
    if (error) {
      console.error("Insert error:", error);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(cyan(`inserting ${inserted} / ${TOTAL} ...`));
  }
  console.log(cyan("Done."));
}

main();
