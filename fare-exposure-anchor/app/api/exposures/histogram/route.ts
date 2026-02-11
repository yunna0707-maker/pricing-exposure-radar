import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exposureQuerySchema, requireExposureFilters } from "@/lib/validators";
import { fetchFilteredExposures, buildExposureDebugInfo, getSinceDate } from "@/lib/query";
import { computeHistogram } from "@/lib/metrics";

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
    // binSize: query param 기준. 없으면 10000. 구간 계산은 Math.floor(price / binSize) * binSize 로 통일(metrics.computeHistogram).
    const binSize = q.binSize ?? 10000;
    const rows = await fetchFilteredExposures(supabaseAdmin, q);
    const prices = rows.map((r) => r.price_krw);
    const bins = computeHistogram(prices, binSize);
    const body: Record<string, unknown> = {
      binSize,
      bins: bins.map((b) => ({ binStart: b.binStart, binEnd: b.binEnd, count: b.count })),
    };
    if (q.debug) {
      const since = getSinceDate(q.period ?? "24h");
      const baseDebug = buildExposureDebugInfo(q, since, rows.length);
      body.debug = {
        ...baseDebug,
        appliedBinSize: binSize,
        minPrice: prices.length > 0 ? Math.min(...prices) : null,
        maxPrice: prices.length > 0 ? Math.max(...prices) : null,
        totalBuckets: bins.length,
      };
    }
    return NextResponse.json(body);
  } catch (err) {
    console.error("GET /api/exposures/histogram", err);
    const isZod = err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError";
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bad request" },
      { status: isZod ? 400 : 500 }
    );
  }
}
