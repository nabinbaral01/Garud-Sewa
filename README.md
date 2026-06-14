# Gadur Sewa 🚌

A responsive, full-stack travel-booking platform for eastern Nepal — **Buses, Hotels, and Car/Jeep
rentals** along the Mechi Highway corridor between **Jhapa and Taplejung**. Includes a complete
**admin panel** where everything (listings, prices, images, places, content, settings) is
create/edit/delete-able with no coding.

Deep-blue + violet theme, bilingual (English + Nepali) labels, currency in NPR (रू).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 6** + **SQLite** (`prisma/dev.db`) — no external services needed
- **bcryptjs** auth with HMAC-signed cookie sessions
- Image uploads stored on disk under `public/uploads/` (path saved in DB)
- Icons: `lucide-react`

## Getting started

```bash
npm install
npm run db:reset   # create schema + seed Jhapa–Taplejung data & admin
npm run dev        # http://localhost:3000
```

### Admin

- URL: `/admin` (login at `/admin/login`)
- Default Super Admin: `admin@gadursewa.com` / `gadur123` (from `.env` — change after first login)
- Roles: **Super Admin** (everything) and **Editor** (listings & content, not staff/settings)

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run db:push` | Sync schema to the SQLite DB |
| `npm run db:seed` | Seed places, buses, hotels, vehicles, banners, admin |
| `npm run db:reset` | Force-reset DB then seed |

## Public site

- `/` — hero + icon service tabs (Buses / Hotels / Car-Jeep), trust strip, promos, popular routes
- `/buses` → `/buses/[id]` — search, sortable results, seat map, passenger details, booking
- `/hotels` → `/hotels/[id]` — search, gallery, room types, booking
- `/vehicles` → `/vehicles/[id]` — filters, self-drive / with-driver, one-way drop-off, booking
- `/booking-success?ref=…` — confirmation (book now, pay later)
- `/about`, `/help`, `/terms`, `/account` — content pages (text editable from admin)

## Admin panel (`/admin`)

Dashboard (stats, charts, recent bookings) · Places · Routes · Operators · Buses · Hotels (+ room
types & gallery) · Vehicles · Bookings (filters, status, recycle bin, CSV export) · Customers ·
Banners/promos · Coupons · Media library (upload/URL) · Staff (Super Admin) · Settings/CMS (Super
Admin).

## Data models

`Place, Route, Operator, Bus, Hotel, HotelImage, RoomType, Vehicle, VehicleImage, Booking, User,
AdminUser, Banner, Setting, Coupon, MediaAsset` — see [`prisma/schema.prisma`](prisma/schema.prisma).

## Notes

- SQLite has no enums/arrays, so enum-like fields are `String` and lists are CSV/JSON strings.
- Seed images use Unsplash URLs; replace them via the Media library + listing forms.
- Payment is intentionally deferred ("book now, pay later") for phase 1.
