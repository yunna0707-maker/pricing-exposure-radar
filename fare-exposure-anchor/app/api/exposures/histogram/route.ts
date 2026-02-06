import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exposureQuerySchema } from "@/lib/validators";
import { fetchFilteredExposures } from "@/lib/query";
import { computeHistogram } from "@/lib/metrics";

export async function GET(request: NextRequest) {
  try {
    const sp = Object.fromEntries(request.nextUrl.searchParams);
    const q = exposureQuerySchema.parse(sp);
    const binSize = q.binSize ?? 10000;
    const rows = await fetchFilteredExposures(supabaseAdmin, q);
    const prices = rows.map((r) => r.price_krw);
    const bins = computeHistogram(prices, binSize);
    return NextResponse.json({
      binSize,
      bins: bins.map((b) => ({ binStart: b.binStart, binEnd: b.binEnd, count: b.count })),
    });
  } catch (err) {
    console.error("GET /api/exposures/histogram", err);
    const isZod = err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError";
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bad request" },
      { status: isZod ? 400 : 500 }
    );
  }
}
