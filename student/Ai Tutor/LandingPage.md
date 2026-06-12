# AI Tutor — Landing Page Motion & Effects Specification
### Addendum to Main Prompt · For: Senior Frontend Developer
### Library Stack: React + Framer Motion (primary) + GSAP ScrollTrigger (for complex sequences)

---

## PHILOSOPHY

Animations are not decoration — they are functional UX.
Every motion on this landing page must serve a purpose:
guide attention, communicate state, or reward interaction.
Nothing should move just to move.
Keep it smooth, subtle, and purposeful.
Target: **60fps** across all devices. Always include `prefers-reduced-motion` fallback.

---

## SECTION 1 — PAGE LOAD SEQUENCE (Entry Animations)

### 1.1 Navbar Fade-Drop
- On page load, navbar slides down from `y: -20` to `y: 0` with `opacity: 0 → 1`
- Duration: `0.5s`, easing: `ease-out`
- Slight delay after page paint: `delay: 0.1s`

### 1.2 Hero Headline — Staggered Word Reveal
- Each word of the headline animates in **sequentially** (not all at once)
- Effect: each word comes from `y: 40, opacity: 0` → `y: 0, opacity: 1`
- Stagger between words: `0.08s`
- Total headline reveal feels like it's being **typed/revealed cinematically**
- Use **Framer Motion `motion.span`** on each word, wrapped in `variants` with `staggerChildren`

**Implementation hint:**
```jsx
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
}
const wordVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
}
```

### 1.3 Hero Subtext Fade-Up
- Subheading fades in from `y: 20, opacity: 0` → `y: 0, opacity: 1`
- Delay: `0.6s` (after headline finishes)
- Duration: `0.5s`

### 1.4 CTA Buttons Pop-In
- Buttons animate in with `scale: 0.92, opacity: 0` → `scale: 1, opacity: 1`
- Duration: `0.4s`, easing: `spring(stiffness: 200, damping: 20)`
- Stagger between primary and secondary CTA: `0.1s`

### 1.5 Hero Illustration Slide-In
- The hero image/illustration enters from `x: 60, opacity: 0` → `x: 0, opacity: 1`
- Duration: `0.7s`, easing: `ease-out`
- Delay: `0.4s` (so it comes in slightly after text)

---

## SECTION 2 — BACKGROUND EFFECTS (Always Running / Ambient)

### 2.1 Gradient Blob / Aurora Background
- 2–3 soft, large circular blobs floating behind the hero section
- Colors: light blue family — `#B3D9F2`, `#7EC8E3`, `#D6EEF8`
- Each blob moves on an infinite slow loop (`keyframes` float animation)
- Blur: heavy — `filter: blur(80px)` — creates soft aurora/glow effect
- Opacity: `0.4–0.6` so it doesn't overpower content
- Blobs move independently with different durations (e.g., 8s, 12s, 10s) so they never sync

```css
@keyframes blobFloat {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 15px) scale(0.97); }
}
```

- Position: `absolute`, `z-index: 0`, behind all content (`z-index: 1`)
- Must NOT affect layout — use `pointer-events: none`

### 2.2 Subtle Dot/Grid Pattern Overlay
- Very faint repeating dot grid or line grid behind hero
- `opacity: 0.04–0.07` — barely visible, adds texture depth
- CSS background pattern (no image file needed):
```css
background-image: radial-gradient(circle, #5BA4CF 1px, transparent 1px);
background-size: 28px 28px;
```

### 2.3 Floating Micro-Elements (Optional, EdTech personality touch)
- 3–4 tiny floating icons (pencil, book, lightbulb, telescope) scattered in hero background
- Each has its own slow float animation with different delays
- `opacity: 0.12`, very subtle — adds EdTech personality without being childish
- Use outline SVG icons for a professional look (not emoji)

---

## SECTION 3 — SCROLL-TRIGGERED ANIMATIONS

**Tool:** Framer Motion `whileInView` (simple) OR GSAP ScrollTrigger (complex sequences)
**Rule:** Elements must animate in only when they enter the viewport — not on page load.
Set `viewport={{ once: true }}` — each element animates only once, not on re-scroll.

### 3.1 Section Headings — Slide-Up Reveal
- Every section heading (`<h2>`) uses:
  - `initial: { opacity: 0, y: 30 }` → `whileInView: { opacity: 1, y: 0 }`
  - Duration: `0.55s`, easing: `easeOut`
  - Triggers when 20% of element is in viewport

### 3.2 Feature Cards — Staggered Cascade
- Feature/tool cards animate in **sequentially** as the section scrolls into view
- Each card: `opacity: 0, y: 50` → `opacity: 1, y: 0`
- Stagger: `0.12s` between each card
- Adds a cascading reveal effect — feels alive, not a wall of content appearing at once

### 3.3 "How It Works" Steps — Sequential Left-Right Alternation
- Step 1 slides in from **left** (`x: -50, opacity: 0` → `x: 0, opacity: 1`)
- Step 2 slides in from **right** (`x: 50, opacity: 0` → `x: 0, opacity: 1`)
- Step 3 slides in from **left** again
- Each triggers only when it individually enters viewport
- Creates a flowing zigzag reading experience

### 3.4 Statistics / Numbers — Count-Up Animation
- Any numbers shown (e.g., "500+ students", "4 tools") count up from 0 to final value
- Trigger: when stat section enters viewport
- Duration: `1.5s` with `easeOut` curve (fast start, slow end)
- Library: use `react-countup` or custom `requestAnimationFrame` hook

### 3.5 Horizontal Scroll Marquee (Trust/Brand Strip)
- If a "used by" or "features" strip is added — it scrolls **horizontally in infinite loop**
- No scroll trigger — always running
- CSS `animation: marquee linear infinite` on a duplicated content row
- `overflow: hidden` on parent

---

## SECTION 4 — HOVER INTERACTIONS

### 4.1 CTA Buttons — Micro-Interaction
- **Primary button** (`Get Started`):
  - Hover: `scale: 1.04`, slight `box-shadow` deepening
  - Active/click: `scale: 0.97` — tactile press feel
  - Background: subtle shimmer/shine effect on hover (CSS `::after` with moving gradient)
  - Transition: `0.2s ease`
- **Secondary button** (`Login`):
  - Hover: border color deepens, text color shifts slightly
  - No scale — more subtle than primary

### 4.2 Feature / Tool Cards — 3D Tilt + Lift
- On hover, each tool card:
  - Lifts with `translateY(-6px)`
  - Gets slightly deeper `box-shadow`
  - Subtle 3D tilt based on cursor position within the card (mouse tracking)
  - Card icon scales up: `scale: 1.1`
- Implementation: use `react-parallax-tilt` library OR manual `onMouseMove` tracking with `rotateX` / `rotateY` via Framer Motion
- Max tilt: `8deg` — subtle, not nauseating

```jsx
// Manual approach with Framer Motion
const handleMouseMove = (e) => {
  const rect = ref.current.getBoundingClientRect();
  const x = (e.clientX - rect.left - rect.width / 2) / 20;
  const y = (e.clientY - rect.top - rect.height / 2) / 20;
  setRotate({ x: -y, y: x });
};
```

### 4.3 Navbar Links — Underline Slide
- On hover, a thin underline slides in from `left` to `right` (not just appearing)
- CSS: `::after` pseudo-element with `width: 0 → 100%` transition
- Color: `#5BA4CF` (primary blue)

### 4.4 Logo — Subtle Pulse on Load
- On initial load, logo does a single gentle `scale: 1 → 1.05 → 1` pulse
- Duration: `0.6s` — just once, draws attention to brand name

---

## SECTION 5 — CUSTOM CURSOR (Desktop Only)

A custom cursor adds a premium, modern feel — now standard in top SaaS and EdTech products.

### Implementation
- Replace default cursor with a **small filled circle** (10px) that follows mouse position
- Add a larger, slower-following **ring** (30px) with slight lag — creates depth
- The inner dot follows cursor exactly; the ring interpolates with delay (`lerp` effect)
- `mix-blend-mode: difference` on the ring — inverts color over light/dark areas
- On hovering over interactive elements (buttons, cards, links):
  - Ring **expands** (`scale: 2.5`) and opacity drops slightly
  - Inner dot **disappears** — ring takes over
  - Signals "clickable" without a tooltip

```css
.cursor-dot {
  width: 8px; height: 8px;
  background: #5BA4CF;
  border-radius: 50%;
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  transition: transform 0.1s ease;
}
.cursor-ring {
  width: 32px; height: 32px;
  border: 1.5px solid #5BA4CF;
  border-radius: 50%;
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  transition: transform 0.15s ease, width 0.3s, height 0.3s, opacity 0.3s;
  mix-blend-mode: difference;
}
```

- **Mobile:** hide custom cursor entirely — use native touch cursor
- Add `cursor: none` to `body` only on desktop (`@media (hover: hover)`)

---

## SECTION 6 — GLASSMORPHISM ELEMENTS

Glassmorphism is the dominant card style in modern SaaS/EdTech 2025–26.

### Usage in this project:
- Tool cards on landing page
- Hero badge/pill (e.g., "✨ Powered by AI")
- Floating stat cards if used in hero section

### Recipe:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(91, 164, 207, 0.10);
}
```

- Keep `backdrop-filter` blur between `10px–16px` — beyond that feels foggy
- Border must be semi-transparent white — defines the glass edge
- Background: slightly warm white (`rgba(255,255,255,0.55)`) — not pure transparent
- Works beautifully over the aurora blob background

---

## SECTION 7 — TEXT EFFECTS

### 7.1 Gradient Text on Key Headline Words
- The main value word(s) in the headline get a **gradient fill** (not solid color)
- Example: *"Your* **AI Study Partner**" — the bold words are gradient
- CSS:
```css
.gradient-text {
  background: linear-gradient(135deg, #5BA4CF, #2E86C1, #7EC8E3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```
- Only 1–2 words maximum — overusing kills the effect

### 7.2 Rotating Words in Hero (Typewriter-style)
- One dynamic word in the headline cycles through options
- Example: *"Master your* **[Concepts / Exams / Doubts / Projects]**" — the bracketed word rotates
- Effect: current word exits with `opacity: 0, y: -10`, next word enters `y: 10, opacity: 0 → 1`
- Interval: every `2.5s`
- Words chosen to map to the 4 tools of the product

### 7.3 Launch Badge / Pill
- Small pill element near headline: e.g., *"✦ Built for CBSE Classes 1–12"*
- Has a slow rotating **gradient border** (CSS `@keyframes` rotating conic-gradient)
- Adds a premium "product launch chip" feel — used by Linear, Vercel, Notion

```css
@keyframes rotateBorder {
  from { --angle: 0deg; }
  to { --angle: 360deg; }
}
.pill {
  border: 1.5px solid transparent;
  background: linear-gradient(white, white) padding-box,
              conic-gradient(from var(--angle), #B3D9F2, #5BA4CF, #B3D9F2) border-box;
  animation: rotateBorder 3s linear infinite;
}
```

---

## SECTION 8 — SCROLL PROGRESS INDICATOR

- Thin line fixed at the **very top of the page**
- Fills from left to right as user scrolls — shows reading progress
- Color: `#5BA4CF` (brand blue)
- Height: `3px`
- Implementation: use Framer Motion `useScroll` + `scaleX` transform on a `position: fixed` bar
- `transform-origin: left` — so it grows from left edge

```jsx
const { scrollYProgress } = useScroll();
<motion.div
  style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
  className="scroll-progress-bar"
/>
```

---

## SECTION 9 — PAGE TRANSITIONS (Route Changes)

- When navigating Landing → Signup or Landing → Login:
  - Current page: `opacity: 1 → 0` over `0.3s`
  - New page: `opacity: 0 → 1` over `0.35s`
- Avoid slide transitions for SPA routing — can feel disorienting on quick clicks
- Use Framer Motion `AnimatePresence` wrapping route components

---

## SECTION 10 — PERFORMANCE RULES (Non-Negotiable)

| Rule | Detail |
|---|---|
| Use `transform` & `opacity` only | Never animate `width`, `height`, `top`, `left` — cause layout reflow, drop fps |
| `will-change: transform` | Add to elements that animate — lets GPU pre-optimize |
| `viewport={{ once: true }}` | Framer Motion: animate in only once, no re-trigger on scroll-up |
| `prefers-reduced-motion` | Wrap all animations — disable/minimize for accessibility |
| Aurora blobs | CSS only, no canvas/WebGL — sufficient and much lighter |
| Custom cursor | Disable entirely on mobile/touch devices |
| Lazy load below-fold | Sections below fold should not block hero paint |

```css
/* Accessibility — always include */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## QUICK REFERENCE TABLE

| Location | Effect | Method | Duration |
|---|---|---|---|
| Navbar | Fade + slide down on load | Framer Motion | 0.5s |
| Hero headline | Staggered word-by-word reveal | Framer Motion stagger | 0.08s per word |
| Hero subtext | Fade-up | Framer Motion | 0.5s |
| CTA buttons | Scale pop-in | Framer Motion spring | 0.4s |
| Hero illustration | Slide in from right | Framer Motion | 0.7s |
| Background | Aurora blobs floating | CSS keyframes | 8–12s loop |
| Background | Dot grid texture | CSS background-image | Static |
| Section headings | Slide-up on scroll | Framer Motion whileInView | 0.55s |
| Feature cards | Staggered cascade on scroll | Framer Motion stagger | 0.12s |
| How It Works steps | Left-right alternating slide | Framer Motion whileInView | 0.5s |
| Stats/numbers | Count-up animation | react-countup | 1.5s |
| Primary button | Scale + shadow + shimmer hover | Framer Motion + CSS | 0.2s |
| Cards | 3D tilt + lift on hover | react-parallax-tilt | Continuous |
| Navbar links | Underline slide on hover | CSS ::after | 0.25s |
| Cursor | Dot + lagging ring | JS requestAnimationFrame | Real-time |
| Headline words | Gradient fill | CSS background-clip | Static |
| Rotating keyword | Word swap with fade | Framer Motion + interval | 2.5s cycle |
| Badge/pill | Rotating gradient border | CSS conic-gradient | 3s loop |
| Scroll progress | Top bar fills on scroll | Framer Motion useScroll | Real-time |
| Page transition | Fade in/out on route change | Framer Motion AnimatePresence | 0.3s |

---

*Addendum to AI Tutor Platform Main Prompt.
All effects listed here apply to the public landing page only.
Dashboard and tool pages: use minimal micro-interactions only — hover states, loading skeletons, and button press feedback. No heavy scroll animations inside the app.*
