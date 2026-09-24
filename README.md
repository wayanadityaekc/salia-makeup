# Salia Makeup

Booking site for **Salia Makeup** — make up, hairdo & nail art (Denpasar).
Monorepo: a Next.js frontend at the root + an Express/Postgres booking API in
[`api/`](./api). No payment gateway anywhere — the final booking step is a
WhatsApp handoff on the client.

## Structure

```
.            Next.js 16 / React 19 frontend (App Router)
  app/       pages (site + /dashboard)
  components/ BookingForm, Navbar, …
  lib/       config (price table), storage (API client), utils
api/         Express + Postgres booking API (deploy separately, e.g. Railway)
```

## Frontend

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev                        # http://localhost:3000
npm run build
```

`NEXT_PUBLIC_API_URL` points the site at the deployed API. Unset ⇒ falls back to
`http://localhost:4000` for local dev.

## API

See [`api/README.md`](./api/README.md). Quick start:

```bash
cd api
npm install
cp .env.example .env               # DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD, CORS_ORIGIN
npm start                          # http://localhost:4000
npm test                           # check-exports + pricing-spec + booking-flow
```

## How it fits together

- **Booking** (`/booking`): the form `POST /bookings`; on success it opens
  WhatsApp with the summary. The server recomputes the total from its own price
  table — a client-sent `total` is never trusted.
- **Dashboard** (`/dashboard`): owner logs in with the shared password
  (`POST /auth/login` → JWT in `sessionStorage`), then lists / confirms /
  completes / deletes bookings. Data persists across devices in Postgres.
- The frontend price table (`lib/config.js`) and the server price table
  (`api/pricing.js`) are kept identical on purpose. Change one → change both,
  then run `api` `npm test`.
