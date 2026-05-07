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
    const t = window.setTimeout(() => setShowHint(true), 2000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: opening ? 0 : 1,
        scale: opening ? 1.15 : 1,
        filter: opening ? 'blur(2px)' : 'blur(0px)',
      }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: opening ? 0.25 : 0.4, delay: opening ? 0.15 : 0 },
        scale: { duration: 0.4, ease: 'easeOut' },
        filter: { duration: 0.4 },
      }}
      className="absolute inset-0 flex items-center justify-center"
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
          className="object-contain"
        />
        {showHint && !opening && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute bottom-8 font-marker text-lg tracking-wide text-white/80 drop-shadow-lg sm:text-2xl"
          >
            click to enter
          </motion.span>
        )}
      </button>
    </motion.div>
  );
}
