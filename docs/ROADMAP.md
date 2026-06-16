# InfraTrack — 8-Week Roadmap (execution companion to GAMEPLAN.md)

Working app by **Week 5**; differentiators **W6–W7**; **W8** = polish + graded deliverables.
Each week ends in a **runnable, demoable** state. Endpoints are under `/api`.

---

## Week 1 — Walking skeleton + geo-tenancy spine
- **Goal:** create + list an issue end-to-end, attributed to a governorate by point-in-polygon.
- **Build:** `client/` (Vite + React + TS + Tailwind, single page) · `server/` (Express + Prisma + Neon) · schema `User, Governorate, Municipality, Issue` + enums · seed 24 governorates + demo users + 2 sample issues · `@turf/boolean-point-in-polygon` attribution on `POST /api/issues` · `GET /api/issues` (+ `?governorateId=` filter).
- **Endpoints:** `GET /api/health`, `GET /api/issues`, `POST /api/issues`.
- **Diagrams touched:** class, seq-report (subset), state (initial → REPORTED).
- **DoD:** submit with Monastir vs Nabeul coords → correctly attributed → persists across refresh → filter isolates each governorate.

## Week 2 — Auth, roles & jurisdiction scoping
- **Goal:** real accounts; authorities only see their jurisdiction.
- **Build:** register/login, **bcrypt** hashing, **JWT**, auth middleware + role guard · React Router + protected routes + login/register UI · scope `GET /api/issues` by the user's governorate/municipality · "My Reports" · minimal **Admin**: onboard a Municipality (name + boundary) so the table starts filling.
- **Endpoints:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/me`, `POST /api/municipalities` (admin).
- **Diagrams:** use-case (auth, onboard), seq-login, class (User ↔ jurisdiction).
- **DoD:** Monastir authority logs in and sees only Monastir issues; admin onboards a municipality and a matching report now routes to it.

## Week 3 — Real reporting (camera + GPS + photo)
- **Goal:** report from a phone with a real photo and auto-location.
- **Build:** `<input capture="environment">` camera · Geolocation API auto-fill · Cloudinary upload · full mobile-first report form · optional reverse-geocode (Nominatim) → `address`.
- **Diagrams:** seq-report (full), activity (citizen lane).
- **DoD:** on a phone, snap a pothole → photo in Cloudinary, GPS auto-filled, issue saved with photo + address.

## Week 4 — The map
- **Goal:** see issues spatially.
- **Build:** Leaflet + OSM · markers colored by status/severity · clustering · issue **detail page** · "nearby issues" · `GET /api/issues` bbox filter.
- **Diagrams:** use-case (View Map), class (read paths).
- **DoD:** map renders all issues color-coded; clicking a marker opens its detail.

## Week 5 — Status workflow + timeline + triage
- **Goal:** track an issue to resolution, transparently.
- **Build:** `StatusEvent` model + migration · `PATCH /api/issues/:id/status` enforcing the **state machine** · assign to staff · authority **triage dashboard** (filter/sort their jurisdiction) · public **status timeline** · citizen notifications (unseen StatusEvents).
- **Endpoints:** `PATCH /api/issues/:id/status`, `PATCH /api/issues/:id/assign`.
- **Diagrams:** state-issue, activity (authority lane), seq-status.
- **DoD:** authority moves an issue REPORTED → … → RESOLVED, each step logged; citizen sees the timeline + notification. **← app is fully usable here.**

## Week 6 — 🤖 AI photo-severity (win-maker #1)
- **Goal:** the demo "wow" — AI grades the photo.
- **Build:** spec the vision model with the **`claude-api` skill** · server-side `analyze(photoUrl)` → `{aiType, aiSeverity, aiConfidence}` on `POST /api/issues` · auto-fill the form + pre-prioritize · show type/severity/confidence in UI · graceful fallback if AI fails.
- **Diagrams:** seq-report (AI leg), class (ai* fields).
- **DoD:** upload a pothole photo → AI returns severity/confidence → pre-fills the form and influences priority.

## Week 7 — 🏛️ Analytics + heatmap (win-maker #2)
- **Goal:** the "smart city" command center.
- **Build:** `GET /api/stats` (KPIs: open/resolved counts, **avg resolution time**, worst zones/streets) · Recharts trend charts · Leaflet **heatmap** layer (leaflet.heat) · dashboard scoped per jurisdiction.
- **Endpoints:** `GET /api/stats`.
- **Diagrams:** use-case (Analytics).
- **DoD:** dashboard shows live KPIs + severity heatmap + trend charts for the authority's jurisdiction.

## Week 8 — Polish + deliver
- **Goal:** ship + all graded deliverables.
- **Build:** `vite-plugin-pwa` (installable, offline shell; optional offline report queue) · responsive/design polish · **deploy** (Vercel/Netlify front + Railway/Render API + DB) · **README** · **technical report** (from `CODEMAP.md` + `DESIGN.md`, led by the objective→feature table) · **demo video** (scripted: report → AI grades → heatmap → status change → citizen notified → public timeline) · **mock-defense** drills.
- **DoD:** installable PWA live on a public URL; README + report + video done; you can defend any part solo.

---

*Buffer / cut-first nice-to-haves (only if ahead): duplicate-merge by proximity · upvote-driven priority · AR/FR bilingual · richer offline queue.*
