# Free Period: Hall Pass Oracle — Build Guide

> **Context for Claude Code:** This document is the complete spec for building an interactive web experience. Read it fully before starting. Ask the user clarifying questions only if something here is genuinely ambiguous; otherwise, proceed with the decisions already made.

---

## 1. Project overview

**What we're building:** A single-page interactive web experience that functions as a comedic "Magic 8-Ball" for hall pass requests in classrooms. A teacher (or student) opens the page, walks through a short cinematic sequence of a grungy school bathroom stall, "flushes" a toilet, and receives a randomized verdict on whether they're allowed to go to the bathroom.

**Why it exists:** It's a fun, useless tool for teachers to use in class as an alternative to the standard "can I go to the bathroom?" interaction. It lives on the Free Period brand (a YouTube channel + ed-tech project for teachers building with AI).

**The core experience (user flow):**

1. User lands on page → sees Shot 1: closed stall door in a grungy bathroom
2. User clicks the door → quick transition with door clang sound → Shot 2: interior of stall with "FLUSH FOR YOUR ODDS" graffiti above the toilet
3. User clicks the flush handle → flush sound + whip cut → Shot 3: top-down view of toilet bowl
4. Water in the bowl swirls (animated in code) for 2.5–4 seconds
5. As the swirl decelerates, a randomized answer surfaces from the water (e.g., "Permission granted." / "Hard no." / "The bowl says yes.")
6. User clicks "flush again" to reset to Shot 1

**The vibe:** A24-meets-school-bathroom liminal photography. Grungy, slightly unsettling, deeply silly. The comedy comes from the contrast between cinematic presentation and absurd subject matter.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Fits user's existing stack (Vercel deployment) |
| Language | TypeScript | User preference |
| Styling | Tailwind CSS | Fast, fits the stack |
| Animation | Framer Motion | Best DX for the choreography we need |
| Water swirl | HTML5 Canvas (2D context) | Simpler than WebGL, sufficient for this effect |
| Audio | HTML5 `<audio>` via custom hook | Native, no library needed |
| Hosting | Vercel | User's default |
| Domain | `flush.freeperiod.xyz` (subdomain of existing domain) | Funnier, feels standalone |

**Do not add:** Three.js, GSAP, Howler.js, or any heavier libraries. This should stay lean and load fast on a school Chromebook.

---

## 3. Repository structure

Create this exact structure:

```
freeperiod-hallpass/
├── README.md
├── BUILD_GUIDE.md              # This file
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── public/
│   ├── images/
│   │   ├── shot-1-door-closed.webp
│   │   ├── shot-2-interior.webp
│   │   └── shot-3-bowl.webp
│   ├── audio/
│   │   ├── door-clang.mp3
│   │   ├── flush.mp3
│   │   ├── ambient.mp3
│   │   └── reveal.mp3
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Main experience (single page)
│   │   ├── globals.css
│   │   └── opengraph-image.png # Social share image
│   ├── components/
│   │   ├── Scene.tsx           # Top-level state manager
│   │   ├── Shot1Door.tsx
│   │   ├── Shot2Interior.tsx
│   │   ├── Shot3Bowl.tsx
│   │   ├── WaterSwirl.tsx      # Canvas animation
│   │   ├── AnswerReveal.tsx
│   │   └── ResetButton.tsx
│   ├── hooks/
│   │   ├── useAudio.ts         # Audio playback helper
│   │   └── usePreloadImages.ts # Preload all 3 shots on mount
│   └── lib/
│       └── answers.ts          # The answer pool
└── .gitignore
```

---

## 4. Scene state machine

The whole experience is a small state machine. Use a single `useState` in `Scene.tsx`:

```typescript
type SceneState =
  | 'shot1'           // Closed door, waiting for click
  | 'opening'         // Transition Shot 1 → Shot 2 in progress
  | 'shot2'           // Interior visible, waiting for flush click
  | 'flushing'        // Transition Shot 2 → Shot 3 in progress
  | 'swirling'        // Water swirl animation playing
  | 'revealing'       // Answer surfacing from water
  | 'answered'        // Answer fully visible, "flush again" button shown
```

State transitions happen on click events. Lock interactions during transition states (`opening`, `flushing`, `swirling`, `revealing`) so users can't double-click and break the flow.

---

## 5. Animation specifications

### 5.1 Shot 1 → Shot 2 transition ("door opens")

**Approach:** Fast camera-push fake-out. We're not actually animating a door swing.

**Timing:** 600ms total
**Steps:**
1. On click, play `door-clang.mp3`
2. Shot 1 image scales from `1.0` to `1.15` over 400ms with ease-out
3. Simultaneously, Shot 1 fades from opacity `1` to `0` over the last 250ms
4. Shot 2 fades in over 350ms (overlapping with Shot 1's fade-out)
5. Optional: brief motion blur filter (`filter: blur(2px)`) on Shot 1 during scale, clearing as Shot 2 appears
6. End state: Shot 2 fully visible, scene state = `'shot2'`

**Framer Motion implementation:** Use `AnimatePresence` with custom variants for entry/exit. Stagger the two shots' animations.

### 5.2 Shot 2 → Shot 3 transition ("flush whip")

**Approach:** Whip-down motion blur with hard audio cut.

**Timing:** 500ms total
**Steps:**
1. On flush click, play `flush.mp3` immediately (it continues through swirl)
2. Shot 2 translates downward (`y: 0 → 100%`) and blurs (`blur(0px) → blur(8px)`) over 250ms
3. At 200ms mark, hard cut to Shot 3 (no fade — the audio masks the cut)
4. Shot 3 enters with a subtle scale-from-1.05 → 1.0 over 250ms to feel like camera "settling"
5. End state: Shot 3 fully visible and steady, scene state = `'swirling'`, water swirl begins

### 5.3 Water swirl (the centerpiece)

This is the most technically interesting piece. Implementation in `WaterSwirl.tsx`.

**Approach:** HTML5 Canvas overlay positioned exactly over the water area in Shot 3. The water area is roughly an ellipse centered in the bowl.

**Canvas dimensions:** Match the visible water ellipse in Shot 3. Approximate values (will need fine-tuning):
- Position: centered horizontally, vertically about 45% from top
- Size: ~40% of viewport width on desktop, scaled appropriately

**The animation:**

```
Phase 1 — Spin up (0–600ms):
  - Rotation speed: 0 → max (radians/frame ramp)
  - Particles begin spawning at outer edge of ellipse
  - Subtle radial darkening at center (vortex forming)

Phase 2 — Sustained swirl (600ms → randomized 2000–3500ms):
  - Rotation at max speed with subtle wobble (±5%)
  - 30–50 particles orbiting in spiral paths toward center
  - Darker vortex visible in center
  - Add slight bowl-shake (CSS transform on parent) for impact

Phase 3 — Spin down (last 600ms):
  - Rotation decelerates
  - Particles settle / fade
  - Vortex dissipates
  - Water returns to calm
  - Trigger answer reveal at end of phase 3
```

**Particle behavior:**
- Each particle has: angle, radius, angular velocity, radial velocity (inward), opacity, color
- Color: white-to-light-grey, semi-transparent
- They spiral inward (radius decreases over lifetime), increase angular velocity, fade out as they reach center
- Respawn at outer edge

**Randomness (for replayability):**
- Phase 2 duration: random between 2000–3500ms
- Max rotation speed: random within ±10% of base
- Particle count: random 30–50
- Slight rotation direction bias: 90% clockwise, 10% counterclockwise

**Don't overthink this.** A simple `requestAnimationFrame` loop drawing semi-transparent radial lines + particles is more than sufficient. We're going for "evocative of a flush" not "fluid simulation."

### 5.4 Answer reveal

**Timing:** 1200ms total
**Steps:**
1. As swirl enters phase 3, randomly pick an answer from the pool
2. After swirl fully settles (water calm again), play `reveal.mp3`
3. Answer text fades in from opacity `0 → 1` over 800ms
4. Simultaneously, text translates upward `y: 20px → 0` (feels like surfacing from water)
5. Slight scale animation: `0.95 → 1.0` over same duration
6. Subtle bobble after settling: gentle `y` oscillation ±2px, infinite, 3s period
7. After 400ms delay, "Flush again?" button fades in below

**Typography:**
- Font: Permanent Marker from Google Fonts
- Color: White with subtle drop shadow for legibility against water
- Size: Responsive — clamp(2rem, 6vw, 4rem)
- Centered horizontally and vertically over the bowl water area

### 5.5 Reset

On "Flush again?" click:
- Quick fade to black (200ms)
- Reset state to `'shot1'`
- Fade from black to Shot 1 (400ms)
- Total: 600ms

---

## 6. Audio implementation

**Files needed in `/public/audio/`:**
- `door-clang.mp3` — ~1.5s, plays on Shot 1 → Shot 2
- `flush.mp3` — ~3-4s, plays on Shot 2 → Shot 3, covers swirl
- `ambient.mp3` — ~10s, loops continuously throughout experience at low volume (0.15)
- `reveal.mp3` — ~0.5-1s, plays when answer surfaces

**`useAudio.ts` hook spec:**

```typescript
// Should expose:
// - preloadAll(): load all audio files on mount
// - play(name: AudioName, volume?: number): play a one-shot
// - playLoop(name: AudioName, volume?: number): play looping (for ambient)
// - stop(name: AudioName): stop a specific sound
// - stopAll(): stop everything
```

**Important:** Browsers block audio autoplay. The first user click (on Shot 1's door) is what unlocks audio context. Start ambient.mp3 looping ONLY after that first interaction.

**Volume levels:**
- Ambient: 0.15 (subtle background)
- Door clang: 0.7
- Flush: 0.8 (this is the star sound)
- Reveal: 0.5

---

## 7. The answer pool

Located at `src/lib/answers.ts`. Export as a typed const:

```typescript
export const ANSWERS: readonly string[] = [
  // Affirmative (~40%)
  "Permission granted.",
  "The bowl says yes.",
  "Lucky flush — go.",
  "Granted, but make it quick.",
  "Today is your day.",
  "Go forth.",
  "The plumbing approves.",
  "Yes. Don't dawdle.",
  "Cleared for takeoff.",
  "Pass granted.",
  "The porcelain has spoken: yes.",
  "Approved — you've earned it.",
  "Flush successful. Proceed.",
  "Green light. Go.",
  "Yes, but you owe me one.",

  // Negative (~35%)
  "Hard no.",
  "Today is not your day.",
  "Hold it.",
  "The plumbing has spoken: no.",
  "Denied.",
  "Try again at the next bell.",
  "Not happening.",
  "The bowl is not in your favor.",
  "No. Sit down.",
  "The toilet gods say no.",
  "Permission revoked.",
  "Negative.",
  "Try again tomorrow.",
  "The flush failed you.",

  // Maybe / deferred (~15%)
  "Try again in 3 minutes.",
  "Ask again after the bell.",
  "Reply hazy, ask the janitor.",
  "Outlook unclear. Flush twice.",
  "The bowl is thinking...",
  "Maybe. The water is unsure.",
  "Pending review by the custodian.",

  // Chaos (~10%)
  "The toilet refuses to acknowledge you.",
  "Ask the vending machine instead.",
  "Bold of you to assume.",
  "Have you tried not asking?",
  "The answer was inside you all along. (No.)",
  "The bowl is empty. So is your hope.",
  "404: bathroom not found.",
  "The school board must convene.",
  "Insufficient karma.",
  "Permission... pending... permission...",
  "ERROR: too much hubris detected.",
  "The water has filed a restraining order.",
  "Permission granted. (Just kidding.)",
  "The toilet is on a coffee break.",
  "Have you considered holding it forever?",
] as const;

export function getRandomAnswer(): string {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}
```

**Note for user:** These are starting drafts. Replace, edit, or add to taste — your voice as a teacher will be funnier than these. The mix ratio (40/35/15/10) is what makes it feel like an 8-ball: mostly answers, occasional non-answers, rare absurd ones for surprise.

---

## 8. Styling and visual polish

### Page background
Solid black (`#000`). The images don't fill the viewport on wide screens; black bars are correct cinematic letterboxing.

### Image presentation
- Object-fit: contain (preserves aspect ratio)
- Centered in viewport
- Max dimensions: 100vh height, scale down on narrow viewports
- Slight vignette overlay (radial gradient, transparent center, ~30% black at corners) — adds cinematic feel and helps the answer text pop against the bowl

### Cursor
- Default: pointer on clickable areas (door, flush handle, reset button)
- Use a subtle pulse animation on the clickable hotspots so users know where to click (especially the flush handle, which isn't obvious)

### Hotspot indicators
The door and flush handle don't have visible UI. Add invisible click targets with a subtle hover state:
- Door (Shot 1): full-screen click target initially, with a subtle "click to enter" hint that fades in after 2 seconds of inactivity
- Flush handle (Shot 2): position an invisible 80×80px clickable region over the actual flush handle in the image. Add a subtle pulsing glow on hover.

### Mobile responsiveness
- The 1024×1024 square images scale gracefully — center them and letterbox
- Touch targets need to be at least 44×44px
- Test on a portrait phone screen — the experience should still feel cinematic

---

## 9. Performance

- All three images: WebP format, quality 85, target <200KB each
- All audio: MP3 at 96-128kbps, target <200KB each
- Preload all images and audio on mount (the `usePreloadImages` hook)
- Use Next.js `<Image>` component with `priority` flag for Shot 1
- Lazy-load Shots 2 and 3 (they'll be preloaded but not in the initial paint)
- Total page weight goal: under 1.5MB

---

## 10. Metadata and sharing

In `app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: "Hall Pass Oracle — Free Period",
  description: "Flush for your odds. The toilet decides whether you can go to the bathroom.",
  openGraph: {
    title: "Hall Pass Oracle",
    description: "Flush for your odds.",
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Hall Pass Oracle",
    description: "Flush for your odds.",
    images: ['/og-image.png'],
  },
};
```

OG image: use a cropped version of Shot 2 (the "FLUSH FOR YOUR ODDS" wall) with the Free Period logo in the corner.

---

## 11. Accessibility

- All interactive elements need keyboard support (Enter/Space to activate)
- Provide a "skip animation" button for users with motion sensitivity (respects `prefers-reduced-motion`)
- When `prefers-reduced-motion: reduce` is detected: skip transitions, just hard-cut between shots, skip swirl animation, show answer immediately
- Alt text on images
- Audio should be mutable (small mute button in corner)

---

## 12. Build order (recommended)

Follow this sequence — don't try to build everything at once:

1. **Scaffold:** `create-next-app`, Tailwind config, file structure, push to GitHub
2. **Static layout:** Get all 3 shots displaying as plain images, click to advance through them with no animation. Validate the basic state machine works.
3. **Audio:** Wire up the audio hook and ambient loop. Get all 4 sounds playing on the right triggers.
4. **Transitions:** Add the Shot 1→2 and Shot 2→3 animations with Framer Motion.
5. **Water swirl:** Build `WaterSwirl.tsx` in isolation (maybe a `/test` route). Get the canvas animation looking right before integrating.
6. **Answer reveal:** Wire up the answer pool and reveal animation.
7. **Reset flow:** "Flush again?" button and reset transition.
8. **Polish:** Vignette, hotspot indicators, hover states, mobile testing.
9. **A11y pass:** Reduced motion, keyboard nav, mute button, alt text.
10. **Deploy:** Push to Vercel, set up `flush.freeperiod.xyz` subdomain.

---

## 13. Things NOT to do

- **Don't add a backend.** v1 is purely client-side. Answer randomization happens in the browser.
- **Don't add analytics in v1.** Ship first, instrument later if it gets traction.
- **Don't add user accounts, leaderboards, or "share your answer" features.** Scope creep. The joy is in the simplicity.
- **Don't try to make the door swing physically.** We agreed on the camera-push fake-out (Approach A). It's faster to build and just as funny.
- **Don't use Three.js / WebGL for the swirl.** Canvas 2D is sufficient and easier to debug.
- **Don't over-design the UI chrome.** The images ARE the UI. Resist adding logos, headers, or "About" links on the main experience page.
- **Don't break the cinematic frame with text overlays** except for the answer reveal itself.

---

## 14. Open questions / user decisions still pending

These are NOT blockers — proceed with the defaults below unless the user overrides:

1. **Domain:** Default to `flush.freeperiod.xyz`. User can override during deployment.
2. **Answer pool:** Use the draft above. User will edit before launch.
3. **Audio sources:** User will provide files in `/public/audio/`. If files aren't present yet, build with empty MP3 placeholders so the structure works; sounds can be dropped in later.
4. **Free Period branding:** None on the main experience. A small "made by Free Period" link in the corner is okay but optional.

---

## 15. Success criteria

The build is "done" when:

- [ ] All three shots load and transition smoothly
- [ ] All four sounds play at the right times
- [ ] Water swirl runs for randomized 2.5–4 seconds and looks evocative of a flush
- [ ] A random answer appears on each flush
- [ ] "Flush again?" resets the experience
- [ ] Total page weight is under 1.5MB
- [ ] First Contentful Paint under 1.5s on a 4G connection
- [ ] Works on Chromebook (most school devices)
- [ ] Works on mobile in portrait
- [ ] Reduced-motion users get a working but de-animated version
- [ ] Deployed to `flush.freeperiod.xyz` (or chosen URL)

---

## 16. Reference: visual asset specs

The three image files in `/public/images/`:

| File | Source | Purpose | Notes |
|---|---|---|---|
| `shot-1-door-closed.webp` | Generated via Nano Banana, refined for right-hinged door | Opening state — closed stall door, sink visible right side | Click target = full image initially |
| `shot-2-interior.webp` | Generated via Midjourney/Nano Banana | Interior with "FLUSH FOR YOUR ODDS" graffiti and toilet | Flush handle hotspot needs precise positioning over the visible flush lever |
| `shot-3-bowl.webp` | Top-down bowl, calm matte water | Final state for swirl + answer reveal | Water area is the inner ellipse — that's where the canvas overlay lives |

All three share consistent grunge, lighting (cold fluorescent green-yellow cast), and 35mm film grain aesthetic. Don't apply additional color grading in code that would break this consistency.

---

## End of guide

Build it lean, ship it weird, make teachers laugh.
