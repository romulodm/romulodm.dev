'use client';

import { useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import type { ReactElement } from 'react';


import { getTimelineData } from '@/data/timeline';

interface IconProps {
    className?: string;
}

interface TimelineObject {
    [year: string]: TimelineEvent[];
}

interface TimelineEvent {
    heading: string;
    Icon: (props: IconProps) => ReactElement;
    description: string;
}

export default function TimelineClient(): ReactElement {
    const locale = useLocale();
    const timelineObject: TimelineObject = getTimelineData(locale);

    const [currentItem, setCurrentItem] = useState<number>(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleItemChange = (index: number): void => {
        setCurrentItem(index);
    };

    let globalIndex = 0;

    return (
        <section id="timeline" className="mt-5 w-full">
            <div ref={scrollContainerRef} className="flex h-80 overflow-x-auto scroll-stylized px-4">
                {Object.entries(timelineObject).map(([year, events]) => (
                    <div key={year} className="relative">
                        <header className="absolute left-0 -translate-x-1/2 text-xs font-semibold text-gray-400 dark:text-neutral-500">
                            {year}
                        </header>

                        <div
                            className="mt-6 grid"
                            style={{ gridTemplateColumns: `repeat(${events.length}, 120px)` }}
                        >
                            {events.map(({ heading, Icon, description }) => {
                                const globalEventIndex = globalIndex;
                                globalIndex += 1;

                                return (
                                    <section
                                        key={heading + year}
                                        className="relative"
                                        onMouseEnter={() => handleItemChange(globalEventIndex)}
                                    >
                                        <button
                                            className="absolute flex -translate-x-1/2 flex-col items-center"
                                            onClick={() => handleItemChange(globalEventIndex)}
                                        >
                                            <span className="sr-only">{`${year} - ${heading}`}</span>
                                            <div className={`h-8 w-0.5 transition-all ${currentItem === globalEventIndex ? 'bg-sky-500 dark:bg-sky-600 h-[80px]' : 'bg-gray-500 dark:bg-neutral-600'}`}></div>
                                            <Icon className={`mt-2 h-5 w-5 transition-all ${currentItem === globalEventIndex ? 'text-sky-500' : 'text-gray-500 dark:text-neutral-500'}`} />
                                        </button>

                                        <div className="absolute top-0 left-px h-2.5 w-[119px] bg-[image:linear-gradient(90deg,transparent_0px,transparent_9px,var(--line-color)_10px,var(--line-color)_10px)] bg-[length:10px_10px] [--line-color:theme(colors.gray.500)]" />

                                        {currentItem === globalEventIndex && (
                                            <main
                                                aria-hidden={currentItem !== globalEventIndex}
                                                className={`absolute w-72 top-28 px-4 pt-1 z-50 ${globalEventIndex === 0 ? 'text-left' : 'text-center'}`}
                                                style={globalEventIndex === 0 ? { transform: 'translateX(-8%)' } : { transform: 'translateX(-50%)' }}
                                            >
                                                <h3 className="font-semibold tracking-tight text-gray-800 dark:text-neutral-300">
                                                    {heading}
                                                </h3>
                                                <p className="text-[0.9rem] font-medium leading-relaxed tracking-tight text-gray-500 dark:text-neutral-400/80">
                                                    {description}
                                                </p>
                                            </main>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div className="relative">
                    <header className="absolute left-0 -translate-x-1/2 text-xs font-semibold text-gray-400">
                        Today
                    </header>
                    <div className="mt-6">
                        <section className="relative">
                            <div className="h-8 w-0.5 bg-gray-500 pb-4"></div>
                        </section>
                    </div>
                </div>
            </div>
        </section>
    );
}