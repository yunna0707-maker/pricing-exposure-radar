# Preview 배포 → Production 승격 가이드 (초급자용)

**원칙:** 기존 Production은 건드리지 않고, 새 변경사항을 Preview로 먼저 올린 뒤 확인하고 Production으로 승격합니다.

---

## 0) 배포 전략

- **Production(기존 배포)은 그대로 둡니다.**
- GitHub에 새 커밋을 푸시하면 **Vercel이 자동으로 Preview Deployment**를 만듭니다.
- **Preview URL**에서 정상 동작을 확인한 뒤에만 **Production으로 Promote** 합니다.

---

## 1) 로컬에서 수정사항 최종 점검

### (1) 빌드 확인 (반드시 실행)

PowerShell에서 **프로젝트 앱 폴더**로 이동한 뒤 아래를 순서대로 실행하세요.

```powershell
cd C:\Users\TS1588\Desktop\pricing-exposure-radar\fare-exposure-anchor

npm install
npm run build
```

- `npm run build` 가 끝까지 에러 없이 완료되어야 합니다.
- **(선택)** 로컬에서 화면 확인: `npm run dev` 실행 후 브라우저에서 `http://localhost:3000/dashboard` 접속.

### (2) 시드 스크립트 (로컬/DB만 영향, 배포와 무관)

시드 데이터를 넣어서 대시보드에서 여러 항공사·노선을 보고 싶다면 **로컬에서만** 실행하세요.  
Vercel 배포 시에는 시드는 **자동 실행되지 않습니다.**

```powershell
cd C:\Users\TS1588\Desktop\pricing-exposure-radar\fare-exposure-anchor
npm run seed
```

- 콘솔에 **항공사별 Top10**, **노선별 Top10**, **trip_type/channel 분포**가 출력되면 정상입니다.
- Supabase에 데이터가 쌓이므로, Preview/Production 대시보드에서도 **같은 Supabase**를 쓰면 필터 옵션이 보입니다.

---

## 2) Git 변경사항 커밋/푸시 (Preview 배포 트리거)

### 삭제된 파일 확인 및 복구

- **레포 루트** = `pricing-exposure-radar` (한 단계 위 폴더)
- **앱 폴더** = `fare-exposure-anchor`

| 파일 | 있어야 할 위치 | 비고 |
|------|----------------|------|
| `public/.gitkeep` | **레포 루트** `pricing-exposure-radar/public/.gitkeep` | 없으면 빈 폴더가 커밋되지 않을 수 있음. 있으면 그대로 두면 됨. |
| `vercel.json` | 레포 루트에 **필수 아님** | Vercel 대시보드에서 **Root Directory**를 `fare-exposure-anchor`로 설정하면 됨. vercel.json 없이 배포 가능. |

**public/.gitkeep 이 없을 때만** 레포 루트에서 다음으로 생성:

```powershell
cd C:\Users\TS1588\Desktop\pricing-exposure-radar
if (!(Test-Path public)) { New-Item -ItemType Directory -Path public }
Set-Content -Path public\.gitkeep -Value ""
```

(이미 있으면 건너뛰어도 됩니다.)

### 레포 루트에서 커밋/푸시

**지금 `fare-exposure-anchor` 폴더에 있다고 가정하면**, 한 단계 위(레포 루트)로 이동한 뒤 진행하세요.

```powershell
cd C:\Users\TS1588\Desktop\pricing-exposure-radar

git status
git add -A
git status
git commit -m "feat: expand seed data and route-matched filters"
git push origin main
```

- **"no changes added to commit"** 이 나오면:  
  이미 모두 커밋된 상태이거나, 변경된 파일이 없다는 뜻입니다.  
  `git status` 로 수정/추가된 파일이 있는지 확인하고, 필요하면 다시 수정 후 `git add -A` → `git commit` → `git push` 하세요.
- **커밋이 완료되고 푸시까지 되면** Vercel이 자동으로 **Preview Deployment**를 만듭니다.

---

## 3) Vercel Preview 배포 확인

### 환경 변수 (필수)

1. **Vercel Dashboard** → 프로젝트 **pricing-exposure-radar** 선택
2. **Settings** → **Environment Variables**
3. 아래가 **Production**과 **Preview** 모두에 설정되어 있는지 확인:
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase 프로젝트 URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase **service_role** 키 (anon 아님)

Preview에서만 데이터를 안 쌓이게 하려면 Preview에만  
`NEXT_PUBLIC_ANALYTICS_ENABLED` = `false` 로 두면 됩니다.

- **서비스 키 보안:** `SUPABASE_SERVICE_ROLE_KEY`는 **서버(API Route)** 에서만 사용되고, 클라이언트 번들에는 포함되지 않습니다. `NEXT_PUBLIC_` 접두사가 없기 때문입니다.

### Deployments에서 Preview 찾기

1. **Deployments** 탭 클릭
2. 방금 푸시한 커밋(예: "feat: expand seed data and route-matched filters")에 해당하는 배포 선택
3. **Preview** 로 표시된 배포의 **URL**(예: `xxx-pricing-exposure-radar-xxx.vercel.app`) 클릭

### Preview 체크리스트

Preview URL에서 아래를 확인하세요.

| # | 확인 항목 |
|---|-----------|
| 1 | `/dashboard` 가 정상적으로 열리는가? |
| 2 | 항공사 필터에 KE/OZ 외 다른 항공사가 보이는가? (Supabase에 시드 데이터가 있으면) |
| 3 | 출발지를 **GMP**로 바꿨을 때, 도착지 목록이 **GMP와 매칭되는 목적지만** 나오는가? |
| 4 | 필터(항공사/출발/도착/기간/채널 등)를 바꿔도 에러나 빈 화면이 없는가? |

이상 없으면 다음 단계로 진행합니다.

---

## 4) Production으로 승격

1. **Deployments** 탭에서 방금 확인한 **Preview 배포** 한 번 클릭
2. 오른쪽 상단 또는 배포 상세 영역에서 **"Promote to Production"** (또는 **"Production"** / **"Promote"**) 버튼 클릭
3. 확인 메시지가 나오면 **승격 확인**
4. **Production URL** (기본 도메인)에서 위 **체크리스트**를 한 번 더 확인

이후에는 해당 배포가 **Production**으로 노출됩니다.

---

## 5) 복붙용 터미널 명령어 정리

### 로컬 점검 (fare-exposure-anchor 에서)

```powershell
cd C:\Users\TS1588\Desktop\pricing-exposure-radar\fare-exposure-anchor
npm install
npm run build
```

### 시드 실행 (선택, 로컬/DB만)

```powershell
cd C:\Users\TS1588\Desktop\pricing-exposure-radar\fare-exposure-anchor
npm run seed
```

### 커밋/푸시 (레포 루트에서)

```powershell
cd C:\Users\TS1588\Desktop\pricing-exposure-radar
git status
git add -A
git commit -m "feat: expand seed data and route-matched filters"
git push origin main
```

---

## 6) Vercel에서 클릭할 메뉴 (Step-by-step)

1. **Vercel Dashboard** 접속 → 로그인
2. **pricing-exposure-radar** 프로젝트 클릭
3. **Settings** → **General** → **Root Directory** 가 `fare-exposure-anchor` 인지 확인
4. **Settings** → **Environment Variables** → Production / Preview 에  
   `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 설정 확인
5. **Deployments** 탭 → 최신 Preview 배포 클릭 → **Preview URL** 로 접속해 체크리스트 확인
6. 같은 배포에서 **"Promote to Production"** 클릭 → Production 승격
7. **Production URL** 에서 다시 체크리스트 확인

---

## 7) 흔한 오류 3가지와 해결

| 오류 | 원인 | 해결 |
|------|------|------|
| **No Next.js version detected** | Vercel이 앱 루트를 잘못 인식함 | **Settings** → **General** → **Root Directory** 를 `fare-exposure-anchor` 로 설정 (앞에 슬래시 없이) |
| **No Output Directory named 'public'** | Output Directory 가 잘못 지정됨 | **Output Directory** 를 **비움**(Automatic). 레포 루트에 `public/.gitkeep` 이 있으면 폴더가 유지됨. |
| **환경변수 이름/값 오류** | 대소문자·특수문자 오타 | 키 이름은 **영문·숫자·언더스코어** 만 사용 (예: `SUPABASE_SERVICE_ROLE_KEY`). 값 앞뒤 공백 없이 입력. |

---

이 순서대로 진행하면 **기존 Production 유지 → Preview 확인 → Production 승격**까지 안전하게 할 수 있습니다.
