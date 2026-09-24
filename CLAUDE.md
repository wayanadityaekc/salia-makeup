# CLAUDE.md — Salia Makeup

Guidance for Claude on this repo. Role = propose and implement; **final decisions
are Wayan's**. When unsure, ask first (keep it short). Casual Indonesian with
Wayan. No fake content (reviews, captions, promises the site doesn't make) —
prefer an empty state over invented data.

## Project
- Booking site for **Salia Makeup** — make up, hairdo & nail art, Denpasar area.
- Booking ends in a **WhatsApp handoff** on the client. **No payment gateway**,
  **no server-side WhatsApp** — the site just opens `wa.me` after the POST succeeds.
- Modelled on the CUE / cahyana-api split, but kept as **one repo**: frontend at
  the root, backend in `api/`.

## Stack & structure
- **Frontend** = Next.js 16 + React 19 (App Router), Tailwind 3, react-hook-form,
  lucide-react. Pages in `app/`, components in `components/`, data/helpers in `lib/`.
- **Backend** (`api/`) = Node + Express 4 + Postgres (`pg`), JWT auth
  (`jsonwebtoken`). Deployed separately (Railway), root pointed at `api/`.
- Frontend talks to the API only through **`lib/storage.js`** (the one place that
  knows the API URL and does snake_case ⇆ camelCase mapping). Components just `await`.

## Money / pricing rules
- **Never trust a client `total`.** `POST /bookings` recomputes everything in
  `api/pricing.js` from `service_id` / `area_id` / `hairdo`.
- **`api/pricing.js` mirrors the frontend `lib/config.js` table** (services,
  nailArt, areas, hairdoAddon). They are identical on purpose so the estimate the
  guest sees equals the total the owner is shown. **Change one → change both**,
  then `cd api && node tools/pricing-spec-test.js` (it asserts the two match).
- **Hairdo add-on** applies only to a service flagged `hairdoIncluded: false`
  (plain "Make Up"). Nail art / hairdo-included services never charge it, even if
  the client sends `hairdo: true` — mirror of `bisaHairdo` in `BookingForm.js`.

## Auth
- Single shared owner password (`ADMIN_PASSWORD`) → `POST /auth/login` → JWT
  (`JWT_SECRET`), stored in `sessionStorage` (`salia_token`). No user table.
- Every non-public booking route is `Bearer`-gated (`api/auth.js requireAuth`).
  A 401 makes the dashboard drop back to the login gate (`UnauthorizedError` in
  `lib/storage.js`).

## Data model — `bookings`
snake_case columns (`service_id`, `service_nama`, `area_id`, `area_nama`,
`created_at`, …), status `baru | konfirmasi | selesai` default `baru`. The UI uses
camelCase; the mapping lives only in `lib/storage.js`. Schema is created by
`db.ensureSchema` on boot — **idempotent, never drops**.

## Before calling it "done"
1. Frontend: `npm run build` passes.
2. API: `cd api && npm test` passes (check-exports + pricing-spec + booking-flow).
3. Touched a price? Ran `pricing-spec-test.js` (and updated BOTH tables).
4. No secrets committed (`.env` / `.env.local` are gitignored; only `.example` files).
