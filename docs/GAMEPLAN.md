# InfraTrack — Full Game Plan

The detailed reference behind `CLAUDE.md`. Read this once, then work week by week.

---

## 1. Problem & brief objectives (what judges grade)
Urban infrastructure issues (potholes, damaged roads, faulty traffic lights) are reported
late, inconsistently, and scattered across channels — so problems persist and city safety
suffers. InfraTrack closes that gap. How we hit each stated objective:

| Brief objective | How InfraTrack delivers it |
|---|---|
| Improve reporting & tracking of issues | Fast structured report flow + central issue DB + status tracking |
| Speed/reliability of detection | Mobile report in seconds (photo + auto-GPS) + AI auto-triage of severity |
| Clear, structured capture of info | Guided form + AI-normalized type/severity + precise geolocation |
| Reduce delays (occurrence → reporting → response) | Instant reporting, auto-prioritization, authority dashboard for fast action |
| Coordination between stakeholders | Roles, issue assignment, status changes, notifications |
| Transparent status over time | `StatusEvent` history + public issue timeline page |

## 2. Users / roles
- **Citizen** — report an issue (photo, auto-location, category, description); track *my* reports; browse issues nearby on the map; upvote; get notified on status changes.
- **Authority (municipality staff)** — triage dashboard + map; see AI severity; move status (Reported → Acknowledged → In Progress → Resolved); assign; filter/sort; analytics + heatmap.
- **Admin** — manage users/roles and categories. For the MVP, treat as a superset of Authority.

## 3. Feature tiers
**Core (must-have):** auth + roles · photo + GPS report · issue list/detail · Leaflet map color-coded by status/severity · status workflow with full history timeline · authority triage dashboard · "My Reports" + status notifications.

**🏆 Win-makers (the two we commit to):**
- 🤖 **AI photo-severity** — on upload, a vision model returns `{type, severity, confidence}`; auto-fill the form and pre-prioritize.
- 🏛️ **Authority analytics + heatmap** — severity heatmap layer, KPIs (open/resolved counts, **avg resolution time**, worst streets/zones), trend charts (Recharts).

**Cut-first nice-to-haves (only if ahead of schedule):** duplicate-merge by proximity · upvotes drive public-impact priority · AR/FR bilingual · offline report queue (PWA flex).

## 4. Data model (Prisma sketch)
```
User      id, name, email, passwordHash, role(CITIZEN|AUTHORITY|ADMIN), createdAt
Issue     id, title, description, category(enum), status(enum, default REPORTED),
          severity(enum), aiType?, aiSeverity?, aiConfidence?,
          latitude, longitude, address?, photoUrl?,
          reporterId -> User, assignedToId? -> User,
          upvoteCount(default 0), createdAt, updatedAt
StatusEvent  id, issueId -> Issue, fromStatus?, toStatus, note?, changedById -> User, createdAt
Upvote    id, issueId -> Issue, userId -> User, createdAt   // @@unique([issueId, userId])
```
Enums: `Category` (POTHOLE, ROAD_DAMAGE, TRAFFIC_LIGHT, FLOODING, SIGNAGE, OTHER) ·
`Status` (REPORTED, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, REJECTED) ·
`Severity` (LOW, MEDIUM, HIGH, CRITICAL).
*Enums over lookup tables for the MVP — leaner and easier to defend.*

## 5. Architecture (lean, one codebase, two surfaces)
```
infratrack/
  InfraTrack.pdf   official brief / project sheet (moved out of the zip)
  CLAUDE.md        project briefing (auto-loaded by Claude Code)
  client/   Vite + React + Tailwind  (mobile-first PWA + desktop dashboard)
            - React Router, Leaflet map, camera (<input capture>) + Geolocation API
            - vite-plugin-pwa (manifest + service worker)
  server/   Express + Prisma + PostgreSQL (Neon)
            - JWT auth, REST API, photo upload -> Cloudinary
            - POST /issues triggers the vision-API severity call (server-side)
  docs/     GAMEPLAN.md, (later) CODEMAP.md = technical report
```
**API surface (first pass):** `POST /auth/register`, `POST /auth/login`, `GET /me` ·
`POST /issues` (create + AI analyze), `GET /issues` (filters: status, severity, bbox),
`GET /issues/:id`, `PATCH /issues/:id/status` (authority), `POST /issues/:id/upvote` ·
`GET /stats` (KPIs + heatmap points for the dashboard).

**Why fast:** lean Vite bundle, lazy-load the map, no heavy infra (no Redis/queues/headless
browser). Ponytail keeps dependencies minimal.

## 6. The 8-week roadmap (each week ends with the developer able to explain it)
1. **Foundations / walking skeleton** — repo, `client` + `server` wired, Prisma schema v1, create+list one issue end-to-end. Explain the full request flow front → API → DB. Start `CODEMAP.md` + git.
2. **Auth + roles** — register/login, JWT, protected routes, CITIZEN vs AUTHORITY. (Reuse GYM patterns.)
3. **Real reporting** — camera capture + GPS geolocation + category + mobile-first report form; issues persist with photo + location.
4. **The map** — Leaflet + OSM, marker clustering, color by status/severity, issue detail page.
5. **Status workflow + timeline + triage** — `StatusEvent` history, public status timeline, authority dashboard to change status/assign, citizen notifications. (Hits the brief's core objectives head-on.)
6. **🤖 AI photo-severity** — wire the vision API; auto-fill `aiType/aiSeverity/aiConfidence`; pre-prioritize. **Use the `claude-api` skill to spec the model here.**
7. **🏛️ Analytics + heatmap** — KPIs, worst-zones, avg resolution time, Recharts trends, Leaflet heat layer. Make it look like a command center.
8. **Polish + deliver** — PWA install + offline niceties, responsive polish, deploy, write README + technical report (from `CODEMAP.md`), record demo video, run mock-defense drills.

Buffer / nice-to-haves slot into any week finished early; cut ruthlessly if behind.

## 7. "Developer owns it" — the method
- Small slices → explain before/while building → developer teaches it back.
- `CODEMAP.md` (every file → role, plain language) maintained continuously → becomes the technical report.
- Weekly mock-defense questions.
- Git from commit one; clear messages = a story the developer can narrate to judges.

## 8. Demo-day winning notes
- Demo on a **real Tunisian city map** with **real problem photos** — authenticity sells at L3.
- Script the demo: report a pothole on a phone → AI grades it instantly → it appears on the authority heatmap → move it to "In Progress" → citizen gets notified → public timeline updates.
- Lead the technical report with the **objective→feature** table in §1.
