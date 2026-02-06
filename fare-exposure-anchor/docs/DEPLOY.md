# 배포 가이드 (가격 노출 기준점)

**GitHub 저장소 생성 → 코드 푸시 → 배포** 순서로 진행하는 전체 가이드입니다.

---

## 0. GitHub부터 시작

### 0-1. Git이 설치되어 있는지 확인

터미널(또는 PowerShell)에서:

```bash
git --version
```

`git version 2.x.x` 처럼 나오면 OK. 없으면 [Git 다운로드](https://git-scm.com/downloads) 후 설치.

---

### 0-2. 프로젝트 폴더에서 Git 초기화 (아직 안 했다면)

**fare-exposure-anchor** 폴더로 이동한 뒤:

```bash
cd fare-exposure-anchor
git init
```

이미 `git init` 되어 있거나 상위 폴더가 Git 저장소라면 이 단계는 건너뛰어도 됩니다.

---

### 0-3. GitHub에서 새 저장소 만들기

1. [GitHub](https://github.com) 로그인
2. 우측 상단 **+** → **New repository**
3. 설정:
   - **Repository name**: 예) `pricing-exposure-radar` 또는 `fare-exposure-anchor`
   - **Description**: (선택) 예) 가격 노출 기준점 대시보드
   - **Public** 선택
   - **Add a README file** 등은 체크하지 않음 (로컬에 이미 코드가 있으므로)
4. **Create repository** 클릭
5. 생성된 페이지에 나오는 **저장소 URL**을 복사  
   - HTTPS: `https://github.com/<사용자명>/<저장소명>.git`  
   - SSH: `git@github.com:<사용자명>/<저장소명>.git`

---

### 0-4. 로컬 코드를 GitHub에 푸시

**fare-exposure-anchor** 폴더가 Git 저장소 루트인 경우 (즉, 이 폴더 안에서 `git init` 한 경우):

```bash
cd fare-exposure-anchor

# 변경 파일 모두 스테이징
git add .

# 첫 커밋 (이미 커밋이 있으면 "배포 준비" 등 원하는 메시지로)
git commit -m "chore: 배포 준비 - 가격 노출 기준점 대시보드"

# GitHub 저장소를 origin으로 연결 (URL은 본인 저장소로 교체)
git remote add origin https://github.com/<사용자명>/<저장소명>.git

# 기본 브랜치 이름이 main이 아니라면: git branch -M main
git push -u origin main
```

- **이미 `origin`이 있다면**  
  `git remote add origin ...` 대신 주소만 바꾸려면:  
  `git remote set-url origin https://github.com/<사용자명>/<저장소명>.git`  
  그 다음 `git push -u origin main`

- **브랜치 이름이 `master`인 경우**  
  `git push -u origin master`  
  또는 `git branch -M main` 후 `git push -u origin main`

- **인증**  
  HTTPS면 GitHub 사용자명 + 비밀번호 대신 **Personal Access Token** 입력  
  (설정 → Developer settings → Personal access tokens에서 생성)

푸시가 끝나면 GitHub 저장소 페이지에서 코드가 보여야 합니다.

---

### 0-5. 확인

- GitHub 저장소 페이지에서 `app`, `src`, `package.json` 등이 보이는지 확인
- `.env.local` 은 `.gitignore`에 있으므로 올라가지 않아야 함 (비밀키 보호)

---

## 1. 배포 전 확인

- [ ] **Supabase**  
  - 프로젝트 생성 후 `supabase/schema.sql` 실행  
  - `exposure_events` 테이블 및 인덱스 존재 확인  
  - 필요 시 `supabase/migrations/20250205000000_add_departure_arrival_dates.sql` 실행  

- [ ] **환경 변수**  
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project URL  
  - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service_role (secret)  

- [ ] **로컬 빌드**  
  - `npm install`  
  - `npm run build`  
  - 빌드 성공 후 `npm run start` 로 동작 확인 (선택)  

---

## 2. Vercel 배포 (권장)

1. **저장소 연결**  
   - [Vercel](https://vercel.com) 로그인 (GitHub 계정 연동 권장)  
   - **Add New** → **Project**  
   - **Import Git Repository**에서 0단계에서 푸시한 GitHub 저장소 선택  
   - 모노레포인 경우 **Root Directory**를 **Edit** → `fare-exposure-anchor` 지정  
   - **Import** 클릭  

2. **환경 변수 설정**  
   - **Settings** → **Environment Variables**  
   - 다음 두 개 추가 (Production, Preview 등 필요한 환경에 체크):  

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret) |

3. **빌드 설정**  
   - **Framework Preset**: Next.js (자동 인식)  
   - **Build Command**: `npm run build` (기본값)  
   - **Output Directory**: 기본값 유지  

4. **배포**  
   - **Deploy** 클릭  
   - 배포 완료 후 제공되는 URL로 접속 (예: `https://xxx.vercel.app`)  
   - 대시보드: `https://xxx.vercel.app/dashboard`  

---

## 3. 다른 호스팅 (Node 서버)

- `npm run build` 후 `npm run start` 로 프로덕션 서버 실행  
- 호스팅 업체에서 Node 서버로 실행할 때:  
  - **Start Command**: `npm run start`  
  - **Port**: 기본 3000 (업체에서 지정한 포트에 맞출 수 있음)  
- 환경 변수 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 를 해당 플랫폼에서 설정  

---

## 4. 배포 후 확인

- [ ] `https://<배포-도메인>/` 접속 시 `/dashboard` 로 리다이렉트되는지  
- [ ] `https://<배포-도메인>/dashboard` 에서 필터 선택 후 **조회** 시 데이터/차트가 로드되는지  
- [ ] Supabase에 데이터가 있는 경우, 동일 조건으로 로컬과 같은 결과가 나오는지  

---

## 5. 트러블슈팅

- **API 연결 실패 / 데이터 없음**  
  - Vercel(또는 호스팅) 환경 변수에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 가 올바르게 설정되었는지 확인  
  - Supabase 대시보드에서 해당 프로젝트의 URL과 service_role 키 재확인  

- **빌드 실패**  
  - 로컬에서 `npm run build` 로 같은 에러가 나는지 확인  
  - Node 버전: 18.x 이상 권장 (Vercel은 자동)  

- **CORS / Mixed Content**  
  - 이 앱은 같은 도메인에서 API를 호출하므로 별도 CORS 설정은 필요 없음  
