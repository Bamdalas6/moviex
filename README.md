# Marquee

Discover, rate and review Nollywood and African cinema. A full-stack implementation of the
[Marquee design](https://claude.ai/artifact/BdnW5QZBJ3wfMHRwMBMxAb) (home, onboarding, log in, sign up,
film detail, rate & review, upload, profile, discover, reviews feed — light and dark).

## Stack

| Layer      | Choice                                                                 | Why |
|------------|------------------------------------------------------------------------|-----|
| Framework  | **Next.js 16** (App Router, React Server Components, Server Actions)   | Server-rendered pages, mutations without a hand-written API layer, streaming. |
| Language   | **TypeScript** (strict, `noUncheckedIndexedAccess`)                     | One language end to end; types flow from DB schema to UI. |
| UI         | **React 19**, **Tailwind CSS v4** with semantic design tokens          | `useActionState` / `useOptimistic` for forms and instant feedback. |
| Data       | **Drizzle ORM** on **libSQL/SQLite**                                    | Zero-setup locally; the same driver talks to Turso in production. Typed SQL, versioned migrations. |
| Validation | **Zod 4**                                                               | One schema per form, shared by server actions and tests. |
| Tests      | **Vitest**                                                              | Fast unit tests for validation, hashing and utilities. |

## Getting started

Requires Node 20.9+.

```bash
npm install
cp .env.example .env.local   # then add your TMDB_API_KEY (free)
npm run setup                # migrate + seed (imports 100+ films from TMDB when the key is set)
npm run dev                  # http://localhost:3000
```

### Film data, posters and where to watch

Films, official posters, cast/crew, genres, streaming availability in Nigeria (Netflix, Prime Video,
IrokoTV …, via JustWatch) and the "now showing in Nigerian cinemas" list come from
[TMDB](https://www.themoviedb.org) — get a free key at <https://www.themoviedb.org/settings/api>.

- `npm run db:import-tmdb` refreshes all of this on an existing database without touching ratings,
  reviews or uploads — schedule it daily so the "In cinemas now" list stays current.
- Without a key the seed falls back to a small built-in catalogue with gradient posters.
- The cinema directory (Filmhouse, Genesis, Silverbird, EbonyLife branches) lives in
  `src/server/db/cinema-data.ts`. No public API publishes Nigerian showtimes, so the app links each chain's
  own site for times and tickets rather than inventing them.
- TMDB requires attribution; it's shown on Discover, Cinemas, film pages and `/terms`.

> **Windows PowerShell:** if `npm` fails with *"running scripts is disabled on this system"*, use `npm.cmd`
> instead (e.g. `npm.cmd run dev`), or run the commands from Command Prompt / Git Bash.

Demo accounts (password from `SEED_PASSWORD`, default `marquee-demo-2026`):

- `kemi@marquee.test` — member with reviews, uploads, watchlist and followers
- `admin@marquee.test` — admin; can approve uploads at `/admin`

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm run typecheck` · `lint` · `test` | `tsc --noEmit` · ESLint · Vitest |
| `npm run db:generate` | Generate a migration after editing `src/server/db/schema.ts` |
| `npm run db:migrate` · `db:seed` | Apply migrations · reseed demo data (wipes data) |
| `npm run db:import-tmdb` | Refresh films, posters, streaming and now-showing data from TMDB (keeps community data) |
| `npm run db:reset` | Delete the local SQLite file, migrate and seed |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## Architecture

```
src/
  app/                    Routes (App Router)
    (app)/                Pages with the tab bar: home, discover, films, reviews, upload, u/[username], admin
    (auth)/               Full-bleed pages for signed-out visitors: welcome, login, signup
    api/posters/[key]     Serves uploaded posters (immutable, cache-forever)
    api/health            Liveness + DB readiness probe
  components/             UI — ui/ primitives, layout/, film/, review/, profile/, auth/
  lib/                    Isomorphic code: constants, zod schemas, DTO types, formatting utils
  server/                 Server-only code (guarded by `server-only`)
    db/                   Drizzle schema + connection
    auth/                 Password hashing, DB-backed sessions
    queries/              Read models → DTOs in lib/types.ts
    actions/              Server Actions (all writes)
    storage.ts            Poster storage (local disk; swap for S3/R2)
    rate-limit.ts         Fixed-window limiter for auth and uploads
scripts/                  migrate, seed, reset (run with tsx)
drizzle/                  Generated SQL migrations (commit these)
tests/                    Vitest unit tests
```

Key decisions:

- **Reads in Server Components, writes in Server Actions.** Pages query the database directly through
  `server/queries/*`, which return plain DTOs, so components never depend on the schema. Every mutation is a
  Server Action that re-validates input with Zod and re-checks authorisation, then calls `revalidatePath`.
- **One rating row per user per film.** A score is always present; a body makes it a review. "Rated but not
  reviewed" (the *Waiting for your review* strip) is a query, not a second table that can drift.
- **URL state for filters and tabs** (`/discover?genre=Drama`, `/reviews?feed=top`, `/u/x?tab=activity`):
  shareable, back-button friendly, and rendered on the server.
- **Optimistic UI** for star ratings, helpful votes, follows and the watchlist via `useOptimistic`.
- **Theme without flashing.** Colours are CSS variables (`globals.css`), light/dark follows the system, and an
  explicit choice is stored in a cookie the root layout reads on the server.
- **Moderation.** Uploads start as `pending`, are visible only to their uploader, and go live when an admin approves them.

## Security notes

- Passwords: scrypt (N=2^15) with per-user salt; constant-time compare; dummy hash on unknown emails to avoid
  user enumeration through timing.
- Sessions: 256-bit random token in an `httpOnly`, `SameSite=Lax` (and `Secure` in production) cookie; only
  its SHA-256 is stored, so a database leak can't be replayed. Sliding 30-day expiry; logout revokes server-side.
- Server Actions get Next's built-in Origin check (CSRF). Post-login redirects only allow same-site paths.
- Uploads: type detected from magic bytes (JPEG/PNG/WebP only — no SVG), 20 MB cap, random file names,
  traversal-proof keys, `nosniff` + `default-src 'none'` on the poster route.
- Rate limits on login, sign-up and uploads (in-memory; move to Redis when running several instances).

## Production checklist

- Point `DATABASE_URL`/`DATABASE_AUTH_TOKEN` at Turso (or another libSQL host) and run `npm run db:migrate` on deploy.
- Replace local poster storage in `src/server/storage.ts` with object storage (S3, R2) — the disk is ephemeral on most hosts.
- Swap the in-memory rate limiter for a shared store if you scale horizontally.
- Fill in the `[YOUR COMPANY NAME]` / `[CONTACT EMAIL]` placeholders on `/terms`.
