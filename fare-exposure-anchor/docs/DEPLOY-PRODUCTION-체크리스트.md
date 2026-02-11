# Vercel Production 배포 체크리스트

로컬에서 동작하는 Next.js 앱을 **Vercel Production**으로 배포할 때 순서대로 진행하는 체크리스트입니다.

- **Repo**: https://github.com/yunna0707-maker/pricing-exposure-radar.git  
- **Vercel Root Directory**: `fare-exposure-anchor` (이미 설정된 경우 그대로 사용)

---

## [1] 로컬 검증

배포 전 반드시 **fare-exposure-anchor** 디렉터리에서 실행해 빌드/타입/린트가 통과하는지 확인합니다.

### 1-1. 디렉터리 이동

```bash
cd c:\Users\TS1588\Desktop\pricing-exposure-radar\fare-exposure-anchor
```

**체크포인트**: 프롬프트가 `fare-exposure-anchor` 경로인지 확인.

---

### 1-2. 빌드

```bash
npm run build
```

**체크포인트 (정상 시)**:
- `✓ Compiled successfully`
- `✓ Linting and checking validity of types`
- `✓ Generating static pages (8/8)`
- 마지막에 Route 테이블 출력, exit code 0

**실패 시**: 타입/린트 에러 메시지에 따라 수정 후 다시 `npm run build`.

---

### 1-3. (선택) 타입체크만

```bash
npx tsc --noEmit
```

**체크포인트**: 에러 없이 종료 (exit code 0).

---

### 1-4. (선택) 린트만

```bash
npm run lint
```

**체크포인트**: `No ESLint warnings or errors` 또는 에러 0개.  
(ESLint 미설정 시 빌드 단계에서 이미 린트가 실행되므로 통과했다면 생략 가능.)

---

## [2] Git 커밋 / 푸시

**실수 방지**: `node_modules`, `.next`, `.env.local` 이 커밋되지 않도록 확인합니다.

### 2-1. 제외 대상 확인

```bash
git status
git check-ignore -v node_modules .next .env.local 2>nul || true
```

**체크포인트**:
- `git status`에 `node_modules/`, `.next/`, `.env.local` 이 **나오지 않음** (`.gitignore`에 의해 무시).
- `.gitignore`에 다음이 있는지 확인:
  - `/node_modules`
  - `/.next/`
  - `.env.local`

---

### 2-2. 변경사항 스테이징 및 커밋

```bash
git status
git add .
git status
git commit -m "chore: Production 배포 준비 (빌드/env 안내 보완)"
```

**체크포인트**:
- `git add .` 후 `git status`에 **추가된 파일만** 보이고, `node_modules`, `.next`, `.env.local` 은 보이지 않음.
- `nothing to commit, working tree clean` 이면 이미 모두 커밋된 상태.

---

### 2-3. main 브랜치 푸시

```bash
git branch
git push origin main
```

**체크포인트**:
- `git branch`에서 `* main` (현재 브랜치가 main).
- `git push` 후 `main -> main` 또는 `Everything up-to-date` 등으로 정상 푸시 완료.

---

## [3] Vercel 배포 (Production)

푸시가 끝나면 Vercel이 **자동으로 빌드**합니다.  
Preview만 배포되고 Production이 아닐 수 있으므로, 아래 두 가지 중 하나로 **Production으로 승격**합니다.

### (A) Vercel 대시보드에서 Production 승격

1. [Vercel Dashboard](https://vercel.com/dashboard) 로그인.
2. 해당 프로젝트 선택.
3. **Deployments** 탭 이동.
4. 최신 배포(방금 푸시로 생긴 것)에서 **⋯** (메뉴) 클릭.
5. **Promote to Production** 선택.
6. 확인 후 승격.

**체크포인트**: 해당 배포의 상태가 **Production**으로 표시됨.

---

### (B) Vercel CLI로 Production 배포

```bash
cd c:\Users\TS1588\Desktop\pricing-exposure-radar\fare-exposure-anchor
npx vercel --prod
```

**체크포인트**:  
CLI가 `Production: https://your-project.vercel.app` 같은 URL을 출력하고 배포가 완료됨.

---

### Production Branch 설정 (Preview만 뜨는 경우)

1. Vercel Dashboard → 프로젝트 → **Settings** → **Git**.
2. **Production Branch**가 `main` 인지 확인.
3. `main`이 아니면 `main`으로 변경 후 저장.
4. `main`에 다시 푸시하거나, **Deployments**에서 최신 main 배포를 **Promote to Production**.

**체크포인트**:  
이후 `main`에 push 시 해당 배포가 자동으로 **Production**으로 배포됨.

---

## [4] 배포 후 체크리스트

### 4-1. Production URL 확인

- Vercel 프로젝트 **Domains** 또는 배포 상세에서 **Production URL** 확인.  
  예: `https://pricing-exposure-radar.vercel.app`

---

### 4-2. 대시보드 페이지

브라우저에서:

```
https://<your-production-domain>/dashboard
```

**체크포인트**:  
대시보드가 로드되고, 필터/조회가 동작함 (데이터가 없으면 "조건에 맞는 데이터 없음" 등은 정상).

---

### 4-3. API Health

```
GET https://<your-production-domain>/api/health
```

**체크포인트 (정상 시)**:
- `ok: true`
- `dbConnected: true`
- `exposure_events.totalCount` 등 숫자 필드 존재 (0이어도 응답 구조만 확인).

**실패 시** (예: 500, `ok: false`):
- Vercel **Environment Variables**에 다음이 **Production**에 설정되어 있는지 확인:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- 수정 후 **Redeploy** (Deployments → 최신 배포 → Redeploy).

---

### 4-4. Options API (필터 옵션)

```
GET https://<your-production-domain>/api/exposures/options?period=7d&debug=1
```

**체크포인트**:
- HTTP 200, JSON 응답.
- `airlines`, `origins`, `dests` 배열이 있고, `debug` 시 `periodCount`, `totalCount` 등 단계별 count 확인 가능.

---

## 환경 변수 확인 안내 (Vercel)

운영에서 필요한 값이 **Vercel Environment Variables**에 있는지 반드시 확인하세요.

| 변수명 | 용도 | 설정 위치 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Vercel → Project → Settings → Environment Variables |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 Supabase 키 (절대 클라이언트에 노출 금지) | 동일 (Production, Preview 모두 권장) |

- **주의**: `.env.local`은 Git에 올리지 않습니다. Vercel에는 대시보드에서 직접 입력합니다.
- env 추가/수정 후에는 **Redeploy**해야 반영됩니다.
- 코드에서 위 두 값이 없으면 서버 에러와 함께  
  `[Supabase] 환경 변수 누락: ... Vercel: Project → Settings → Environment Variables에서 ... 재배포.`  
  안내 메시지가 나오도록 되어 있습니다.
