'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePassFrame } from './PassFrame';
import { getRandomAnswer, type Answer } from '@/lib/answers';
import ResetButton from './ResetButton';

const TP_VIDEO = '/videos/tp-spin-2.mp4';
const TP_POSTER = '/images/tp-spin-final.png';

type UnravelState = 'idle' | 'spinning' | 'revealing' | 'answered';

export default function UnravelScene() {
  const { audio, reducedMotion, startAmbient } = usePassFrame();
  const [state, setState] = useState<UnravelState>('idle');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [includeWild, setIncludeWild] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const includeWildRef = useRef(true);

  useEffect(() => {
    includeWildRef.current = includeWild;
  }, [includeWild]);

  const settleVerdict = useCallback(() => {
    const picked = getRandomAnswer({ includeWild: includeWildRef.current });
    setAnswer(picked);
    setState('revealing');
    audio.stop('paperRustle');
    audio.play('paperRip', 0.75);
    audio.play('reveal', 0.5);
    window.setTimeout(() => {
      setState('answered');
      setShowModal(true);
    }, 1200);
  }, [audio]);

  const handleVideoEnded = useCallback(() => {
    settleVerdict();
  }, [settleVerdict]);

  const beginSpin = useCallback(() => {
    startAmbient();
    audio.play('click', 0.6);

    if (reducedMotion) {
      settleVerdict();
      return;
    }

    audio.playLoop('paperRustle', 0.35);
    setAnswer(null);
    setShowModal(false);
    setState('spinning');

    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      void v.play();
    }
  }, [audio, reducedMotion, settleVerdict, startAmbient]);

  const handleReset = useCallback(() => {
    audio.stop('paperRustle');
    audio.play('click', 0.5);
    setAnswer(null);
    setShowModal(false);
    setState('idle');
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }, [audio]);

  useEffect(() => {
    return () => {
      audio.stop('paperRustle');
    };
  }, [audio]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') handleReset();
      if (state === 'idle' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        beginSpin();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [beginSpin, handleReset, state]);

  const showTextOnSheet = state === 'revealing' || state === 'answered';

  return (
    <div className="absolute inset-0 z-10 h-full w-full">
      {/* Full-bleed background video */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={TP_VIDEO}
        poster={TP_POSTER}
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoEnded}
        aria-hidden
      />

      {/* Verdict text overlay — positioned over the hanging sheet in
          the video. Percentages are relative to the viewport; nudge if
          the video composition changes. */}
      <AnimatePresence>
        {showTextOnSheet && answer && (
          <motion.div
            key="sheet-text"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="pointer-events-none absolute"
            style={{
              left: '34%',
              right: '34%',
              top: '42%',
              bottom: '20%',
            }}
          >
            <div
              className="flex h-full w-full items-center justify-center text-center font-marker"
              style={{
                color: 'rgba(28, 22, 14, 0.92)',
                fontSize: 'clamp(0.9rem, 2vw, 1.4rem)',
                lineHeight: 1.15,
                transform: 'rotate(-1.5deg)',
                textShadow: '0 1px 0 rgba(255,245,210,0.6)',
              }}
            >
              {answer.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-right chips */}
      <div className="pointer-events-auto absolute right-3 top-14 z-40 flex flex-wrap items-center justify-end gap-2">
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
          disabled={state === 'idle'}
        >
          RESET · R
        </button>
      </div>

      {/* Spin button (idle only) */}
      <AnimatePresence>
        {state === 'idle' && (
          <motion.div
            key="spin-btn"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto absolute bottom-10 left-1/2 z-40 -translate-x-1/2"
          >
            <button
              type="button"
              onClick={beginSpin}
              className="btn-primary"
              aria-label="Spin the toilet paper"
            >
              <span>SPIN</span>
              <span className="kbd">SPACE</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pop-up sheet modal */}
      <AnimatePresence>
        {showModal && answer && (
          <SheetModal answer={answer} onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SheetModal({
  answer,
  onReset,
}: {
  answer: Answer;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm"
      onClick={onReset}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -2, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, rotate: -1, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative mx-4 w-[min(86vw,420px)]"
      >
        <TornSheet>
          <Stamp kind={answer.kind} />
          <p
            className="font-marker"
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
          </p>
          <div className="mt-6">
            <ResetButton onClick={onReset} label="Spin again?" tone="dark" />
          </div>
        </TornSheet>
      </motion.div>
    </motion.div>
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
      animate={{ opacity: 1, scale: 1, rotate: kind === 'wild' ? -6 : -12 }}
      transition={{ duration: 0.42, ease: [0.2, 0.7, 0.2, 1], delay: 0.05 }}
      className={`stamp ${cls} absolute right-2 top-0`}
      aria-hidden
    >
      <div>{main}</div>
      <div className="stamp-sub">{sub}</div>
    </motion.div>
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
