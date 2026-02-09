-- 시드 삽입 후 Supabase SQL Editor에서 실행하여 검증
-- KE/OZ 외 다수 항공사·노선·채널 분포 확인용

-- 1) 항공사별 건수
SELECT airline, count(*) AS cnt
FROM public.exposure_events
GROUP BY 1
ORDER BY cnt DESC;

-- 2) OD Pair별 건수 (상위 30)
SELECT origin, dest, count(*) AS cnt
FROM public.exposure_events
GROUP BY 1, 2
ORDER BY cnt DESC
LIMIT 30;

-- 3) 최근 24시간 비중
SELECT
  count(*) FILTER (WHERE ts >= now() - interval '24 hours') AS last_24h,
  count(*) AS total
FROM public.exposure_events;
