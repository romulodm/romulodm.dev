'use client';

import './Vision.css';

import { useState } from 'react';
import { Parallax } from 'react-scroll-parallax';
import Icons from './container/Icons';
import Frame from './container/Frame';
import Productivity from './container/Productivity';
import Development from './container/Development';

interface ContainerProps {
  step: number;
}

export default function Container({ step }: ContainerProps) {
  const [cardScrollProgress, setCardScrollProgress] = useState(0);

  return (
    <Parallax
      shouldAlwaysCompleteAnimation
      onProgressChange={(progress) => setCardScrollProgress(progress)}
    >
      <div className="relative grid-background w-full h-[43rem] sm:h-[40rem] bg-transparent pointer-events-none overflow-visible">
        <Icons />
        <Frame />
        <Productivity cardScrollProgress={cardScrollProgress} />
        <Development step={step} />
      </div>
    </Parallax>
  );
}
