'use client';

import './Vision.css';

import { useMemo, useState } from 'react';
import { Parallax } from 'react-scroll-parallax';
import Cursor from './Cursor';
import Container from './Container';

export default function Vision() {
  const animationDelay = 0.2;

  const [scrollingProgress, setScrollingProgress] = useState(0);

  const animationStep = useMemo(
    () =>
      Math.min(
        Math.round(
          Math.max(0, scrollingProgress - animationDelay) *
          (6 / (1 - animationDelay)),
        ),
        6,
      ),
    [scrollingProgress],
  );

  return (
    <div className="w-full flex flex-col mt-4 justify-center">
      <Parallax
        shouldAlwaysCompleteAnimation
        onProgressChange={(progress) => setScrollingProgress(progress)}
      >
        <div className="container-grid">
          <Cursor step={animationStep} />
          <Container step={animationStep} />
        </div>
      </Parallax>
    </div>
  );
}
