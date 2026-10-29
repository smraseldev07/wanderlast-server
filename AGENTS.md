# wanderlast-server

## Commands

- Run the server: `node index.js` — there are **no** npm scripts for start/dev/test; `npm start` and `npm test` fail (test script intentionally exits 1).
- No lint, typecheck, or test tooling exists. Quick sanity check: `node --check index.js`.
- Setup: `npm install`, then a local `.env` containing `MONGODB_URI=<connection string>` (must create it — it is gitignored and not committed). dotenv is loaded via `import 'dotenv/config'` in `index.js`.

## How it works

- The entire app lives in `index.js` — Mongo connection, collections, and all routes. `"type": "module"` is set, so use ESM (`import`/`export`), not `require`.
- On startup the process **top-level-awaits** a MongoDB connection (`wanderlast` database) before creating routes; with a missing/invalid `MONGODB_URI` or unreachable DB it crashes (or dead-ends) before serving. An agent verifying changes needs a reachable MongoDB — integration testing is not possible otherwise.
- Express **5** (not 4) — route syntax must be Express 5 compatible; the first registered route wins over later duplicates.

## Route quirks (verified in index.js)

- `POST /destination` deceptively inserts into the **`bookings`** collection, not `destination`. Destinations are created via `POST /add-destination`.
- Documents have dual identities: Mongo `_id` and an app-generated `id` (UUID). `GET /destinations/:id` and the working `PATCH /destinations/:id` choose them via a 24-hex-char check. Body `id` is stripped on PATCH to avoid overwriting identity (see inline comment in index.js) — preserve that.
- There are **two** `PATCH /destinations/:id` definitions; the second (only `_id`-matching, no `id` removal) is dead code — don't "fix" the live behavior by editing the second one.
- Port is hardcoded to `5000` (`const port`), not read from env.
