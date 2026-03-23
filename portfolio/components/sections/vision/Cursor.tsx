'use client';

import './Vision.css';
import { useEffect, useMemo } from 'react';
import { useSpring, animated } from '@react-spring/web';
import useMobileMode from './Mobile';

interface CursorProps { step: number }

export default function Cursor({ step }: CursorProps) {
  const mobile = useMobileMode();

  const states = [
    { top: '0%', left: mobile ? '70%' : '20%', rotate: 0, opacity: 0 },
    { top: mobile ? '27%' : '21%', left: mobile ? '10%' : '49%', rotate: 0, opacity: 1 },
    { top: mobile ? '41%' : '37%', left: mobile ? '30%' : '24%', rotate: 0, opacity: 1 },
    { top: mobile ? '52.5%' : '47%', left: mobile ? '10%' : '55%', rotate: -90, opacity: 1 },
    { top: mobile ? '55%' : '73.7%', left: mobile ? '63%' : '50.2%', rotate: 0, opacity: 1 },
    { top: mobile ? '77%' : '92%', left: mobile ? '65%' : '97%', rotate: -90, opacity: 1 },
    { top: '105%', left: mobile ? '50%' : '48%', rotate: 0, opacity: 0 },
  ];

  const current = states[step] ?? states[0];

  const [cursorSpring, cursorApi] = useSpring(() => ({
    top: current.top,
    left: current.left,
    opacity: current.opacity,
  }));

  const [rotateSpring, rotateApi] = useSpring(() => ({
    rotate: current.rotate,
  }));

  useEffect(() => {
    cursorApi.start({ top: current.top, left: current.left, opacity: current.opacity });
    rotateApi.start({ rotate: current.rotate });
  }, [current, cursorApi, rotateApi]);

  // Label offset: quando rotacionado, desloca diferente
  const labelStyle = useMemo(() => {
    if (current.rotate === -90) return { transform: 'translate(calc(20% + 8px), 16px)' };
    return { transform: 'translate(calc(-100% + 6px), 18px)' };
  }, [current.rotate]);

  return (
    <animated.div
      className="absolute z-50"
      style={{ top: cursorSpring.top, left: cursorSpring.left, opacity: cursorSpring.opacity }}
    >
      <div
        className="absolute bg-green-500 text-white text-xs rounded-sm shadow-lg py-1 px-2"
        style={labelStyle}
      >
        Romulo
      </div>
      <animated.div
        className="absolute"
        style={{ rotate: rotateSpring.rotate }}
      >
        <svg height="25" viewBox="0 0 17 18" fill="currentColor" className="text-green-500">
          <path d="M15.5036 3.11002L12.5357 15.4055C12.2666 16.5204 10.7637 16.7146 10.22 15.7049L7.4763 10.6094L2.00376 8.65488C0.915938 8.26638 0.891983 6.73663 1.96711 6.31426L13.8314 1.65328C14.7729 1.28341 15.741 2.12672 15.5036 3.11002Z" strokeWidth="1.5" />
        </svg>
      </animated.div>
    </animated.div>
  );
}