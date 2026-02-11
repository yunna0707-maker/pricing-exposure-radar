import { NextResponse } from "next/server";
import { subDays, subHours } from "date-fns";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  let ok = true;
  let dbConnected = false;
  let totalCount = 0;
  let last24hCount = 0;
  let last7dCount = 0;
  let airlineTop5: { airline: string; count: number }[] = [];
  let airlineTop20: { airline: string; count: number }[] = [];
  let originTop20: { origin: string; count: number }[] = [];
  let destTop20: { dest: string; count: number }[] = [];
  let errorMessage: string | null = null;

  if (hasSupabaseUrl && hasServiceRoleKey) {
    try {
      const now = new Date();
      const since24h = subHours(now, 24).toISOString();
      const since7d = subDays(now, 7).toISOString();

      const [pingRes, countRes, last24hRes, last7dRes, airlineRes, originRes, destRes] = await Promise.all([
        supabaseAdmin.from("exposure_events").select("id").limit(1),
        supabaseAdmin.from("exposure_events").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("exposure_events").select("id", { count: "exact", head: true }).gte("ts", since24h),
        supabaseAdmin.from("exposure_events").select("id", { count: "exact", head: true }).gte("ts", since7d),
        supabaseAdmin.from("exposure_events").select("airline").gte("ts", since7d).limit(10000),
        supabaseAdmin.from("exposure_events").select("origin").limit(10000),
        supabaseAdmin.from("exposure_events").select("dest").limit(10000),
      ]);

      dbConnected = !pingRes.error;
      totalCount = countRes.count ?? 0;
      last24hCount = last24hRes.count ?? 0;
      last7dCount = last7dRes.count ?? 0;

      const byAirline: Record<string, number> = {};
      const byOrigin: Record<string, number> = {};
      const byDest: Record<string, number> = {};
      (airlineRes.data ?? []).forEach((r: { airline: string }) => {
        byAirline[r.airline] = (byAirline[r.airline] ?? 0) + 1;
      });
      (originRes.data ?? []).forEach((r: { origin: string }) => {
        byOrigin[r.origin] = (byOrigin[r.origin] ?? 0) + 1;
      });
      (destRes.data ?? []).forEach((r: { dest: string }) => {
        byDest[r.dest] = (byDest[r.dest] ?? 0) + 1;
      });

      airlineTop5 = Object.entries(byAirline)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([airline, count]) => ({ airline, count }));
      airlineTop20 = Object.entries(byAirline)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([airline, count]) => ({ airline, count }));
      originTop20 = Object.entries(byOrigin)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([origin, count]) => ({ origin, count }));
      destTop20 = Object.entries(byDest)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([dest, count]) => ({ dest, count }));
    } catch (e) {
      ok = false;
      dbConnected = false;
      errorMessage = e instanceof Error ? e.message : String(e);
    }
  } else {
    ok = false;
    errorMessage = "Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY";
  }

  return NextResponse.json({
    ok,
    dbConnected,
    error: errorMessage,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: hasSupabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey,
      SUPABASE_SERVICE_ROLE_KEY: hasServiceRoleKey,
    },
    exposure_events: {
      totalCount,
      last24hCount,
      last7dCount,
      airlineTop5,
      airlineTop20,
      originTop20,
      destTop20,
    },
  });
}
