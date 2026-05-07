'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { SceneState } from './Scene';
import WaterSwirl from './WaterSwirl';
import AnswerReveal from './AnswerReveal';

interface Props {
  state: SceneState;
  answer: string;
  onSwirlComplete: () => void;
  onReset: () => void;
}

export default function Shot3Bowl({
  state,
  answer,
  onSwirlComplete,
  onReset,
}: Props) {
  const swirling = state === 'swirling';
  const showAnswer = state === 'revealing' || state === 'answered';

  return (
    <motion.div
      initial={{ opacity: 1, scale: 1.05 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: swirling ? [0, -2, 2, -1, 1, 0] : 0,
      }}
      exit={{ opacity: 0 }}
      transition={{
        scale: { duration: 0.25, ease: 'easeOut' },
        x: swirling
          ? { duration: 0.3, repeat: 4, ease: 'easeInOut' }
          : { duration: 0 },
      }}
      className="absolute inset-0"
    >
      <Image
        src="/images/shot-3-bowl.webp"
        alt="Top-down view of a toilet bowl with calm water."
        fill
        sizes="100vw"
        className="object-contain"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2"
        style={{ width: 'min(40vw, 40vh)', height: 'min(40vw, 40vh)' }}
      >
        {swirling && <WaterSwirl onComplete={onSwirlComplete} />}
      </div>
      {showAnswer && (
        <AnswerReveal
          answer={answer}
          ready={state === 'answered'}
          onReset={onReset}
        />
      )}
    </motion.div>
  );
}
