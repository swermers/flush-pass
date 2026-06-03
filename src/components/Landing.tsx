'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

const LANDING_POSTER = '/images/landing-bathroom.png';
const LANDING_VIDEO = '/videos/attendant-wave.mp4';
const INTRO_SEEN_KEY = 'flushpass.introSeen';

type Hotspot = {
  id: string;
  label: string;
  href?: string;
  comingSoon?: boolean;
  isAttendant?: boolean;
  /** Percent of the image: [leftPct, topPct, widthPct, heightPct] */
  rect: [number, number, number, number];
};

// Coordinates are tuned to the 1659x948 landing image. Each rect is
// a percentage so it scales with object-contain.
const HOTSPOTS: Hotspot[] = [
  { id: 'slot', label: 'Slot Machine', rect: [2, 12, 13, 42], comingSoon: true },
  { id: 'craps', label: 'Craps Table', rect: [16, 14, 16, 42], comingSoon: true },
  { id: 'flush', label: 'Flush Oracle', href: '/oracle', rect: [33, 6, 17, 50] },
  { id: 'tp', label: 'TP Oracle', href: '/unravel', rect: [55, 8, 19, 48] },
  { id: 'pick', label: 'Pick A Door', rect: [78, 6, 20, 50], comingSoon: true },
  { id: 'attendant', label: 'The Attendant', isAttendant: true, rect: [33, 22, 25, 55] },
];

export default function Landing() {
  const [intro, setIntro] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(INTRO_SEEN_KEY);
      if (!seen) setIntro(true);
    } catch {
      setIntro(true);
    }
  }, []);

  const closeIntro = useCallback(() => {
    setIntro(false);
    try {
      window.localStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {}
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  return (
    <div className="relative z-10 h-full w-full">
      {/* Bathroom video (with still as poster). Letterboxed so all
          hotspots remain visible at any aspect ratio. */}
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="relative overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.7)_inset]"
          style={{
            aspectRatio: '1659 / 948',
            width: 'min(100vw, calc(100dvh * (1659 / 948)))',
            height: 'min(100dvh, calc(100vw * (948 / 1659)))',
          }}
        >
          <video
            className="h-full w-full object-cover"
            src={LANDING_VIDEO}
            poster={LANDING_POSTER}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden
          />

          {/* Hotspots */}
          {HOTSPOTS.map((spot) => {
            const style = {
              left: `${spot.rect[0]}%`,
              top: `${spot.rect[1]}%`,
              width: `${spot.rect[2]}%`,
              height: `${spot.rect[3]}%`,
            };
            const common = {
              className: `group absolute rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80 hover:bg-white/[0.06] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] ${spot.isAttendant ? 'z-30' : 'z-20'}`,
              style,
              'aria-label': spot.label,
              title: spot.label,
            } as const;

            if (spot.isAttendant) {
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => setIntro(true)}
                  {...common}
                />
              );
            }
            if (spot.href) {
              return (
                <Link key={spot.id} href={spot.href} {...common}>
                  <HotspotLabel label={spot.label} />
                </Link>
              );
            }
            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => showToast(`${spot.label} — coming soon`)}
                {...common}
              >
                <HotspotLabel label={spot.label} muted />
              </button>
            );
          })}
        </div>
      </div>

      {/* Title overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center px-6 pt-6">
        <div className="text-center">
          <h1
            className="font-marker text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
            style={{ fontSize: 'clamp(1.75rem, 4.5vw, 3rem)', lineHeight: 1 }}
          >
            Hall Pass Oracle
          </h1>
          <p className="mt-1 text-xs tracking-[0.25em] text-white/70 sm:text-sm">
            PICK YOUR METHOD OF JUDGMENT
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-4">
        <p className="text-[10px] tracking-[0.3em] text-white/40 sm:text-xs">
          free period · flush.freeperiod.xyz
        </p>
      </div>

      {/* Coming-soon toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute inset-x-0 bottom-16 z-50 flex justify-center px-6"
          >
            <div className="rounded-full bg-black/75 px-4 py-2 text-xs tracking-[0.2em] text-white/90 backdrop-blur">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendant intro modal */}
      <AnimatePresence>
        {intro && <IntroModal onClose={closeIntro} />}
      </AnimatePresence>
    </div>
  );
}

function HotspotLabel({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-2 py-1 text-[10px] tracking-[0.2em] text-white/90 opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${muted ? 'text-white/60' : ''}`}
    >
      {label}
      {muted && <span className="ml-1 text-white/40">· soon</span>}
    </span>
  );
}

function IntroModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="intro-title"
        className="relative mx-4 max-w-md rounded-xl border border-white/10 bg-[#1a1410]/95 p-6 text-center shadow-2xl sm:p-8"
      >
        <div className="mb-3 font-stamp text-[10px] tracking-[0.4em] text-amber-200/80">
          THE ATTENDANT
        </div>
        <h2
          id="intro-title"
          className="font-marker text-white"
          style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', lineHeight: 1.05 }}
        >
          Welcome to the lavatory of fate.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
          Every stall here is an oracle. Pick your method of judgment — the
          bowl swirls, the paper unravels, the dice tumble, the doors decide.
          Whatever you choose, the answer is final.
        </p>
        <p className="mt-2 text-xs italic tracking-wide text-white/50">
          Tip: I&apos;ll wait by the counter. Click me anytime for the rules.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-full bg-amber-300/90 px-5 py-2 font-marker text-sm tracking-[0.25em] text-black transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        >
          ENTER
        </button>
      </motion.div>
    </motion.div>
  );
}
