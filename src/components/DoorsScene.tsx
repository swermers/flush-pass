'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePassFrame } from './PassFrame';
import { getRandomAnswer, type Answer } from '@/lib/answers';

const SWING_MS = 720;
const REVEAL_DELAY_MS = 220;
const ANSWERED_DELAY_MS = 1100;
const CLOSE_MS = 600;

type DoorId = 1 | 2 | 3;
type Hinge = 'left' | 'right';
type DoodleKind = 'text' | 'shape-heart' | 'shape-star';

interface DoorData {
  id: DoorId;
  cls: string;
  hinge: Hinge;
  num: string;
  doodleKind: DoodleKind;
  doodle: string;
  indicatorLabel: string;
}

const DOORS: readonly DoorData[] = [
  {
    id: 1,
    cls: 'd1 tilt-left',
    hinge: 'left',
    num: '1',
    doodleKind: 'text',
    doodle: 'wuz here',
    indicatorLabel: 'IN USE',
  },
  {
    id: 2,
    cls: 'd2',
    hinge: 'left',
    num: '2',
    doodleKind: 'shape-heart',
    doodle: '♡ + ?',
    indicatorLabel: 'VACANT',
  },
  {
    id: 3,
    cls: 'd3 tilt-right',
    hinge: 'right',
    num: '3',
    doodleKind: 'shape-star',
    doodle: '★ free period',
    indicatorLabel: 'IN USE',
  },
];

type SceneState = 'idle' | 'opening' | 'revealing' | 'answered' | 'closing';

// ---------- Synthesized audio (clang / reveal / ambient hum) ----------
function useDoorsAudio(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const humRef = useRef<{
    o1: OscillatorNode;
    o2: OscillatorNode;
    g: GainNode;
    ctx: AudioContext;
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
    o.frequency.value = 380;
    o.connect(g).connect(ctx.destination);
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.start(t);
    o.stop(t + 0.08);
  }, [muted, ensureCtx]);

  const clang = useCallback(() => {
    if (muted) return;
    const ctx = ensureCtx();
    const t0 = ctx.currentTime;

    // Low body
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = 'sawtooth';
    o1.frequency.value = 110;
    o1.frequency.exponentialRampToValueAtTime(70, t0 + 0.35);
    o1.connect(g1).connect(ctx.destination);
    g1.gain.setValueAtTime(0.0001, t0);
    g1.gain.linearRampToValueAtTime(0.18, t0 + 0.01);
    g1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    o1.start(t0);
    o1.stop(t0 + 0.5);

    // Metallic resonance
    [620, 920, 1450, 2380].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.02);
      o.connect(g).connect(ctx.destination);
      const dur = 0.6 + Math.random() * 0.2;
      g.gain.setValueAtTime(0, t0 + i * 0.004);
      g.gain.linearRampToValueAtTime(0.08 / (i + 1), t0 + 0.005 + i * 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.start(t0 + i * 0.004);
      o.stop(t0 + dur + 0.05);
    });

    // Click impact
    const bs = Math.floor(0.06 * ctx.sampleRate);
    const buf = ctx.createBuffer(1, bs, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bs; i++)
      d[i] = (Math.random() * 2 - 1) * (1 - i / bs);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const sg = ctx.createGain();
    sg.gain.value = 0.4;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    src.connect(hp).connect(sg).connect(ctx.destination);
    src.start(t0);
  }, [muted, ensureCtx]);

  const reveal = useCallback(() => {
    if (muted) return;
    const ctx = ensureCtx();
    const t0 = ctx.currentTime;
    [440, 660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      o.connect(g).connect(ctx.destination);
      const d = 0.5;
      g.gain.setValueAtTime(0, t0 + i * 0.06);
      g.gain.linearRampToValueAtTime(0.1 - i * 0.025, t0 + 0.04 + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + i * 0.06);
      o.start(t0 + i * 0.06);
      o.stop(t0 + d + i * 0.06 + 0.05);
    });
  }, [muted, ensureCtx]);

  const stopAmbient = useCallback(() => {
    const h = humRef.current;
    if (!h) return;
    const t = h.ctx.currentTime;
    h.g.gain.cancelScheduledValues(t);
    h.g.gain.linearRampToValueAtTime(0, t + 0.4);
    h.o1.stop(t + 0.5);
    h.o2.stop(t + 0.5);
    humRef.current = null;
  }, []);

  const startAmbient = useCallback(() => {
    if (muted) return;
    const ctx = ensureCtx();
    if (humRef.current) return;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o1.type = 'sine';
    o1.frequency.value = 60;
    o2.type = 'sine';
    o2.frequency.value = 120;
    g.gain.value = 0;
    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);
    const t = ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.025, t + 1.2);
    o1.start();
    o2.start();
    humRef.current = { o1, o2, g, ctx };
  }, [muted, ensureCtx]);

  useEffect(() => {
    if (muted) stopAmbient();
  }, [muted, stopAmbient]);

  useEffect(() => () => stopAmbient(), [stopAmbient]);

  return { ensureCtx, click, clang, reveal, startAmbient };
}

export default function DoorsScene() {
  const { reducedMotion } = usePassFrame();
  const audio = useDoorsAudio(false);

  const [state, setState] = useState<SceneState>('idle');
  const [picked, setPicked] = useState<DoorId | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [pickCount, setPickCount] = useState(0);
  const [scale, setScale] = useState(1);

  const timers = useRef<number[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Auto-scale the 1620x980 stage to fit viewport.
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const s = Math.min(w / 1620, h / 980);
      setScale(s);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  const handlePick = useCallback(
    (doorId: DoorId) => {
      if (state !== 'idle') return;
      audio.ensureCtx();
      audio.startAmbient();
      audio.clang();

      const v = getRandomAnswer({ includeWild: false });
      setPicked(doorId);
      setAnswer(v);
      setPickCount((n) => n + 1);

      if (reducedMotion) {
        setState('answered');
        audio.reveal();
        return;
      }

      setState('opening');
      timers.current.push(
        window.setTimeout(() => {
          setState('revealing');
          audio.reveal();
        }, REVEAL_DELAY_MS),
      );
      timers.current.push(
        window.setTimeout(() => {
          setState('answered');
        }, ANSWERED_DELAY_MS),
      );
    },
    [audio, reducedMotion, state],
  );

  const handleReset = useCallback(() => {
    audio.click();
    clearTimers();
    if (reducedMotion) {
      setPicked(null);
      setAnswer(null);
      setState('idle');
      return;
    }
    setState('closing');
    timers.current.push(
      window.setTimeout(() => {
        setPicked(null);
        setAnswer(null);
      }, 50),
    );
    timers.current.push(
      window.setTimeout(() => setState('idle'), CLOSE_MS + 50),
    );
  }, [audio, clearTimers, reducedMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        state === 'idle' &&
        (e.key === '1' || e.key === '2' || e.key === '3')
      ) {
        e.preventDefault();
        handlePick(parseInt(e.key, 10) as DoorId);
      } else if ((e.key === 'r' || e.key === 'R') && state === 'answered') {
        handleReset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, handlePick, handleReset]);

  const slipVisible = state === 'revealing' || state === 'answered';
  const dxByDoor: Record<DoorId, number> = { 1: -440, 2: 0, 3: 440 };
  const dx = picked != null ? dxByDoor[picked] : 0;

  return (
    <div className="doors-viewport">
      <div
        className={`doors-stage state-${state}`}
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div className="doors-wall" />
        <div className="doors-floor" />

        <div className="doors-header">
          <div className="doors-brand-dot" />
          <div className="doors-brand">FlushPass · Doors Oracle</div>
          <div className="doors-brand-dot" />
        </div>

        <div className="doors-meta">
          <div className="doors-chip">PICK #{pickCount}</div>
          <button
            type="button"
            className="doors-chip"
            disabled={state !== 'answered'}
            onClick={state === 'answered' ? handleReset : undefined}
          >
            RESET · R
          </button>
        </div>

        <div className="doors-top-right">
          <div className="doors-chip">
            {reducedMotion ? 'REDUCED MOTION' : 'PICK MODE'}
          </div>
          <div className="doors-chip">FLAVOR ONLY</div>
        </div>

        <div className="doors-rail">
          {DOORS.map((d) => (
            <Door
              key={d.id}
              data={d}
              isPicked={picked === d.id}
              isOther={picked != null && picked !== d.id}
              disabled={state !== 'idle'}
              onPick={() => handlePick(d.id)}
            />
          ))}
        </div>

        {state === 'idle' && <div className="doors-hint">pick a door</div>}

        {slipVisible && picked != null && answer && (
          <HallPassSlip
            doorNum={picked}
            answer={answer}
            answered={state === 'answered'}
            onReset={handleReset}
            dx={dx}
          />
        )}
      </div>
    </div>
  );
}

function Door({
  data,
  isPicked,
  isOther,
  disabled,
  onPick,
}: {
  data: DoorData;
  isPicked: boolean;
  isOther: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <div
      className={`stall ${data.cls} ${isPicked ? 'is-picked' : ''} ${isOther ? 'is-other' : ''}`}
      data-hinge={data.hinge}
    >
      <div className="stall-cavity" />
      <div className="stall-gap" />

      <button
        type="button"
        className="door"
        onClick={onPick}
        disabled={disabled}
        aria-label={`Pick door ${data.num}`}
      >
        <div className="door-inner">
          <div className="door-rail r-top" />
          <div className="door-rail r-bot" />

          <div className="chalk-num" data-num={data.num}>
            {data.num}
          </div>
          {data.doodleKind === 'text' && (
            <div className="chalk-doodle">{data.doodle}</div>
          )}
          {data.doodleKind === 'shape-heart' && (
            <div className="chalk-doodle shape heart">{data.doodle}</div>
          )}
          {data.doodleKind === 'shape-star' && (
            <div className="chalk-doodle shape star">{data.doodle}</div>
          )}

          <div className="door-hinge h-top" />
          <div className="door-hinge h-bot" />
          <div className="door-latch">
            <div className="door-latch-screw" />
            <div className="door-latch-window">{data.indicatorLabel}</div>
            <div className="door-latch-screw" />
          </div>
          <div className="door-hook" />
        </div>
      </button>
    </div>
  );
}

function HallPassSlip({
  doorNum,
  answer,
  answered,
  onReset,
  dx,
}: {
  doorNum: DoorId;
  answer: Answer;
  answered: boolean;
  onReset: () => void;
  dx: number;
}) {
  const yes = answer.kind === 'yes';
  return (
    <div
      className="doors-slip-wrap"
      style={
        { ['--slip-dx' as string]: `${dx}px` } as React.CSSProperties
      }
    >
      <div className="doors-slip">
        <div className="doors-slip-head">
          <div>
            <div className="doors-slip-eyebrow">
              Bowl Authority · Hallway Division
            </div>
            <div className="doors-slip-title">HALL PASS</div>
          </div>
          <div className="doors-slip-roll">
            DOOR:<b>{doorNum}</b>
          </div>
        </div>

        <div className={`doors-slip-stamp ${yes ? 'is-yes' : ''}`}>
          {yes ? 'GRANTED' : 'DENIED'}
          <small>{yes ? `BEHIND DOOR ${doorNum}` : 'NO PASS'}</small>
        </div>

        <p className="doors-slip-verdict">{answer.text}</p>

        <div className="doors-slip-foot">
          <div className="doors-slip-sigline">
            <em>{yes ? 'P. Plumbing' : '— · —'}</em>
            <span>Signed</span>
          </div>
          <div className="doors-slip-sigline" style={{ maxWidth: 180 }}>
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
            className="doors-slip-reset"
            onClick={onReset}
          >
            Try another door?
          </button>
        )}
      </div>
    </div>
  );
}
