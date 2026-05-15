'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePassFrame } from './PassFrame';
import { getRandomAnswer, type Answer } from '@/lib/answers';

const MAX_DEG_PER_SEC = 1440; // 4 revs/sec
const ACCEL_MS = 380;
const STOP_MIN_MS = 900;
const STOP_MAX_MS = 1500;
const REVEAL_BEAT_MS = 600;

type DieFace = 1 | 2 | 3 | 4 | 5 | 6;
type SceneState = 'idle' | 'rolling' | 'stopping' | 'revealing' | 'answered';

// Resting (rotX, rotY) on the cube to bring face N to the front.
const FACE_REST: Record<DieFace, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

const PIP_SLOTS: Record<DieFace, readonly number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

// ---------- Synthesized audio (rattle / thunk / click / jingle) ----------
function useDiceAudio(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const rattleRef = useRef<{
    master: GainNode;
    lp: BiquadFilterNode;
    ctx: AudioContext;
    stop: () => void;
    handle?: number;
  } | null>(null);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const click = useCallback(() => {
    if (muted) return;
    const ctx = ensureCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 360;
    o.connect(g).connect(ctx.destination);
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.start(t);
    o.stop(t + 0.08);
  }, [muted, ensureCtx]);

  const startRattle = useCallback(() => {
    if (muted) return;
    const ctx = ensureCtx();
    if (rattleRef.current) return;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.18);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    lp.Q.value = 0.4;
    master.connect(lp).connect(ctx.destination);

    let running = true;
    const ref = { master, lp, ctx, stop: () => (running = false) } as {
      master: GainNode;
      lp: BiquadFilterNode;
      ctx: AudioContext;
      stop: () => void;
      handle?: number;
    };
    const tick = () => {
      if (!running) return;
      const ct = ctx.currentTime;
      const burstCount = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < burstCount; i++) {
        const dur = 0.015 + Math.random() * 0.035;
        const t0 = ct + i * 0.012 + Math.random() * 0.005;
        const buf = ctx.createBuffer(
          1,
          Math.max(2, Math.floor(dur * ctx.sampleRate)),
          ctx.sampleRate,
        );
        const d = buf.getChannelData(0);
        for (let n = 0; n < d.length; n++) {
          d[n] = (Math.random() * 2 - 1) * (1 - n / d.length);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.value = 0.4 + Math.random() * 0.35;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 700 + Math.random() * 600;
        src.connect(hp).connect(g).connect(master);
        src.start(t0);
        src.stop(t0 + dur + 0.02);
      }
      ref.handle = window.setTimeout(tick, 60 + Math.random() * 90);
    };
    rattleRef.current = ref;
    tick();
  }, [muted, ensureCtx]);

  const setRattleIntensity = useCallback((v: number) => {
    const r = rattleRef.current;
    if (!r) return;
    const t = r.ctx.currentTime;
    const vv = Math.max(0, Math.min(1, v));
    r.master.gain.cancelScheduledValues(t);
    r.master.gain.linearRampToValueAtTime(0.1 + 0.7 * vv, t + 0.06);
    r.lp.frequency.linearRampToValueAtTime(900 + 2400 * vv, t + 0.06);
  }, []);

  const stopRattle = useCallback(() => {
    const r = rattleRef.current;
    if (!r) return;
    if (r.handle) window.clearTimeout(r.handle);
    r.stop();
    const t = r.ctx.currentTime;
    r.master.gain.cancelScheduledValues(t);
    r.master.gain.linearRampToValueAtTime(0, t + 0.18);
    rattleRef.current = null;
  }, []);

  const tone = useCallback(
    (
      freq: number,
      dur: number,
      type: OscillatorType = 'sine',
      gain = 0.16,
      delay = 0,
    ) => {
      if (muted) return;
      const ctx = ensureCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.connect(g).connect(ctx.destination);
      const t0 = ctx.currentTime + delay;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    },
    [muted, ensureCtx],
  );

  const thunk = useCallback(() => {
    if (muted) return;
    const ctx = ensureCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 130;
    o.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.18);
    o.connect(g).connect(ctx.destination);
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.34, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.start(t);
    o.stop(t + 0.3);

    const bs = Math.floor(0.05 * ctx.sampleRate);
    const buf = ctx.createBuffer(1, bs, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bs);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const sg = ctx.createGain();
    sg.gain.value = 0.35;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1600;
    src.connect(hp).connect(sg).connect(ctx.destination);
    src.start(t);
  }, [muted, ensureCtx]);

  const jingle = useCallback(
    (mercy: boolean) => {
      if (muted) return;
      if (mercy) {
        tone(523, 0.32, 'triangle', 0.18);
        tone(659, 0.3, 'triangle', 0.16, 0.1);
        tone(784, 0.5, 'triangle', 0.2, 0.22);
      } else {
        tone(220, 0.3, 'sawtooth', 0.16);
        tone(174, 0.5, 'sawtooth', 0.22, 0.12);
      }
    },
    [muted, tone],
  );

  useEffect(() => {
    if (muted) stopRattle();
  }, [muted, stopRattle]);
  useEffect(() => () => stopRattle(), [stopRattle]);

  return {
    ensureCtx,
    click,
    startRattle,
    stopRattle,
    setRattleIntensity,
    thunk,
    jingle,
  };
}

// Advance a rotation `cur` so it lands on `rest` (mod 360) with at
// least `min` degrees of additional travel in `dir`'s sign.
function targetRotation(
  cur: number,
  rest: number,
  dir: number,
  min: number,
): number {
  const sign = dir >= 0 ? 1 : -1;
  let candidate = Math.round(cur / 360) * 360 + rest;
  while (sign > 0 ? candidate < cur + min : candidate > cur - min) {
    candidate += sign * 360;
  }
  return candidate;
}

function pickFace(): DieFace {
  return ((1 + Math.floor(Math.random() * 6)) as DieFace);
}

function pickVerdictForFace(face: DieFace): Answer {
  // Face 6 = mercy → yes. Faces 1–5 = no.
  const want = face === 6 ? 'yes' : 'no';
  // Sample until we get the right kind. Wildcards excluded.
  for (let i = 0; i < 32; i++) {
    const a = getRandomAnswer({ includeWild: false });
    if (a.kind === want) return a;
  }
  return want === 'yes'
    ? { text: 'Yes. The bowl shows mercy.', kind: 'yes' }
    : { text: 'No. The bowl is unmoved.', kind: 'no' };
}

export default function DiceScene() {
  const { reducedMotion } = usePassFrame();
  const audio = useDiceAudio(false);

  const [state, setState] = useState<SceneState>('idle');
  const [rotX, setRotX] = useState(-22);
  const [rotY, setRotY] = useState(-28);
  const [face, setFace] = useState<DieFace | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [confettiGo, setConfettiGo] = useState(false);
  const [rollCount, setRollCount] = useState(0);
  const [scale, setScale] = useState(1);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const stateRef = useRef<SceneState>('idle');
  const rotXRef = useRef(-22);
  const rotYRef = useRef(-28);
  const velXRef = useRef(0);
  const velYRef = useRef(0);
  const dirXRef = useRef(1);
  const dirYRef = useRef(1);
  const stopStartRef = useRef(0);
  const stopDurRef = useRef(STOP_MIN_MS);
  const fromXRef = useRef(0);
  const fromYRef = useRef(0);
  const targetXRef = useRef(0);
  const targetYRef = useRef(0);
  const resultFaceRef = useRef<DieFace>(1);
  const revealTimerRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Auto-scale the 1280x800 stage to fit viewport.
  useEffect(() => {
    const apply = () => {
      const s = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
      setScale(s);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  const tick = useCallback(
    (ts: number) => {
      const last = lastTsRef.current ?? ts;
      const dt = Math.min(0.06, (ts - last) / 1000);
      lastTsRef.current = ts;
      const s = stateRef.current;

      if (s === 'rolling') {
        const k = 1 / (ACCEL_MS / 1000);
        const targetVel = MAX_DEG_PER_SEC;
        velXRef.current +=
          (dirXRef.current * targetVel - velXRef.current) *
          Math.min(1, k * dt);
        velYRef.current +=
          (dirYRef.current * targetVel - velYRef.current) *
          Math.min(1, k * dt);
        rotXRef.current += velXRef.current * dt;
        rotYRef.current += velYRef.current * dt;
        setRotX(rotXRef.current);
        setRotY(rotYRef.current);
        audio.setRattleIntensity(
          Math.abs(velXRef.current) / MAX_DEG_PER_SEC,
        );
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (s === 'stopping') {
        const start = stopStartRef.current;
        const elapsed = ts - start;
        const tt = Math.min(1, elapsed / stopDurRef.current);
        const eased = 1 - Math.pow(1 - tt, 3);
        rotXRef.current =
          fromXRef.current + (targetXRef.current - fromXRef.current) * eased;
        rotYRef.current =
          fromYRef.current + (targetYRef.current - fromYRef.current) * eased;
        setRotX(rotXRef.current);
        setRotY(rotYRef.current);
        audio.setRattleIntensity((1 - eased) * 0.9);

        if (tt >= 1) {
          const f = resultFaceRef.current;
          setFace(f);
          audio.stopRattle();
          audio.thunk();
          const v = pickVerdictForFace(f);
          setAnswer(v);
          if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
          revealTimerRef.current = window.setTimeout(() => {
            setState('revealing');
            stateRef.current = 'revealing';
            audio.jingle(f === 6);
            if (f === 6) {
              setConfettiGo(true);
              window.setTimeout(() => setConfettiGo(false), 2400);
            }
            window.setTimeout(() => {
              setState('answered');
              stateRef.current = 'answered';
            }, 700);
          }, REVEAL_BEAT_MS);
          rafRef.current = null;
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
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      audio.stopRattle();
    };
  }, [audio]);

  const handleTap = useCallback(() => {
    if (state === 'idle') {
      audio.ensureCtx();
      audio.click();

      if (reducedMotion) {
        const f = pickFace();
        const v = pickVerdictForFace(f);
        const rest = FACE_REST[f];
        rotXRef.current = rest.x;
        rotYRef.current = rest.y;
        setRotX(rest.x);
        setRotY(rest.y);
        setFace(f);
        setAnswer(v);
        audio.thunk();
        setState('revealing');
        stateRef.current = 'revealing';
        audio.jingle(f === 6);
        if (f === 6) {
          setConfettiGo(true);
          window.setTimeout(() => setConfettiGo(false), 2400);
        }
        window.setTimeout(() => {
          setState('answered');
          stateRef.current = 'answered';
        }, 350);
        setRollCount((n) => n + 1);
        return;
      }

      audio.startRattle();
      dirXRef.current = Math.random() > 0.5 ? 1 : -1;
      dirYRef.current = Math.random() > 0.5 ? 1 : -1;
      velXRef.current = 0;
      velYRef.current = 0;
      setState('rolling');
      stateRef.current = 'rolling';
      startLoop();
      return;
    }

    if (state === 'rolling') {
      audio.click();
      const f = pickFace();
      resultFaceRef.current = f;
      const rest = FACE_REST[f];
      fromXRef.current = rotXRef.current;
      fromYRef.current = rotYRef.current;
      targetXRef.current = targetRotation(
        rotXRef.current,
        rest.x,
        dirXRef.current,
        540,
      );
      targetYRef.current = targetRotation(
        rotYRef.current,
        rest.y,
        dirYRef.current,
        540,
      );
      stopStartRef.current = performance.now();
      stopDurRef.current =
        STOP_MIN_MS + Math.random() * (STOP_MAX_MS - STOP_MIN_MS);
      setState('stopping');
      stateRef.current = 'stopping';
      setRollCount((n) => n + 1);
    }
  }, [state, audio, reducedMotion, startLoop]);

  const handleReset = useCallback(() => {
    audio.click();
    audio.stopRattle();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    rafRef.current = null;
    velXRef.current = 0;
    velYRef.current = 0;
    rotXRef.current = -22;
    rotYRef.current = -28;
    setRotX(-22);
    setRotY(-28);
    setFace(null);
    setAnswer(null);
    setConfettiGo(false);
    setState('idle');
    stateRef.current = 'idle';
  }, [audio]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTap();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleTap, handleReset]);

  const showHint = state === 'idle' || state === 'rolling';
  const hintText = state === 'idle' ? 'tap to roll' : 'tap to stop';
  const dieDim = state === 'revealing' || state === 'answered';
  const slipOpen = state === 'revealing' || state === 'answered';

  return (
    <div className="dice-viewport">
      <div
        className={`dice-stage-root state-${state} ${state === 'stopping' ? 'wobble' : ''}`}
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div className="dice-header">
          <div className="dice-brand-dot" />
          <div className="dice-brand">FlushPass · Dice Oracle</div>
          <div className="dice-brand-dot" />
        </div>

        <div className="dice-meta">
          <div className="doors-chip">ROLL #{rollCount}</div>
          <button
            type="button"
            className="doors-chip"
            onClick={handleReset}
            disabled={state === 'idle'}
          >
            RESET · R
          </button>
        </div>

        <div className="dice-top-right">
          <div className="doors-chip">
            {reducedMotion ? 'REDUCED MOTION' : 'TAP MODE'}
          </div>
          <div className="doors-chip">
            MERCY: <span className="dice-mercy-star">★ 6</span>
          </div>
        </div>

        <button
          type="button"
          className="dice-tap-area"
          onClick={handleTap}
          disabled={state === 'stopping' || state === 'revealing'}
          aria-label={
            state === 'idle'
              ? 'Tap to roll the die'
              : state === 'rolling'
                ? 'Tap to stop'
                : 'Wait'
          }
        />

        <div className="dice-stage-inner">
          <div className="dice-floor" />
          <div
            className="dice-die-host"
            style={{
              transform: `scale(${dieDim ? 0.78 : 1})`,
              opacity: dieDim ? 0.55 : 1,
            }}
          >
            <Die rotX={rotX} rotY={rotY} />
          </div>
        </div>

        {showHint && <div className="dice-hint">{hintText}</div>}

        {slipOpen && face != null && answer && (
          <HallPassSlip
            face={face}
            answer={answer}
            answered={state === 'answered'}
            onReset={handleReset}
          />
        )}

        {confettiGo && <MercyConfetti />}
      </div>
    </div>
  );
}

function Die({ rotX, rotY }: { rotX: number; rotY: number }) {
  return (
    <div
      className="die-wrap"
      style={{ transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)` }}
    >
      <div className="die">
        {([1, 2, 3, 4, 5, 6] as DieFace[]).map((v) => (
          <PipFace key={v} value={v} />
        ))}
      </div>
    </div>
  );
}

function PipFace({ value }: { value: DieFace }) {
  const slots = PIP_SLOTS[value];
  const isGold = value === 6;
  return (
    <div className={`die-face face-${value}`}>
      <div className="die-pips">
        {Array.from({ length: 9 }).map((_, i) => {
          const slot = i + 1;
          const has = slots.includes(slot);
          return (
            <div key={i} className="pip-slot">
              {has && <div className={`pip ${isGold ? 'gold' : ''}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HallPassSlip({
  face,
  answer,
  answered,
  onReset,
}: {
  face: DieFace;
  answer: Answer;
  answered: boolean;
  onReset: () => void;
}) {
  const mercy = face === 6;
  return (
    <div className={`dice-slip-wrap ${answered ? 'is-open' : ''}`}>
      <div className="dice-slip">
        <div className="dice-slip-head">
          <div>
            <div className="dice-slip-eyebrow">
              Bowl Authority · Hallway Division
            </div>
            <div className="dice-slip-title">HALL PASS</div>
          </div>
          <div className="dice-slip-roll">
            ROLL:<b>{face}</b>
          </div>
        </div>

        <div className={`dice-slip-stamp ${mercy ? 'is-mercy' : ''}`}>
          {mercy ? 'GRANTED' : 'DENIED'}
          <small>{mercy ? 'BY MERCY' : 'NO PASS'}</small>
        </div>

        <p className="dice-slip-verdict">{answer.text}</p>

        <div className="dice-slip-foot">
          <div className="dice-slip-sigline">
            <em>{mercy ? 'P. Plumbing' : '— · —'}</em>
            <span>Signed</span>
          </div>
          <div className="dice-slip-sigline" style={{ maxWidth: 180 }}>
            <em style={{ fontSize: 22 }}>
              {new Date().toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </em>
            <span>Date</span>
          </div>
        </div>

        {answered && (
          <button
            type="button"
            className="dice-slip-reset"
            onClick={onReset}
          >
            Roll again?
          </button>
        )}
      </div>
    </div>
  );
}

function MercyConfetti() {
  const colors = useMemo(
    () => ['#f1d27f', '#c39a4b', '#ffffff', '#ffe89a'],
    [],
  );
  const bits = useMemo(
    () =>
      Array.from({ length: 48 }).map((_, i) => ({
        left: 50 + (Math.random() - 0.5) * 70,
        top: 38 + Math.random() * 10,
        delay: Math.random() * 0.4,
        dx: (Math.random() - 0.5) * 1400,
        dy: 500 + Math.random() * 300,
        rot: `${Math.random() * 1440 - 720}deg`,
        color: colors[i % colors.length],
      })),
    [colors],
  );
  return (
    <div className="dice-confetti">
      {bits.map((b, i) => (
        <div
          key={i}
          className="dice-confetti-bit"
          style={
            {
              left: `${b.left}%`,
              top: `${b.top}%`,
              background: b.color,
              animationDelay: `${b.delay}s`,
              ['--dx' as string]: `${b.dx}px`,
              ['--dy' as string]: `${b.dy}px`,
              ['--rot' as string]: b.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
