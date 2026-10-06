# Design System: Research Agent — Noir/Gris Interface
**Project:** AI Research Agent (Google ADK) — ChatGPT-style interface with thinking space
**Stack:** Next.js 15, React 19, Tailwind CSS v4, Motion, TypeScript

---

## Configuration — Noir/Gris Dials

| Dial | Level | Description |
|------|-------|-------------|
| **DESIGN_VARIANCE** | `8` | High asymmetry — split layouts, offset panels, no centered symmetry |
| **MOTION_INTENSITY** | `6` | Fluid spring physics, perpetual micro-loops on active states, staggered reveals |
| **VISUAL_DENSITY** | `4` | Balanced — generous whitespace but functional density for chat interface |

---

## 1. Visual Theme & Atmosphere

A **clinical noir interface** — deep charcoal surfaces, muted steel dividers, single electric blue accent. The atmosphere is a "mission control" for research: focused, serious, alive with micro-motion. High variance (8) prevents template feel; asymmetric thinking panel, offset message alignment, staggered thought entries. Motion (6) gives weight: spring-physics panel expands, thoughts cascade in, send button has tactile press. Density (4) keeps breathing room for long-form research responses.

**Mood keywords:** Noir, Mission Control, Editorial, Precise, Alive.

---

## 2. Color Palette & Roles (Noir Primary + Gris Secondary)

| Name | Hex | Role |
|------|-----|------|
| **Noir Primary** | `#0A0A0A` | Page background, deepest surface |
| **Noir Elevated** | `#111111` | Header, sidebar, input container — one step up |
| **Gris Card** | `#1A1A1A` | Message bubbles, thinking panel, cards — primary container |
| **Gris Border** | `#2A2A2A` | Borders, dividers, subtle outlines |
| **Gris Hover** | `#333333` | Hover states, active backgrounds |
| **Steel Text** | `#A3A3A3` | Secondary text, timestamps, metadata, placeholders |
| **Steel Muted** | `#737373` | Tertiary text, disabled states, subtle labels |
| **Pure White** | `#FFFFFF` | Primary text, headlines, user message text |
| **Off White** | `#E5E5E5` | Body text, thought content, readable paragraphs |
| **Electric Blue** | `#3B82F6` | **Single Accent** — primary CTAs, focus rings, active indicators, send button, thinking header icon, links |
| **Electric Blue Muted** | `#1E3A5F` | Accent backgrounds (10% opacity), subtle glows |
| **Emerald Success** | `#10B981` | Execution history, completed tools, checkmarks |
| **Amber Warning** | `#F59E0B` | Analysis phase, pending states |
| **Deep Rose Error** | `#E11D48` | Errors, blocked states, delete actions |

### Banned Colors
- Pure black `#000000` — use Noir Primary `#0A0A0A`
- Purple/violet neon — the "AI Purple" aesthetic
- Warm beige/cream premium palette — banned per design-taste-frontend
- Mixed warm/cool grays — single gray scale only (neutral zinc)
- Oversaturated accents > 80%

---

## 3. Typography Rules

### Font Stack
- **Display/Headlines:** `Geist` (or `Satoshi` / `Cabinet Grotesk`) — Track-tight `-0.025em`, weight-driven hierarchy (700-900), leading `1.1`
- **Body:** Same family at 400 — Relaxed leading `1.65`, max-width `65ch`, Off White `#E5E5E5`
- **Mono:** `Geist Mono` — Code, timestamps, metadata, step counters. When density > 7, all numbers → mono
- **UI Labels:** Same family at 500, `0.75rem`, uppercase, tracking `0.1em`

### Scale (clamp-based)
- **H1 (Page Title):** `clamp(1.5rem, 3vw, 2rem)` / `font-bold` / `tracking-tight`
- **H2 (Section):** `clamp(1.125rem, 2vw, 1.375rem)` / `font-semibold`
- **H3 (Card Title):** `0.875rem` / `font-semibold` / `tracking-tight`
- **Body:** `1rem` / `leading-relaxed` / `text-[#E5E5E5]`
- **Small:** `0.8125rem` / `text-[#A3A3A3]`
- **Micro:** `0.75rem` / `uppercase` / `tracking-wide` / `text-[#737373]`

### Banned
- `Inter` font — banned in premium contexts
- Generic serifs (`Times`, `Georgia`, `Garamond`) — banned in dashboards/software UI
- Pure white text on pure white backgrounds (contrast failures)

---

## 4. Component Stylings

### 4.1 Buttons
| Variant | Style |
|---------|-------|
| **Primary (Send, Validate)** | `bg-[#3B82F6] text-white` — flat, no glow. Active: `scale-[0.97]`. Hover: `bg-[#2563EB]`. Focus: `ring-2 ring-[#3B82F6] ring-offset-2 ring-offset-[#0A0A0A]` |
| **Secondary (Modify, New Chat)** | `bg-transparent border border-[#2A2A2A] text-[#E5E5E5]` — hover: `bg-[#1A1A1A] border-[#3B82F6] text-[#3B82F6]` |
| **Ghost (Burger, Close, Model Pill)** | `bg-transparent text-[#A3A3A3]` — hover: `bg-[#1A1A1A] text-white` |
| **Destructive (Delete, Clear All)** | `bg-transparent border border-[#E11D48]/30 text-[#E11D48]` — hover: `bg-[#E11D48]/10` |

**Shape Consistency Lock:** All interactive elements use `rounded-xl` (`12px`). Buttons: `rounded-lg` (`8px`). Pills (model selector): `rounded-full`.

### 4.2 Cards / Containers
- **Thinking Panel:** `bg-[#111111] border border-[#2A2A2A] rounded-2xl` — header `bg-[#0A0A0A]`, content `bg-[#1A1A1A]/50`
- **Message Bubbles:** User: `bg-[#0A0A0A] text-white rounded-2xl rounded-tr-md`. Agent: `bg-[#1A1A1A] text-[#E5E5E5] rounded-2xl rounded-tl-md`
- **Response Cards (Plan, Notes, History):** `bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl`
- **Sidebar:** `bg-[#111111] border-r border-[#2A2A2A]`

**High-Density Override:** When `VISUAL_DENSITY > 7`, replace cards with `border-t border-[#2A2A2A]` dividers.

### 4.3 Inputs / Textarea
- **Container:** `bg-[#111111] border border-[#2A2A2A] rounded-2xl` — focus: `border-[#3B82F6] ring-2 ring-[#3B82F6]/20`
- **Textarea:** `bg-transparent text-white placeholder-[#737373]` — no resize handle, auto-height
- **Label:** Above input, `text-[#A3A3A3]` micro text

### 4.4 Loading / Empty / Error States
- **Loading:** Skeletal shimmer — `bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] animate-pulse` matching exact layout dimensions. **No circular spinners.**
- **Empty State:** Composed illustration (search icon) + guidance text in Steel Text
- **Error:** Inline, `border-l-3 border-[#E11D48] bg-[#E11D48]/5 text-[#E11D48]` with clear recovery action

### 4.5 Thinking Panel Specifics
- **Header:** `bg-[#0A0A0A] border-b border-[#2A2A2A]` — brain icon in Electric Blue
- **Category Badges:**
  - REASONING: `bg-[#1E3A5F] text-[#3B82F6] border-[#3B82F6]/30` + Brain icon
  - SEARCH: `bg-[#0F2A1E] text-[#10B981] border-[#10B981]/30` + Search icon
  - ANALYSIS: `bg-[#2A1E0F] text-[#F59E0B] border-[#F59E0B]/30` + BookOpen icon
  - DECISION: `bg-[#2A0F1E] text-[#E11D48] border-[#E11D48]/30` + Compass icon
  - SYNTHESIS: `bg-[#0F2A1A] text-[#10B981] border-[#10B981]/30` + CheckCircle2 icon
- **Execution History:** `bg-[#0F2A1E] border border-[#10B981]/30` with Emerald icons
- **Scrollbar:** Thin, `thumb-[#2A2A2A] track-transparent`

---

## 5. Layout Principles

### Grid-First Architecture
- **Main Chat Area:** CSS Grid `grid grid-rows-[auto_auto_1fr_auto]` — Header, Messages, Thinking, Input (fixed)
- **Sidebar:** Fixed width `max-w-sm` (`384px`), full height, slide-in from left
- **Thinking Panel:** Expandable, max-height `256px` scrollable content
- **Response Space:** Single column, `gap-5` between cards

### Asymmetric Structure (Variance 8)
- **Header:** 3-zone — Burger (left), Title Pill (center, flex-1, max-width), New Chat (right)
- **Messages:** User right-aligned (`justify-end`), Agent left-aligned (default flow)
- **Thinking Panel:** Full-width expandable, NOT a sidebar — sits in message flow
- **Input:** Fixed bottom, full-width, model pill (left) + send button (right)

### Containment
- **Max Width:** `max-w-4xl` (`896px`) for chat column, centered
- **Horizontal Padding:** `px-4` mobile, `px-6` tablet+
- **Vertical Rhythm:** Section gaps `gap-6` (messages), `gap-5` (response cards)

### No Overlapping Elements
Clean spatial separation — every element in its own grid cell or flow position. No absolute-positioned content stacking over other content.

---

## 6. Responsive Rules

| Breakpoint | Behavior |
|------------|----------|
| **< 640px (Mobile)** | Sidebar = full-screen drawer (already implemented). Chat `px-4`. Input fixed bottom `pb-5`. Thinking panel max-height `200px`. |
| **640–1024px (Tablet)** | Sidebar = slide-in drawer. Chat `max-w-3xl`. |
| **> 1024px (Desktop)** | Sidebar = drawer (not persistent). Chat `max-w-4xl`. All hover states active. |

**Mobile-First Collapse:** All multi-column → single column. No horizontal scroll. Touch targets min `44px` (already satisfied by `h-9 w-9` buttons).

**Typography Scaling:** Headlines via `clamp()`. Body minimum `1rem`/`16px`.

---

## 7. Motion & Interaction

### Physics Engine
- **Spring:** `stiffness: 100, damping: 20` — premium, weighty feel
- **All interactive:** `transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s`
- **Panel Expand/Collapse:** Height + opacity spring, `duration: 300ms`

### Perpetual Micro-Loops
| Component | Loop |
|-----------|------|
| **Thinking Header (loading)** | Brain icon → `animate-spin` (Loader2) |
| **Send Button (hover)** | `scale-[1.05]` + subtle glow `shadow-[0_0_12px_rgba(59,130,246,0.4)]` |
| **Execution Status** | Pulse on active tool: `animate-pulse` on status dot |
| **New Thought Entry** | Staggered cascade: `delay: index * 80ms`, `y: 16 → 0`, `opacity: 0 → 1` |
| **Sidebar Open** | Slide `x: -100% → 0`, backdrop `opacity: 0 → 1` |

### Staggered Orchestration
- Thoughts mount with `animation-delay: calc(var(--index) * 80ms)`
- Response cards cascade `delay: index * 100ms`
- Sidebar items: `delay: index * 40ms`

### Hardware Rules
- Animate ONLY `transform` and `opacity`
- Grain/noise on fixed `pointer-events-none` pseudo-element only (optional atmospheric layer)
- Isolate heavy animations in Client Component leaves (`'use client'`)

---

## 8. Anti-Patterns (Banned - Enforced)

- ❌ No emojis anywhere
- ❌ No `Inter` font
- ❌ No generic serif fonts
- ❌ No pure black `#000000`
- ❌ No neon outer glows
- ❌ No oversaturated accents
- ❌ No excessive gradient text
- ❌ No custom mouse cursors
- ❌ No overlapping elements
- ❌ No 3-column equal card layouts
- ❌ No centered Hero sections
- ❌ No filler UI text ("Scroll to explore", chevrons)
- ❌ No generic names ("John Doe", "Acme")
- ❌ No fake round numbers
- ❌ No AI copywriting clichés ("Elevate", "Seamless", "Unleash")
- ❌ No broken image links
- ❌ No default `shadcn/ui` radii/colors/shadows — customize to this system
- ❌ No `z-index` spam — only: Sidebar (50), Modal (40), Dropdown (30), Toast (20)
- ❌ No `h-screen` — use `min-h-[100dvh]`
- ❌ No circular spinners — skeletal shimmer only
- ❌ No warm beige/cream premium palette
- ❌ No mixed warm/cool grays

---

## 9. Implementation Checklist (for @ui-designer)

### Phase 1: Tailwind Config & CSS Variables
- [ ] Update `tailwind.config.ts` / CSS variables with noir/gris palette
- [ ] Add `Geist` font via `next/font`
- [ ] Configure dark mode as default (class strategy)
- [ ] Add custom border-radius scale: `rounded-xl: 12px`, `rounded-2xl: 16px`

### Phase 2: Global Styles
- [ ] `globals.css` — CSS variables for colors, shimmer keyframes, scrollbar styling
- [ ] Root `html.dark` — enforce dark mode default
- [ ] Selection color: `::selection { background: #3B82F6; color: white; }`

### Phase 3: Component Updates (in order)
1. **`Header.tsx`** — Noir background, Gris border, Electric Blue pill accent
2. **`Sidebar.tsx`** — Noir Elevated background, Gris dividers, proper hover states
3. **`UserMessage.tsx`** — Noir bubble, white text, proper rounded corners
4. **`AgentThinking.tsx`** — **Critical**: Noir header, Gris content, category badges with accent colors, staggered thought entry animation
5. **`BottomInput.tsx`** — Noir Elevated container, Gris border, Electric Blue send button, model pill with popover
6. **`ResponseSpace.tsx`** + children — Gris cards, Noir borders, proper spacing
7. **`app/page.tsx`** — Assemble with proper grid layout, scroll behavior

### Phase 4: Motion Integration
- [ ] Add Motion `motion.div` wrappers for staggered thought entries
- [ ] Spring-based panel expand/collapse
- [ ] Tactile button press (`whileTap: { scale: 0.97 }`)
- [ ] Sidebar slide animation
- [ ] Reduced motion support via `useReducedMotion()`

### Phase 5: Polish & Audit
- [ ] Contrast audit (WCAG AA minimum)
- [ ] Mobile testing at 375px, 390px, 768px
- [ ] Dark mode lock (no light mode leakage)
- [ ] Performance: no layout shift, 60fps animations
- [ ] Accessibility: focus visible, ARIA labels, keyboard navigation

---

## 10. Visual References (for imagegen-frontend-web)

*Generate ONE horizontal image PER section:*

1. **Header + Sidebar Closed** — Noir top bar, burger left, title pill center (Electric Blue pulse dot), new chat right. Chat area empty state.
2. **Sidebar Open** — Full-height drawer, conversation list with hover states, active item highlighted Electric Blue, delete icons on hover.
3. **User Message + Thinking Panel (Collapsed)** — Right-aligned user bubble (Noir), thinking header below (Noir header, Electric Blue brain, chevron down, step count badge).
4. **Thinking Panel (Expanded)** — Expanded panel showing 4 thought entries: REASONING (blue badge), SEARCH (emerald badge), ANALYSIS (amber badge), SYNTHESIS (emerald badge). Scrollable, staggered entry.
5. **Thinking Panel (Executing Tools)** — Live execution: spinner, "Interrogation des sources..." text, execution history cards with Emerald checkmarks.
6. **Response Space (Plan View)** — Plan card with objective, tasks (checkboxes), required info/tools, Validate/Modify buttons (Primary/Secondary).
7. **Response Space (Notes + History)** — Saved notes card with source links, Execution history card with tool audit log.
8. **Bottom Input (Idle)** — Fixed container, textarea, model pill "Gemini 3.5 Flash" with green dot, Electric Blue send button.
9. **Bottom Input (Focused + Model Popover)** — Focus ring Electric Blue, model popover open with description.
10. **Mobile View (375px)** — Full flow: header, message, thinking, response, input. Sidebar as drawer overlay.
11. **Empty State** — Centered target icon, "Nouvelle recherche" headline, guidance text, suggestions pills above input.

---

*Generated for Google Stitch / @ui-designer implementation. This DESIGN.md is the single source of truth for the noir/gris Research Agent interface.*