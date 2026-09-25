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

## Money / pricing rules
- **Never trust a client `total`.** The API recomputes everything from
  `service_id` / `area_id` / `hairdo` on `POST /bookings`.
- **The frontend `lib/config.js` table mirrors the API's `pricing.js`** (services,
  nailArt, areas, hairdoAddon). Identical on purpose so the estimate the guest
  sees equals the total the owner is shown. **Change one → change both**; the API's
  `pricing-spec-test` asserts they match when both repos sit side by side.
- **Hairdo add-on** applies only to a service flagged `hairdoIncluded: false`
  (plain "Make Up"). Nail art / hairdo-included services never charge it, even if
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
