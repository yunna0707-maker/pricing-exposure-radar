/**
 * Client-only visit tracking: cookie pea_vid + fire-and-forget POST to /api/visits.
 * Only run in browser (e.g. from useEffect in dashboard).
 */

const COOKIE_NAME = "pea_vid";
const COOKIE_DAYS = 365;

function randomUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[^.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/** Get existing visitor id or generate, set cookie, return. Client-only. */
export function getOrSetVisitorId(): string | null {
  if (typeof document === "undefined") return null;
  let vid = getCookie(COOKIE_NAME);
  if (!vid) {
    vid = randomUuid();
    setCookie(COOKIE_NAME, vid, COOKIE_DAYS);
  }
  return vid;
}

const DEDUPE_MS = 2000;
let lastSentPath: string | null = null;
let lastSentAt = 0;

const FETCH_TIMEOUT_MS = 2000;

/** Fire-and-forget: POST one pageview. Deduped so Strict Mode double-invoke only counts once. */
export function trackPageView(path: string, meta?: Record<string, unknown>): void {
  try {
    if (typeof window === "undefined") return;
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") return;
    const now = Date.now();
    if (lastSentPath === path && now - lastSentAt < DEDUPE_MS) return;
    lastSentPath = path;
    lastSentAt = now;

    const visitorId = getOrSetVisitorId();
    if (!visitorId) return;

    const body = {
      path,
      visitorId,
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      meta: meta ?? {},
    };

    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
      signal: ac.signal,
    })
      .finally(() => clearTimeout(timeoutId))
      .catch(() => {});
  } catch {
    // 방문 기록 실패해도 화면 동작에 영향 없음
  }
}
