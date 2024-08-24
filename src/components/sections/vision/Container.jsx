import "./Vision.css";

import { useState } from 'react';
import { HiOutlineSparkles } from 'react-icons/hi';
import { MdRocketLaunch } from 'react-icons/md';
import { Parallax } from 'react-scroll-parallax';
import { FaCode, FaPeopleCarry } from 'react-icons/fa';
import Comment from './Comment';
import useMobileMode from './Mobile';

export default function Container({ step }) {
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
                        className="absolute bg-white dark:bg-neutral-700 p-1 border-2 dark:border-neutral-500/80 shadow-lg w-64"
                        style={{
                            top: mobile ? '12%' : '3%',
                            right: mobile ? '1rem' : 'auto',
                            left: mobile ? 'auto' : '49%',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="text-xl bg-gray-200 dark:bg-neutral-500 dark:text-white rounded-lg w-10 h-10 flex items-center justify-center">
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
                        className="absolute bg-white dark:bg-neutral-700 p-1 border-2 dark:border-neutral-500/80 shadow-lg w-64"
                        style={{
                            top: mobile ? '12%' : '5%',
                            right: mobile ? '1rem' : 'auto',
                            left: mobile ? 'auto' : '50%',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="text-xl bg-gray-200 dark:bg-neutral-500 dark:text-white rounded-lg w-10 h-10 flex items-center justify-center">
                                <HiOutlineSparkles />
                            </div>
                            <div>
                                <p className="text-base dark:text-white/90">Innovation</p>
                                <p className="text-sm text-gray-500 dark:text-neutral-400/90 whitespace-nowrap">
                                    Shaping tomorrow&apos;s guidelines.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        className="absolute bg-white dark:bg-neutral-700 p-1 border-2 dark:border-neutral-500/80 shadow-lg w-64"
                        style={{
                            top: mobile ? '12%' : '15%',
                            right: mobile ? '1rem' : 'auto',
                            left: mobile ? 'auto' : '50%',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="text-xl bg-gray-200 dark:bg-neutral-500 dark:text-white rounded-lg w-10 h-10 flex items-center justify-center">
                                <FaPeopleCarry />
                            </div>
                            <div>
                                <p className="text-base dark:text-white/90">Community</p>
                                <p className="text-sm text-gray-500 dark:text-neutral-400/90 whitespace-nowrap">
                                    Making people&apos;s lives easier.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bg-white dark:bg-neutral-700 top-[23%] left-[25%]">
                        <div className="p-4 border-2 dark:border-neutral-500/80 shadow-lg">
                            <h3 className="text-lg font-bold">
                                <span className="text-gray-500 dark:text-neutral-400">Design.</span>
                                <br />
                                <span className="text-gray-700 dark:text-white/80">Prototipe.</span>
                                <br />
                                <span className="text-green-500">Develop.</span>
                                <br />
                                <span className="text-black dark:text-neutral-900">Improve.</span>
                            </h3>
                        </div>
                    </div>

                    <div
                        className="absolute"
                        style={{
                            top: mobile ? '40%' : '37%',
                            left: mobile ? '1rem' : '43%',
                            right: mobile ? 'auto' : 'auto',
                        }}
                    >
                        <div className="flex justify-center p-4 bg-white dark:bg-neutral-700 border-2 dark:border-neutral-500/80 shadow-lg relative flex gap-4 items-center">
                            <div className="flex text-xl bg-purple-400 text-white rounded-lg w-10 h-10 flex items-center justify-center">
                                <MdRocketLaunch />
                            </div>
                            <div>
                                <h5 className="text-xl font-bold dark:text-white/80">
                                    Productivity <span className="text-gray-700 dark:text-neutral-300/90">at its finest.</span>
                                </h5>
                                <p className="text-sm text-gray-700 dark:text-neutral-400/90">
                                    With <span className="font-bold text-black dark:text-neutral-300">quality</span> and <span className="font-bold text-black dark:text-neutral-300">sustainability</span> at heart.
                                </p>
                            </div>
                            <div
                                className={`absolute w-32 text-center p-1 border-dashed dark:border-neutral-200 border-2 dark:border-neutral-500/80 dark:text-white ${cardColor} indicator`}
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

                    <div className="absolute top-[65%] left-1/2 transform -translate-x-[50%] flex space-x-2">
                        <button className="bg-white dark:bg-neutral-700 dark:text-neutral-200 border-2 dark:border-neutral-500/80 shadow-lg rounded-lg p-2">
                            Segurança
                        </button>
                        <button className="bg-green-500 shadow-lg rounded-lg text-white px-4 flex items-center space-x-2">
                            <FaCode />
                            <span>Desenvolvimento colaborativo</span>
                        </button>
                        <button className="bg-white text-gray-00 dark:text-neutral-300 dark:bg-neutral-700 border-2 dark:border-neutral-500/80 shadow-lg rounded-lg p-2">
                            Flexibilidade
                        </button>
                        <Comment step={step} />
                    </div>

                    <div className="absolute bgpwhite top-[65%] left-1/2 transform -translate-x-[50%] flex space-x-2">
                        <button className="border-2 dark:border-neutral-500/80 shadow-lg rounded-lg p-2 text-gray-700">
                            Segurança
                        </button>
                        <button className="bg-green-500 shadow-lg rounded-lg text-white px-4 flex items-center space-x-2">
                            <FaCode />
                            <span>Desenvolvimento colaborativo</span>
                        </button>
                        <button className="border-2 dark:border-neutral-500/80 shadow-lg rounded-lg p-2 text-gray-700">
                            Flexibilidade
                        </button>
                        <Comment step={step} />
                    </div>
                </div>
            </div>
        </Parallax>
    );
}
