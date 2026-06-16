# InfraTrack — Environment Setup (Phase 0)

The "necessities" to do **before** Week 1 coding, so coding stays pure focus.
Legend: ✅ done · ⬜ needs you · 🔧 I do it when we start Week 1.

## Toolchain
- ✅ Node v22.15 · npm 10.9 · git 2.51 — verified.

## Accounts & secrets (you sign up; nothing is committed — `.env` is git-ignored)

### ⬜ Neon (Postgres) — needed Week 1
1. <https://neon.tech> → sign up (GitHub/Google).
2. **Create project** → name `infratrack`, region **Europe (Frankfurt)** (closest to Tunisia).
3. Open **Connection Details** → turn **off** "Pooled connection" → copy the **direct** `postgresql://...` string.
   *(The direct string avoids `prisma migrate` errors; we add the pooled one later for deploy.)*
4. Hold onto it — Week 1 it goes into `server/.env` as `DATABASE_URL`.

### ⬜ Cloudinary (image storage) — needed Week 3
1. <https://cloudinary.com> → sign up free.
2. Dashboard → **Product Environment Credentials** → note **Cloud name**, **API Key**, **API Secret**.
3. Week 3 these go into `server/.env`.

### ⬜ Vision AI provider — needed Week 6
- We'll spec the exact model with the `claude-api` skill in Week 6; you'll get an API key then. Nothing to do now.

## Repository
- ✅ `git init` + first commit of the planning docs.
- ✅ GitHub: **private** repo created + pushed → <https://github.com/fourchika/infratrack> *(graded deliverable).*

## Data
- ✅ Tunisia **governorate boundaries** downloaded → `server/prisma/data/tunisia-governorates.geojson`
  (geoBoundaries gbOpen ADM1, CC-BY; 24 features; governorate name is in each feature's `properties.shapeName`).
  *Full-resolution (~2.2 MB); can be simplified later for lighter map payloads.*

## Diagrams
- ✅ 7 PlantUML sources in `docs/design/` (see `docs/DESIGN.md` to render/export).
- ⬜ Render each at planttext.com → export PNG into `docs/design/img/` for the technical report.

---

### When all ⬜ above are green, say **"start Week 1"** and I begin the walking skeleton.
