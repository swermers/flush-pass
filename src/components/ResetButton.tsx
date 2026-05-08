'use client';

interface Props {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  tone?: 'light' | 'dark';
}

export default function ResetButton({
  onClick,
  disabled,
  label = 'Flush again?',
  tone = 'light',
}: Props) {
  const palette =
    tone === 'dark'
      ? 'text-stone-800/90 hover:text-stone-900 focus-visible:ring-stone-700/70'
      : 'text-white/80 hover:text-white focus-visible:ring-white/70';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`font-marker text-base tracking-widest underline decoration-dotted underline-offset-8 transition focus:outline-none focus-visible:ring-2 disabled:opacity-0 sm:text-lg ${palette}`}
    >
      {label}
    </button>
  );
}
