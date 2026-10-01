# CLAUDE.md — Salia Makeup

Guidance for Claude on this repo. Role = propose and implement; **final decisions
are Wayan's**. When unsure, ask first (keep it short). Casual Indonesian with
Wayan. No fake content (reviews, captions, promises the site doesn't make) —
prefer an empty state over invented data.

## Cahyana standards (repo consistency, all repos)

Shared across CUE, cahyanaui, ubud-private-villas and salia-makeup (Sep 2026).
Where an older note below conflicts with these, THESE win - above all: never push to
`main` without Wayan explicitly saying so. Repo-specific notes below that do not
conflict still apply. Source of truth for style is CUE.

### Working rules

- [ ] Audit first, then fix. Never fix during an audit.
- [ ] Report format: rule, hits/files, where most of it is, likely false positives or keep-as-is.
- [ ] Delete nothing (files, endpoints, components) without Wayan's OK.
- [ ] Push work-order commits to the feature branch `claude/work-tree-validation-vqexsf` as you go (standing approval, that branch is not live). Never push to `main` until Wayan explicitly says so.
- [ ] When a rule cannot be applied cleanly (for example a loop with `return`/`break`), list it separately and do it in its own work order.
- [ ] When a new feature or new site is built, walk Wayan through the QA checklist (QA checklist below) step by step and remind him of small items he may forget.

### Syntax rules (from the finished CUE audit)

- [ ] Standalone named helper functions: plain `function name() {}`. Not `const name = () => {}`.
- [ ] Arrow functions stay for inline callbacks (`.map`, `.forEach`, `.filter`) and short inline event handlers (`onClick={() => {...}}`).
- [ ] Components: `export default function ComponentName()`.
- [ ] Strings: template literals. No `+` concatenation (skip false positives like a phone prefix or a CSS class string).
- [ ] Loops: `forEach` and array methods (`filter`, `find`, `some`, `reduce`, `map`). Exception: `for...of` only when each item must `await` in sequence (for example stop on the first failed submission).
- [ ] Destructure props and multi-property pulls in function parameters by default: `function Card({ title, price })`. Plain dot access is fine for a single simple value or an awkward deeply nested case.
- [ ] Spread operator is the default for copying arrays and objects.
- [ ] Async: `async`/`await`. No `.then()` chains. Exception: fire-and-forget calls that must not be awaited (for example the Resend email send); wrap those in an un-awaited async helper.
- [ ] Conditions: `if`/`else`. No `switch`.
- [ ] Try/catch: every `try` has a `catch`, and the error variable is always named `e`.
- [ ] Naming: camelCase. Descriptive names. No cryptic single letters (`el`, `dt`, `mm`, `q`, `r`, `c`, `t`). Exception: `a`/`b` inside `.sort()` comparators.
- [ ] Comments: one line maximum, placed directly above the tricky line, saying simply what it does. No paragraph or block comments.
- [ ] Components with several props get default values (for example `included = []`) plus a friendly fallback message when data is missing ("Sorry, we could not load this information. Please try again.").
- [ ] Files over about 300 lines: flag for splitting. Pure data files are exempt.

### Stack

Frontend:
- [ ] React, Next.js, Tailwind
- [ ] Zod (validation)
- [ ] Framer Motion (animation)
- [ ] Lucide React (icons)
- [ ] clsx (conditional classes)
- [ ] jspdf (Salia receipts)
- [ ] Forms: hand-rolled validation. Do NOT add React Hook Form (tried and declined).
- [ ] Do NOT install shadcn/ui. Study its structure only. Build Cahyana's own components.

Backend (plain Express, kept simple on purpose):
- [ ] Node, Express, PostgreSQL
- [ ] Helmet, Morgan, Zod, cors

Before adding any library not listed here: ask Wayan first.

### Typography

- [ ] Inter only, for headings and body. No second typeface.
- [ ] Default for every repo and every future site. Follow CUE. Change only when Wayan explicitly asks.

### Animation

- [ ] Framer Motion is the only animation library. Popups, modals, dropdowns, page and section transitions must animate smoothly, not appear abruptly.
- [ ] On every new feature with an interaction, check whether Framer Motion applies. If it does, ask Wayan once: "Should this use Framer Motion?" If yes, add it.
- [ ] Audit `ubud-private-villas` and `salia-makeup` to confirm they consume Framer Motion consistently.
- [ ] Known issue in CUE: some interactions (for example a popup on click) appear abruptly. Flag to Wayan; he will double-check CUE later.
- [ ] Every popup locks background scroll.

### Mobile inputs and popups (standing rules, Oct 2026, brief #16)

- [ ] No iOS zoom when a field is tapped. Every page mounts the iOS-only viewport clamp (`IosZoomFix`: adds `maximum-scale=1` on iPhone and iPad only; Android keeps pinch-zoom; never `user-scalable=no`). Fields under 16px are allowed only while that clamp is mounted in the root layout.
- [ ] Every popup, dialog, modal, drawer, bottom sheet, chat panel and full-screen overlay locks background scroll while open and releases it when closed (`useBodyLock`: a class on both html and body). A popup opened on top of another must not release the lock of the one underneath.
- [ ] New popup = verify in a browser: open it, scroll over it, the page behind must not move; close it, the page scrolls again. Check the iOS clamp on a real iPhone (headless browsers cannot reproduce iOS focus zoom).

### QA checklist (draft: extend it from CUE, then ask Wayan to approve)

Claude Code: read CUE, propose the full checklist, mark each item Must-have or Nice-to-have, and wait for approval. Starting list:

Must-have
- [ ] Payment flow works end to end and matches CUE
- [ ] Favicon and browser tab icon present and correct
- [ ] Font, colors and animation match CUE (typography and animation above)
- [ ] Syntax matches section 3
- [ ] Forms validated front and back (Zod on the backend)
- [ ] Endpoints check ownership (locked, security-by-default)
- [ ] `sitemap.xml` present and correct
- [ ] `robots.txt` present and correct
- [ ] Alt text on every image
- [ ] Unique page title and meta description per page
- [ ] No placeholder content left live (phone numbers, dummy reviews, wrong brand name)

Nice-to-have
- [ ] Structured data (schema) for search engines and AI systems (GEO)
- [ ] Open Graph / social share preview
- [ ] Image sizes set (width/height) to avoid layout shift; WebP images
- [ ] Lighthouse check, mobile and desktop
- [ ] Google Search Console verified

## Project
- Booking site for **Salia Makeup** — make up, hairdo & nail art, Denpasar area.
- This repo is the **frontend only**. The backend is a **separate repo**,
  `salia-makeup-api` (Express + Postgres, Railway) — same split as CUE /
  cahyana-api. The frontend is served publicly, so the backend stays out of it.
- Booking ends in a **WhatsApp handoff** on the client. **No payment gateway**,
  **no server-side WhatsApp** — the site just opens `wa.me` after the POST succeeds.

## Stack & structure
- **Frontend** (this repo) = Next.js 16 + React 19 (App Router), Tailwind 3,
  react-hook-form, lucide-react.
  Moving to the shared stack (Cahyana standards above): react-hook-form is being
  removed, Tailwind 3 -> 4 is its own migration work order, and Framer Motion goes
  in per popup only after Wayan says yes to each one. Pages in `app/`, components in `components/`,
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
