/**
 * 필터/데이터 진단 스크립트 (Node 실행)
 * - /api/health 호출
 * - airline=BX 시 origin top list
 * - BX+GMP 조합 존재 여부, BX+ICN 결과 확인
 *
 * 실행: npx tsx scripts/verify-filters.ts
 * (로컬 서버 npm run dev 가 떠 있어야 함, 또는 BASE_URL 환경변수로 URL 지정)
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

interface HealthRes {
  ok: boolean;
  error?: string;
  exposure_events?: {
    totalCount: number;
    last7dCount: number;
    airlineTop20: { airline: string; count: number }[];
    originTop20: { origin: string; count: number }[];
    destTop20: { dest: string; count: number }[];
  };
}

interface SummaryRes {
  totalExposures?: number;
  debug?: { appliedFilters: Record<string, unknown>; rowsCount: number; queryDescription: string };
}

async function main() {
  console.log("BASE_URL:", BASE);
  console.log("--- 1) /api/health ---");
  const health = await get<HealthRes>("/api/health").catch((e) => {
    console.error("Health failed:", e.message);
    process.exit(1);
  });
  console.log("ok:", health.ok);
  if (health.exposure_events) {
    console.log("totalCount:", health.exposure_events.totalCount);
    console.log("last7dCount:", health.exposure_events.last7dCount);
    console.log("airlineTop5:", health.exposure_events.airlineTop20?.slice(0, 5));
    console.log("originTop5:", health.exposure_events.originTop20?.slice(0, 5));
  }

  console.log("\n--- 2) airline=BX 일 때 origin (options) ---");
  const optionsBx = await get<{ origins: string[]; airlines: string[] }>(
    "/api/exposures/options?period=24h&airline=BX"
  ).catch((e) => {
    console.error("Options BX failed:", e.message);
    return { origins: [], airlines: [] };
  });
  console.log("origins for BX:", optionsBx.origins?.slice(0, 15) ?? []);

  console.log("\n--- 3) BX + origin=GMP 조회 (summary?debug=1) ---");
  const sumGmp = await get<SummaryRes>(
    "/api/exposures/summary?debug=1&period=24h&airline=BX&origin=GMP"
  ).catch((e): Partial<SummaryRes> => {
    console.error("Summary BX+GMP failed:", e.message);
    return {};
  });
  console.log("totalExposures:", sumGmp.totalExposures);
  if (sumGmp.debug) {
    console.log("debug.rowsCount:", sumGmp.debug.rowsCount);
    console.log("debug.queryDescription:", sumGmp.debug.queryDescription);
  }
  if ((sumGmp.totalExposures ?? 0) === 0) {
    console.log("-> BX+GMP 조합 데이터 없음 (DB에 해당 OD 없으면 정상)");
  }

  console.log("\n--- 4) BX + origin=ICN 조회 ---");
  const sumIcn = await get<SummaryRes>(
    "/api/exposures/summary?debug=1&period=24h&airline=BX&origin=ICN"
  ).catch((e): Partial<SummaryRes> => {
    console.error("Summary BX+ICN failed:", e.message);
    return {};
  });
  console.log("totalExposures:", sumIcn.totalExposures);
  if (sumIcn.debug) console.log("debug.rowsCount:", sumIcn.debug.rowsCount);
  if ((sumIcn.totalExposures ?? 0) > 0) {
    console.log("-> BX+ICN 데이터 있음 (정상)");
  }

  console.log("\n진단 완료.");
}

main();
