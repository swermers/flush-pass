'use client';

import { AnimatePresence } from 'framer-motion';
import { useCallback, useState } from 'react';
import { usePassFrame } from '@/components/PassFrame';
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

const OPEN_MS = 850;
const FLUSH_MS = 750;
const FLASH_PEAK = 0.6;

export default function Scene() {
  const { audio, reducedMotion, startAmbient } = usePassFrame();
  const [state, setState] = useState<SceneState>('shot1');
  const [answer, setAnswer] = useState<string>('');
  const [resetting, setResetting] = useState(false);
  const [flash, setFlash] = useState(0);

  usePreloadImages(IMAGES);

  const triggerFlash = useCallback((duration: number) => {
    setFlash(FLASH_PEAK);
    window.setTimeout(() => setFlash(0), duration);
  }, []);

  const handleDoorClick = useCallback(() => {
    if (state !== 'shot1') return;
    startAmbient();
    audio.play('doorClang', 0.7);
    if (reducedMotion) {
      setState('shot2');
      return;
    }
    setState('opening');
    triggerFlash(220);
    window.setTimeout(() => setState('shot2'), OPEN_MS);
  }, [state, audio, reducedMotion, startAmbient, triggerFlash]);

  const handleFlushClick = useCallback(() => {
    if (state !== 'shot2') return;
    audio.play('flush', 0.85);
    if (reducedMotion) {
      const picked = getRandomAnswer();
      setAnswer(picked);
      setState('answered');
      audio.play('reveal', 0.5);
      return;
    }
    setState('flushing');
    triggerFlash(180);
    window.setTimeout(() => setState('swirling'), FLUSH_MS);
  }, [state, audio, reducedMotion, triggerFlash]);

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
    }, 220);
  }, [state, reducedMotion]);

  const showShot1 = state === 'shot1' || state === 'opening';
  const showShot2 = state === 'shot2' || state === 'flushing';
  const showShot3 =
    state === 'swirling' || state === 'revealing' || state === 'answered';

  return (
    <>
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

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40 bg-black transition-opacity duration-150 ease-out"
        style={{ opacity: resetting ? 1 : flash }}
      />
    </>
  );
}
