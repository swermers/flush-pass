'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface Props {
  href?: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  disabled?: boolean;
}

export default function PassTile({
  href,
  title,
  subtitle,
  icon,
  disabled,
}: Props) {
  const baseClasses =
    'group relative flex aspect-[4/3] flex-col items-start justify-between rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70';
  const enabledClasses =
    'cursor-pointer hover:border-white/30 hover:bg-black/70 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.45)]';
  const disabledClasses = 'cursor-not-allowed opacity-40';

  const content = (
    <>
      <div className="text-white/80 transition group-hover:text-white">
        {icon}
      </div>
      <div>
        <h2 className="font-marker text-xl tracking-wide text-white sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-white/60">{subtitle}</p>
      </div>
      {disabled && (
        <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/70">
          coming soon
        </span>
      )}
    </>
  );

  if (disabled || !href) {
    return (
      <div
        aria-disabled
        className={`${baseClasses} ${disabledClasses}`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={`${baseClasses} ${enabledClasses}`}>
      {content}
    </Link>
  );
}
