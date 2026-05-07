'use client';

import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { usePreloadImages } from '@/hooks/usePreloadImages';
import { getRandomAnswer } from '@/lib/answers';
import Shot1Door from './Shot1Door';
import Shot2Interior from './Shot2Interior';
import Shot3Bowl from './Shot3Bowl';

export type SceneState =
  | 'shot1'
  | 'opening'
  | 'shot2'
  | 'flushing'
  | 'swirling'
  | 'revealing'
  | 'answered';

const IMAGES = [
  '/images/shot-1-door-closed.webp',
  '/images/shot-2-interior.webp',
  '/images/shot-3-bowl.webp',
] as const;

export default function Scene() {
  const [state, setState] = useState<SceneState>('shot1');
  const [answer, setAnswer] = useState<string>('');
  const [muted, setMuted] = useState(false);
  const [resetting, setResetting] = useState(false);
  const audio = useAudio();
  const reducedMotion = useReducedMotion();

  usePreloadImages(IMAGES);

  // Start ambient loop once user has interacted (autoplay unlock).
  useEffect(() => {
    if (state !== 'shot1' && state !== 'answered') {
      audio.playLoop('ambient', 0.15);
    }
  }, [state, audio]);

  const handleDoorClick = useCallback(() => {
    if (state !== 'shot1') return;
    audio.unlock();
    audio.play('doorClang', 0.7);
    audio.playLoop('ambient', 0.15);
    if (reducedMotion) {
      setState('shot2');
      return;
    }
    setState('opening');
    window.setTimeout(() => setState('shot2'), 600);
  }, [state, audio, reducedMotion]);

  const handleFlushClick = useCallback(() => {
    if (state !== 'shot2') return;
    audio.play('flush', 0.8);
    if (reducedMotion) {
      const picked = getRandomAnswer();
      setAnswer(picked);
      setState('answered');
      audio.play('reveal', 0.5);
      return;
    }
    setState('flushing');
    window.setTimeout(() => setState('swirling'), 500);
  }, [state, audio, reducedMotion]);

  const handleSwirlComplete = useCallback(() => {
    const picked = getRandomAnswer();
    setAnswer(picked);
    setState('revealing');
    audio.play('reveal', 0.5);
    window.setTimeout(() => setState('answered'), 1200);
  }, [audio]);

  const handleReset = useCallback(() => {
    if (state !== 'answered') return;
    if (reducedMotion) {
      setAnswer('');
      setState('shot1');
      return;
    }
    setResetting(true);
    window.setTimeout(() => {
      setAnswer('');
      setState('shot1');
      window.setTimeout(() => setResetting(false), 400);
    }, 200);
  }, [state, reducedMotion]);

  const handleMute = useCallback(() => {
    const next = audio.toggleMute();
    setMuted(next);
  }, [audio]);

  const showShot1 = state === 'shot1' || state === 'opening';
  const showShot2 = state === 'shot2' || state === 'flushing';
  const showShot3 =
    state === 'swirling' || state === 'revealing' || state === 'answered';

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-black">
      <div className="vignette absolute inset-0">
        <AnimatePresence mode="sync">
          {showShot1 && (
            <Shot1Door
              key="shot1"
              onActivate={handleDoorClick}
              opening={state === 'opening'}
            />
          )}
          {showShot2 && (
            <Shot2Interior
              key="shot2"
              onFlush={handleFlushClick}
              flushing={state === 'flushing'}
            />
          )}
          {showShot3 && (
            <Shot3Bowl
              key="shot3"
              state={state}
              answer={answer}
              onSwirlComplete={handleSwirlComplete}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={handleMute}
        aria-label={muted ? 'Unmute audio' : 'Mute audio'}
        aria-pressed={muted}
        className="absolute right-3 top-3 z-50 rounded-full bg-black/40 p-2 text-white/80 backdrop-blur transition hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        {muted ? <MutedIcon /> : <SoundIcon />}
      </button>

      {resetting && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-40 bg-black opacity-100 transition-opacity duration-300"
        />
      )}
    </main>
  );
}

function SoundIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M3 10v4a1 1 0 0 0 1 1h3l4 4V5L7 9H4a1 1 0 0 0-1 1Zm13.5 2a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12Zm-2.5-7.5v2.07a7 7 0 0 1 0 10.86v2.07a9 9 0 0 0 0-15Z" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M16.5 12a4.5 4.5 0 0 0-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63ZM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.96 8.96 0 0 0 21 12c0-4.28-3-7.86-7-8.77v2.06A6.99 6.99 0 0 1 19 12ZM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.17v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73 4.27 3ZM12 4l-2.71 2.71L12 9.41V4Z" />
    </svg>
  );
}
