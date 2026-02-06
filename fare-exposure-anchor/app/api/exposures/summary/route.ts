import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exposureQuerySchema } from "@/lib/validators";
import { fetchFilteredExposures } from "@/lib/query";
import {
  computePercentiles,
  computeHistogram,
  computeModeBin,
} from "@/lib/metrics";

export async function GET(request: NextRequest) {
  try {
    const sp = Object.fromEntries(request.nextUrl.searchParams);
    const q = exposureQuerySchema.parse(sp);
    const rows = await fetchFilteredExposures(supabaseAdmin, q);
    const prices = rows.map((r) => r.price_krw);

    const { p25, p50, p75 } = computePercentiles(prices);
    const bins = computeHistogram(prices, 50000);
    const modeBin = computeModeBin(bins);

    const uniqueSessions = new Set(rows.map((r) => r.session_id)).size;

    return NextResponse.json({
      totalExposures: rows.length,
      uniqueSessions,
      p25,
      p50,
      p75,
      anchorPrice: p50,
      modeBin: modeBin
        ? { binStart: modeBin.binStart, binEnd: modeBin.binEnd, count: modeBin.count }
        : null,
    });
  } catch (err) {
    console.error("GET /api/exposures/summary", err);
    const isZod = err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError";
    let message: string;
    if (isZod && err && typeof err === "object" && "errors" in err) {
      const zodErr = err as { errors: unknown[] };
      const parts = zodErr.errors?.map((e: unknown) => {
        const m = (e as { message?: string }).message;
        return m !== undefined && m !== null ? m : String(e);
      });
      const joined = parts?.join("; ");
      const fallback = (err as { message?: string }).message;
      message = (joined && joined.length > 0) ? joined : (fallback ?? "Bad request");
    } else {
      message = err instanceof Error ? err.message : "Bad request";
    }
    return NextResponse.json(
      { error: message },
      { status: isZod ? 400 : 500 }
    );
  }
}
