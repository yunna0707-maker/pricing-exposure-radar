import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { optionsQuerySchema } from "@/lib/validators";
import { fetchFilterOptions, getOptionsDebugCounts, type FilterOptionsQuery } from "@/lib/query";
import { getSupabaseDiagnosticMeta } from "@/lib/envDebug";

export const runtime = "nodejs";
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sp = Object.fromEntries(url.searchParams);
    const parsed = optionsQuerySchema.parse(sp);
    const q: FilterOptionsQuery = {
      airline: parsed.airline?.trim() || undefined,
      origin: parsed.origin?.trim() || undefined,
      dest: parsed.dest?.trim() || undefined,
      tripType: parsed.tripType?.trim() || undefined,
      period: parsed.period,
      channel: parsed.channel?.trim() && parsed.channel !== "all" ? parsed.channel : undefined,
      departureDate: parsed.departureDate,
      arrivalDate: parsed.arrivalDate,
    };
    const result = await fetchFilterOptions(supabaseAdmin, q);

    if (parsed.debug) {
      const [meta, counts] = await Promise.all([
        Promise.resolve(getSupabaseDiagnosticMeta()),
        getOptionsDebugCounts(supabaseAdmin, q),
      ]);
      return NextResponse.json({
        ...result,
        debug: {
          urlHostMask: meta.urlHostMask,
          keyMode: meta.keyMode,
          filtersNormalized: {
            airline: q.airline ?? null,
            origin: q.origin ?? null,
            dest: q.dest ?? null,
            tripType: q.tripType ?? null,
            channel: q.channel ?? null,
            period: q.period ?? "24h",
          },
          whereSummary: counts.whereSummary,
          totalCount: counts.totalCount,
          periodCount: counts.periodCount,
          airlineCount: counts.airlineCount,
          odCount: counts.odCount,
          finalCount: counts.finalCount,
          nowIso: counts.nowIso,
          cutoffIso: counts.cutoffIso,
        },
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/exposures/options", err);
    const isZod = err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError";
    const message = isZod ? "Invalid query" : err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: message }, { status: isZod ? 400 : 500 });
  }
}
