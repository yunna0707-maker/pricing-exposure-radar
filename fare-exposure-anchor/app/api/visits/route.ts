import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { postVisitBodySchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = postVisitBodySchema.parse(body);

    const { error } = await supabaseAdmin.from("visit_events").insert({
      path: parsed.path,
      visitor_id: parsed.visitorId,
      session_id: parsed.visitorId,
      referrer: parsed.referrer ?? null,
      user_agent: parsed.userAgent ?? null,
      meta: parsed.meta ?? {},
    });

    if (error) {
      console.error("POST /api/visits insert error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inserted: 1 });
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    console.error("POST /api/visits", err);
    return NextResponse.json({ error: "Bad request" }, { status: 500 });
  }
}
