'use client';

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export default function ResetButton({ onClick, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="font-marker text-base tracking-widest text-white/80 underline decoration-dotted underline-offset-8 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-0 sm:text-lg"
    >
      Flush again?
    </button>
  );
}
