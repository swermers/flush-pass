'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Props {
  onFlush: () => void;
  flushing: boolean;
}

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
        style={{ objectPosition: 'center 55%' }}
      />
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
        className="absolute inset-0 cursor-pointer bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        {showHint && !flushing && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
            className="flush-hint pointer-events-none absolute left-1/2 top-[68%] z-10 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/0"
          />
        )}
        <span className="sr-only">Flush</span>
      </button>
    </motion.div>
  );
}
