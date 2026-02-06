import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Admin (service role) client.
 * 서버 전용: 클라이언트 번들에 포함되지 않도록 server-only 사용.
 * 빌드 시 env 미설정을 위해 사용 시점에 초기화.
 */
let _client: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as unknown as Record<string, unknown>)[prop as string];
  },
});

export type ExposureRow = {
  id: string;
  ts: string;
  airline: string;
  origin: string;
  dest: string;
  trip_type: string;
  channel: string;
  session_id: string;
  search_id: string;
  result_rank: number;
  price_krw: number;
  currency: string;
  is_discounted: boolean;
  departure_date?: string | null;
  arrival_date?: string | null;
  meta: Record<string, unknown>;
};
