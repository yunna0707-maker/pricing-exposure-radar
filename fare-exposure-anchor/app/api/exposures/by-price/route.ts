import { NextRequest, NextResponse } from "next/server";
import { format, startOfHour } from "date-fns";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { byPriceQuerySchema, type ByPriceResponse } from "@/lib/validators";
import { fetchExposuresByPrice } from "@/lib/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildHourBins(rows: { ts: string }[]): { hour: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.ts);
    const key = format(startOfHour(d), "yyyy-MM-dd HH:00");
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({ hour, count }));
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sp = Object.fromEntries(url.searchParams);
    const q = byPriceQuerySchema.parse(sp);

    const rows = await fetchExposuresByPrice(supabaseAdmin, {
      priceKRW: q.priceKRW,
      period: q.period,
      airline: q.airline,
      origin: q.origin,
      dest: q.dest,
      tripType: q.tripType,
      channel: q.channel,
    });

    const hourBins = buildHourBins(rows);
    const total = rows.length;

    const response: ByPriceResponse = {
      priceKRW: q.priceKRW,
      total,
      hourBins,
      events: rows.map((r) => ({
        ts: r.ts,
        channel: r.channel,
        result_rank: r.result_rank,
        search_id: r.search_id,
        session_id: r.session_id,
      })),
    };

    if (q.anchorPrice != null && q.anchorPrice > 0) {
      response.anchorPrice = q.anchorPrice;
      response.diffFromAnchor = q.priceKRW - q.anchorPrice;
      response.diffPct = Number((((q.priceKRW - q.anchorPrice) / q.anchorPrice) * 100).toFixed(2));
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("GET /api/exposures/by-price", err);
    const isZod =
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name: string }).name === "ZodError";
    const message =
      err instanceof Error ? err.message : "Bad request";
    return NextResponse.json(
      { error: message },
      { status: isZod ? 400 : 500 }
    );
  }
}
