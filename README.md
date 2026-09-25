# Salia Makeup

Booking site for **Salia Makeup** — make up, hairdo & nail art (Denpasar).
Next.js frontend. No payment gateway anywhere — the final booking step is a
WhatsApp handoff on the client.

The backend lives in a **separate repo**, `salia-makeup-api` (Express + Postgres,
deployed on Railway) — same split as CUE / cahyana-api. Keeping the backend out
of this repo matters because the frontend is served publicly.

## Structure

```
app/         pages (site + /dashboard)
components/  BookingForm, Navbar, …
lib/         config (price table), storage (API client), utils
```

## Run

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev                        # http://localhost:3000
npm run build
```

`NEXT_PUBLIC_API_URL` points the site at the deployed `salia-makeup-api`. Unset ⇒
falls back to `http://localhost:4000` for local dev.

## How it fits together

- **Booking** (`/booking`): the form `POST`s to the API; on success it opens
  WhatsApp with the summary. The server recomputes the total — a client-sent
  `total` is never trusted.
- **Dashboard** (`/dashboard`): owner logs in with the shared password
  (`POST /auth/login` → JWT in `sessionStorage`), then lists / confirms /
  completes / deletes bookings. Data persists across devices in Postgres.
- The frontend price table (`lib/config.js`) mirrors the server price table
  (`pricing.js` in `salia-makeup-api`). Change one → change both; the API's
  `pricing-spec-test` asserts they match when both repos are checked out together.
- All API calls go through **`lib/storage.js`** (the one place that knows the API
  URL and maps snake_case ⇆ camelCase).

See `API-BRIEF.md` for the original spec.
