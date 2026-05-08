'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePassFrame } from './PassFrame';
import { getRandomAnswer } from '@/lib/answers';
import ResetButton from './ResetButton';
import TPRoll from './TPRoll';

export type UnravelState =
  | 'idle'
  | 'unraveling'
  | 'stopping'
  | 'revealing'
  | 'answered';

const SHEET_HEIGHT = 220; // px per perforated sheet
const MAX_SPEED = 1400; // px/sec
const ACCEL_MS = 380; // ramp up to MAX_SPEED
const STOP_MIN_MS = 650;
const STOP_MAX_MS = 950;

export default function UnravelScene() {
  const { audio, reducedMotion, startAmbient } = usePassFrame();
  const [state, setState] = useState<UnravelState>('idle');
  const [answer, setAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState(false);

  // Streamer offset in px (how far the paper has unrolled).
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);

  // RAF state
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<UnravelState>('idle');
  const speedRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const stopStartRef = useRef<number | null>(null);
  const stopFromSpeedRef = useRef(0);
  const stopDurRef = useRef(STOP_MIN_MS);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const t = window.setTimeout(() => setShowHint(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  // Animation loop
  const tick = useCallback((ts: number) => {
    const last = lastTsRef.current ?? ts;
    const dt = Math.min(0.06, (ts - last) / 1000);
    lastTsRef.current = ts;

    const s = stateRef.current;

    if (s === 'unraveling') {
      // Accelerate toward MAX_SPEED
      const target = MAX_SPEED;
      const k = 1 / (ACCEL_MS / 1000);
      speedRef.current += (target - speedRef.current) * Math.min(1, k * dt);
      offsetRef.current += speedRef.current * dt;
      setOffset(offsetRef.current);
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    if (s === 'stopping') {
      const start = stopStartRef.current ?? ts;
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / stopDurRef.current);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      speedRef.current = stopFromSpeedRef.current * (1 - eased);
      offsetRef.current += speedRef.current * dt;
      setOffset(offsetRef.current);
      if (t >= 1) {
        speedRef.current = 0;
        rafRef.current = null;
        // Pick the verdict, transition to revealing
        const picked = getRandomAnswer();
        setAnswer(picked);
        setState('revealing');
        audio.stop('paperRustle');
        audio.play('paperRip', 0.7);
        audio.play('reveal', 0.5);
        window.setTimeout(() => setState('answered'), 1100);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    rafRef.current = null;
  }, [audio]);

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

  const handleTug = useCallback(() => {
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

      audio.playLoop('paperRustle', 0.4);
      offsetRef.current = 0;
      speedRef.current = 0;
      setOffset(0);
      setState('unraveling');
      stateRef.current = 'unraveling';
      startLoop();
      return;
    }

    if (state === 'unraveling') {
      audio.play('click', 0.6);
      stopStartRef.current = performance.now();
      stopFromSpeedRef.current = speedRef.current;
      stopDurRef.current =
        STOP_MIN_MS + Math.random() * (STOP_MAX_MS - STOP_MIN_MS);
      setState('stopping');
      stateRef.current = 'stopping';
      return;
    }
  }, [state, audio, reducedMotion, startAmbient, startLoop]);

  const handleReset = useCallback(() => {
    audio.stop('paperRustle');
    audio.play('click', 0.5);
    if (reducedMotion) {
      offsetRef.current = 0;
      setOffset(0);
      setAnswer('');
      setState('idle');
      return;
    }
    // Animate paper retracting briefly, then reset.
    const start = performance.now();
    const startOffset = offsetRef.current;
    const dur = 600;
    const animateRetract = (ts: number) => {
      const t = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      offsetRef.current = startOffset * (1 - eased);
      setOffset(offsetRef.current);
      if (t < 1) {
        requestAnimationFrame(animateRetract);
      } else {
        setAnswer('');
        setState('idle');
        stateRef.current = 'idle';
        setShowHint(false);
        window.setTimeout(() => setShowHint(true), 1200);
      }
    };
    requestAnimationFrame(animateRetract);
  }, [audio, reducedMotion]);

  // Stream is interactive only in idle/unraveling/stopping states
  const interactive =
    state === 'idle' || state === 'unraveling' || state === 'stopping';

  // Cap how much we visually translate the streamer so it doesn't disappear
  const visualOffset = Math.min(offset, 50000);

  return (
    <div className="absolute inset-0 z-10 flex h-full w-full justify-center">
      {/* The streamer extends BELOW the roll. We render a long vertical
          track of "sheet" segments, then translate it downward. */}
      <button
        type="button"
        onClick={handleTug}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && interactive) {
            e.preventDefault();
            handleTug();
          }
        }}
        disabled={!interactive}
        aria-label={
          state === 'idle'
            ? 'Tug the paper'
            : state === 'unraveling'
              ? 'Stop the paper'
              : 'Stopping...'
        }
        className="relative flex h-full w-full max-w-md flex-col items-center bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-default"
        style={{ cursor: interactive ? 'pointer' : 'default' }}
      >
        {/* Roll, fixed near the top */}
        <div className="relative z-20 mt-[6vh] flex flex-col items-center">
          <TPRoll size={Math.min(260, Math.round(0.55 * 600))} />
          {state === 'idle' && showHint && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mt-3 font-marker text-base tracking-[0.2em] text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] sm:text-lg"
            >
              tug to pull
            </motion.span>
          )}
        </div>

        {/* Streamer that hangs from the roll. translateY animates how
            much paper has come off. The streamer is a tall stack of
            perforated sheets. */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 overflow-hidden"
          style={{
            top: 'calc(6vh + 110px)', // just below the roll
            width: 'min(86vw, 360px)',
            height: 'calc(94vh - 110px)',
          }}
        >
          <div
            style={{
              transform: `translateY(${visualOffset - 4000}px)`,
              willChange: 'transform',
            }}
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <Sheet key={i} index={i} />
            ))}
          </div>
        </div>

        {/* Verdict sheet — a single, larger sheet that surfaces when stopped.
            Dark ink on cream paper for legibility. */}
        {(state === 'revealing' || state === 'answered') && (
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute left-1/2 z-30 -translate-x-1/2"
            style={{
              top: '52%',
              width: 'min(86vw, 380px)',
            }}
          >
            <div
              className="flex flex-col items-center rounded-sm px-6 py-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
              style={{
                background:
                  'linear-gradient(180deg, #f5efde 0%, #e7dec5 60%, #d4c8a8 100%)',
                border: '1px dashed rgba(0,0,0,0.18)',
              }}
            >
              <motion.p
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="font-marker motion-safe:animate-bobble"
                style={{
                  color: 'rgba(20, 18, 12, 0.92)',
                  fontSize: 'clamp(1.5rem, 4.5vw, 2.4rem)',
                  lineHeight: 1.1,
                }}
              >
                {answer}
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: state === 'answered' ? 1 : 0 }}
                transition={{ duration: 0.4, delay: state === 'answered' ? 0.4 : 0 }}
                className="mt-6"
              >
                <ResetButton
                  onClick={handleReset}
                  disabled={state !== 'answered'}
                  label="Pull again?"
                  tone="dark"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </button>
    </div>
  );
}

function Sheet({ index }: { index: number }) {
  return (
    <div
      style={{
        height: SHEET_HEIGHT,
        background:
          'linear-gradient(180deg, #f4eedd 0%, #e7dec5 60%, #d4c8a8 100%)',
        borderBottom: '1px dashed rgba(0,0,0,0.22)',
        boxShadow: 'inset 0 -10px 18px -8px rgba(0,0,0,0.18)',
        opacity: 0.92,
      }}
      aria-hidden
    >
      {/* faint sheet number / texture */}
      <div
        style={{
          height: '100%',
          backgroundImage:
            'repeating-linear-gradient(180deg, transparent 0 36px, rgba(0,0,0,0.04) 36px 38px)',
        }}
      />
    </div>
  );
}
