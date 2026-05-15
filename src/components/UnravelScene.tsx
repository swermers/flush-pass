'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { usePassFrame } from './PassFrame';
import { usePreloadImages } from '@/hooks/usePreloadImages';
import { getRandomAnswer, TEASERS, type Answer } from '@/lib/answers';
import ResetButton from './ResetButton';

const ROLL_IMAGE = '/images/tp-assembly.png';
const ROLL_PRELOAD = [ROLL_IMAGE] as const;
const ROLL_SIZE = 360;

// Spin physics
const MAX_DEG_PER_SEC = 1440;
const ACCEL_MS = 380;
const STOP_MIN_MS = 900;
const STOP_MAX_MS = 1500;
const HOLD_FULL_MS = 1400;
const COOLDOWN_S = 8;

type UnravelState = 'idle' | 'spinning' | 'stopping' | 'revealing' | 'answered';
type Mode = 'tap' | 'hold' | 'pull';

export default function UnravelScene() {
  const { audio, reducedMotion, startAmbient } = usePassFrame();
  const [state, setState] = useState<UnravelState>('idle');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [rotation, setRotation] = useState(0);
  const [teaserIdx, setTeaserIdx] = useState(0);
  const [confettiGo, setConfettiGo] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [tension, setTension] = useState(0);
  const [mode, setMode] = useState<Mode>('tap');
  const [includeWild, setIncludeWild] = useState(true);

  usePreloadImages(ROLL_PRELOAD);

  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<UnravelState>('idle');
  const rotationRef = useRef(0);
  const angVelRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const stopStartRef = useRef<number | null>(null);
  const stopFromVelRef = useRef(0);
  const stopDurRef = useRef(STOP_MIN_MS);
  const teaserClockRef = useRef(0);
  const tensionRafRef = useRef<number | null>(null);
  const tensionStartRef = useRef(0);
  const tensionRef = useRef(0);
  const dragLastYRef = useRef(0);
  const dragLastTsRef = useRef(0);
  const dragVelRef = useRef(0);
  const draggingRef = useRef(false);
  const modeRef = useRef<Mode>('tap');
  const includeWildRef = useRef(true);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    includeWildRef.current = includeWild;
  }, [includeWild]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(
      () => setCooldown((c) => (c > 1 ? c - 1 : 0)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [cooldown]);

  const settleVerdict = useCallback(() => {
    const picked = getRandomAnswer({ includeWild: includeWildRef.current });
    setAnswer(picked);
    setState('revealing');
    stateRef.current = 'revealing';
    audio.stop('paperRustle');
    audio.play('paperRip', 0.75);
    audio.play('reveal', 0.5);
    if (picked.kind !== 'no') {
      setConfettiGo(true);
      window.setTimeout(() => setConfettiGo(false), 2400);
    }
    window.setTimeout(() => {
      setState('answered');
      stateRef.current = 'answered';
      setCooldown(COOLDOWN_S);
    }, 1100);
  }, [audio]);

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

        teaserClockRef.current += dt * 1000;
        if (teaserClockRef.current > 90) {
          teaserClockRef.current = 0;
          setTeaserIdx((i) => i + 1);
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (s === 'stopping') {
        const start = stopStartRef.current ?? ts;
        const elapsed = ts - start;
        const tt = Math.min(1, elapsed / stopDurRef.current);
        const eased = 1 - Math.pow(1 - tt, 3);
        angVelRef.current = stopFromVelRef.current * (1 - eased);
        rotationRef.current += angVelRef.current * dt;
        setRotation(rotationRef.current);

        if (tt >= 1) {
          angVelRef.current = 0;
          rafRef.current = null;
          settleVerdict();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      rafRef.current = null;
    },
    [settleVerdict],
  );

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return;
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (tensionRafRef.current != null)
        cancelAnimationFrame(tensionRafRef.current);
      audio.stop('paperRustle');
    };
  }, [audio]);

  const beginSpin = useCallback(
    (initialVel = 0) => {
      startAmbient();
      audio.play('click', 0.6);
      if (reducedMotion) {
        settleVerdict();
        return;
      }
      audio.playLoop('paperRustle', 0.35);
      setAnswer(null);
      setConfettiGo(false);
      angVelRef.current = initialVel;
      setState('spinning');
      stateRef.current = 'spinning';
      startLoop();
    },
    [audio, reducedMotion, settleVerdict, startAmbient, startLoop],
  );

  const beginStop = useCallback(() => {
    audio.play('click', 0.6);
    stopStartRef.current = performance.now();
    stopFromVelRef.current = Math.max(
      angVelRef.current,
      MAX_DEG_PER_SEC * 0.4,
    );
    stopDurRef.current =
      STOP_MIN_MS + Math.random() * (STOP_MAX_MS - STOP_MIN_MS);
    setState('stopping');
    stateRef.current = 'stopping';
    startLoop();
  }, [audio, startLoop]);

  const handleReset = useCallback(() => {
    audio.stop('paperRustle');
    audio.play('click', 0.5);
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    rotationRef.current = 0;
    angVelRef.current = 0;
    setRotation(0);
    setAnswer(null);
    setConfettiGo(false);
    setTension(0);
    tensionRef.current = 0;
    setState('idle');
    stateRef.current = 'idle';
  }, [audio]);

  // ---------- Tap mode ----------
  const onPrimary = useCallback(() => {
    if (cooldown > 0) return;
    if (modeRef.current !== 'tap') return;
    const s = stateRef.current;
    if (s === 'idle') beginSpin();
    else if (s === 'spinning') beginStop();
    else if (s === 'answered') {
      handleReset();
      window.setTimeout(() => beginSpin(), 200);
    }
  }, [beginSpin, beginStop, handleReset, cooldown]);

  // ---------- Hold mode ----------
  const tensionTick = useCallback((ts: number) => {
    const elapsed = ts - tensionStartRef.current;
    const tt = Math.min(1, elapsed / HOLD_FULL_MS);
    const eased = tt * tt * (3 - 2 * tt);
    tensionRef.current = eased;
    setTension(eased);
    if (tt < 1) tensionRafRef.current = requestAnimationFrame(tensionTick);
    else tensionRafRef.current = null;
  }, []);

  const onHoldStart = useCallback(() => {
    if (cooldown > 0 || modeRef.current !== 'hold') return;
    if (stateRef.current === 'answered') handleReset();
    if (stateRef.current !== 'idle') return;
    audio.play('click', 0.5);
    tensionStartRef.current = performance.now();
    tensionRafRef.current = requestAnimationFrame(tensionTick);
  }, [audio, cooldown, handleReset, tensionTick]);

  const onHoldEnd = useCallback(() => {
    if (modeRef.current !== 'hold') return;
    if (tensionRafRef.current != null) {
      cancelAnimationFrame(tensionRafRef.current);
      tensionRafRef.current = null;
    }
    const tt = tensionRef.current;
    if (tt < 0.08) {
      tensionRef.current = 0;
      setTension(0);
      return;
    }
    const initial = MAX_DEG_PER_SEC * (0.55 + 0.45 * tt);
    tensionRef.current = 0;
    setTension(0);
    beginSpin(initial);
    window.setTimeout(() => {
      if (stateRef.current === 'spinning') {
        stopStartRef.current = performance.now();
        stopFromVelRef.current = angVelRef.current;
        stopDurRef.current = 1000 + 1100 * tt;
        setState('stopping');
        stateRef.current = 'stopping';
      }
    }, 120);
  }, [beginSpin]);

  // ---------- Pull mode ----------
  const onPullPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (cooldown > 0 || modeRef.current !== 'pull') return;
      if (stateRef.current === 'answered') handleReset();
      if (stateRef.current !== 'idle' && stateRef.current !== 'spinning')
        return;
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      draggingRef.current = true;
      dragLastYRef.current = e.clientY;
      dragLastTsRef.current = performance.now();
      dragVelRef.current = 0;
      if (stateRef.current === 'idle') {
        startAmbient();
        audio.playLoop('paperRustle', 0.35);
        setAnswer(null);
        setConfettiGo(false);
        angVelRef.current = 0;
        setState('spinning');
        stateRef.current = 'spinning';
        startLoop();
      }
    },
    [audio, cooldown, handleReset, startAmbient, startLoop],
  );

  const onPullPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      const y = e.clientY;
      const now = performance.now();
      const dy = y - dragLastYRef.current;
      const dtMs = Math.max(8, now - dragLastTsRef.current);
      if (dy > 0) {
        const velRaw = (dy * 6) / (dtMs / 1000);
        dragVelRef.current = dragVelRef.current * 0.55 + velRaw * 0.45;
        angVelRef.current = Math.min(
          MAX_DEG_PER_SEC * 1.3,
          Math.max(angVelRef.current, dragVelRef.current),
        );
        rotationRef.current += dy * 4;
        setRotation(rotationRef.current);
      }
      dragLastYRef.current = y;
      dragLastTsRef.current = now;
    },
    [],
  );

  const onPullPointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const v = dragVelRef.current;
    stopStartRef.current = performance.now();
    if (Math.abs(v) < 80) {
      stopFromVelRef.current = Math.max(
        angVelRef.current,
        MAX_DEG_PER_SEC * 0.3,
      );
      stopDurRef.current = 700 + Math.random() * 400;
    } else {
      stopFromVelRef.current = Math.min(MAX_DEG_PER_SEC * 1.1, v);
      stopDurRef.current = 1100 + Math.random() * 700;
    }
    setState('stopping');
    stateRef.current = 'stopping';
    startLoop();
  }, [startLoop]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (modeRef.current === 'tap') onPrimary();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleReset, onPrimary]);

  const teaser = useMemo(
    () => TEASERS[teaserIdx % TEASERS.length] ?? '…',
    [teaserIdx],
  );

  const isStopping = state === 'stopping';
  const showRoll = state === 'idle' || state === 'spinning' || state === 'stopping';
  const interactive = state === 'idle' || state === 'spinning';

  return (
    <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center">
      {/* Top-right controls — mode toggle + wildcard toggle + reset chip */}
      <div className="pointer-events-auto absolute right-3 top-14 z-40 flex flex-wrap items-center justify-end gap-2">
        <ModeToggle mode={mode} onChange={setMode} />
        <button
          type="button"
          className="oracle-chip"
          aria-pressed={includeWild}
          onClick={() => setIncludeWild((v) => !v)}
        >
          {includeWild ? 'WILD ON' : 'WILD OFF'}
        </button>
        <button
          type="button"
          className="oracle-chip"
          onClick={handleReset}
          disabled={state === 'idle' && cooldown === 0}
        >
          RESET · R
        </button>
      </div>

      {/* Pull handle for pull mode */}
      {mode === 'pull' && (state === 'idle' || state === 'answered') && (
        <div
          className="pull-handle"
          onPointerDown={onPullPointerDown}
          onPointerMove={onPullPointerMove}
          onPointerUp={onPullPointerUp}
          onPointerCancel={onPullPointerUp}
        >
          <div className="pull-handle-hint">grab &amp; pull ↓</div>
        </div>
      )}

      <div
        className={`relative flex h-full w-full max-w-md flex-col items-center justify-center px-6 ${isStopping ? 'wobble' : ''}`}
      >
        {/* Roll, centered. Hidden once the answer is revealed so the
            torn sheet has the stage. */}
        <AnimatePresence>
          {showRoll && (
            <motion.div
              key="roll"
              className="relative z-20 flex flex-col items-center"
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div
                className="relative"
                style={{
                  width: ROLL_SIZE,
                  height: ROLL_SIZE,
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
                {/* Perforation lines that scroll down the paper while
                    spinning — sells the rotation without spinning the
                    whole assembly (which has fixed wall brackets). */}
                {(state === 'spinning' || state === 'stopping') && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute"
                    style={{
                      // Paper area in the assembly image: roughly the
                      // central rectangle below the spindle.
                      left: '24%',
                      right: '24%',
                      top: '40%',
                      bottom: '6%',
                      overflow: 'hidden',
                      mixBlendMode: 'multiply',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        transform: `translateY(${((rotation % 36) / 36) * 36}px)`,
                        backgroundImage:
                          'repeating-linear-gradient(to bottom, transparent 0 30px, rgba(35,42,55,0.18) 30px 32px)',
                        opacity: state === 'stopping' ? 0.5 : 0.7,
                        filter:
                          state === 'spinning'
                            ? 'blur(0.4px)'
                            : 'none',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Teaser flashes during spin/stopping */}
              {(state === 'spinning' || state === 'stopping') && (
                <motion.span
                  key={teaser + state}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{
                    opacity: state === 'stopping' ? 0.45 : 0.9,
                    y: 0,
                  }}
                  transition={{ duration: 0.12 }}
                  className="spin-teaser mt-6 text-base sm:text-lg"
                >
                  {state === 'stopping' ? 'locking it in…' : teaser}
                </motion.span>
              )}

              {state === 'idle' && (
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 0.85, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mt-6 font-marker text-base tracking-[0.25em] text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] sm:text-lg"
                >
                  {modeHint(mode)}
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Torn sheet verdict */}
        <AnimatePresence>
          {(state === 'revealing' || state === 'answered') && answer && (
            <motion.div
              key="sheet"
              initial={{
                opacity: 0,
                y: -ROLL_SIZE * 0.6,
                rotate: -3,
                scale: 0.96,
              }}
              animate={{ opacity: 1, y: 0, rotate: -1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.65, ease: [0.2, 0.7, 0.2, 1] }}
              className="absolute left-1/2 z-30 -translate-x-1/2"
              style={{ width: 'min(86vw, 380px)' }}
            >
              <TornSheet>
                <div className="relative w-full">
                  <Stamp kind={answer.kind} />
                  <motion.p
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
                    className="font-marker motion-safe:animate-bobble"
                    style={{
                      color: 'rgba(20, 18, 12, 0.92)',
                      fontSize:
                        answer.kind === 'wild'
                          ? 'clamp(1.2rem, 3.6vw, 1.9rem)'
                          : 'clamp(1.5rem, 4.5vw, 2.4rem)',
                      lineHeight: 1.15,
                      textAlign: 'center',
                    }}
                  >
                    {answer.text}
                  </motion.p>
                </div>
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
                    label={
                      cooldown > 0 ? `Wait ${cooldown}s…` : 'Spin again?'
                    }
                    tone="dark"
                  />
                </motion.div>
              </TornSheet>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confetti */}
        {confettiGo && answer && <Confetti kind={answer.kind} />}
      </div>

      {/* Bottom controls — primary button (tap/hold modes) */}
      {mode !== 'pull' && (
        <div className="pointer-events-auto absolute bottom-10 left-1/2 z-40 -translate-x-1/2">
          {mode === 'tap' ? (
            <button
              type="button"
              onClick={onPrimary}
              disabled={
                cooldown > 0 || state === 'stopping' || state === 'revealing'
              }
              className={`btn-primary ${state === 'spinning' ? 'is-spinning' : ''}`}
            >
              <span>{tapLabel(state, cooldown)}</span>
              <span className="kbd">SPACE</span>
            </button>
          ) : (
            <button
              type="button"
              onPointerDown={onHoldStart}
              onPointerUp={onHoldEnd}
              onPointerLeave={onHoldEnd}
              onPointerCancel={onHoldEnd}
              disabled={
                cooldown > 0 || state === 'stopping' || state === 'spinning'
              }
              className={`btn-primary tension-host ${tension > 0 ? 'is-tense' : ''}`}
            >
              <div
                className="tension-ring"
                style={{ ['--tension' as string]: tension * 100 } as React.CSSProperties}
              />
              <span>{holdLabel(state, cooldown)}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function modeHint(mode: Mode): string {
  if (mode === 'hold') return 'hold to spin';
  if (mode === 'pull') return 'pull the paper ↓';
  return 'tap to spin';
}

function tapLabel(state: UnravelState, cooldown: number): string {
  if (cooldown > 0) return `WAIT… ${cooldown}s`;
  if (state === 'spinning') return 'STOP';
  if (state === 'answered') return 'SPIN AGAIN';
  return 'SPIN';
}

function holdLabel(state: UnravelState, cooldown: number): string {
  if (cooldown > 0) return `WAIT… ${cooldown}s`;
  if (state === 'answered') return 'GO AGAIN';
  return 'HOLD TO SPIN';
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const modes: { id: Mode; label: string }[] = [
    { id: 'tap', label: 'TAP' },
    { id: 'hold', label: 'HOLD' },
    { id: 'pull', label: 'PULL' },
  ];
  return (
    <div className="flex items-center gap-1">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          className="oracle-chip"
          aria-pressed={mode === m.id}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function Stamp({ kind }: { kind: Answer['kind'] }) {
  const cls = kind === 'no' ? 'is-no' : kind === 'wild' ? 'is-wild' : '';
  const [main, sub] =
    kind === 'no'
      ? ['DENIED', 'NO HALL PASS']
      : kind === 'wild'
        ? ['WILDCARD', 'WITH STRINGS']
        : ['GRANTED', 'HALL PASS'];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.3, rotate: kind === 'wild' ? 6 : 12 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: kind === 'wild' ? -6 : -12,
      }}
      transition={{ duration: 0.42, ease: [0.2, 0.7, 0.2, 1], delay: 0.05 }}
      className={`stamp ${cls} absolute right-2 top-0`}
      aria-hidden
    >
      <div>{main}</div>
      <div className="stamp-sub">{sub}</div>
    </motion.div>
  );
}

function Confetti({ kind }: { kind: Answer['kind'] }) {
  const colors =
    kind === 'wild'
      ? ['#ffd166', '#e9a32a', '#b87618', '#ffffff']
      : ['#ffffff', '#ffe89a', '#f5b938', '#c9d2e0'];
  const bits = useMemo(() => {
    return Array.from({ length: 48 }).map((_, i) => ({
      left: 50 + (Math.random() - 0.5) * 60,
      top: 38 + Math.random() * 10,
      delay: Math.random() * 0.4,
      dx: (Math.random() - 0.5) * 900,
      rot: `${Math.random() * 1440 - 720}deg`,
      color: colors[i % colors.length],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {bits.map((b, i) => (
        <div
          key={i}
          className="confetti-bit is-going"
          style={
            {
              left: `${b.left}%`,
              top: `${b.top}%`,
              background: b.color,
              animationDelay: `${b.delay}s`,
              ['--dx' as string]: `${b.dx}px`,
              ['--rot' as string]: b.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

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
