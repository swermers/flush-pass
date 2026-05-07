'use client';

import { useCallback, useEffect, useRef } from 'react';

export type AudioName = 'doorClang' | 'flush' | 'ambient' | 'reveal';

const SOURCES: Record<AudioName, string> = {
  doorClang: '/audio/door-clang.wav',
  flush: '/audio/flush.wav',
  ambient: '/audio/ambient.wav',
  reveal: '/audio/reveal.wav',
};

export interface AudioApi {
  unlock: () => void;
  play: (name: AudioName, volume?: number) => void;
  playLoop: (name: AudioName, volume?: number) => void;
  stop: (name: AudioName) => void;
  stopAll: () => void;
  toggleMute: () => boolean;
  isMuted: () => boolean;
}

export function useAudio(): AudioApi {
  const elements = useRef<Partial<Record<AudioName, HTMLAudioElement>>>({});
  const muted = useRef(false);
  const unlocked = useRef(false);

  useEffect(() => {
    (Object.keys(SOURCES) as AudioName[]).forEach((name) => {
      const el = new Audio(SOURCES[name]);
      el.preload = 'auto';
      elements.current[name] = el;
    });
    return () => {
      Object.values(elements.current).forEach((el) => {
        if (el) {
          el.pause();
          el.src = '';
        }
      });
      elements.current = {};
    };
  }, []);

  const unlock = useCallback(() => {
    unlocked.current = true;
  }, []);

  const play = useCallback((name: AudioName, volume = 0.7) => {
    const el = elements.current[name];
    if (!el || muted.current) return;
    try {
      el.volume = volume;
      el.loop = false;
      el.currentTime = 0;
      void el.play().catch(() => {});
    } catch {
      // Ignore — silent stub may be empty in dev.
    }
  }, []);

  const playLoop = useCallback((name: AudioName, volume = 0.15) => {
    const el = elements.current[name];
    if (!el || muted.current) return;
    try {
      el.volume = volume;
      el.loop = true;
      void el.play().catch(() => {});
    } catch {
      // Ignore.
    }
  }, []);

  const stop = useCallback((name: AudioName) => {
    const el = elements.current[name];
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, []);

  const stopAll = useCallback(() => {
    Object.values(elements.current).forEach((el) => {
      if (!el) return;
      el.pause();
      el.currentTime = 0;
    });
  }, []);

  const toggleMute = useCallback(() => {
    muted.current = !muted.current;
    Object.values(elements.current).forEach((el) => {
      if (el) el.muted = muted.current;
    });
    return muted.current;
  }, []);

  const isMuted = useCallback(() => muted.current, []);

  return { unlock, play, playLoop, stop, stopAll, toggleMute, isMuted };
}
