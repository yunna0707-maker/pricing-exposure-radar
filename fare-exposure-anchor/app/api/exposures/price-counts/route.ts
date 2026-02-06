import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { exposureQuerySchema } from "@/lib/validators";
import { fetchFilteredExposures } from "@/lib/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_ITEMS = 50;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sp = Object.fromEntries(url.searchParams);
    const q = exposureQuerySchema.parse(sp);
    const rows = await fetchFilteredExposures(supabaseAdmin, q);
    const byPrice = new Map<number, number>();
    for (const r of rows) {
      byPrice.set(r.price_krw, (byPrice.get(r.price_krw) ?? 0) + 1);
    }
    const items = Array.from(byPrice.entries())
      .map(([price_krw, count]) => ({ price_krw, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_ITEMS);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET /api/exposures/price-counts", err);
    const isZod = err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError";
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bad request" },
      { status: isZod ? 400 : 500 }
    );
  }
}
