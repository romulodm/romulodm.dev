'use client';

import './Vision.css';

import { Parallax } from 'react-scroll-parallax';
import Icons from './container/Icons';
import Frame from './container/Frame';
import Productivity from './container/Productivity';
import Development from './container/Development';

interface ContainerProps {
  step: number;
}

export default function Container({ step }: ContainerProps) {
  return (
    <Parallax>
      <div className="relative grid-background w-full h-[43rem] sm:h-[32rem] bg-transparent pointer-events-none overflow-visible">
        <Icons />
        <Frame />
        <Productivity step={step} />
        <Development step={step} />
      </div>
    </Parallax>
  );
}