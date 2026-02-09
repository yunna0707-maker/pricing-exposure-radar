# Pricing Exposure Anchor

항공 운임 노출(Exposure) 로그를 적재하고, 집계 API로 조회하여 대시보드에서 시각화하는 풀스택 앱입니다.

## 기술 스택

- **Front/Server**: Next.js 14+ (App Router) + TypeScript
- **UI**: TailwindCSS + shadcn/ui + lucide-react
- **Chart**: recharts
- **Date**: date-fns
- **DB**: Supabase (Postgres)
- **Validation**: zod
- **Supabase**: @supabase/supabase-js

## Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. 대시보드 → **SQL Editor**에서 `supabase/schema.sql` 내용 붙여넣기 후 **Run** 실행  
   (이미 테이블이 있는 경우: `supabase/migrations/20250205000000_add_departure_arrival_dates.sql`만 실행해 출발일/도착일 컬럼 추가)
3. **방문 추적(visit tracking)** 을 쓰려면 **SQL Editor**에서 `supabase/migrations/20250206000000_visit_events.sql` 내용을 붙여넣고 **Run** 실행해 `visit_events` 테이블을 생성하세요.
4. **Project Settings** → **API**에서 다음 확인:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`  
   (서비스 롤 키는 서버 전용으로만 사용되며 클라이언트 번들에 포함되지 않습니다.)

## Local Setup

1. `.env.local` 생성  
   `.env.local.example`를 참고해 프로젝트 루트에 `.env.local` 생성 후 Supabase URL/키 설정

2. `npm install`

3. `npm run check:env`  
   환경변수(.env.local, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) 점검

4. `npm run check:db`  
   Supabase 연결 및 `exposure_events` 테이블 접근 테스트

5. `npm run seed`  
   50,000건 더미 노출 이벤트 삽입 (선택)

6. `npm run dev`  
   개발 서버 실행 후 http://localhost:3000/dashboard 접속

한 번에 점검 후 실행: `npm run dev:all` (check:env → check:db → dev)

**대시보드에서 "API에 연결할 수 없습니다" / "Failed to fetch"가 나오면:**  
`fare-exposure-anchor` 폴더에서 `npm run dev` 또는 `npm run dev:all`을 실행했는지, `.env.local`이 해당 폴더에 있는지 확인하세요.

**시드 시 "Could not find the 'arrival_date' column" 오류가 나오면:**  
Supabase 대시보드 → **SQL Editor**에서 아래 SQL을 실행한 뒤 다시 `npm run seed` 하세요.
```sql
ALTER TABLE exposure_events
  ADD COLUMN IF NOT EXISTS departure_date date,
  ADD COLUMN IF NOT EXISTS arrival_date date;
```

## 로컬 실행 (요약)

- 의존성: `npm install`
- 환경 변수: `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 설정
- 점검: `npm run check:env`, `npm run check:db`
- 시드: `npm run seed` (선택)
- 실행: `npm run dev` 또는 `npm run dev:all`

## 배포

- **GitHub → Vercel**  
  1. GitHub에 저장소 생성 후 코드 푸시  
  2. [Vercel](https://vercel.com)에서 해당 저장소 연결  
  3. **Environment Variables**에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 등록  
  4. **Deploy** 실행  

- **전체 가이드 (GitHub부터 순서대로)**  
  **[docs/DEPLOY.md](docs/DEPLOY.md)** 에서 다음 순서로 정리되어 있습니다.  
  - 0. GitHub: 저장소 생성, 로컬 푸시  
  - 1. 배포 전 확인 (Supabase, 환경 변수, 로컬 빌드)  
  - 2. Vercel 배포  
  - 3~5. 기타 호스팅, 배포 후 확인, 트러블슈팅  

- 배포 전 로컬에서 `npm run build` 로 빌드 성공 여부 확인 권장  

## Visit tracking (방문 추적)

- 대시보드 조회 시 **방문 수(Pageviews)** / **방문자 수(Unique)** 를 `visit_events` 테이블에 기록하고 KPI로 표시합니다.
- `pea_vid` 쿠키(365일)로 고유 방문자를 근사합니다. 테이블 생성: `supabase/migrations/20250206000000_visit_events.sql` 실행.

## API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/exposures` | 노출 이벤트 적재 (단건/배열) |
| POST | `/api/visits` | 방문 이벤트 1건 기록 (body: path, visitorId, referrer?, userAgent?, meta?) |
| GET | `/api/visits/summary` | 방문 수·고유 방문자 수 (query: period=24h\|7d, path=/dashboard) |
| GET | `/api/exposures/summary` | 총 노출, 세션 수, P25/P50/P75, Anchor, 최빈 구간 |
| GET | `/api/exposures/histogram` | 구간별 건수 (binSize 기본 10,000, 쿼리로 10,000~50,000 조정) |
| GET | `/api/exposures/timeseries` | 시간대별 평균/중앙값/건수 |
| GET | `/api/exposures/recent` | 최근 30건 |
| GET | `/api/exposures/by-price` | 특정 가격 구간 노출 상세 (시간대별·로그, Drill-down용) |

공통 쿼리: `airline`, `origin`, `dest`, `tripType`, `channel`(선택), `period=24h|7d`

## 폴더 구조

```
/app
  /dashboard/page.tsx
  /api/exposures/route.ts (POST)
  /api/exposures/summary/route.ts (GET)
  /api/exposures/histogram/route.ts (GET)
  /api/exposures/timeseries/route.ts (GET)
  /api/exposures/recent/route.ts (GET)
  /api/exposures/by-price/route.ts (GET)
  /api/exposures/price-counts/route.ts (GET)
/src
  /lib/supabaseAdmin.ts   (service role, server-only)
  /lib/validators.ts
  /lib/metrics.ts
  /lib/query.ts
  /components/...
/scripts
  seed.ts
/supabase
  schema.sql
```
