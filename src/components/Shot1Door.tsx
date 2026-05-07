'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Props {
  onActivate: () => void;
  opening: boolean;
}

export default function Shot1Door({ onActivate, opening }: Props) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowHint(true), 1800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.06 }}
      animate={
        opening
          ? {
              opacity: 0,
              scale: 1.5,
              filter: 'blur(14px) brightness(1.15)',
            }
          : {
              opacity: 1,
              scale: [1.0, 1.025, 1.0],
              x: [0, -3, 2, 0],
              y: [0, 2, -1, 0],
              filter: 'blur(0px) brightness(1)',
            }
      }
      exit={{ opacity: 0 }}
      transition={
        opening
          ? {
              opacity: { duration: 0.5, delay: 0.25 },
              scale: { duration: 0.85, ease: [0.6, 0.05, 0.95, 0.5] },
              filter: { duration: 0.85 },
            }
          : {
              opacity: { duration: 0.6 },
              scale: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
              x: { duration: 11, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 13, repeat: Infinity, ease: 'easeInOut' },
              filter: { duration: 0.6 },
            }
      }
      className="absolute inset-0"
    >
      <button
        type="button"
        onClick={onActivate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate();
          }
        }}
        aria-label="Open the stall door"
        className="relative flex h-full w-full cursor-pointer items-center justify-center bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <Image
          src="/images/shot-1-door-closed.webp"
          alt="A grungy school bathroom stall with the door closed."
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: 'center' }}
        />
        {showHint && !opening && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.75, y: 0 }}
            transition={{ duration: 1.0 }}
            className="pointer-events-none absolute bottom-12 z-10 font-marker text-lg tracking-[0.2em] text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] sm:text-2xl"
          >
            click to enter
          </motion.span>
        )}
      </button>
    </motion.div>
  );
}
