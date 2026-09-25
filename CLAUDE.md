# CLAUDE.md — Salia Makeup

Guidance for Claude on this repo. Role = propose and implement; **final decisions
are Wayan's**. When unsure, ask first (keep it short). Casual Indonesian with
Wayan. No fake content (reviews, captions, promises the site doesn't make) —
prefer an empty state over invented data.

## Project
- Booking site for **Salia Makeup** — make up, hairdo & nail art, Denpasar area.
- This repo is the **frontend only**. The backend is a **separate repo**,
  `salia-makeup-api` (Express + Postgres, Railway) — same split as CUE /
  cahyana-api. The frontend is served publicly, so the backend stays out of it.
- Booking ends in a **WhatsApp handoff** on the client. **No payment gateway**,
  **no server-side WhatsApp** — the site just opens `wa.me` after the POST succeeds.

## Stack & structure
- **Frontend** (this repo) = Next.js 16 + React 19 (App Router), Tailwind 3,
  react-hook-form, lucide-react. Pages in `app/`, components in `components/`,
  data/helpers in `lib/`.
- **Backend** (`salia-makeup-api` repo) = Node + Express + Postgres (`pg`), JWT auth.
- Frontend talks to the API only through **`lib/storage.js`** (the one place that
  knows the API URL and does snake_case ⇆ camelCase mapping). Components just `await`.
- `NEXT_PUBLIC_API_URL` = deployed API URL (unset ⇒ `http://localhost:4000`).

## Services & photos are dashboard-managed
- **Services + gallery photos live in the DB**, edited from `/dashboard`
  (tabs Layanan & Galeri). Public pages (home/layanan/nail-art/galeri) read them
  live from `GET /services` and `GET /gallery` via `lib/storage.js`, so those
  routes are dynamic (ƒ). Photo upload goes to the API (`POST /uploads` →
  Cloudinary); needs `CLOUDINARY_*` env on the server or it returns 501.
- **`lib/config.js` is the FALLBACK table** — used only if the API is unreachable,
  and as the seed the API loads into the `services` table on first boot. It still
  mirrors the API's `pricing.js`, so **change one → change both** (the API's
  `pricing-spec-test` asserts they match when both repos sit side by side).
- Areas + the hairdo add-on are still fixed (not dashboard-editable yet).

## Money / pricing rules
- **Never trust a client `total`.** The API recomputes from the DB service row +
  `area_id` / `hairdo` on `POST /bookings`.
- **Hairdo add-on** applies only when a makeup service has `hairdo_included = false`
  ("Make Up"); nail art (null) and hairdo-included services never charge it, even if
  the client sends `hairdo: true` — mirror of `bisaHairdo` in `BookingForm.js`.

## Auth
- Single shared owner password (`ADMIN_PASSWORD`) → `POST /auth/login` → JWT,
  stored in `sessionStorage` (`salia_token`). No user table.
- Admin routes are `Bearer`-gated. A 401 makes the dashboard drop back to the
  login gate (`UnauthorizedError` in `lib/storage.js`).

## Data model — `bookings`
API columns are snake_case (`service_id`, `service_nama`, `area_id`, `area_nama`,
`created_at`, …), status `baru | konfirmasi | selesai` default `baru`. The UI uses
camelCase; the mapping lives only in `lib/storage.js`.

## Before calling it "done"
1. Frontend: `npm run build` passes.
2. Touched a price? Update BOTH tables (`lib/config.js` here + `pricing.js` in
   `salia-makeup-api`) and run the API's `pricing-spec-test.js`.
3. No secrets committed (`.env` / `.env.local` are gitignored; only `.example` files).
