<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Gadur Sewa

Full-stack Nepal travel-booking app (Buses / Hotels / Car-Jeep, Jhapa↔Taplejung) + complete admin CMS.
Next.js 16 App Router · React 19 · Tailwind v4 · Prisma 6 + SQLite (`prisma/dev.db`). See README.md.

## Conventions
- `route handlers` / `page` params and `searchParams` are **async** (`await params`) in Next 16.
- DB access via the singleton in `src/lib/db.ts`. SQLite → no enums/arrays: enum-like = `String`,
  lists = CSV (`src/lib/format.ts#csv`) or JSON strings.
- Public booking server actions: `src/app/actions.ts`. Admin CRUD server actions: `src/app/admin/actions.ts`
  (each guards with `requireAdmin`/`requireSuperAdmin` from `src/lib/auth.ts`, then `revalidatePath`).
- Admin auth = HMAC-signed cookie (`gs_admin`), helpers in `src/lib/auth.ts`. Admin shell + guard live
  in the `src/app/admin/(panel)/` route group; `/admin/login` sits outside it.
- Admin list pages use the edit-in-place pattern: `?edit=<id>` (or `?edit=new`) renders the form via
  one `upsertX` action; delete via `<DeleteButton>` (confirm dialog).
- Editable site content/branding is a key-value store: `src/lib/settings.ts` (defaults there).
- Image uploads: POST `/api/admin/upload` → `public/uploads/` + `MediaAsset` row. Pick images in
  forms via `<MediaSelect>`.
- Run `npm run db:reset` to reseed. Validate with `npx tsc --noEmit`.
