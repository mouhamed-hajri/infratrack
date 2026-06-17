# CODEMAP — InfraTrack

Plain-language map of every file: what it is and why it exists. Maintained from day one;
grows into the technical report. **Status: Week 7** (Command center — analytics, heatmap, AI briefing, dispatch priority).

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
| `src/routes/issues.ts` | All issue endpoints: list, mine, jurisdiction, detail, create, status-change, edit, delete. `POST /analyze-photo` (AI assessment, auth-gated). |
| `src/routes/analytics.ts` | `GET /api/analytics` (KPIs + charts data, role-scoped) + `POST /api/analytics/briefing` (Groq executive summary, on-demand). |
| `src/lib/analyzePhoto.ts` | Sends a base64 image to Groq (llama-4-scout vision) in JSON-mode; returns `{category, severity, confidence, summary, title, description}`. |
| `src/lib/analytics.ts` | Pure analytics engine. `OPEN_STATUSES`, `SLA_HOURS`, `SEVERITY_WEIGHT` constants. `loadScopedIssues` (one DB query, role-scoped). `computeAnalytics` (pure function: KPIs, distributions, weekly buckets, worstZones). |
| `src/lib/briefing.ts` | `generateBriefing(analytics)` — calls Groq `llama-3.3-70b-versatile` JSON-mode for 3-4 sentence executive summary + ≤3 actions. Falls back to deterministic text on any error. |
| `src/index.ts` | Wires Express (CORS, JSON, routes, `/api/health`, JSON error handler), loads boundaries, listens on `:4000`. |

## Client (`client/`)
| File | Role |
|---|---|
| `vite.config.ts` | Vite + React + Tailwind v4 plugin + dev proxy (`/api` → `:4000`). |
| `src/main.tsx` | React entry — renders `<App/>`, imports the stylesheet. (Vite scaffold) |
| `src/index.css` | `@import "tailwindcss";` + page background. |
| `src/lib/api.ts` | Typed `fetch` wrappers for all endpoints. `Issue`, `Analytics`, `BriefingResult` types. `getAnalytics()`, `generateBriefing()`, `analyzePhoto()`. |
| `src/lib/image.ts` | `fileToBase64(file, maxDim)` — canvas resize to 1024px, returns JPEG data URL. |
| `src/lib/severity.ts` | `SEVERITY_COLOR` map + `severityColor(s)` helper; single source of truth for severity hex colors. |
| `src/lib/priority.ts` | `SEVERITY_WEIGHT`, `SLA_HOURS`, `OPEN_STATUSES`, `ageDays`, `isOverdue`, `priorityOf` — mirrors server analytics constants; drives dispatch queue sort + overdue chips. |
| `src/components/ReportForm.tsx` | The report form. On photo select: auto-analyzes with AI, shows `<AiSuggestion>`, pre-fills all fields. |
| `src/components/AiSuggestion.tsx` | Spinner / result / error panel for photo AI analysis. |
| `src/components/AiBriefing.tsx` | On-demand AI executive briefing — idle/loading/done/error states; calls `generateBriefing()` on button click. |
| `src/components/HeatLayer.tsx` | Leaflet heatmap layer (`leaflet.heat`). Uses `useMap()` child pattern; severity-weighted points; cleans up on unmount. |
| `src/components/IssueList.tsx` | Renders issue cards with hover photo popup + overdue chip when `isOverdue(issue)`. |
| `src/App.tsx` | Page layout: form + governorate filter dropdown + list; refreshes the list on create. |

## Design system (`client/src/ui/`) — liquid glass + viz toolkit

| File | Role |
|---|---|
| `ui/Surface.tsx` | Reusable card container — paper background, border ring, light shadow. |
| `ui/Eyebrow.tsx` | Small uppercase label above headings. |
| `ui/Reveal.tsx` | Scroll-triggered fade-in wrapper. |
| `ui/Button.tsx` | Primary action button. |
| `ui/viz/StatCard.tsx` | KPI card — count-up number, ▲▼ week delta chip, optional danger tone. |
| `ui/viz/TrendArea.tsx` | SVG dual-series area chart (reported vs resolved, 8 weeks). Hand-built, zero deps. |
| `ui/viz/BarList.tsx` | Horizontal labeled bar list with animated widths. Used for category, funnel, worst-zones. |
| `ui/viz/Donut.tsx` | CSS `conic-gradient` severity ring + legend. Guards zero-sum. |
| `ui/viz/useCountUp.ts` | rAF count-up hook; skips animation under `prefers-reduced-motion`. |

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
