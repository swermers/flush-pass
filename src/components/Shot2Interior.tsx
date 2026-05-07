'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Props {
  onFlush: () => void;
  flushing: boolean;
}

// Flush-handle position in source-image coordinates (% of the 1:1 webp).
// The image is rendered with object-cover + objectPosition 'center 55%';
// the wrapper layer below mirrors that exact rect so these percentages
// land on the right pixel at any viewport ratio.
const HANDLE_X = 39;
const HANDLE_Y = 58;
const OBJECT_Y = 55; // must match the image's objectPosition Y

export default function Shot2Interior({ onFlush, flushing }: Props) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowHint(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.18, filter: 'blur(8px) brightness(1.15)' }}
      animate={
        flushing
          ? {
              opacity: 0.4,
              y: '14%',
              scale: 0.94,
              filter: 'blur(16px) brightness(0.6)',
            }
          : {
              opacity: 1,
              scale: [1.0, 1.02, 1.0],
              x: [0, -2, 3, 0],
              y: [0, 1, -2, 0],
              filter: 'blur(0px) brightness(1)',
            }
      }
      exit={{ opacity: 0 }}
      transition={
        flushing
          ? {
              opacity: { duration: 0.45, delay: 0.2 },
              y: { duration: 0.6, ease: [0.7, 0, 0.9, 0.4] },
              scale: { duration: 0.6, ease: 'easeIn' },
              filter: { duration: 0.55 },
            }
          : {
              opacity: { duration: 0.7 },
              scale: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
              x: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 14, repeat: Infinity, ease: 'easeInOut' },
              filter: { duration: 0.7 },
            }
      }
      className="absolute inset-0"
    >
      <Image
        src="/images/shot-2-interior.webp"
        alt='Interior of a school bathroom stall with "Flush For Your Odds" graffiti above the toilet.'
        fill
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: `center ${OBJECT_Y}%` }}
      />

      {/* Wrapper that mirrors the image's rendered 1:1 rect. Children
          positioned with % coordinates land on the source image pixels. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: 'max(100vw, 100dvh)',
          height: 'max(100vw, 100dvh)',
          left: '50%',
          top: `${OBJECT_Y}%`,
          transform: `translate(-50%, -${OBJECT_Y}%)`,
        }}
      >
        <button
          type="button"
          onClick={onFlush}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onFlush();
            }
          }}
          aria-label="Flush the toilet"
          disabled={flushing}
          className="group pointer-events-auto absolute cursor-pointer rounded-full bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          style={{
            left: `${HANDLE_X}%`,
            top: `${HANDLE_Y}%`,
            width: 'clamp(48px, 5vmax, 96px)',
            height: 'clamp(48px, 5vmax, 96px)',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {showHint && !flushing && (
            <span className="flush-hint pointer-events-none absolute inset-0 rounded-full" />
          )}
          <span className="sr-only">Flush</span>
        </button>
      </div>
    </motion.div>
  );
}
