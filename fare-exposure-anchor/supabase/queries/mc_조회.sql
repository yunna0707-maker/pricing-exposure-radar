-- ============================================================
-- MC(다구간) 여정 조회 — Supabase SQL Editor에서 실행
-- ============================================================

-- 1) MC 여정 전체 조회 (최근 100건)
SELECT
  id,
  ts,
  airline,
  origin,
  dest,
  trip_type,
  channel,
  result_rank,
  price_krw,
  is_discounted,
  departure_date,
  arrival_date
FROM exposure_events
WHERE trip_type = 'MC'
ORDER BY ts DESC
LIMIT 100;


-- 2) MC 여정 — 최근 24시간만
SELECT
  id,
  ts,
  airline,
  origin,
  dest,
  trip_type,
  channel,
  result_rank,
  price_krw,
  departure_date,
  arrival_date
FROM exposure_events
WHERE trip_type = 'MC'
  AND ts >= NOW() - INTERVAL '24 hours'
ORDER BY ts DESC;


-- 3) MC 노선별 건수·가격 요약
SELECT
  airline,
  origin,
  dest,
  COUNT(*) AS 건수,
  MIN(price_krw) AS 최저가,
  MAX(price_krw) AS 최고가,
  ROUND(AVG(price_krw)::numeric, 0) AS 평균가
FROM exposure_events
WHERE trip_type = 'MC'
GROUP BY airline, origin, dest
ORDER BY 건수 DESC;


-- 4) MC 여정 존재 여부만 확인 (빠른 체크)
SELECT EXISTS (
  SELECT 1 FROM exposure_events WHERE trip_type = 'MC' LIMIT 1
) AS mc_데이터_존재;
