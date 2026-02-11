import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exposureQuerySchema, requireExposureFilters } from "@/lib/validators";
import { fetchFilteredExposures, buildExposureDebugInfo, getSinceDate } from "@/lib/query";

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
    const recent = rows.slice(0, 30).map((r) => ({
      id: r.id,
      ts: r.ts,
      airline: r.airline,
      origin: r.origin,
      dest: r.dest,
      trip_type: r.trip_type,
      channel: r.channel,
      result_rank: r.result_rank,
      price_krw: r.price_krw,
      is_discounted: r.is_discounted,
      departure_date: r.departure_date ?? null,
      arrival_date: r.arrival_date ?? null,
    }));
    const body: Record<string, unknown> = { items: recent };
    if (q.debug) {
      const since = getSinceDate(q.period ?? "24h");
      body.debug = buildExposureDebugInfo(q, since, rows.length);
    }
    return NextResponse.json(body);
  } catch (err) {
    console.error("GET /api/exposures/recent", err);
    const isZod = err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError";
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bad request" },
      { status: isZod ? 400 : 500 }
    );
  }
}
