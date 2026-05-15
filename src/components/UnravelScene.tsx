'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePassFrame } from './PassFrame';
import { usePreloadImages } from '@/hooks/usePreloadImages';
import { getRandomAnswer } from '@/lib/answers';
import ResetButton from './ResetButton';

const ROLL_IMAGE = '/images/tp-roll.png';
const ROLL_PRELOAD = [ROLL_IMAGE] as const;
const ROLL_SIZE = 280;

// Spin physics — pure rotation, no streamer.
const MAX_DEG_PER_SEC = 1440; // 4 revolutions/sec at full spin
const ACCEL_MS = 380;
const STOP_MIN_MS = 800;
const STOP_MAX_MS = 1400;

export type UnravelState =
  | 'idle'
  | 'spinning'
  | 'stopping'
  | 'revealing'
  | 'answered';

export default function UnravelScene() {
  const { audio, reducedMotion, startAmbient } = usePassFrame();
  const [state, setState] = useState<UnravelState>('idle');
  const [answer, setAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [rotation, setRotation] = useState(0);

  usePreloadImages(ROLL_PRELOAD);

  // RAF state
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<UnravelState>('idle');
  const rotationRef = useRef(0);
  const angVelRef = useRef(0); // deg/sec
  const lastTsRef = useRef<number | null>(null);
  const stopStartRef = useRef<number | null>(null);
  const stopFromVelRef = useRef(0);
  const stopDurRef = useRef(STOP_MIN_MS);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const t = window.setTimeout(() => setShowHint(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  const tick = useCallback(
    (ts: number) => {
      const last = lastTsRef.current ?? ts;
      const dt = Math.min(0.06, (ts - last) / 1000);
      lastTsRef.current = ts;

      const s = stateRef.current;

      if (s === 'spinning') {
        const k = 1 / (ACCEL_MS / 1000);
        angVelRef.current +=
          (MAX_DEG_PER_SEC - angVelRef.current) * Math.min(1, k * dt);
        rotationRef.current += angVelRef.current * dt;
        setRotation(rotationRef.current);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (s === 'stopping') {
        const start = stopStartRef.current ?? ts;
        const elapsed = ts - start;
        const t = Math.min(1, elapsed / stopDurRef.current);
        const eased = 1 - Math.pow(1 - t, 3);
        angVelRef.current = stopFromVelRef.current * (1 - eased);
        rotationRef.current += angVelRef.current * dt;
        setRotation(rotationRef.current);
        if (t >= 1) {
          angVelRef.current = 0;
          rafRef.current = null;
          const picked = getRandomAnswer();
          setAnswer(picked);
          setState('revealing');
          audio.stop('paperRustle');
          audio.play('paperRip', 0.75);
          audio.play('reveal', 0.5);
          window.setTimeout(() => setState('answered'), 1100);
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      rafRef.current = null;
    },
    [audio],
  );

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return;
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      audio.stop('paperRustle');
    };
  }, [audio]);

  const handleTap = useCallback(() => {
    if (state === 'idle') {
      startAmbient();
      audio.play('click', 0.6);

      if (reducedMotion) {
        const picked = getRandomAnswer();
        setAnswer(picked);
        setState('answered');
        audio.play('reveal', 0.5);
        return;
      }

      audio.playLoop('paperRustle', 0.35);
      angVelRef.current = 0;
      setState('spinning');
      stateRef.current = 'spinning';
      startLoop();
      return;
    }

    if (state === 'spinning') {
      audio.play('click', 0.6);
      stopStartRef.current = performance.now();
      stopFromVelRef.current = angVelRef.current;
      stopDurRef.current =
        STOP_MIN_MS + Math.random() * (STOP_MAX_MS - STOP_MIN_MS);
      setState('stopping');
      stateRef.current = 'stopping';
    }
  }, [state, audio, reducedMotion, startAmbient, startLoop]);

  const handleReset = useCallback(() => {
    audio.stop('paperRustle');
    audio.play('click', 0.5);
    rotationRef.current = 0;
    angVelRef.current = 0;
    setRotation(0);
    setAnswer('');
    setState('idle');
    stateRef.current = 'idle';
    setShowHint(false);
    window.setTimeout(() => setShowHint(true), 900);
  }, [audio]);

  const interactive = state === 'idle' || state === 'spinning';

  return (
    <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center">
      <button
        type="button"
        onClick={handleTap}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && interactive) {
            e.preventDefault();
            handleTap();
          }
        }}
        disabled={!interactive}
        aria-label={
          state === 'idle'
            ? 'Tap to spin the roll'
            : state === 'spinning'
              ? 'Tap to stop'
              : 'Stopping...'
        }
        className="relative flex h-full w-full max-w-md flex-col items-center justify-center bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-default"
        style={{ cursor: interactive ? 'pointer' : 'default' }}
      >
        {/* Roll, centered. Hidden once the answer is revealed so the
            torn sheet has the stage. */}
        <motion.div
          className="relative z-20 flex flex-col items-center"
          animate={{
            opacity: state === 'revealing' || state === 'answered' ? 0 : 1,
            scale: state === 'revealing' || state === 'answered' ? 0.92 : 1,
          }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div
            className="relative"
            style={{
              width: ROLL_SIZE,
              height: ROLL_SIZE,
              transform: `rotate(${rotation}deg)`,
              willChange: 'transform',
            }}
            aria-hidden
          >
            <Image
              src={ROLL_IMAGE}
              alt=""
              fill
              priority
              sizes={`${ROLL_SIZE}px`}
              draggable={false}
            />
          </div>
          {state === 'idle' && showHint && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mt-6 font-marker text-base tracking-[0.25em] text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] sm:text-lg"
            >
              tap to spin
            </motion.span>
          )}
          {state === 'spinning' && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              transition={{ duration: 0.3 }}
              className="mt-6 font-marker text-base tracking-[0.25em] text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] sm:text-lg"
            >
              tap to stop
            </motion.span>
          )}
        </motion.div>

        {/* Torn sheet verdict. Drops from where the roll sat, lands
            centered, presents the answer. */}
        {(state === 'revealing' || state === 'answered') && (
          <motion.div
            initial={{ opacity: 0, y: -ROLL_SIZE * 0.6, rotate: -3, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotate: -1, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute left-1/2 z-30 -translate-x-1/2"
            style={{ width: 'min(86vw, 360px)' }}
          >
            <TornSheet>
              <motion.p
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
                className="font-marker motion-safe:animate-bobble"
                style={{
                  color: 'rgba(20, 18, 12, 0.92)',
                  fontSize: 'clamp(1.5rem, 4.5vw, 2.4rem)',
                  lineHeight: 1.15,
                  textAlign: 'center',
                }}
              >
                {answer}
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: state === 'answered' ? 1 : 0 }}
                transition={{
                  duration: 0.4,
                  delay: state === 'answered' ? 0.4 : 0,
                }}
                className="mt-6"
              >
                <ResetButton
                  onClick={handleReset}
                  disabled={state !== 'answered'}
                  label="Spin again?"
                  tone="dark"
                />
              </motion.div>
            </TornSheet>
          </motion.div>
        )}
      </button>
    </div>
  );
}

// A single toilet-paper sheet with torn top edge and perforated bottom
// edge, drawn with SVG masks so the edges read as real paper rather
// than a generic card.
function TornSheet({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative px-7 pb-9 pt-8 text-center"
      style={{
        background:
          'linear-gradient(180deg, #f8f2e1 0%, #ede4cb 60%, #d9cdaf 100%)',
        filter:
          'drop-shadow(0 18px 28px rgba(0,0,0,0.55)) drop-shadow(0 4px 8px rgba(0,0,0,0.35))',
        clipPath:
          'polygon(0% 6px, 3% 0, 6% 5px, 10% 1px, 14% 7px, 18% 0, 22% 4px, 26% 8px, 30% 1px, 34% 6px, 38% 0, 42% 5px, 46% 8px, 50% 2px, 54% 6px, 58% 0, 62% 4px, 66% 8px, 70% 1px, 74% 6px, 78% 0, 82% 5px, 86% 8px, 90% 2px, 94% 6px, 97% 0, 100% 5px, 100% 100%, 97% calc(100% - 5px), 94% 100%, 90% calc(100% - 6px), 86% calc(100% - 2px), 82% 100%, 78% calc(100% - 5px), 74% 100%, 70% calc(100% - 6px), 66% calc(100% - 1px), 62% 100%, 58% calc(100% - 4px), 54% 100%, 50% calc(100% - 6px), 46% calc(100% - 2px), 42% 100%, 38% calc(100% - 5px), 34% 100%, 30% calc(100% - 6px), 26% calc(100% - 1px), 22% 100%, 18% calc(100% - 4px), 14% 100%, 10% calc(100% - 7px), 6% calc(100% - 1px), 3% 100%, 0% calc(100% - 5px))',
      }}
    >
      {/* faint horizontal pulp lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(180deg, transparent 0 26px, rgba(80,60,30,0.05) 26px 27px)',
        }}
      />
      <div className="relative flex flex-col items-center">{children}</div>
    </div>
  );
}
