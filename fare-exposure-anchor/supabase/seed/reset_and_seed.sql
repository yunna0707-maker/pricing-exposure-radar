-- =============================================================================
-- reset_and_seed.sql — exposure_events 초기화 + 데모/검증용 대량 시드
-- =============================================================================
--
-- README — 실행 방법
-- ------------------
-- 1) Supabase Dashboard > SQL Editor
-- 2) reset_and_seed.sql 전체 복사 후 붙여넣기, Run 실행
-- 3) 하단 검증 쿼리 결과로 last24h_count / last7d_count / total_count 확인
-- 4) 앱 검증:
--    - GET /api/health  → dbConnected, totalCount, last24hCount, last7dCount
--    - GET /api/exposures/options?period=7d&debug=1  → 항공사/출발/도착 옵션 및 debug 단계별 count
--
-- 주의: 기존 exposure_events 데이터가 전부 삭제됩니다. 트랜잭션으로 묶어 롤백 가능.
-- =============================================================================

BEGIN;

-- A) 안전장치: 테이블 존재 확인
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'exposure_events'
  ) THEN
    RAISE EXCEPTION '테이블 exposure_events 가 없습니다. 먼저 supabase/schema.sql 을 실행하세요.';
  END IF;
END $$;

-- B) 기존 데이터 전부 삭제 (uuid PK라 RESTART IDENTITY 없음)
TRUNCATE TABLE exposure_events;

-- C) 대량 INSERT (generate_series + 랜덤 분포)
--    - 50,000건 이상 (여기서는 80,000건)
--    - ts: 최근 7일 이내, 그 중 40%는 최근 24시간
--    - airline 15개, origin/dest 25개 이상, trip_type OW 60% / RT 35% / MC 5%
--    - channel web/mobile/api, price_krw 노선군별 현실 범위
INSERT INTO exposure_events (
  ts,
  airline,
  origin,
  dest,
  trip_type,
  channel,
  session_id,
  search_id,
  result_rank,
  price_krw,
  currency,
  is_discounted,
  departure_date,
  arrival_date,
  meta
)
WITH base AS (
  SELECT
    n,
    CASE WHEN random() < 0.60 THEN 'OW' WHEN random() < 0.95 THEN 'RT' ELSE 'MC' END AS trip_type,
    (current_date + (1 + floor(random() * 45))::int)::date AS dep
  FROM generate_series(1, 80000) AS n
)
SELECT
  (CASE
    WHEN random() < 0.40 THEN now() - (random() * interval '24 hours')
    ELSE now() - interval '24 hours' - (random() * interval '6 days')
  END)::timestamptz,
  (ARRAY['KE','OZ','7C','BX','LJ','TW','ZE','RS','YP','JL','NH','SQ','TR','D7','PR'])[1 + floor(random() * 15)::int],
  (ARRAY['ICN','GMP','CJU','PUS','TAE','KUV','RSU','KWJ','NRT','HND','KIX','FUK','PEK','PVG','BKK','SIN','HKG','TPE','MNL','SGN','LAX','SFO','JFK','SEA','LHR'])[1 + floor(random() * 25)::int],
  (ARRAY['ICN','GMP','CJU','PUS','NRT','HND','KIX','FUK','PEK','PVG','BKK','SIN','HKG','TPE','MNL','SGN','LAX','SFO','JFK','SEA','LHR','CDG','SYD','DXB','CJU'])[1 + floor(random() * 25)::int],
  base.trip_type,
  (ARRAY['web','mobile','api'])[1 + floor(random() * 3)::int],
  's-' || md5(random()::text || base.n::text),
  'q-' || md5(random()::text || base.n::text),
  (1 + floor(random() * 20))::int,
  (CASE
    WHEN random() < 0.30 THEN 50000 + floor(random() * 200000)::int
    WHEN random() < 0.80 THEN 200000 + floor(random() * 600000)::int
    ELSE 600000 + floor(random() * 1900000)::int
  END),
  'KRW',
  false,
  base.dep,
  (CASE
    WHEN base.trip_type = 'OW' AND random() < 0.5 THEN NULL
    ELSE (base.dep + (1 + floor(random() * 14))::int)::date
  END),
  '{}'::jsonb
FROM base;

COMMIT;

-- D) 검증 쿼리 (실행 후 결과 확인)
-- 최근 24h / 7d / 전체 건수
SELECT
  count(*) FILTER (WHERE ts >= now() - interval '24 hours') AS last24h_count,
  count(*) FILTER (WHERE ts >= now() - interval '7 days')  AS last7d_count,
  count(*) AS total_count
FROM exposure_events;

-- airline 상위 10
SELECT airline, count(*) AS cnt
FROM exposure_events
GROUP BY airline
ORDER BY cnt DESC
LIMIT 10;

-- OD(origin-dest) 상위 20
SELECT origin, dest, count(*) AS cnt
FROM exposure_events
GROUP BY origin, dest
ORDER BY cnt DESC
LIMIT 20;

-- trip_type / channel 분포
SELECT trip_type, count(*) AS cnt FROM exposure_events GROUP BY trip_type ORDER BY cnt DESC;
SELECT channel, count(*) AS cnt FROM exposure_events GROUP BY channel ORDER BY cnt DESC;
