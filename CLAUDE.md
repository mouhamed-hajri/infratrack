# InfraTrack — Project Context & Working Agreement

> **You (Claude) are starting fresh on this project. This file is your full briefing.**
> Read `docs/GAMEPLAN.md` for the complete plan, then begin **Week 1** (see "START HERE").

## What this is
- **Competition:** IEEE ISIMM (ISIM Monastir) student-branch challenge — **Level 3 (Advanced)**, category **Smart Cities**. Tagline: *"From explorer to innovator — building the next generation of problem solvers."*
- **Brief:** **InfraTrack** — improve the reporting and tracking of urban infrastructure issues (damaged roads, potholes, faulty traffic lights). Full brief: `InfraTrack.pdf` (in the project root).
- **Duration:** ~2 months / **8 weeks**. **Team: solo** — one human developer + Claude as build partner (no other humans).
- **Deliverables (graded):** MVP · README · Technical report · GitHub repo · Demo video.
- **Why this project:** the developer genuinely cares about the terrible state of Tunisia's roads. Lean into an authentic, local, real-data demo — that passion is a scoring edge at L3.

## ⚠️ The hard rule that shapes EVERYTHING
AI assistance **is allowed** (confirmed with the organizer) — **but judges can ask about ANY part of the code in a live defense, and the developer must explain it SOLO.** Therefore:
- **Comprehension-first, never code-dump.** Build in small slices. Explain *what* and *why* before/while writing. After each slice the developer **teaches it back** in their own words; fix gaps on the spot.
- Maintain **`CODEMAP.md`** from day one — every file → its role, in plain language. It grows into the **Technical Report**.
- Favor **simple, readable, idiomatic** code. No clever abstractions the developer can't defend. (Ponytail is installed globally and enforces minimal code — keep it `/ponytail lite` for the design-heavy frontend if it gets in the way.)
- **Weekly mock-defense drills:** quiz the developer on random parts until nothing surprises them.
- The **developer makes the design calls**; Claude proposes options + a clear recommendation.

## Locked technical decisions
- **Platform:** mobile-first **PWA** (installable web app). ONE codebase serves **citizens on mobile** AND the **municipality dashboard on desktop**. Not native. (L3 platform is open — confirmed.)
- **Frontend:** Vite + React + Tailwind · React Router · **Leaflet + OpenStreetMap** · `vite-plugin-pwa`.
- **Backend:** **Express + Prisma + PostgreSQL** · JWT auth. (Hand-built, not a BaaS — so it's fully defensible.)
- **Database:** **Neon** serverless Postgres (free; just a connection string in `server/.env` → `DATABASE_URL`).
- **Image storage:** Cloudinary.
- **AI win-maker:** server-side **vision API** for photo-severity. Do NOT hardcode a model now — spec it at Week 6 using the `claude-api` skill.
- **Deploy (for demo):** Netlify/Vercel (frontend) + Railway/Render (API + DB).
- **Keep it lean & fast.** The developer hates heavy/slow apps (their old `lawejli` was bloated by Redis/queues/Playwright — none of that here).

## The product in one line
A citizen snaps a road problem (photo + auto-GPS) → **AI grades the severity** → a **municipality command-center** maps, prioritizes, and tracks it to resolution, with a **public status timeline** keeping it transparent.

## Roles
**Citizen** (report + track my reports + nearby issues + notifications) · **Authority/municipality** (triage dashboard, map, status workflow, analytics) · **Admin** (users/roles/categories; superset of Authority for the MVP).

## Win-makers (where 1st place is won)
1. 🤖 **AI photo-severity** — classify damage type + severity + confidence from the photo, auto-fill the form, pre-prioritize. The demo "wow."
2. 🏛️ **Authority heatmap + analytics** — city severity heatmap, KPIs (open/resolved, avg resolution time, worst zones), trends. The "smart city" command center.

## Data model (Prisma) — see GAMEPLAN.md for fields
`User` · `Issue` · `StatusEvent` (powers the transparent timeline) · `Upvote`.

## 8-week roadmap (summary)
1. Walking skeleton (create+list one issue end-to-end) → 2. Auth + roles → 3. Camera + GPS reporting → 4. Leaflet map → 5. Status workflow + timeline + authority triage → 6. 🤖 AI photo-severity → 7. 🏛️ Analytics + heatmap → 8. PWA install + deploy + deliverables (README, technical report, demo video) + mock-defense.
*Working app by Week 5; differentiators 6–7; Week 8 is polish + graded deliverables.*

## ▶️ START HERE (next action)
1. Confirm Node.js is installed. Help the developer create a **free Neon Postgres** project and put its URL in `server/.env` as `DATABASE_URL`.
2. **Week 1 — walking skeleton:** scaffold `client/` (Vite + React + Tailwind) and `server/` (Express + Prisma + Postgres), Prisma schema v1 (`User`, `Issue`), and ONE end-to-end slice: create an issue and list it (no photo/AI yet). Initialize git with clear commits. Start `CODEMAP.md`.
3. Go slice-by-slice, explaining as you build. Have the developer teach each piece back.
