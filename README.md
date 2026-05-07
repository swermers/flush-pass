# flush-pass
Flush for Hall Pass
freeperiod-hallpass/
├── README.md
├── package.json
├── next.config.js
├── public/
│   ├── images/
│   │   ├── shot-1-door-closed.webp
│   │   ├── shot-2-interior.webp
│   │   └── shot-3-bowl.webp
│   └── audio/
│       ├── door-clang.mp3
│       ├── flush.mp3
│       ├── ambient-bathroom.mp3
│       └── reveal.mp3
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx          // Landing or redirect
│   │   └── hallpass/
│   │       └── page.tsx      // The actual experience
│   ├── components/
│   │   ├── Scene.tsx         // Container, manages shot state
│   │   ├── Shot1Door.tsx
│   │   ├── Shot2Interior.tsx
│   │   ├── Shot3Bowl.tsx
│   │   ├── WaterSwirl.tsx    // Canvas/WebGL animation
│   │   └── AnswerReveal.tsx
│   ├── lib/
│   │   ├── answers.ts        // The 50 one-liners
│   │   └── audio.ts          // Sound playback helpers
│   └── styles/
│       └── globals.css
└── tsconfig.json

# 1. Create the Next.js app
npx create-next-app@latest freeperiod-hallpass --typescript --tailwind --app --no-src-dir
cd freeperiod-hallpass

# 2. Install Framer Motion for animations
npm install framer-motion

# 3. Add the images and audio to /public

# 4. Initialize git, push to GitHub
git init
git add .
git commit -m "initial scaffold"
gh repo create freeperiod-hallpass --public --source=. --push

# 5. Connect to Vercel for deploys
# (via the Vercel dashboard, link the GitHub repo)

Audio: 4 files needed
This is the most important non-image work, because Approach A leans heavily on sound to sell the transitions. The hard cuts only feel intentional when audio is doing the lifting.
SoundPurposeLengthSearch termsDoor creak + clangSells Shot 1 → Shot 2 transition~1.5 sec"metal stall door open close," "bathroom stall door slam"Toilet flushSells Shot 2 → Shot 3 transition + covers the swirl~3-4 sec"toilet flush school," "public toilet flush long"Ambient bathroom humBackground atmosphere, loops the whole experience~10 sec loopable"bathroom ambience fluorescent," "public restroom room tone"Answer revealPunctuates the moment the answer appears~0.5-1 sec"magic 8 ball reveal," "low gong soft," "wet plop bubble"
