import './Vision.css'

import { useEffect, useMemo } from 'react';
import { useSpring, animated } from '@react-spring/web';
import useMobileMode from './Mobile';

export default function Cursor({ step }) {
    const mobile = useMobileMode()

    const labelTransforms = {
      left: 'translate(calc(-100% + 6px), 18px)',
      right: 'translate(calc(100% + 0px), 18px)',
      rotated: 'translate(calc(20% + 8px), 16px)', 
    };
  
    const states = [
      { top: mobile ?'0' : '0', left: mobile ?'70%' :'20%', rotate: '0deg', opacity: '0' },
      { top: mobile ?'27%' : '21%', left: mobile ? '10%' : '49%', rotate: '0deg', opacity: '1' },
      { top: mobile ?'41%' : '37%', left: mobile ? '30%' : '24%', rotate: '0deg', opacity: '1' },
      { top: mobile ?'52.5%' : '47%', left: mobile ? '10%' : '55%', rotate: '-90deg', opacity: '1' },
      { top: mobile ?'55%' : '73.7%', left: mobile ? '63%' : '50.2%', rotate: '0deg', opacity: '1' },
      { top: mobile ?'77%' : '92%', left: mobile ? '65%' : '97%', rotate: '-90deg', opacity: '1' },
      { top: mobile ?'105%' : '105%', left: mobile ? '50%' : '48%', rotate: '0deg', opacity: '0' },
    ];
  
    const currentState = useMemo(() => {
      const state = states[step] || states[0];
      const labelTransform = state.rotate === '0deg'
        ? 'left'
        : state.rotate === '-90deg'
          ? 'rotated'
          : 'right';
      return {
        ...state,
        labelTransform: labelTransforms[labelTransform],
      };
    }, [step]);
  
    const [style, api] = useSpring(() => ({
      top: currentState.top,
      left: currentState.left,
      transform: `rotate(${currentState.rotate})`,
      labelTransform: currentState.labelTransform,
      opacity: currentState.opacity,
    }));
  
    useEffect(() => {
      api.start({
        top: currentState.top,
        left: currentState.left,
        transform: `rotate(${currentState.rotate})`,
        labelTransform: currentState.labelTransform,
        opacity: currentState.opacity,
      });
    }, [currentState, api]);
  
    return (
      <animated.div
        className="absolute z-50"
        style={{ top: style.top, left: style.left, opacity: style.opacity }}
      >
        <animated.div
          className="absolute bg-green-500 text-white text-xs rounded-sm shadow-lg py-1 px-2"
          style={{ transform: style.labelTransform }}
        >
          Romulo
        </animated.div>
        <animated.div
          className="absolute"
          style={{ transform: style.transform }}
        >
          <svg
            height="25"
            viewBox="0 0 17 18"
            fill="currentColor"
            className="text-green-500"
          >
            <path d="M15.5036 3.11002L12.5357 15.4055C12.2666 16.5204 10.7637 16.7146 10.22 15.7049L7.4763 10.6094L2.00376 8.65488C0.915938 8.26638 0.891983 6.73663 1.96711 6.31426L13.8314 1.65328C14.7729 1.28341 15.741 2.12672 15.5036 3.11002ZM7.56678 10.6417L7.56645 10.6416C7.56656 10.6416 7.56667 10.6416 7.56678 10.6417L7.65087 10.4062L7.56678 10.6417Z" strokeWidth="1.5" />
          </svg>
        </animated.div>
      </animated.div>
    );
  }