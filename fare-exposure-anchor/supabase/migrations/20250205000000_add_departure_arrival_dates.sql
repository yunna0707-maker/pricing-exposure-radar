-- 기존 exposure_events 테이블에 출발일/도착일 컬럼 추가
-- Supabase SQL Editor에서 이 파일만 실행하면 됨 (이미 테이블이 있는 경우)

ALTER TABLE exposure_events
  ADD COLUMN IF NOT EXISTS departure_date date,
  ADD COLUMN IF NOT EXISTS arrival_date date;
