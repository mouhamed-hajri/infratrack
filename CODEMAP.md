# CODEMAP — InfraTrack

Plain-language map of every file: what it is and why it exists. Maintained from day one;
grows into the technical report. **Status: Week 6** (AI photo-severity — Groq vision classifies damage).

## The request flow (how it all connects)
```
Browser (React PWA)  →  /api/...  →  Express  →  Prisma  →  Neon Postgres  →  back
                     (Vite dev proxy)
```
On `POST /api/issues`, the report's `(lat,lng)` is stamped with its **governorate** by
point-in-polygon — deterministic, computed server-side at creation time.

## Repository layout
- `client/` — the front end (Vite + React + TypeScript + Tailwind v4)
- `server/` — the REST API (Express + Prisma + PostgreSQL)
- `docs/` — design (UML), roadmap, setup, gameplan
- `UML/` — exported diagram images
- `CLAUDE.md` — project briefing · `InfraTrack.pdf` — the official brief

## Server (`server/`)
| File | Role |
|---|---|
| `package.json` | ESM project. Scripts: `dev` (tsx watch), `migrate`, `seed`, `studio`. |
| `.env` | `DATABASE_URL` (Neon) + `PORT`. **Git-ignored** — never committed. |
| `.env.example` | Template showing the env vars without secrets. |
| `tsconfig.json` | TypeScript config (strict, ESM/Bundler). `tsx` runs TS directly — no dev build step. |
| `prisma/schema.prisma` | The DB schema: models `User, Governorate, Municipality, Issue` + enums `Role, Category, Status, Severity`. Source of truth for the DB and the generated Prisma client. |
| `prisma/migrations/` | SQL migration history (the `init` migration that created the tables). Committed. |
| `prisma/data/tunisia-governorates.geojson` | 24 governorate boundary polygons (geoBoundaries, CC-BY). Read by the seed. |
| `prisma/seed.ts` | Seeds the 24 governorates, a demo citizen + demo authority, and 2 sample issues. Idempotent (upserts + count guard). |
| `src/db.ts` | The single shared Prisma client. |
| `src/geo.ts` | Loads boundaries into memory at startup; `attribute(lat,lng)` → `{governorateId, municipalityId}` via `@turf/boolean-point-in-polygon`. **GeoJSON/Turf use `[lng, lat]` order.** |
| `src/routes/issues.ts` | All issue endpoints: list, mine, jurisdiction, detail, create, status-change, edit, delete. New: `POST /analyze-photo` (AI assessment, auth-gated). |
| `src/lib/analyzePhoto.ts` | Sends a base64 image to Groq (llama-4-scout vision) in JSON-mode; returns `{category, severity, confidence, summary}`. Validates/clamps all AI output before returning. |
| `src/index.ts` | Wires Express (CORS, JSON, routes, `/api/health`, JSON error handler), loads boundaries, listens on `:4000`. |

## Client (`client/`)
| File | Role |
|---|---|
| `vite.config.ts` | Vite + React + Tailwind v4 plugin + dev proxy (`/api` → `:4000`). |
| `src/main.tsx` | React entry — renders `<App/>`, imports the stylesheet. (Vite scaffold) |
| `src/index.css` | `@import "tailwindcss";` + page background. |
| `src/lib/api.ts` | Typed `fetch` wrappers for all endpoints. `Issue` type includes `ai*` fields. `analyzePhoto(file)` sends to the server endpoint. |
| `src/lib/image.ts` | `fileToBase64(file, maxDim)` — canvas resize to 1024px, returns JPEG data URL. Used before sending to the AI endpoint. |
| `src/lib/severity.ts` | `SEVERITY_COLOR` map + `severityColor(s)` helper; single source of truth for severity hex colors. |
| `src/components/ReportForm.tsx` | The report form. On photo select: auto-analyzes with AI, shows `<AiSuggestion>`, pre-fills category + severity. Gracefully degrades on error. |
| `src/components/AiSuggestion.tsx` | Presentational panel: shows spinner while analyzing; confidence + category + summary when done; gentle error note on failure. |
| `src/components/IssueList.tsx` | Renders issue cards (title, severity badge, category, status, attributed governorate). |
| `src/App.tsx` | Page layout: form + governorate filter dropdown + list; refreshes the list on create. |

## Design system (`client/src/ui/`) — liquid glass
The premium "liquid glass" look (per the design brief). **Reuse these across the whole project.**

| File | Role |
|---|---|
| `ui/GlassProvider.tsx` | Wraps the app; shares (via context) the page element all glass tracks the mouse against. |
| `ui/Background.tsx` | Fixed dark gradient + 3 drifting blurred orbs (blue / violet / cyan) that the glass refracts. |
| `ui/GlassButton.tsx` | True `LiquidGlass` pill button — hero CTAs only (standalone, never nested). |
| `ui/GlassCard.tsx` | True `LiquidGlass` card — hero stat + feature cards. |
| `ui/Nav.tsx`, `ui/Footer.tsx` | Full-width **CSS-glass** strips (`backdrop-blur`). |
| `.glass` / `.glass-btn` (in `index.css`) | CSS glassmorphism for any container/button that holds other elements. |

**Rule of thumb (a real `liquid-glass-react` constraint):** use true `LiquidGlass` only for *standalone* showcase surfaces. It **cannot be nested** (glass-inside-glass breaks rendering) and a `LiquidGlass` strip won't reliably stretch full-width — so nav, form, footer, and list cards use the lighter `.glass` / `.glass-btn` CSS instead. Same look, faster on mobile, cross-browser. `prefers-reduced-motion` freezes the orbs. Entrance animations: framer-motion fade-up on scroll per section.

## Key design decisions (Week 1)
- **Geo-attribution is deterministic, not AI.** Which jurisdiction owns a report is an authorization boundary → computed by point-in-polygon, never by an LLM. (AI is reserved for *photo-severity* in Week 6.)
- **Two-level jurisdiction with fallback.** `governorateId` is always set (24 governorates cover all of Tunisia); `municipalityId` is set only when an onboarded municipality contains the point. None onboarded yet → every report routes to its governorate.
- **Prisma 6, not 7.** Prisma 7 requires driver adapters + a `prisma.config.ts`; v6's `url = env("DATABASE_URL")` model is simpler to read and defend for an MVP.
- **No auth yet.** Week 2 adds JWT + bcrypt and scopes the issue list per jurisdiction (a `WHERE` clause).

## Run it
1. Ensure `server/.env` has `DATABASE_URL`. From `server/`: `npm install` → `npm run migrate` → `npm run seed` → `npm run dev` (API on `:4000`).
2. From `client/`: `npm install` → `npm run dev` (app on `:5173`). Open <http://localhost:5173>.
3. Clean slate: from `server/`, `npx prisma migrate reset` (drops, re-applies, re-seeds), then restart the server.
