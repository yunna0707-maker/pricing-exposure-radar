# Preview → Production 배포 가이드

Production을 바로 덮어쓰지 않고, **Preview 배포로 검증한 뒤 main 병합**으로 승격합니다.

---

## 0) 사전 점검

- [ ] **Vercel** 프로젝트 설정에서 **Root Directory** = `fare-exposure-anchor`
- [ ] 이 프로젝트는 **Next.js App Router** 기반
- [ ] 로컬에서 `cd fare-exposure-anchor` 후 `npm run dev` 정상 동작
- [ ] `.env.local` 은 커밋하지 않음 (`.gitignore`에 포함됨)

---

## 1) 변경사항 커밋 준비

**작업 폴더:** 레포 루트 `pricing-exposure-radar` (한 단계 위에서 실행하면 됨)

```powershell
cd c:\Users\TS1588\Desktop\pricing-exposure-radar
git status
git add .
git commit -m "feat: visit tracking + UI polish"
```

---

## 2) Preview용 브랜치 생성

```powershell
git checkout main
git pull origin main
git checkout -b release/ui-analytics
```

이미 main에 커밋했다면, 위 브랜치 생성 후 해당 브랜치에선 그대로 두고 push만 하면 됨.

---

## 3) GitHub에 브랜치 push

```powershell
git push -u origin release/ui-analytics
```

---

## 4) Vercel Preview 배포 확인

- Vercel 대시보드 → **Deployments** 에서 `release/ui-analytics` 브랜치의 **Preview URL** 확인
- 체크리스트:
  - [ ] `/dashboard` 접속 OK
  - [ ] UI 개선 영역(방문 수/방문자 수 KPI, 동일 금액별 노출 등) 렌더링 OK
  - [ ] 방문자 기록 API 정상 (아래 5에서 DB 확인)
  - [ ] Supabase 연결(환경 변수) 정상
  - [ ] 브라우저 콘솔 에러 없음

---

## 5) Preview에서 방문 로그 검증 (필수)

- **Supabase** → 해당 프로젝트 → **Table Editor** → `visit_events` 테이블
- Preview URL에서 `/dashboard` 몇 번 접속/새로고침 후, `visit_events` 에 row가 늘어나는지 확인
- 또는 `GET /api/visits/summary?period=24h&path=/dashboard` (Preview 도메인 기준) 호출 시 `{ pageviews, uniqueVisitors }` 가 오는지 확인

**실패 시:** Vercel Preview 환경 변수에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 가 설정되어 있는지, Supabase에 `visit_events` 테이블이 생성되어 있는지 확인.

---

## 6) Production 승격

1. **GitHub**에서 **Pull Request** 생성: `release/ui-analytics` → `main`
2. Vercel이 PR에 대한 **Preview URL** 자동 생성 → 위 4·5 체크 한 번 더 수행
3. 문제 없으면 **Merge** (main에 병합)
4. Merge 후 Vercel이 **Production** 자동 배포

---

## 7) 운영 안전장치 (적용됨)

- **방문 기록 실패 시 화면 보호:** `trackPageView` 내부 `try/catch` 로 예외 무시
- **API 타임아웃:** 클라이언트 fetch 2초 후 `AbortController` 로 중단, 실패 시 무시
- **Preview에서 기록 끄기:** Vercel Preview 환경에서  
  `NEXT_PUBLIC_ANALYTICS_ENABLED=false` 설정 시 클라이언트가 `/api/visits` 호출하지 않음  
  (설정하지 않으면 기본적으로 기록함)

---

## Vercel 배포 시 흔한 오류 3가지

| 오류 | 원인 | 해결 |
|------|------|------|
| **No Next.js version detected** / **Could not identify Next.js** | Root Directory가 앱 루트가 아님 | Vercel → Settings → General → **Root Directory** = `fare-exposure-anchor` |
| **No Output Directory named 'public'** | Output Directory가 잘못 지정됨 | **Output Directory** 비우기(Automatic). Root Directory를 `fare-exposure-anchor`로 설정 |
| **Missing env var** / **API 연결 실패** | 환경 변수 미설정 또는 오타 | Settings → Environment Variables 에서 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 확인 (Preview 환경에도 필요 시 동일 설정) |
