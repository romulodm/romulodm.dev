// components/wall/ui/Decoration.tsx
import type { DecoType } from "../themes";

function LightningSmiley() {
  return (
    <>
      <svg className="absolute top-4 left-4 w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4 13h7l-1 9 10-12h-7l1-8z"
          stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      <svg className="absolute bottom-14 right-4 w-12 h-12 opacity-25" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="19" stroke="white" strokeWidth="1.4" />
        <circle cx="17" cy="21" r="2" fill="white" opacity="0.8" />
        <circle cx="31" cy="21" r="2" fill="white" opacity="0.8" />
        <path d="M16 31 Q24 38 32 31" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>
    </>
  );
}

function DiamondDots() {
  return (
    <>
      <svg className="absolute top-3 right-5 w-6 h-6 opacity-50" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
          stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2.5" fill="white" opacity="0.7" />
      </svg>
      {/* small dot accent */}
      <div className="absolute top-4 left-5 w-1.5 h-1.5 rounded-full bg-white/30" />
      <svg className="absolute bottom-14 left-4 opacity-20" viewBox="0 0 40 12" fill="none" width="40" height="12">
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={4 + i * 11} cy="6" r="2.5" fill="white" />
        ))}
      </svg>
    </>
  );
}

function DiagLines() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]"
      viewBox="0 0 300 200" fill="none" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1={i * 50 - 40} y1="0" x2={i * 50 + 60} y2="200"
          stroke="white" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function Hearts() {
  return (
    <svg className="absolute bottom-12 left-3 w-14 h-14 opacity-30" viewBox="0 0 60 60" fill="none">
      <path d="M12 25 Q12 17 19 17 Q26 17 26 23 Q26 17 33 17 Q40 17 40 25 Q40 34 26 44 Q12 34 12 25Z"
        stroke="white" strokeWidth="1.4" />
      <path d="M6 38 Q6 33 11 33 Q16 33 16 37 Q16 33 21 33 Q26 33 26 38 Q26 43 16 50 Q6 43 6 38Z"
        stroke="white" strokeWidth="1.2" opacity="0.6" />
      <path d="M35 30 Q42 25 44 32 Q46 38 40 42"
        stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

function Curl() {
  return (
    <>
      <svg className="absolute top-4 right-4 w-12 h-12 opacity-25" viewBox="0 0 50 50" fill="none">
        <path d="M35 8 Q45 8 45 18 Q45 30 35 32 Q25 34 22 26 Q19 18 27 15 Q33 12 34 18 Q35 22 31 23"
          stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </svg>
      <div className="absolute bottom-14 right-5 w-1 h-1 rounded-full bg-white/30" />
    </>
  );
}

function Spinner() {
  return (
    <div className="absolute top-4 left-4 opacity-40">
      <svg className="w-7 h-7 animate-spin [animation-duration:3s]" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5"
          strokeDasharray="12 44" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function DiamondCenter() {
  return (
    <>
      <svg className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-6 opacity-40"
        viewBox="0 0 40 24" fill="none">
        <line x1="20" y1="0" x2="20" y2="8" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="5" y1="5" x2="11" y2="11" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="35" y1="5" x2="29" y2="11" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <svg className="absolute bottom-14 left-1/2 -translate-x-1/2 w-8 h-10 opacity-30"
        viewBox="0 0 32 40" fill="none">
        <path d="M16 2 L30 16 L16 38 L2 16 Z" stroke="white" strokeWidth="1.4" />
        <path d="M2 16 L16 22 L30 16" stroke="white" strokeWidth="1" opacity="0.5" />
      </svg>
      <div className="absolute bottom-16 right-8 w-1.5 h-1.5 rounded-full bg-white/25" />
    </>
  );
}

export function Decoration({ type }: { type: DecoType }) {
  switch (type) {
    case "lightning-smiley": return <LightningSmiley />;
    case "diamond-dots": return <DiamondDots />;
    case "diag-lines": return <DiagLines />;
    case "hearts": return <Hearts />;
    case "curl": return <Curl />;
    case "spinner": return <Spinner />;
    case "diamond-center": return <DiamondCenter />;
  }
}
