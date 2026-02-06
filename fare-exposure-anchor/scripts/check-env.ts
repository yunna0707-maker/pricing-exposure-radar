/**
 * 로컬 개발용 환경변수 자동 점검
 * 실행: npm run check:env
 */
import { existsSync } from "fs";
import { resolve } from "path";
import { red, green, yellow } from "colorette";
import dotenv from "dotenv";

const ENV_LOCAL = resolve(process.cwd(), ".env.local");

function loadEnvLocal(): void {
  if (existsSync(ENV_LOCAL)) {
    dotenv.config({ path: ENV_LOCAL });
  }
}

export function checkEnv(): void {
  loadEnvLocal();

  if (!existsSync(ENV_LOCAL)) {
    console.error(red("[ERROR] .env.local file not found."));
    console.error(yellow("Create .env.local in the project root with:"));
    console.error(yellow("  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"));
    console.error(yellow("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"));
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let failed = false;

  if (!url || url.trim() === "") {
    console.error(red("[ERROR] Missing NEXT_PUBLIC_SUPABASE_URL in .env.local"));
    failed = true;
  }

  if (!key || key.trim() === "") {
    console.error(red("[ERROR] Missing SUPABASE_SERVICE_ROLE_KEY in .env.local"));
    failed = true;
  }

  if (failed) {
    console.error(yellow("Copy .env.local.example and fill in your Supabase credentials."));
    process.exit(1);
  }

  console.log(green("[OK] Environment variables check passed."));
}

const isMain = process.argv[1]?.includes("check-env");
if (isMain) {
  checkEnv();
}
