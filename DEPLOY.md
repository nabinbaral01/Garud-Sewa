# Deploying Garud Sewa to Vercel

The app uses **Postgres** (database) and **Vercel Blob** (image uploads). Both are
free to start. Follow these once.

## 1. Push the code to GitHub
```bash
git init              # if not already a repo
git add -A
git commit -m "Garud Sewa"
# create a repo on github.com, then:
git remote add origin https://github.com/<you>/garud-sewa.git
git push -u origin main
```

## 2. Create a Postgres database
Either option works:

**A) Neon (neon.tech) — free**
1. Sign up → Create project → copy the **connection string** (looks like
   `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).

**B) Vercel Postgres**
1. In your Vercel project → **Storage → Create → Postgres** → it sets
   `DATABASE_URL` for you automatically (skip pasting it in step 4).

## 3. Import the project into Vercel
1. vercel.com → **Add New → Project** → import your GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Leave build settings default
   (build command `prisma generate && next build` is already in package.json).

## 4. Add a Blob store (image uploads)
1. In the Vercel project → **Storage → Create → Blob**.
2. This adds the **`BLOB_READ_WRITE_TOKEN`** env var automatically.

## 5. Set environment variables (Project → Settings → Environment Variables)
| Name | Value |
| --- | --- |
| `DATABASE_URL` | your Postgres connection string (skip if using Vercel Postgres) |
| `SESSION_SECRET` | a long random string |
| `ADMIN_EMAIL` | e.g. `admin@garudsewa.com` |
| `ADMIN_PASSWORD` | a strong password |
| `BLOB_READ_WRITE_TOKEN` | added automatically by the Blob store |

## 6. Create the tables + seed data (run once, locally, pointing at the prod DB)
```bash
# put the SAME DATABASE_URL in your local .env, then:
npm install
npx prisma db push      # creates all tables in Postgres
npm run db:seed         # places, sample Hiace/hotels, admin user
```
(Or run `npx prisma db push` against the prod DB any time the schema changes.)

## 7. Deploy
Vercel deploys automatically on every push to `main`. Your site is live at
`https://<project>.vercel.app`. Log in at `/admin/login` with the ADMIN_EMAIL /
ADMIN_PASSWORD you set.

---

## Local development
Local now uses Postgres too (set `DATABASE_URL` in `.env` to a Neon dev DB or the
same one). Image uploads with **no** `BLOB_READ_WRITE_TOKEN` fall back to
`public/uploads`, so dev keeps working without a Blob token.

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

## Notes
- Schema changes: run `npx prisma db push` against the DB (or set up
  `prisma migrate` for versioned migrations).
- The old local `prisma/dev.db` (SQLite) is no longer used; data there won't
  appear in Postgres — reseed or re-enter as needed.
- Uploaded images on Vercel are served from Blob URLs; older `/uploads/...` paths
  only exist on whatever machine created them.
