# Pricing Exposure Radar

이 저장소는 **가격 노출 기준점** 대시보드 프로젝트를 포함합니다.

## 레포 구조

- **실제 Next.js 앱**은 [`fare-exposure-anchor/`](./fare-exposure-anchor/) 폴더 안에 있습니다.
- **루트의 `package.json`** 은 wrapper 역할만 합니다. 앱 의존성/빌드는 모두 `fare-exposure-anchor`에서 이루어지며, 루트 스크립트는 `--prefix fare-exposure-anchor` 로 해당 폴더 명령을 대신 실행합니다.
- **Vercel 배포 시** 반드시 **Root Directory** 를 `fare-exposure-anchor` 로 설정하세요. Output Directory는 비워 두고(Automatic) 사용합니다.

## 로컬 실행

앱 폴더에서 직접 실행:

```bash
cd fare-exposure-anchor
npm install
npm run dev
```

또는 루트에서 한 번에 실행:

```bash
npm install --prefix fare-exposure-anchor && npm run dev --prefix fare-exposure-anchor
```

대시보드: http://localhost:3000/dashboard

## 로컬 빌드

```bash
npm run build --prefix fare-exposure-anchor
```

(루트 `package.json`의 `build` 스크립트는 위와 동일한 빌드를 실행합니다.)

## 프로젝트 상세

- **실행·배포·API** 등 상세 내용은 [fare-exposure-anchor/README.md](./fare-exposure-anchor/README.md) 참고

## GitHub 푸시

저장소는 이미 연결되어 있습니다. **최초 1회 인증**이 필요합니다.

```bash
git push -u origin main
```

- HTTPS 사용 시: GitHub **사용자명** + **Personal Access Token**(비밀번호 대신) 입력  
  → [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) 에서 생성
- 푸시 후 [https://github.com/yunna0707-maker/pricing-exposure-radar](https://github.com/yunna0707-maker/pricing-exposure-radar) 에서 코드 확인

## Vercel 배포

### 설정 가이드 (권장)

- **Root Directory**: 반드시 `fare-exposure-anchor` 로 설정하세요. (앱이 이 폴더 안에 있음)
- **Framework Preset**: **Next.js** 선택
- **Output Directory**: 비워 두고 **Automatic** 으로 두세요. Next.js가 자동으로 출력 경로를 사용합니다. (`public` 등으로 고정하지 말 것)
- **Build / Install Command**: Root Directory를 `fare-exposure-anchor`로 두면 Vercel이 해당 폴더의 `package.json`을 기준으로 자동 인식합니다.

### 배포 절차

1. [Vercel](https://vercel.com) 로그인 (GitHub 연동 권장) → **Add New** → **Project**
2. **Import** 할 저장소: `yunna0707-maker/pricing-exposure-radar` 선택
3. **Root Directory**: **Edit** → `fare-exposure-anchor` 입력
4. **Environment Variables** 에 추가:
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service_role 키 (비밀 유지)
5. **Deploy** 클릭 → 완료 후 `https://<프로젝트>.vercel.app/dashboard` 로 접속

상세: [fare-exposure-anchor/docs/DEPLOY.md](./fare-exposure-anchor/docs/DEPLOY.md)
