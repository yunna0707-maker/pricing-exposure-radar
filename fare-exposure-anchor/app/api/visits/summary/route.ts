import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { visitSummaryQuerySchema } from "@/lib/validators";
import { subHours, subDays } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sp = Object.fromEntries(url.searchParams);
    const q = visitSummaryQuerySchema.parse(sp);

    const now = new Date();
    const since =
      q.period === "7d" ? subDays(now, 7).toISOString() : subHours(now, 24).toISOString();

    const { data: rows, error } = await supabaseAdmin
      .from("visit_events")
      .select("id, visitor_id")
      .eq("path", q.path)
      .gte("ts", since);

    if (error) {
      console.error("GET /api/visits/summary", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const pageviews = rows?.length ?? 0;
    const uniqueVisitors = new Set(rows?.map((r) => r.visitor_id) ?? []).size;

    return NextResponse.json({ pageviews, uniqueVisitors });
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }
    console.error("GET /api/visits/summary", err);
    return NextResponse.json({ error: "Bad request" }, { status: 500 });
  }
}
