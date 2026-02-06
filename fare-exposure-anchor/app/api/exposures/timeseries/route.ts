import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exposureQuerySchema } from "@/lib/validators";
import { fetchFilteredExposures } from "@/lib/query";
import { computeTimeseries } from "@/lib/metrics";

export async function GET(request: NextRequest) {
  try {
    const sp = Object.fromEntries(request.nextUrl.searchParams);
    const q = exposureQuerySchema.parse(sp);
    const rows = await fetchFilteredExposures(supabaseAdmin, q);
    const points = computeTimeseries(rows);
    return NextResponse.json({ interval: "1h", points });
  } catch (err) {
    console.error("GET /api/exposures/timeseries", err);
    const isZod = err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError";
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bad request" },
      { status: isZod ? 400 : 500 }
    );
  }
}
