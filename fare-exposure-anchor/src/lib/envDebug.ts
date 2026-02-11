import "server-only";

/**
 * 진단용 메타 정보. 키/URL 전체는 절대 반환하지 않음.
 */
export function getSupabaseDiagnosticMeta(): {
  urlHostMask: string;
  keyMode: "service_role" | "anon" | "unknown";
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let urlHostMask = "";
  try {
    const u = new URL(url);
    const host = u.hostname || "";
    if (host.length <= 12) urlHostMask = host;
    else urlHostMask = host.slice(0, 4) + "…" + host.slice(-4);
  } catch {
    urlHostMask = "(invalid-url)";
  }

  const keyMode = hasServiceRole ? "service_role" : hasAnon ? "anon" : "unknown";
  return { urlHostMask, keyMode };
}
