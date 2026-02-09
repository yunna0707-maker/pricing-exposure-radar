-- Visit events: pageviews and unique visitors (visitor_id cookie)
-- Run in Supabase SQL Editor or via migration.

CREATE TABLE IF NOT EXISTS visit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  path text NOT NULL,
  visitor_id text NOT NULL,
  session_id text,
  referrer text,
  user_agent text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_visit_events_ts_desc ON visit_events (ts DESC);
CREATE INDEX IF NOT EXISTS idx_visit_events_path_ts ON visit_events (path, ts DESC);
CREATE INDEX IF NOT EXISTS idx_visit_events_visitor_ts ON visit_events (visitor_id, ts DESC);

COMMENT ON TABLE visit_events IS 'Pageview/visitor tracking for PEA dashboard';
