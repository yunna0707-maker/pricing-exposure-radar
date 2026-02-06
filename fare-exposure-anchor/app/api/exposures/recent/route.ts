import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exposureQuerySchema } from "@/lib/validators";
import { fetchFilteredExposures } from "@/lib/query";

export async function GET(request: NextRequest) {
  try {
    const sp = Object.fromEntries(request.nextUrl.searchParams);
    const q = exposureQuerySchema.parse(sp);
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
    return NextResponse.json({ items: recent });
  } catch (err) {
    console.error("GET /api/exposures/recent", err);
    const isZod = err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError";
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bad request" },
      { status: isZod ? 400 : 500 }
    );
  }
}
