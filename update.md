# update.md — Animation, Custom Icons & Mobile-First Polish

Instructions for Claude Code to upgrade **RepLog** with rich motion, a custom icon set, and a tighter mobile-first responsive layout. Read `CLAUDE.md` first — everything here must respect the priorities already set there, especially **fast logging above all** and **local-only / zero-setup** (any library here installs with one `npm install`, no config, no services).

## How to use this file
- Treat this as a polish pass over the existing UI, not a rewrite.
- **Derive the aesthetic from the inspiration images already in the project.** Match their palette, type feel, spacing, and mood. Don't introduce a new visual direction — the animations and icons should feel like they were always part of that design.
- Work surface by surface. After each, take a screenshot (or describe the result) and self-critique before moving on.

---

## 1. Animation

Goal: the app should feel alive and physical — things slide, settle, and respond to touch — without ever slowing the person down.

### Libraries (install as needed, latest stable)
- **Motion (Framer Motion)** — primary. Use for enter/exit (`AnimatePresence`), layout animations (`layout` prop), gestures (drag, swipe), spring physics, drag-to-reorder (`Reorder`), and the `useReducedMotion` hook.
- **@formkit/auto-animate** — zero-config automatic animation for lists that grow/shrink/reorder (set lists, exercise lists, history). Drop-in where a full Motion setup is overkill.
- **canvas-confetti** — celebration bursts (PRs, completing a workout).
- **tailwindcss-animate** — already present via shadcn; use its utilities for simple transitions.
- Optional: **lottie-react** for a richer empty-state or PR animation if a fitting Lottie file exists. Don't add it just to add it.

> Don't stack two libraries doing the same job. Motion is the default; reach for the others only where they're clearly simpler.

### Where to animate (in priority order)
1. **PR celebration — go big here.** When a set beats a record, fire a confetti burst, pop/scale the PR badge with a spring, and briefly highlight the row. This is the signature motion moment; spend the boldness here.
2. **Set completion** — checking a set off animates the check (draw-on or spring scale) and the row settles with a subtle color/elevation shift.
3. **Rest timer** — animated circular countdown (animate `stroke-dashoffset`), gentle pulse as it nears zero, satisfying finish state.
4. **Route / tab transitions** — short shared-element or slide/fade between screens so navigation feels continuous, not snappy-blank.
5. **List changes** — adding/removing/reordering sets and exercises animates smoothly (auto-animate or Motion layout). Drag-to-reorder exercises uses Motion `Reorder` with a lift/shadow on grab.
6. **Numbers & charts** — stats (total volume, est. 1RM) count up; progress charts draw in on first view.
7. **Micro-interactions** — button press scale, toggle springs, bottom-sheet slide-up with a drag-to-dismiss handle, skeleton shimmer on first data load.

### Rules (non-negotiable)
- **Never block the logging hot path.** On the active-workout screen, animations must be ≤150ms, interruptible, and must not delay input. Tapping "add set" or entering reps stays instant — motion decorates, it never gates.
- **Respect `prefers-reduced-motion`.** Use Motion's `useReducedMotion`; when set, drop to instant or simple opacity fades. Confetti and large movement are disabled in this mode.
- **Animate `transform` and `opacity` only** on anything frequent (GPU-friendly). Avoid animating layout properties (width/height/top/left) in hot paths to prevent jank on mid-range phones.
- **Spring, don't ease-linear.** Prefer spring physics with natural settling over robotic linear/ease transitions. Keep durations short (150–300ms) for UI, looser only for celebratory moments.
- **Restraint.** Rich ≠ everything moving at once. One clear focal motion per moment; keep the rest quiet. Over-animation reads as cheap — let the PR moment be the star.

---

## 2. Custom Icons

Build a small, cohesive **custom SVG icon set** instead of relying on a generic library. It should look hand-made for this app and match the inspiration images' line weight and personality.

### Structure
- `components/icons/` holds one React component per icon, plus an `index.ts` barrel and an `<Icon name="..." />` registry for convenience.
- Each icon: a `24×24` viewBox, `stroke="currentColor"` (so it inherits text color), a single consistent `strokeWidth` (pick 1.5 or 2 to match the inspiration), `strokeLinecap="round"` and `strokeLinejoin="round"`, and a `size` prop (default 24).
- Fill-style icons use `fill="currentColor"` instead — pick one style (stroke vs fill) and stay consistent across the whole set.

### Icons to create
- **Navigation:** home/dashboard, history, exercises, routines, progress, settings.
- **Equipment:** barbell, dumbbell, kettlebell, machine, cable, resistance band, bodyweight.
- **Muscle groups:** chest, back, legs, shoulders, arms, core (used in tags and the volume heatmap).
- **Actions:** add set, complete/check, edit, delete, rest timer, plate, swap exercise.
- **Achievement:** PR trophy/medal, streak flame.

### Rules
- One visual language across all icons: same stroke weight, same corner radius feel, same level of detail. They should look like a family.
- Icons inherit color from context (`currentColor`) — never hardcode hex inside an icon.
- A few icons can be **animated** where it carries meaning: the check icon draws on at set completion, the streak flame flickers subtly, the timer icon sweeps. Use Motion or inline SVG animation; respect reduced-motion.
- Keep them legible at 20–24px (their real size on mobile). Detail that disappears at small sizes is wasted.

---

## 3. Mobile-First & Highly Responsive

The app is used on a phone, in a gym, often one-handed. **Design and build mobile-first, then enhance upward** — base styles target the phone; `sm:` / `md:` / `lg:` only add to it.

### Method
- Start every component at the smallest width and make it great there before adding breakpoints. Never design desktop-down.
- Build and verify at phone widths first — **360, 390, and 430px** — then check tablet (768) and desktop (1024+). No horizontal scroll at any width.
- Use **fluid type** (`clamp()` or responsive Tailwind text scales) so headings breathe on larger screens without separate hardcoded sizes.

### Layout patterns
- **Bottom tab navigation on mobile** within thumb reach; promote to a side rail or expanded nav at `md:` and up. Primary actions live in the lower half of the screen.
- **Bottom sheets** (slide-up, drag-to-dismiss) for quick actions like add-exercise or edit-set — far more thumb-friendly than top modals.
- **Single column on mobile → multi-column / wider canvas on desktop** (e.g., history list + detail side-by-side at `lg:`).
- **Safe areas:** add `viewport-fit=cover` and pad with `env(safe-area-inset-*)` so content clears the notch and home indicator. Sticky bars must sit above the home indicator.
- Use **dynamic viewport units (`dvh`)** for full-height layouts so mobile browser chrome appearing/disappearing doesn't break the layout.

### Touch
- **Tap targets ≥ 44px**, with comfortable spacing so sweaty-finger taps don't misfire (reinforces `CLAUDE.md`).
- **No hover-only affordances** — touch has no hover. Every hover reveal needs a tap-reachable equivalent; reserve hover purely as desktop enhancement.
- Embrace native-feeling **gestures**: swipe a set to complete or delete, drag to reorder, pull/drag to dismiss sheets. Pair key gestures with haptics where available (`navigator.vibrate`).

### Quality floor
- Visible keyboard focus states, logical tab order, semantic landmarks.
- Test landscape on a phone too (rest timer and active logging especially).
- Charts and tables degrade gracefully on narrow screens (scrollable or reflowed, never clipped).

---

## Acceptance checklist
- [ ] Aesthetic of new motion + icons matches the inspiration images and existing UI.
- [ ] PR moment has a standout celebration; logging a set is still instant and never blocked by animation.
- [ ] All animation respects `prefers-reduced-motion`; frequent animations use only transform/opacity.
- [ ] Custom icon set is cohesive (one style, `currentColor`, legible at 24px) and replaces generic icons app-wide.
- [ ] Every screen built mobile-first; looks right at 360/390/430px with no horizontal scroll, then scales up cleanly.
- [ ] Bottom nav + bottom sheets reachable one-handed; safe-area insets handled; tap targets ≥44px; no hover-only controls.
- [ ] No new backend, service, or required config introduced (stays local-only / zero-setup).