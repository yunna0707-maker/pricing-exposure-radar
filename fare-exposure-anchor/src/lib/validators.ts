import { z } from "zod";

const tripTypeEnum = z.enum(["OW", "RT", "MC"]);

export const exposureEventSchema = z.object({
  ts: z.union([z.string().datetime(), z.date()]).transform((v) => (typeof v === "string" ? new Date(v) : v)),
  airline: z.string().min(1),
  origin: z.string().min(1),
  dest: z.string().min(1),
  trip_type: tripTypeEnum,
  channel: z.string().min(1),
  session_id: z.string().min(1),
  search_id: z.string().min(1),
  result_rank: z.number().int().min(0),
  price_krw: z.number().int().min(0),
  currency: z.string().optional().default("KRW"),
  is_discounted: z.boolean().optional().default(false),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  arrival_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meta: z.record(z.unknown()).optional().default({}),
});

export type ExposureEvent = z.infer<typeof exposureEventSchema>;

export const exposureEventRowSchema = exposureEventSchema.extend({
  id: z.string().uuid().optional(),
});

export const postExposuresBodySchema = z.union([
  exposureEventSchema,
  z.array(exposureEventSchema),
]);

export type PostExposuresBody = z.infer<typeof postExposuresBodySchema>;

// 빈값/"all" → undefined (규칙 A: 값 없으면 조건 걸지 않음)
const optionalFilterString = z
  .string()
  .optional()
  .transform((v) => {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s || s === "all") return undefined;
    return s;
  });

// Query params for GET APIs
export const exposureQuerySchema = z.object({
  airline: optionalFilterString,
  origin: optionalFilterString,
  dest: optionalFilterString,
  tripType: optionalFilterString,
  channel: optionalFilterString,
  period: z.enum(["24h", "7d"]).optional().default("24h"),
  binSize: z.coerce.number().int().min(10000).optional().default(10000),
  departureDate: z
    .string()
    .optional()
    .transform((v) => {
      const s = typeof v === "string" ? v.trim() : "";
      return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
    }),
  arrivalDate: z
    .string()
    .optional()
    .transform((v) => {
      const s = typeof v === "string" ? v.trim() : "";
      return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
    }),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  debug: z.union([z.string(), z.coerce.number()]).optional().transform((v) => v === "1" || v === 1),
});

export type ExposureQuery = z.infer<typeof exposureQuerySchema>;

/** 필수 필터(airline, origin, dest, tripType) 누락 시 에러 메시지 반환, 있으면 null */
export function requireExposureFilters(q: ExposureQuery): string | null {
  if (!q.airline?.trim()) return "missing required filters: airline";
  if (!q.origin?.trim()) return "missing required filters: origin";
  if (!q.dest?.trim()) return "missing required filters: dest";
  if (!q.tripType?.trim()) return "missing required filters: tripType";
  return null;
}

// GET /api/exposures/options — 캐스케이딩 필터 옵션용 (전부 optional)
export const optionsQuerySchema = z.object({
  airline: z.string().optional(),
  origin: z.string().optional(),
  dest: z.string().optional(),
  tripType: z.string().optional(),
  period: z.enum(["24h", "7d"]).optional().default("24h"),
  channel: z.string().optional(),
  departureDate: z
    .string()
    .optional()
    .transform((v) => {
      const s = typeof v === "string" ? v.trim() : "";
      return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
    }),
  arrivalDate: z
    .string()
    .optional()
    .transform((v) => {
      const s = typeof v === "string" ? v.trim() : "";
      return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
    }),
  debug: z.union([z.string(), z.coerce.number()]).optional().transform((v) => v === "1" || v === 1),
});
export type OptionsQuery = z.infer<typeof optionsQuerySchema>;

// GET /api/exposures/by-price
export const byPriceQuerySchema = z.object({
  priceKRW: z.coerce.number().int().min(0),
  period: z.enum(["24h", "7d"]),
  airline: z.string().min(1),
  origin: z.string().min(1),
  dest: z.string().min(1),
  tripType: z.string().min(1),
  channel: z.string().optional(),
  anchorPrice: z.coerce.number().int().min(0).optional(),
});
export type ByPriceQuery = z.infer<typeof byPriceQuerySchema>;

export const byPriceEventSchema = z.object({
  ts: z.string(),
  channel: z.string(),
  result_rank: z.number(),
  search_id: z.string(),
  session_id: z.string(),
});
export const byPriceResponseSchema = z.object({
  priceKRW: z.number(),
  total: z.number(),
  anchorPrice: z.number().optional(),
  diffFromAnchor: z.number().optional(),
  diffPct: z.number().optional(),
  hourBins: z.array(z.object({ hour: z.string(), count: z.number() })),
  events: z.array(byPriceEventSchema),
});
export type ByPriceResponse = z.infer<typeof byPriceResponseSchema>;

// POST /api/visits — insert one visit event
export const postVisitBodySchema = z.object({
  path: z.string().min(1).max(500),
  visitorId: z.string().min(1).max(128),
  referrer: z.string().max(2000).optional(),
  userAgent: z.string().max(1000).optional(),
  meta: z.record(z.unknown()).optional().default({}),
});
export type PostVisitBody = z.infer<typeof postVisitBodySchema>;

// GET /api/visits/summary
export const visitSummaryQuerySchema = z.object({
  period: z.enum(["24h", "7d"]).optional().default("24h"),
  path: z.string().min(1).optional().default("/dashboard"),
});
export type VisitSummaryQuery = z.infer<typeof visitSummaryQuerySchema>;
