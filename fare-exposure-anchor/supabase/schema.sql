-- Pricing Exposure Anchor - DB Schema
-- 실행 가이드:
-- 1) Supabase 대시보드 → SQL Editor에서 이 파일 내용 붙여넣기 후 Run
-- 2) .env.local에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정
-- 3) npm run seed 로 더미 데이터 적재
-- 4) npm run dev 로 로컬 실행

-- 항공 운임 노출 이벤트
CREATE TABLE IF NOT EXISTS exposure_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL,
  airline text NOT NULL,
  origin text NOT NULL,
  dest text NOT NULL,
  trip_type text NOT NULL,
  channel text NOT NULL,
  session_id text NOT NULL,
  search_id text NOT NULL,
  result_rank int NOT NULL,
  price_krw int NOT NULL,
  currency text NOT NULL DEFAULT 'KRW',
  is_discounted boolean NOT NULL DEFAULT false,
  departure_date date,
  arrival_date date,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 시계열/최근 조회
CREATE INDEX IF NOT EXISTS idx_exposure_ts ON exposure_events (ts DESC);

-- 노선+기간 필터 조회
CREATE INDEX IF NOT EXISTS idx_exposure_route_ts ON exposure_events (airline, origin, dest, trip_type, ts DESC);

-- 검색별 순위
CREATE INDEX IF NOT EXISTS idx_exposure_search_rank ON exposure_events (search_id, result_rank);

-- RLS 비활성화 (서비스 롤로만 접근하는 API 전제)
ALTER TABLE exposure_events DISABLE ROW LEVEL SECURITY;
