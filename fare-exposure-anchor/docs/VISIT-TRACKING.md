# Visit tracking — 적용 및 확인

## 1. Supabase에 SQL 적용

1. [Supabase](https://supabase.com) 대시보드 → 프로젝트 선택
2. 왼쪽 **SQL Editor** 클릭
3. **New query** 선택 후 아래 파일 내용을 붙여넣기:
   - `supabase/migrations/20250206000000_visit_events.sql`
4. **Run** 실행
5. `visit_events` 테이블이 생성되었는지 **Table Editor**에서 확인

## 2. Vercel 환경 변수

기존과 동일합니다. 이미 설정했다면 추가 작업 없음.

- **Settings** → **Environment Variables**
- `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase **service_role** 키 (anon 아님)

변경 후 재배포: **Deployments** → 최신 배포 → **⋯** → **Redeploy**

## 3. 로컬에서 확인

1. **SQL 적용**  
   Supabase SQL Editor에서 `supabase/migrations/20250206000000_visit_events.sql` 실행

2. **로컬 실행**  
   ```bash
   cd fare-exposure-anchor
   npm run dev
   ```

3. **브라우저**  
   - http://localhost:3000/dashboard 접속
   - 상단에 **방문 수 (Pageviews)** / **방문자 수 (Unique)** 두 개의 KPI 카드가 보이는지 확인
   - 페이지를 새로고침하거나 다시 열면 **방문 수**가 1씩 늘어나는지 확인
   - 같은 브라우저(같은 쿠키)로 여러 번 보면 **방문자 수**는 1, **방문 수**는 증가하는지 확인

4. **API 직접 호출 (선택)**  
   - `GET http://localhost:3000/api/visits/summary?period=24h&path=/dashboard`  
     → `{ "pageviews": N, "uniqueVisitors": M }` 형태로 응답되는지 확인

## 4. 배포 후 확인 (Vercel)

1. 배포 URL의 `/dashboard` 접속
2. 방문 수 / 방문자 수 KPI가 표시되는지 확인
3. 몇 번 새로고침 후 숫자가 올라가는지 확인
