/**
 * 특정 항공사·노선·편도여부 존재 여부 조회
 * 사용 예: npx tsx scripts/check-route.ts
 * 또는: npx tsx scripts/check-route.ts 7C ICN SFO MC
 */
import { resolve } from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const airline = process.argv[2] ?? "7C";
const origin = process.argv[3] ?? "ICN";
const dest = process.argv[4] ?? "SFO";
const tripType = process.argv[5] ?? "MC";

async function main() {
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요 (.env.local)");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("exposure_events")
    .select("id, ts, airline, origin, dest, trip_type, price_krw")
    .eq("airline", airline)
    .eq("origin", origin)
    .eq("dest", dest)
    .eq("trip_type", tripType)
    .order("ts", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Query error:", error.message);
    process.exit(1);
  }

  const { count } = await supabase
    .from("exposure_events")
    .select("id", { count: "exact", head: true })
    .eq("airline", airline)
    .eq("origin", origin)
    .eq("dest", dest)
    .eq("trip_type", tripType);

  console.log(`\n[조건] airline=${airline} origin=${origin} dest=${dest} trip_type=${tripType}\n`);
  console.log(`총 건수: ${count ?? 0}`);
  if (data && data.length > 0) {
    console.log("\n최근 5건 샘플:");
    data.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.ts} | ${row.price_krw?.toLocaleString()}원`);
    });
  } else {
    console.log("해당 조건의 데이터가 없습니다.");
  }
  console.log("");
}

main();
