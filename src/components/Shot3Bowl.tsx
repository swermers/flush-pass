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
      initial={{ opacity: 0, scale: 1.22, filter: 'blur(10px) brightness(0.7)' }}
      animate={{
        opacity: 1,
        scale: swirling ? [1.02, 0.99, 1.01, 1.0] : [1.0, 1.015, 1.0],
        x: swirling ? [0, -4, 4, -2, 2, 0] : [0, -2, 2, 0],
        y: swirling ? [0, 2, -1, 0] : [0, -1, 1, 0],
        filter: 'blur(0px) brightness(1)',
      }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.55 },
        scale: swirling
          ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 8, repeat: Infinity, ease: 'easeInOut' },
        x: swirling
          ? { duration: 0.4, repeat: 5, ease: 'easeInOut' }
          : { duration: 10, repeat: Infinity, ease: 'easeInOut' },
        y: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
        filter: { duration: 0.7 },
      }}
      className="absolute inset-0"
    >
      <Image
        src="/images/shot-3-bowl.webp"
        alt="Top-down view of a toilet bowl with calm water."
        fill
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: 'center' }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 'min(48vw, 48vh)', height: 'min(48vw, 48vh)' }}
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
