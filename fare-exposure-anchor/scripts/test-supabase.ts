/**
 * Supabase 연결 테스트 (exposure_events select 1)
 * 실행: npm run check:db
 */
import { resolve } from "path";
import { red, green } from "colorette";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const ENV_LOCAL = resolve(process.cwd(), ".env.local");
dotenv.config({ path: ENV_LOCAL });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FAIL_MSG =
  "Check your Supabase Project URL and Service Role Key in .env.local";

export async function testSupabase(): Promise<void> {
  if (!url || !key) {
    console.error(red("[ERROR] Missing env vars. Run: npm run check:env"));
    console.error(red(FAIL_MSG));
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { error } = await supabase
    .from("exposure_events")
    .select("id")
    .limit(1);

  if (error) {
    console.error(red("[ERROR] Supabase connection failed."));
    console.error(red(error.message));
    if (error.details) console.error(red(error.details));
    console.error(red(FAIL_MSG));
    process.exit(1);
  }

  console.log(green("[OK] Supabase connection successful."));
}

async function main(): Promise<void> {
  await testSupabase();
}

main();
