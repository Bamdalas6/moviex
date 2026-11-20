# Deploying Marquee to Cloudflare (free tier)

The app runs on **Cloudflare Workers** through [OpenNext](https://opennext.js.org/cloudflare), with
**Turso** (hosted libSQL/SQLite) as the database and **Cloudflare R2** for community poster uploads.
Every push to `main` on GitHub can deploy automatically.

```
Browser ──▶ Cloudflare Worker (Next.js via OpenNext)
                 ├──▶ Turso database (libsql://…)
                 ├──▶ R2 bucket "moviex-posters" (uploads)
                 └──▶ image.tmdb.org (official posters, loaded by the browser)
GitHub Action (daily) ──▶ TMDB API ──▶ Turso   (film/poster/now-showing refresh)
```

## Free-tier trade-offs (read first)

| Limit (Workers Free) | What it means here |
|---|---|
| ~10 ms CPU per request | Password hashing uses PBKDF2-SHA256 at 20,000 iterations — weaker than the ~600,000 OWASP recommends. On the $5 Workers Paid plan, raise `PASSWORD_ITERATIONS` in `wrangler.jsonc`; existing hashes upgrade at each user's next login. Heavy pages can occasionally exceed the CPU limit — if the dashboard shows "Exceeded CPU" errors, the Paid plan is the fix. |
| 3 MiB compressed Worker | The build output must fit; `npm run cf:build` prints the size. |
| 50 sub-requests per request | Every database query is one. Pages use ~10–30. The TMDB import does not run on Workers (see step 6). |

R2's free tier (10 GB) may still ask for a payment method when you first enable it. Without R2 the
site works; only poster uploads are disabled.

## 1. Create the database (Turso, free)

1. Sign up at <https://turso.tech> and create a database (e.g. `moviex`), in a region close to your users.
2. Copy its **URL** (`libsql://moviex-<you>.turso.io`) and create a **token** for it.
3. On your computer, put them in a file named `.env.production.local` (git-ignored):

   ```
   DATABASE_URL="libsql://moviex-<you>.turso.io"
   DATABASE_AUTH_TOKEN="<token>"
   TMDB_API_KEY="<your TMDB key>"
   ```

4. Create the tables and load the films (PowerShell; `npm.cmd` avoids the script-policy error):

   ```powershell
   $env:DATABASE_URL = "libsql://moviex-<you>.turso.io"; $env:DATABASE_AUTH_TOKEN = "<token>"
   npm.cmd run db:migrate
   npm.cmd run db:import-tmdb
   ```

   Do **not** run `db:seed` against production — it wipes data and creates demo accounts with a public password.

5. Create your admin account (for the moderation queue):

   ```powershell
   $env:ADMIN_EMAIL = "you@example.com"; $env:ADMIN_NAME = "Your Name"; $env:ADMIN_PASSWORD = "<12+ characters>"
   npm.cmd run db:create-admin
   ```

## 2. (Optional) Poster uploads with R2

The site deploys without R2; only community poster uploads are disabled. To enable them:
**R2 → Create bucket → `moviex-posters`** (or `npx wrangler r2 bucket create moviex-posters`), then
uncomment the `r2_buckets` line in `wrangler.jsonc` and push. Don't uncomment it before the bucket
exists — a missing bucket makes every deploy fail.

## 3. Connect the GitHub repo to Cloudflare

1. Dashboard → **Workers & Pages → Create → Workers → Import a repository** → pick `Bamdalas6/moviex`.
   (Choose **Workers**, not **Pages** — Pages can't run this app.)
2. Settings:
   - **Project name:** `moviex` — must match `name` in `wrangler.jsonc`.
   - **Build command:** `npm run build` (the default). On Cloudflare it detects `WORKERS_CI=1` and builds
     the Worker with OpenNext; locally it's a normal `next build`.
   - **Deploy command:** `npx wrangler deploy` (the default).
   - **Root directory:** `/`
3. Save and deploy. The site will show an error page until the secrets below exist — that's expected.

## 4. Add the secrets

Worker → **Settings → Variables and Secrets** (type: *Secret*):

| Name | Value |
|---|---|
| `DATABASE_URL` | your `libsql://…` URL |
| `DATABASE_AUTH_TOKEN` | the Turso token |

Then **Deployments → Retry** (or push a commit). Your site is live at
`https://moviex.<your-subdomain>.workers.dev`; add a custom domain under **Settings → Domains & Routes**.

## 5. Check it

- `https://…/api/health` should return `{"status":"ok"}` (database reachable). If not, its `message`
  says what's wrong (e.g. the `DATABASE_URL` secret is missing).
- Log in with the admin account from step 1.5 and open **/admin**.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Deploy fails: *R2 bucket … not found* / *enable R2* | Comment out `r2_buckets` in `wrangler.jsonc` (see step 2). |
| Deploy fails: *name … does not match* | Project name in Cloudflare must be `moviex`, or change `name` in `wrangler.jsonc`. |
| Deploy fails: *Could not find compiled Open Next config* | The OpenNext build didn't run. Build command must be `npm run build` (or `npx opennextjs-cloudflare build`); the log should show "building the Worker with OpenNext". |
| Site shows an error / health says *DATABASE_URL is not set* | Add both secrets (step 4), then **Retry deployment**. |
| Health says *401* / *unauthorized* | The Turso token is wrong or expired — create a new one and update the secret. |
| Pages work but lists are empty | Run `db:migrate` and `db:import-tmdb` against Turso (step 1.4). |
| "Exceeded CPU" in Worker logs | Free-plan limit; the $5 Workers Paid plan removes it. |

## 6. Keep "In cinemas now" fresh

The workflow in `.github/workflows/tmdb-refresh.yml` re-imports from TMDB every morning. Add these
repository secrets on GitHub (**Settings → Secrets and variables → Actions**):
`DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `TMDB_API_KEY`. Run it once by hand from the **Actions** tab.

## Local preview of the Worker (optional)

`npm run cf:preview` builds and runs the Worker locally with Wrangler. Put the same two secrets in a
`.dev.vars` file (git-ignored). OpenNext's Windows support is limited; if the build fails locally, use
WSL or rely on Cloudflare's build. Regular development stays `npm run dev`.
