# Brief: Salia Makeup API + Frontend Wiring

Paste this into Claude Code, run from the repo root. Build the backend and wire the existing Next.js frontend to it. No payment gateway anywhere — the final booking step stays a WhatsApp handoff on the client.

## Stack
- Node + Express, PostgreSQL. Deploy target: Railway (same setup as `cahyana-api`).
- Keep it minimal: no ORM required (use `pg`), or Prisma if you prefer — your call, stay consistent.

## What the API does
1. Accept public booking submissions and store them.
2. Serve, update, and delete bookings for the owner only (password-protected).
3. Do NOT send WhatsApp messages server-side and do NOT handle payments. The frontend already opens `wa.me` after a successful POST.

## Data model — `bookings`
| column        | type        | notes                                             |
|---------------|-------------|---------------------------------------------------|
| id            | uuid / serial pk |                                              |
| nama          | text        | required                                          |
| telepon       | text        | required                                          |
| service_id    | text        | e.g. `makeup-hairdo`, `nail-gel`                  |
| service_nama  | text        |                                                   |
| hairdo        | boolean     | default false                                     |
| area_id       | text        |                                                   |
| area_nama     | text        |                                                   |
| tanggal       | date        |                                                   |
| jam           | text        | `HH:MM`                                           |
| lokasi        | text        | nullable                                          |
| catatan       | text        | nullable                                          |
| total         | integer     | rupiah                                            |
| status        | text        | `baru` \| `konfirmasi` \| `selesai`, default `baru` |
| created_at    | timestamptz | default now()                                     |

## Auth
- Single owner login. `POST /auth/login { password }` → returns a signed JWT (`ADMIN_PASSWORD` + `JWT_SECRET` in env).
- Protect all non-public booking routes with a `Bearer` token middleware.
- No user table needed — one shared owner password is enough.

## Endpoints
| method | path              | auth   | body / notes                                  |
|--------|-------------------|--------|-----------------------------------------------|
| POST   | `/bookings`       | public | create booking, returns created row           |
| GET    | `/bookings`       | admin  | list, newest first; optional `?status=`       |
| PATCH  | `/bookings/:id`   | admin  | update `{ status }`                            |
| DELETE | `/bookings/:id`   | admin  | delete                                         |
| POST   | `/auth/login`     | public | `{ password }` → `{ token }`                   |
| GET    | `/health`         | public | `{ ok: true }`                                 |

- Validate POST body server-side (nama, telepon, service_id, tanggal, jam required). Recompute `total` on the server from a price table mirrored from `lib/config.js` — never trust the client total.
- Enable CORS for the frontend origin.

## Env
```
DATABASE_URL=
JWT_SECRET=
ADMIN_PASSWORD=
CORS_ORIGIN=https://saliamakeup.com
PORT=
```

## Frontend wiring (this repo)
1. Add `NEXT_PUBLIC_API_URL` to `.env.local`.
2. Rewrite `lib/storage.js` to call the API instead of `localStorage`:
   - `saveBooking` → `POST /bookings`
   - `getBookings` → `GET /bookings` (send `Authorization: Bearer <token>`)
   - `updateBooking` → `PATCH /bookings/:id`
   - `deleteBooking` → `DELETE /bookings/:id`
   Make them `async`; update callers in `components/BookingForm.js` and `app/dashboard/page.js` to await.
3. `app/dashboard/page.js`: replace the local `DASHBOARD_PASSWORD` check with `POST /auth/login`; store the returned JWT in `sessionStorage` and send it on every admin request. On 401, kick back to the login gate.
4. Keep the WhatsApp handoff in `BookingForm.onSubmit` exactly as-is — call it only after the POST succeeds.
5. Mirror the price table (`services`, `nailArt`, `areas`, `hairdoAddon`) server-side for the recompute in step (Endpoints).

## Acceptance
- Submitting `/booking` writes a row and still opens WhatsApp.
- `/dashboard` requires the API password, lists real rows, and status/delete persist across devices.
- No payment gateway, no server-side WhatsApp calls.
- `npm run build` passes; API deploys on Railway with the env vars above.
