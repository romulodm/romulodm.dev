import React from 'react';

export default function SatelliteIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Illustration of a satellite transmitting a signal"
    >
      <defs>
        <linearGradient id="satBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4B5563" />
          <stop offset="100%" stopColor="#1F2937" />
        </linearGradient>
        <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--contact-color)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--contact-color)" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="pingGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--contact-color)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--contact-color)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* stars */}
      <circle cx="40" cy="40" r="1.6" fill="currentColor" opacity="0.4" />
      <circle cx="80" cy="90" r="1.2" fill="currentColor" opacity="0.3" />
      <circle cx="300" cy="60" r="1.6" fill="currentColor" opacity="0.4" />
      <circle cx="330" cy="150" r="1.2" fill="currentColor" opacity="0.3" />
      <circle cx="60" cy="220" r="1.4" fill="currentColor" opacity="0.3" />

      {/* signal pings */}
      <circle cx="230" cy="120" r="30" stroke="var(--contact-color)" strokeOpacity="0.35" strokeWidth="1.5" fill="none" />
      <circle cx="230" cy="120" r="55" stroke="var(--contact-color)" strokeOpacity="0.2" strokeWidth="1.5" fill="none" />
      <circle cx="230" cy="120" r="14" fill="url(#pingGlow)" />

      {/* satellite group, rotated for a dynamic feel */}
      <g transform="translate(120,150) rotate(-18)">
        {/* left solar panel */}
        <g>
          <rect x="-96" y="-16" width="64" height="32" rx="2" fill="url(#panelGrad)" />
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={-96 + (i + 1) * 12.8}
              y1="-16"
              x2={-96 + (i + 1) * 12.8}
              y2="16"
              stroke="#0B0F1E"
              strokeOpacity="0.25"
            />
          ))}
          <rect x="-34" y="-3" width="14" height="6" fill="url(#satBody)" />
        </g>

        {/* right solar panel */}
        <g>
          <rect x="32" y="-16" width="64" height="32" rx="2" fill="url(#panelGrad)" />
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={32 + (i + 1) * 12.8}
              y1="-16"
              x2={32 + (i + 1) * 12.8}
              y2="16"
              stroke="#0B0F1E"
              strokeOpacity="0.25"
            />
          ))}
          <rect x="20" y="-3" width="14" height="6" fill="url(#satBody)" />
        </g>

        {/* body */}
        <rect x="-20" y="-22" width="40" height="44" rx="6" fill="url(#satBody)" />
        <rect x="-14" y="-14" width="28" height="10" rx="2" fill="#0B0F1E" opacity="0.4" />
        <circle cx="0" cy="10" r="5" fill="var(--contact-color)" opacity="0.9" />

        {/* dish arm */}
        <line x1="8" y1="-20" x2="34" y2="-46" stroke="url(#satBody)" strokeWidth="4" strokeLinecap="round" />
        <path
          d="M18 -50 a20 20 0 0 1 32 8 L34 -46 Z"
          fill="url(#satBody)"
          transform="translate(2,4)"
        />
        <ellipse cx="34" cy="-46" rx="16" ry="10" fill="url(#satBody)" transform="rotate(-30 34 -46)" />
      </g>
    </svg>
  );
}
