'use client';

import { useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAudio, type AudioApi } from '@/hooks/useAudio';

interface PassFrameApi {
  audio: AudioApi;
  reducedMotion: boolean;
  ambientStarted: boolean;
  startAmbient: () => void;
}

const PassFrameContext = createContext<PassFrameApi | null>(null);

export function usePassFrame(): PassFrameApi {
  const ctx = useContext(PassFrameContext);
  if (!ctx) {
    throw new Error('usePassFrame must be used inside <PassFrame>');
  }
  return ctx;
}

const OTHER_ROUTE: Record<string, string> = {
  '/oracle': '/unravel',
  '/unravel': '/oracle',
};

export default function PassFrame({ children }: { children: ReactNode }) {
  const audio = useAudio();
  const reducedMotion = useReducedMotion() ?? false;
  const [muted, setMuted] = useState(false);
  const ambientStarted = useRef(false);
  const [ambientActive, setAmbientActive] = useState(false);
  const pathname = usePathname();
  const otherRoute = pathname ? OTHER_ROUTE[pathname] : undefined;
  const showNav = otherRoute !== undefined;

  const startAmbient = useCallback(() => {
    if (ambientStarted.current) return;
    ambientStarted.current = true;
    audio.unlock();
    audio.playLoop('ambient', 0.18);
    setAmbientActive(true);
  }, [audio]);

  const handleMute = useCallback(() => {
    const next = audio.toggleMute();
    setMuted(next);
  }, [audio]);

  // Keep ambient muted state in sync if user toggles before starting
  useEffect(() => {
    if (!ambientActive) return;
    // Ambient is already running; toggleMute on the audio API mutes it.
  }, [ambientActive]);

  return (
    <PassFrameContext.Provider
      value={{
        audio,
        reducedMotion,
        ambientStarted: ambientActive,
        startAmbient,
      }}
    >
      <div className="relative h-dvh w-screen overflow-hidden bg-black">
        <div className="vignette absolute inset-0">
          {children}
          <div className="film-grain" aria-hidden />
          <div className="flicker" aria-hidden />
        </div>

        {showNav && (
          <div className="absolute left-3 top-3 z-50 flex gap-2">
            <Link
              href="/"
              aria-label="Back to options"
              className="rounded-full bg-black/50 p-2 text-white/80 backdrop-blur transition hover:bg-black/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <BackIcon />
            </Link>
            <Link
              href={otherRoute!}
              aria-label="Try the other oracle"
              className="rounded-full bg-black/50 p-2 text-white/80 backdrop-blur transition hover:bg-black/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <SwapIcon />
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={handleMute}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          aria-pressed={muted}
          className="absolute right-3 top-3 z-50 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur transition hover:bg-black/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {muted ? <MutedIcon /> : <SoundIcon />}
        </button>
      </div>
    </PassFrameContext.Provider>
  );
}

function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M7 7h13l-3-3" />
      <path d="M17 17H4l3 3" />
    </svg>
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
