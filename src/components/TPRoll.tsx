'use client';

interface Props {
  size?: number;
}

// Pure-SVG toilet paper roll, viewed mostly from the front with a
// slight 3D-ish tilt so the cardboard tube and the rolled paper edge
// are visible.
export default function TPRoll({ size = 220 }: Props) {
  return (
    <svg
      viewBox="0 0 200 140"
      width={size}
      height={(size * 140) / 200}
      aria-hidden
    >
      <defs>
        <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7f3eb" />
          <stop offset="0.5" stopColor="#ece5d6" />
          <stop offset="1" stopColor="#cfc6b3" />
        </linearGradient>
        <radialGradient id="endcap" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f8f4ec" />
          <stop offset="0.7" stopColor="#d9d1bf" />
          <stop offset="1" stopColor="#a89e87" />
        </radialGradient>
        <radialGradient id="tube" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#3a2a1a" />
          <stop offset="0.7" stopColor="#5a4329" />
          <stop offset="1" stopColor="#7a5b3a" />
        </radialGradient>
        <linearGradient id="shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(0,0,0,0)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.45)" />
        </linearGradient>
      </defs>

      {/* drop shadow on floor */}
      <ellipse cx="100" cy="128" rx="80" ry="6" fill="rgba(0,0,0,0.55)" />

      {/* cylinder body (paper-wound roll) */}
      <rect x="20" y="25" width="160" height="95" fill="url(#paper)" />

      {/* subtle horizontal striations for paper-layer texture */}
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x="20"
          y={28 + i * 8}
          width="160"
          height="1"
          fill="rgba(150, 130, 90, 0.18)"
        />
      ))}

      {/* shadow under top edge */}
      <rect
        x="20"
        y="25"
        width="160"
        height="95"
        fill="url(#shadow)"
        opacity="0.35"
      />

      {/* left endcap (paper edge) */}
      <ellipse cx="20" cy="72" rx="10" ry="47" fill="url(#endcap)" />
      {/* tube hole on left */}
      <ellipse cx="20" cy="72" rx="3" ry="14" fill="url(#tube)" />

      {/* right endcap */}
      <ellipse cx="180" cy="72" rx="10" ry="47" fill="url(#endcap)" />
      <ellipse cx="180" cy="72" rx="3" ry="14" fill="url(#tube)" />

      {/* visible front paper sheet hanging slightly */}
      <path
        d="M 22 120 L 22 132 Q 100 137 178 132 L 178 120 Z"
        fill="url(#paper)"
      />
      <path
        d="M 22 120 L 22 132 Q 100 137 178 132 L 178 120 Z"
        fill="rgba(0,0,0,0.08)"
      />
    </svg>
  );
}
