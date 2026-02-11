import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exposureQuerySchema, requireExposureFilters } from "@/lib/validators";
import { fetchFilteredExposures, buildExposureDebugInfo, getSinceDate } from "@/lib/query";
import { computeTimeseries } from "@/lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sp = Object.fromEntries(url.searchParams);
    const q = exposureQuerySchema.parse(sp);
    const requiredErr = requireExposureFilters(q);
    if (requiredErr) return NextResponse.json({ error: requiredErr }, { status: 400 });
    const rows = await fetchFilteredExposures(supabaseAdmin, q);
    const points = computeTimeseries(rows);
    const body: Record<string, unknown> = { interval: "1h", points };
    if (q.debug) {
      const since = getSinceDate(q.period ?? "24h");
      body.debug = buildExposureDebugInfo(q, since, rows.length);
    }
    return NextResponse.json(body);
  } catch (err) {
    console.error("GET /api/exposures/timeseries", err);
    const isZod = err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError";
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bad request" },
      { status: isZod ? 400 : 500 }
    );
  }
}
