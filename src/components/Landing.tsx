'use client';

import PassTile from './PassTile';

export default function Landing() {
  return (
    <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 py-10">
      <div className="mb-10 max-w-2xl text-center">
        <h1
          className="font-marker text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', lineHeight: 1.05 }}
        >
          Hall Pass Oracle
        </h1>
        <p className="mt-4 text-base tracking-wide text-white/70 sm:text-lg">
          Pick your method of judgment.
        </p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <PassTile
          href="/oracle"
          title="Flush Oracle"
          subtitle="The bowl decides. Cinematic."
          icon={<DropIcon />}
        />
        <PassTile
          href="/unravel"
          title="TP Unravel"
          subtitle="Pull the paper. Stop on your fate."
          icon={<RollIcon />}
        />
        <PassTile
          href="/doors"
          title="Pick a Door"
          subtitle="Three stalls. One verdict."
          icon={<DoorIcon />}
        />
        <PassTile
          title="Dice Roll"
          subtitle="Six faces. One is mercy."
          icon={<DiceIcon />}
          disabled
        />
      </div>

      <p className="mt-10 text-xs tracking-widest text-white/40">
        free period · flush.freeperiod.xyz
      </p>
    </div>
  );
}

function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8" aria-hidden>
      <path d="M12 2.5c-3 4.5-6.5 8-6.5 12a6.5 6.5 0 0 0 13 0c0-4-3.5-7.5-6.5-12Z" />
    </svg>
  );
}

function RollIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-8 w-8"
      aria-hidden
    >
      <ellipse cx="12" cy="7" rx="7" ry="2.5" />
      <path d="M5 7v8a7 2.5 0 0 0 14 0V7" />
      <ellipse cx="12" cy="7" rx="2.5" ry="0.9" />
      <path d="M19 12c1 0 2.5 1 2.5 4S20 22 19 22" />
    </svg>
  );
}

function DiceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-8 w-8"
      aria-hidden
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DoorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-8 w-8"
      aria-hidden
    >
      <rect x="3" y="3" width="5.5" height="18" rx="0.6" />
      <rect x="9.25" y="3" width="5.5" height="18" rx="0.6" />
      <rect x="15.5" y="3" width="5.5" height="18" rx="0.6" />
      <circle cx="7.4" cy="12" r="0.55" fill="currentColor" stroke="none" />
      <circle cx="13.65" cy="12" r="0.55" fill="currentColor" stroke="none" />
      <circle cx="19.9" cy="12" r="0.55" fill="currentColor" stroke="none" />
    </svg>
  );
}
