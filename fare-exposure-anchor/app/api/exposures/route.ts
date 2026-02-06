import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { postExposuresBodySchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = postExposuresBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const events = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
    const rows = events.map((e) => ({
      ts: e.ts.toISOString(),
      airline: e.airline,
      origin: e.origin,
      dest: e.dest,
      trip_type: e.trip_type,
      channel: e.channel,
      session_id: e.session_id,
      search_id: e.search_id,
      result_rank: e.result_rank,
      price_krw: e.price_krw,
      currency: e.currency ?? "KRW",
      is_discounted: e.is_discounted ?? false,
      ...(e.departure_date != null && { departure_date: e.departure_date }),
      ...(e.arrival_date != null && { arrival_date: e.arrival_date }),
      meta: e.meta ?? {},
    }));

    const { error } = await supabaseAdmin.from("exposure_events").insert(rows);
    if (error) throw error;
    return NextResponse.json({ inserted: rows.length });
  } catch (err) {
    console.error("POST /api/exposures", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
