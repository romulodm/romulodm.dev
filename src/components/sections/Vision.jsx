import './Vision.css'

import { useEffect, useMemo, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { HiOutlineSparkles } from 'react-icons/hi';
import { MdOutlineRocketLaunch, MdRocketLaunch } from 'react-icons/md';
import { Parallax } from 'react-scroll-parallax';
import { FaCode, FaPeopleCarry } from 'react-icons/fa';
import { FaArrowRightLong } from 'react-icons/fa6';
import { NavLink } from 'react-router-dom';

function Comment({ step }) {
  const mobile = useMobileMode();
  const [opacity, api] = useSpring(() => ({ opacity: 0 }));

  useEffect(() => {
    api.start({ opacity: step >= 3 ? 1 : 0 });
  }, [step, api]);

  return (
    <animated.div
      className="absolute w-72 bg-white shadow-lg flex flex-row items-center gap-2.5 p-2.5 border-red-500 border rounded-tl-none rounded-3xl"
      style={{ top: 'calc(1rem + 100%)', left: mobile ? '10%' : '50%', opacity }}
    >
      <div className="bg-red-500 text-white rounded-full w-8 h-8 p-1 flex items-center justify-center">
        M
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">
          Manager
          {' • '}
          <span className="text-gray-500">2 hours ago</span>
        </p>
        <p className="text-sm text-gray-700 mr-2">
          Don&apos;t forget the daily, mate!

        </p>
      </div>
    </animated.div>
  );
}

function Cursor({ step }) {
  const labelTransforms = {
    left: 'translate(calc(-100% + 6px), 18px)',
    right: 'translate(calc(100% + 0px), 18px)',
    rotated: 'translate(calc(20% + 8px), 16px)', 
  };

  const states = [
    { top: '0', left: '20%', rotate: '0deg', opacity: '0' },
    { top: '17%', left: '49%', rotate: '0deg', opacity: '1' },
    { top: '30%', left: '30%', rotate: '0deg', opacity: '1' },
    { top: '37%', left: '61%', rotate: '-90deg', opacity: '1' },
    { top: '64.5%', left: '50.8%', rotate: '0deg', opacity: '1' },
    { top: '92%', left: '97%', rotate: '-90deg', opacity: '1' },
    { top: '105%', left: '48%', rotate: '0deg', opacity: '0' },
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


function Container({ step }) {
  const mobile = useMobileMode();
  const [cardScrollProgress, setCardScrollProgress] = useState(0);
  const cardColors = ['bg-red-500', 'bg-yellow-400', 'bg-green-500'];

  const cardColorIndex = Math.min(Math.floor(cardScrollProgress * 3), 2);
  const cardColor = cardColors[cardColorIndex];

  const getCommitText = (progress) => {
    if (progress < 0.35) return '1 new commit';
    if (progress < 0.45) return '5 new commits';
    if (progress < 0.50) return '8 new commits';
    if (progress < 0.55) return '13 new commits';
    if (progress < 0.65) return '18 new commits';
    if (progress < 0.70) return '21 new commits';
    if (progress < 0.75) return '25 new commits';
    return '33 new commits';
  };

  const commitText = getCommitText(cardScrollProgress);
  return (
    <Parallax
      shouldAlwaysCompleteAnimation
      onProgressChange={(progress) => setCardScrollProgress(progress)} 
    >
      <div className="relative grid-background w-full h-[40rem] bg-transparent pointer-events-none">
        <div className='z-50'>

        <div
          id="card"
          className="absolute p-1 border-2 shadow-lg w-64"
          style={{
            top: mobile ? '12%' : '3%',
            right: mobile ? '1rem' : 'auto',
            left: mobile ? 'auto' : '49%',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="text-xl bg-gray-200 rounded-lg w-10 h-10 flex items-center justify-center">
            </div>
            <div>
              <p className="text-base">Productivity</p>
              <p className="text-sm text-gray-500 whitespace-nowrap">
                Shaping tomorrow&apos;s guidelines..
              </p>
            </div>
          </div>
        </div>

        <div
          id="card"
          className="absolute p-1 border-2 shadow-lg w-64"
          style={{
            top: mobile ? '12%' : '5%',
            right: mobile ? '1rem' : 'auto',
            left: mobile ? 'auto' : '50%',
          }}
        >
          <div className="flex items-center gap-2">
          <div className="text-xl bg-gray-200 rounded-lg w-10 h-10 flex items-center justify-center">
              <HiOutlineSparkles />
            </div>
            <div>
              <p className="text-base">Innovation</p>
              <p className="text-sm text-gray-500 whitespace-nowrap">
                Shaping tomorrow&apos;s guidelines.
              </p>
            </div>
          </div>
        </div>

        <div
          id="card"
          className="absolute p-1 border-2 shadow-lg w-64"
          style={{
            top: mobile ? '12%' : '15%',
            right: mobile ? '1rem' : 'auto',
            left: mobile ? 'auto' : '50%',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="text-xl bg-gray-200 rounded-lg w-10 h-10 flex items-center justify-center">
              <FaPeopleCarry />
            </div>
            <div>
              <p className="text-base">Community</p>
              <p className="text-sm text-gray-500 whitespace-nowrap">
                Making people&apos;s lives easier.
              </p>
            </div>
          </div>
        </div>
 
        <div id="card" className="absolute top-[23%] left-[30%]">
          <div className="p-4 border-2 shadow-lg">
            <h3 className="text-lg font-bold">
              <span className="text-gray-500">Design.</span>
              <br />
              <span className="text-gray-700">Prototipe.</span>
              <br />
              <span className="text-green-500">Develop.</span>
              <br />
              <span className="text-black">Improve.</span>
            </h3>
          </div>
        </div>
        <div
          className="absolute"
          style={{
            top: mobile ? '40%' : '37%',
            left: mobile ? '1rem' : 'auto',
            right: mobile ? 'auto' : '20%',
          }}
        >
      <div id="card" className="p-4 border-2 shadow-lg relative flex gap-4 items-center">
        <div className="flex text-xl bg-purple-400 text-white rounded-lg w-10 h-10 flex items-center justify-center">
          <MdRocketLaunch />
        </div>
        
        <div>
          <h5 className="text-xl font-bold">
            Productivity <span className="text-gray-700">at its finest.</span>
          </h5>
          <p className="text-sm text-gray-700 ">
            With <span className="font-bold text-black">quality</span> and <span className="font-bold text-black">sustainability</span> at heart.
          </p>
        </div>
        <div
          className={`absolute w-32 text-center p-1 border-dashed border-2 ${cardColor} indicator`}
          style={{
            top: '50%',
            left: 'calc(100% + 2rem)',
            transform: 'translateY(-50%)',
          }}
        >
          <code className="w-full text-sm text-center z-50 shadow-lg">
            {commitText}
          </code>
        </div>
        <div className="dashed-line"></div>
      </div>
      </div>
      <div id="card" className="absolute top-[65%] left-1/2 transform -translate-x-[50%] flex space-x-2">
        <button className="border-2 shadow-lg rounded-lg p-2 text-gray-700">Segurança</button>
        <button className="bg-green-500 shadow-lg rounded-lg text-white px-4 flex items-center space-x-2">
          <FaCode />
          <span>Desenvolvimento colaborativo</span>
        </button>
        <button className="border-2 shadow-lg rounded-lg p-2 text-gray-700">Flexibilidade</button>
        <Comment step={step} />
      </div>

      <div id="card" className="absolute top-[65%] left-1/2 transform -translate-x-[50%] flex space-x-2">
        <button className="border-2 shadow-lg rounded-lg p-2 text-gray-700">Segurança</button>
        <button className="bg-green-500 shadow-lg rounded-lg text-white px-4 flex items-center space-x-2">
          <FaCode />
          <span>Desenvolvimento colaborativo</span>
        </button>
        <button className="border-2 shadow-lg rounded-lg p-2 text-gray-700">Flexibilidade</button>
        <Comment step={step} />
      </div>
      
      </div>
    </div>
    </Parallax>
  );
}

export default function Vision() {
    const animationDelay = 0.2;

    const [scrollingProgress, setScrollingProgress] = useState(0);
    const animationStep = useMemo(() => Math.min(Math.round(
      Math.max(0, scrollingProgress - animationDelay) * (6 / (1 - animationDelay)),
    ), 6), [scrollingProgress]);

    return(
      <div className="w-full flex flex-col mt-4 justify-center">
        <Parallax
            shouldAlwaysCompleteAnimation
            onProgressChange={(progress) => setScrollingProgress(progress)}
        >
            <div className="container-grid">
                <Cursor step={animationStep}/>
                <Container step={animationStep}/>
            </div>

            <hr className="mt-1 mb-5"/>
            
            <div className="flex items-center justify-between w-full py-4 px-2 sm:py-8 sm:px-6 bg-gray-200 border rounded-lg flex-col sm:flex-row text-center sm:text-left items-center">
                <div className="mb-2 sm:mb-0">
                    <p className="text-slate-700 font-bold mb-1 text-lg sm:text-2xl">Quer saber mais? 📝</p>
                    <p className="text-slate-500 text-sm sm:text-lg">Você pode ver mais sobre o que eu penso no meu blog.</p>
                </div>
                <NavLink to="/blog">
                    <button className="flex px-5 min-w-44 text-sm md:text-md justify-center w-full font-semibold items-center gap-2 p-3 bg-green-600 hover:bg-green-500 rounded-lg text-white">
                        Ver postagens
                        <FaArrowRightLong/>
                    </button>
                </NavLink>
            </div>
            
        </Parallax>
      </div>
    )

}

function useMobileMode() {
    return window.innerWidth < 768;
}