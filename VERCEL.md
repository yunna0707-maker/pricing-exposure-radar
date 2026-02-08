# Vercel deployment (pricing-exposure-radar)

Use these **exact settings** so the app deploys without errors.

## 1. In Vercel: Project → Settings → General

| Setting | Value |
|--------|--------|
| **Root Directory** | `fare-exposure-anchor` |
| **Framework Preset** | Next.js |
| **Build Command** | (leave empty — use default) or `npm run build` |
| **Output Directory** | (leave empty — Automatic) |
| **Install Command** | (leave empty — use default) or `npm install` |

Do **not** set Output Directory to `public`.

## 2. Environment variables (Settings → Environment Variables)

Add these for **Production** (and Preview if you use it):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase **service_role** key (not anon) |

## 3. Deploy

- Push to `main` → Vercel auto-deploys.
- Or: Deployments → … → **Redeploy** after changing settings.

## 4. After deploy

- App URL: `https://<your-project>.vercel.app`
- Dashboard: `https://<your-project>.vercel.app/dashboard`
- API example: `https://<your-project>.vercel.app/api/exposures/summary?airline=KE&origin=ICN&dest=NRT&tripType=RT&period=7d`

If Root Directory is **not** set to `fare-exposure-anchor`, Vercel will not detect Next.js and build will fail.
