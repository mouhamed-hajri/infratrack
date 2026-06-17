# InfraTrack — Visual Redesign Plan ("Civic Editorial")

> **Status: PLAN ONLY. Do not execute until the developer says go.**
> This document is written so that **Sonnet 4.6 can execute it end-to-end with zero design guesswork.**
> Every token, file, and hard technique is specified. Where a step is subtle, there is a **▶ WHY / HOW** block.
> Skill basis: `high-end-visual-design` (Awwwards-tier) + `redesign-existing-projects` (audit-first).

---

## 0. Diagnosis — why the current design reads as "AI slop"

Audited against `redesign-existing-projects`. The current build hits the three biggest AI fingerprints at once:

| Current | Why it's slop | Verdict |
|---|---|---|
| Dark cinematic bg + drifting neon orbs | Generic "AI/crypto startup" texture; wrong trust signal for a civic app | **Remove** |
| Purple→blue gradient (`#4f8ef7`→`#a78bfa`) | The single most common AI design fingerprint (the audit names it explicitly) | **Remove** |
| `liquid-glass-react` everywhere | Black-box GPU-heavy SVG displacement; breaks on iOS Safari; **undefensible in a live viva** (dev didn't write it); the lag you felt | **Remove dependency** |
| System font stack | No typographic character | **Replace** |
| Centered symmetric hero + 3 equal feature cards | The two most generic AI layouts | **Replace** |

**The core decision: we drop `liquid-glass-react` completely.** It is simultaneously the source of the slop look, the lag, *and* a dependency you cannot defend to judges. Everything it did is replaced by hand-written, fully-explainable components (~80 lines of CSS/React you own).

---

## 1. The direction — "Civic Editorial"

A warm, light, editorial, **trustworthy** interface with a Tunisian-Mediterranean identity. Not a dark tech demo — a civic instrument citizens trust and a command center authorities respect.

**Archetypes selected** (from `high-end-visual-design` §3):
- **Vibe:** *Editorial Luxury* (warm paper base, variable **serif** display, film-grain texture) blended with *Soft Structuralism* (ultra-diffuse ambient shadows, airy floating components).
- **Layout:** *Editorial Split* hero (massive type left, live data right) → *Asymmetric Bento* for content. Collapses to a single clean column on mobile.

**Why this direction (defensible one-liner for the viva):** "A pothole-reporting app is a civic-trust product, so I moved from a dark 'tech demo' look to a warm, editorial, paper-like interface — lighter to read in sunlight on a phone, and it signals officialdom without feeling cold."

---

## 2. Design tokens (the single source of truth)

These live in `client/src/index.css` inside Tailwind v4's `@theme` block (see §4, Hard Part A). **All components consume these tokens — no raw hex anywhere else.**

### 2.1 Color
```
/* Surfaces — warm paper, never pure white/black */
--color-paper:      #FAF6EF   /* page base */
--color-paper-2:    #F2EBDF   /* alternating section / sunken wells */
--color-card:       #FFFDF8   /* raised surface (slightly lighter than paper) */

/* Ink — warm near-black, never #000 */
--color-ink:        #1C1A17   /* headings + primary text */
--color-ink-soft:   #57514733 /* hairline borders (ink @ ~20%) */
--color-muted:      #6B6356   /* secondary text */

/* Brand — deep Mediterranean petrol. Distinct from AI blue; OUTSIDE the severity color lane. */
--color-brand:      #0F5C5B
--color-brand-deep: #0A4544
--color-brand-tint: #0F5C5B14 /* ~8% wash for chips/hovers */

/* Warm secondary accent — Tunisian clay. Use SPARINGLY: eyebrows, underlines, focus. */
--color-clay:       #C4622D
```

### 2.2 Severity (semantic, desaturated to sit on warm paper)
Kept in their own lane so brand teal never collides with status meaning.
```
LOW       text #3F7D5B   bg #3F7D5B14   (sage)
MEDIUM    text #B8861E   bg #B8861E14   (ochre)
HIGH      text #C4622D   bg #C4622D17   (clay)
CRITICAL  text #A8321F   bg #A8321F17   (brick)
```

### 2.3 Typography
- **Display (headings, the live stat):** `Fraunces Variable` — warm editorial serif, optical sizing, real character.
- **UI / body:** `Plus Jakarta Sans Variable` — clean modern grotesk (allowed by the skill; **definitely exists on Fontsource** — no import hallucination).
- Numbers/coords: `font-variant-numeric: tabular-nums`.
- Headings: sentence case, tracking `-0.02em`. Body max width ~65ch, line-height 1.6.
- `text-wrap: balance` on headings, `pretty` on paragraphs (kills orphans).

> ▶ Optional swap: Geist is also skill-approved. We use Plus Jakarta Sans because its Fontsource-variable package is guaranteed to exist; swapping later is a one-line change.

### 2.4 Spacing, radius, shadow, motion
```
Section padding:  py-24 (mobile) → md:py-32 → lg:py-40   /* breathe heavily */
Container:        max-w-[1200px] mx-auto px-5 md:px-8
Radius:           cards rounded-[1.75rem] · inner rounded-[1.375rem] · pills rounded-full · inputs rounded-2xl
Shadow (tinted, ultra-diffuse, warm — NEVER pure black):
  --shadow-soft:  0 1px 2px rgba(40,30,15,.04), 0 12px 32px -12px rgba(40,30,15,.12)
  --shadow-lift:  0 2px 4px rgba(40,30,15,.05), 0 24px 56px -16px rgba(40,30,15,.16)
Motion easing:    --ease-fluid: cubic-bezier(0.32,0.72,0,1)   /* the ONE easing we use */
  durations:      micro 200ms · hover 300ms · reveal 800ms
```

---

## 3. New file tree (client/src)

```
src/
  index.css            REWRITE  — @theme tokens, fonts, base, grain, severity utilities
  main.tsx             EDIT     — add 2 font imports (one line each)
  App.tsx              REWRITE  — new composition, mobile-first
  ui/
    Background.tsx      REWRITE  — ambient warm gradient + fixed grain (no orbs)
    Surface.tsx         NEW      — double-bezel card (replaces GlassCard)
    Button.tsx          NEW      — pill + button-in-button icon (replaces GlassButton)
    Eyebrow.tsx         NEW      — pill micro-label above headings
    Reveal.tsx          NEW      — framer-motion scroll-reveal wrapper (reduced-motion safe)
    Nav.tsx             REWRITE  — floating "island" pill, desktop only
    BottomNav.tsx       EDIT     — restyle to new tokens (keep structure)
    Footer.tsx          REWRITE  — simplified, 1 row, tokens
    GlassProvider.tsx   DELETE
    GlassButton.tsx     DELETE
    GlassCard.tsx       DELETE
  components/
    ReportForm.tsx      REWRITE  — editorial form: choice-chips + segmented severity
    IssueList.tsx       REWRITE  — asymmetric list, severity rail, tokens
    SeverityBadge.tsx   NEW      — single source for severity pills (used by list + form)
```

**Dependency changes** (`client/`):
```
REMOVE:  liquid-glass-react
ADD:     @fontsource-variable/fraunces   @fontsource-variable/plus-jakarta-sans
```
> ▶ After removing `liquid-glass-react`, grep the repo for any lingering `import ... 'liquid-glass-react'` and `useGlassContainer` — there must be **zero** before build.

---

## 4. HARD PARTS — detailed, so execution is flawless

### ▶ Hard Part A — Tailwind v4 theme tokens (CSS-first config)
Tailwind v4 has **no `tailwind.config.js`**. Tokens are declared in CSS and become utilities automatically (`--color-brand` → `bg-brand`, `text-brand`; `--font-display` → `font-display`).

`index.css` top:
```css
@import "tailwindcss";

@theme {
  --color-paper: #FAF6EF;
  --color-paper-2: #F2EBDF;
  --color-card: #FFFDF8;
  --color-ink: #1C1A17;
  --color-muted: #6B6356;
  --color-brand: #0F5C5B;
  --color-brand-deep: #0A4544;
  --color-clay: #C4622D;

  --font-display: "Fraunces Variable", ui-serif, Georgia, serif;
  --font-sans: "Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif;

  --ease-fluid: cubic-bezier(0.32, 0.72, 0, 1);
}
```
> **Gotcha:** custom easing as a `--ease-*` theme var is *not* auto-mapped to a utility in v4. Use it via arbitrary value: `ease-[cubic-bezier(0.32,0.72,0,1)]`, or define a small `.ease-fluid{transition-timing-function:var(--ease-fluid)}` helper. Prefer the arbitrary value inline so it's self-documenting.

### ▶ Hard Part B — Self-hosted variable fonts (offline-ready, defensible)
Self-host via Fontsource so the PWA works offline and makes no third-party request (good for the viva + Week 8 PWA).

Install: `npm i @fontsource-variable/fraunces @fontsource-variable/plus-jakarta-sans`

`main.tsx` (add **above** `import './index.css'`):
```ts
import '@fontsource-variable/fraunces'
import '@fontsource-variable/plus-jakarta-sans'
```
Then in `index.css` base layer:
```css
body { font-family: var(--font-sans); background: var(--color-paper); color: var(--color-ink); }
h1, h2, h3 { font-family: var(--font-display); letter-spacing: -0.02em; text-wrap: balance; }
p { text-wrap: pretty; }
```
> **Family-name gotcha:** the variable family names are exactly `"Fraunces Variable"` and `"Plus Jakarta Sans Variable"`. Wrong name = silent fallback to serif/sans. Verify by inspecting a heading in DevTools after wiring.

### ▶ Hard Part C — The Double-Bezel surface (concentric radii)
The premium "machined hardware" look: an outer tray holding an inner plate, with **mathematically concentric corners**. Rule: `inner_radius = outer_radius − padding`.

We use outer `1.75rem`, padding `0.375rem` (`p-1.5`) → inner `1.375rem`. `Surface.tsx`:
```tsx
import type { ReactNode } from 'react'

// Double-bezel "machined" surface. Outer tray + inner plate with concentric radii.
// inner_radius = outer_radius - padding  →  1.75rem - 0.375rem = 1.375rem
export function Surface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="rounded-[1.75rem] bg-paper-2/60 p-1.5 ring-1 ring-ink/5 shadow-[0_1px_2px_rgba(40,30,15,.04),0_12px_32px_-12px_rgba(40,30,15,.12)]">
      <div className={`rounded-[1.375rem] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,.6)] ${className}`}>
        {children}
      </div>
    </div>
  )
}
```
> **WHY two layers:** the inset white highlight on the inner plate + the diffuse outer shadow simulate a real edge catching light. A single flat card can't. **Don't nest a Surface inside a Surface** (double tray looks wrong) — same discipline the old glass had, but now it's honest CSS.
> `bg-paper-2/60` needs `paper-2` in `@theme` (add `--color-paper-2`). The `/60` opacity utility works on theme colors in v4.

### ▶ Hard Part D — Ambient background + film grain (perf-safe)
Replaces the orb `Background.tsx`. **Fixed, `pointer-events-none`, behind everything.** Grain is an inline SVG `feTurbulence` data-URI (no asset file, no network).

```tsx
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {/* warm ambient wash — static, no animation, no blur on scroll content */}
      <div className="absolute inset-0 bg-paper" />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60% 50% at 15% 0%, #0F5C5B12 0%, transparent 60%),' +
            'radial-gradient(50% 40% at 100% 20%, #C4622D10 0%, transparent 55%)',
        }}
      />
      {/* film grain — fixed overlay only */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
```
> **Perf rule honored** (`high-end-visual-design` §6): grain/gradient sit on a *fixed* layer, never on scrolling containers, so no repaint storms. This is what fixed the lag — the old orbs animated `transform` on 3 huge `blur(120px)` layers; this animates nothing.

### ▶ Hard Part E — Button: pill + "button-in-button" + magnetic hover
The CTA pattern from the skill (§4B, §5B). Trailing icon lives in its own circle; whole button presses; inner circle drifts on hover.
```tsx
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'ghost'
  icon?: boolean            // show the nested arrow circle
}

export function Button({ children, onClick, type = 'button', variant = 'primary', icon = true }: Props) {
  const base =
    'group inline-flex items-center gap-3 rounded-full pl-6 pr-2 py-2 text-sm font-medium ' +
    'transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/60'
  const skin =
    variant === 'primary'
      ? 'bg-brand text-paper hover:bg-brand-deep shadow-[0_2px_4px_rgba(40,30,15,.05),0_16px_40px_-16px_rgba(15,92,91,.5)]'
      : 'bg-transparent text-ink ring-1 ring-ink/15 hover:ring-ink/30'
  return (
    <button type={type} onClick={onClick} className={`${base} ${skin}`}>
      <span className="py-1">{children}</span>
      {icon && (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] ${
            variant === 'primary' ? 'bg-paper/15' : 'bg-ink/5'
          }`}
        >
          {/* ultra-light arrow, not Lucide */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      )}
    </button>
  )
}
```
> **Optical detail:** right padding is `pr-2` (not `pr-6`) so the 32px icon circle sits flush inside the pill — that asymmetry is the "island button" signature. Don't symmetrize it.

### ▶ Hard Part F — Reveal: scroll entry (reduced-motion safe)
One wrapper, used everywhere. Heavy fade-up + blur clearing, stagger by `delay`. Respects `prefers-reduced-motion` (renders static).
```tsx
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  )
}
```
> **GPU rule:** only `opacity`, `transform` (`y`), and `filter` animate — never layout props. Stagger a list by passing `delay={i * 0.06}`.

### ▶ Hard Part G — Severity as one shared component
Kills ad-hoc badge classes scattered across files (the old `severityStyle` map duplicated intent). `SeverityBadge.tsx`:
```tsx
const MAP: Record<string, { fg: string; bg: string }> = {
  LOW:      { fg: '#3F7D5B', bg: '#3F7D5B14' },
  MEDIUM:   { fg: '#B8861E', bg: '#B8861E14' },
  HIGH:     { fg: '#C4622D', bg: '#C4622D17' },
  CRITICAL: { fg: '#A8321F', bg: '#A8321F17' },
}
export function SeverityBadge({ severity }: { severity: string }) {
  const s = MAP[severity] ?? { fg: '#6B6356', bg: '#6B635614' }
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: s.fg, backgroundColor: s.bg }}
    >
      {severity}
    </span>
  )
}
```
> **Square-ish badge** (`rounded-md`), not a pill — the audit flags pill "New/Beta" badges as generic. The CTA is the only `rounded-full` thing.

### ▶ Hard Part H — Mobile-first collapse rules (write base = mobile, enhance with md:)
The old code was desktop-first (`text-7xl` then shrunk). **Invert it.** Authoring order is mobile → `md:` → `lg:`.
- Hero: base = single column, headline `text-4xl`, stat card stacks **below** the copy. `md:` = `grid-cols-2`, headline `md:text-6xl lg:text-7xl`, stat sits right.
- Bento/features: base `grid-cols-1 gap-4`; `md:grid-cols-12` with explicit `col-span`s for the asymmetric layout. Every `col-span-*` must reset implicitly at base (don't set them below `md:`).
- Never `h-screen`; use `min-h-[100dvh]` for any full-height block (iOS Safari).
- Below `md:`: Nav (island pill) hidden, `BottomNav` shown. Above `md:`: reverse.

### ▶ Hard Part I — The Report form (citizen's core action — make it the centerpiece)
This is the one screen judges will watch most. Replace raw `<select>`s with tactile controls; keep it 100% defensible (plain React state, no libs).
- Wrap the whole form in a `Surface`.
- **Category** → a 6-button **choice-chip grid** (`grid-cols-2 sm:grid-cols-3`), selected chip gets `bg-brand text-paper`, others `ring-1 ring-ink/15`. State stays the same `category` string.
- **Severity** → a 4-segment **segmented control** (single row of buttons), selected uses that severity's own color tokens from §2.2.
- **Title / description** → large inputs, `bg-paper-2/50`, `rounded-2xl`, focus ring `ring-clay/50`, generous `px-4 py-3.5`.
- **Lat/Lng** → keep the two number inputs for now, label them "Location (auto-filled in Week 3)" and show them in `font-variant-numeric: tabular-nums`. (Week 3 swaps in Geolocation; the layout already fits.)
- **Submit** → primary `Button` with the arrow circle; disabled shows "Submitting…".
- **Error** → inline, `text-[#A8321F]` on `bg-[#A8321F12]`, no `window.alert`, no "Oops!".
> Keep the exact `createIssue`/`NewIssue` contract from `src/lib/api.ts` — fields `title, description, category, severity, latitude, longitude`. **Do not change the API surface.**

### ▶ Hard Part J — Nav (floating island) + BottomNav
- **Nav (md+ only):** a floating glass-free pill detached from the top — `fixed top-4 inset-x-0 mx-auto w-max`, `rounded-full bg-card/80 backdrop-blur-md ring-1 ring-ink/10 shadow-soft`, links + a primary `Button`. `backdrop-blur` is allowed here (fixed element, perf rule respected).
- **BottomNav (mobile only):** keep current structure; restyle to `bg-card/90 backdrop-blur-md`, active tab `text-brand`, inactive `text-muted`. Keep `pb-safe`.

---

## 5. Page composition (App.tsx)

Mobile-first sections, each wrapped in `Reveal`, container `max-w-[1200px] mx-auto px-5 md:px-8`:

1. **Background** (fixed) + **Nav** (md+) + **BottomNav** (mobile).
2. **Hero — Editorial Split.**
   - Left: `Eyebrow` ("Tunisia · Smart Cities") → H1 in Fraunces, e.g. *"Report the road. Track the fix."* (sentence case, balanced) → one muted paragraph (≤65ch) → primary `Button` ("Report an issue", arrow) + ghost `Button` ("See the map").
   - Right: a `Surface` "live" panel — big Fraunces number (`issues.length`, tabular-nums), "issues tracked", "across 24 governorates", a tiny pulse dot. On mobile it stacks **below** the copy.
3. **How it works — Asymmetric Bento** (`md:grid-cols-12`): three steps as varied-size `Surface` cards (e.g. `md:col-span-7`, `md:col-span-5`, `md:col-span-12` or a 5/7 split), each with a light line-icon, step number in clay, title (Fraunces), one line of copy. **Not** 3 equal columns.
4. **Report — the form** (`Hard Part I`), in a `max-w-2xl` block, eyebrow + H2 above.
5. **Issues — asymmetric list:** section header H2 + the governorate filter (restyled `<select>` → see note) on one row (`flex-wrap`); then `IssueList`. Each issue card: a left **severity color rail** (a 3px tinted bar), title (Fraunces sm), description (muted), and a meta row (category · status · 📍 governorate/municipality). Cards `bg-card ring-1 ring-ink/5 rounded-2xl shadow-soft`, hover `-translate-y-0.5` with `ease-fluid`. Layout `grid gap-4 md:grid-cols-2`; optionally make the first/critical card `md:col-span-2` for rhythm.
6. **Footer:** one row, `Infra` + brand-colored `Track`, a line of copy, "Built for IEEE ISIMM". `border-t border-ink/10`.
> Filter `<select>` restyle: `rounded-full bg-card ring-1 ring-ink/15 px-4 py-2 text-sm`. Keep native select for accessibility + zero deps (defensible). Option bg uses `bg-card`.

---

## 6. Execution order (phased — each phase compiles & looks intentional)

Run in this order (mirrors the skill's Fix Priority: tokens/fonts first = biggest win, lowest risk):

| Phase | Do | Done-when |
|---|---|---|
| **P1 Tokens + fonts** | Rewrite `index.css` (@theme, base, severity helpers); add font imports to `main.tsx`; `npm i` fonts, `npm rm liquid-glass-react` | App boots on warm paper, Fraunces visible in a test `<h1>`, no console font fallback |
| **P2 Background** | Rewrite `Background.tsx` (gradient + grain); delete orb CSS from `index.css` | Warm ambient bg, subtle grain, **zero** animation jank |
| **P3 Primitives** | Add `Surface`, `Button`, `Eyebrow`, `Reveal`, `SeverityBadge`; delete `GlassProvider/GlassButton/GlassCard` | All five render in isolation; no `liquid-glass-react` imports remain (grep = 0) |
| **P4 Shell** | Rewrite `Nav` (island), restyle `BottomNav`, rewrite `Footer` | Desktop island pill; mobile bottom bar; both on tokens |
| **P5 Hero + Bento** | Rewrite `App.tsx` hero + how-it-works | Editorial split on desktop, clean stack on mobile, reveals fire once |
| **P6 Form** | Rewrite `ReportForm` (chips + segmented severity), wire `SeverityBadge` | Submit still calls `createIssue` unchanged; create→list refresh works |
| **P7 List** | Rewrite `IssueList` (severity rail, asymmetric grid) | Filter works; cards match the language; hover springy |
| **P8 Sweep** | grep dead imports; `npx tsc --noEmit`; mobile (390×844) + desktop pass; run `/graphify . --update` | tsc clean, no slop checklist item fails, graph updated |

> After P8, **update `CODEMAP.md`**: replace the "liquid glass" design-system section with the "Civic Editorial" kit (Surface/Button/Eyebrow/Reveal/SeverityBadge + tokens), and note `liquid-glass-react` was removed and *why* (defensibility + perf). This feeds the technical report.

---

## 7. PRE-FLIGHT CHECKLIST (Sonnet self-checks before declaring done)

From `high-end-visual-design` §8 + `redesign-existing-projects`, tuned to this app:
- [ ] No banned fonts (Inter/Roboto/system) — Fraunces + Plus Jakarta Sans wired and rendering.
- [ ] No purple/blue AI gradient anywhere; brand is petrol teal; one accent (clay) used sparingly.
- [ ] `liquid-glass-react` removed from `package.json`; grep for it + `useGlassContainer` returns nothing.
- [ ] Every card uses `Surface` (double-bezel) or the list-card token recipe — no flat `border+shadow+white`.
- [ ] CTA uses button-in-button arrow; `active:scale-[0.98]`; magnetic icon drift on hover.
- [ ] Section padding ≥ `py-24`; layout breathes.
- [ ] All transitions use `ease-[cubic-bezier(0.32,0.72,0,1)]` — no `linear`/`ease-in-out`/instant.
- [ ] `Reveal` on each section; nothing pops in statically; `prefers-reduced-motion` renders static.
- [ ] Mobile-first authoring; collapses to one column `w-full px-5` < `md`; `min-h-[100dvh]` not `h-screen`.
- [ ] Only `transform`/`opacity`/`filter` animate; `backdrop-blur` only on fixed Nav/BottomNav.
- [ ] Severity colors only via `SeverityBadge`/rail; never collide with brand.
- [ ] Form posts the unchanged `NewIssue` shape; create→refresh→list still works.
- [ ] `npx tsc --noEmit` clean; no dead/commented code; favicon still set.
- [ ] Reads as "$150k civic product", not "template with nicer fonts".

---

## 8. Guardrails (do NOT break these)
- **Don't touch** `src/lib/api.ts` contracts, the Vite proxy, or anything under `server/`. This is a **visual** redesign.
- **Don't add** state/data libraries, UI kits, icon packs, or a CSS-in-JS lib. Hand-written + Tailwind v4 + framer-motion (already present) only. (Ponytail.)
- **Don't migrate** Tailwind versions — this is v4, config is CSS-first.
- Keep components small and explainable — the dev must defend every line solo.
- Real copy only — no Lorem Ipsum, no "Elevate/Seamless/Next-Gen", no exclamation marks in success/error text.
