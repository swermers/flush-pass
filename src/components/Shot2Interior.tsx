'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface Props {
  onFlush: () => void;
  flushing: boolean;
}

export default function Shot2Interior({ onFlush, flushing }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        y: flushing ? '100%' : '0%',
        filter: flushing ? 'blur(8px)' : 'blur(0px)',
      }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.35 },
        y: { duration: 0.25, ease: 'easeIn' },
        filter: { duration: 0.25 },
      }}
      className="absolute inset-0"
    >
      <Image
        src="/images/shot-2-interior.webp"
        alt='Interior of a school bathroom stall, with "Flush For Your Odds" graffiti above the toilet.'
        fill
        sizes="100vw"
        className="object-contain"
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
        // Hotspot positioned over the visible flush handle. Tunable.
        className="group absolute left-[58%] top-[55%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <span className="absolute inset-0 rounded-full bg-white/0 transition group-hover:bg-white/15 motion-safe:animate-pulse-soft" />
        <span className="sr-only">Flush</span>
      </button>
    </motion.div>
  );
}
