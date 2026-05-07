'use client';

import { motion } from 'framer-motion';
import ResetButton from './ResetButton';

interface Props {
  answer: string;
  ready: boolean;
  onReset: () => void;
}

export default function AnswerReveal({ answer, ready, onReset }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <motion.p
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="font-marker text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] motion-safe:animate-bobble"
        style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', lineHeight: 1.1 }}
      >
        {answer}
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.5, delay: ready ? 0.4 : 0 }}
        className="mt-8"
      >
        <ResetButton onClick={onReset} disabled={!ready} />
      </motion.div>
    </div>
  );
}
