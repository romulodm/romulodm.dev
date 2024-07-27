import { useEffect, useState } from 'react';
import getTimeline from '../../utils/getTimeline';

export default function Timeline() {
    const [currentItem, setCurrentItem] = useState(0);
    const [intervalId, setIntervalId] = useState(null);
    const [isMouseOver, setIsMouseOver] = useState(false);

    const timelineObject = getTimeline();
    const totalEvents = Object.values(timelineObject).reduce((acc, events) => acc + events.length, 0);
    let globalIndex = 0;

    const handleItemChange = (index) => {
        setCurrentItem(index);
    };

    const startInterval = () => {
        if (intervalId) clearInterval(intervalId);

        const id = setInterval(() => {
            if (!isMouseOver) {
                setCurrentItem((prevItem) => (prevItem === totalEvents - 1 ? 0 : prevItem + 1));
            }
        }, 8000);

        setIntervalId(id);
    };

    useEffect(() => {
        startInterval();
        return () => clearInterval(intervalId);
    }, [isMouseOver]);

    const handleMouseEnter = (index) => {
        setIsMouseOver(true);
        handleItemChange(index);
    };

    const handleMouseLeave = () => {
        setIsMouseOver(false);
    };

    return (
        <section id="timeline" className="mt-5 w-full pb-2">
            <div className=" flex h-72 overflow-x-auto px-4 scroll-stylized">
                {Object.entries(timelineObject).map(([year, events]) => (
                    <div key={year} className="relative">
                        <header className="absolute left-0 -translate-x-1/2 text-xs font-semibold text-gray-400">
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
                                        onMouseEnter={() => handleMouseEnter(globalEventIndex)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <button 
                                            key={globalEventIndex} 
                                            className="absolute flex -translate-x-1/2 flex-col items-center"
                                            onClick={() => handleItemChange(globalEventIndex)}
                                        >
                                            <span className="sr-only">{`${year} - ${heading}`}</span>
                                            <div className={`h-8 w-0.5 transition-all ${currentItem === globalEventIndex ? 'bg-sky-500 h-[80px]' : 'bg-gray-500'}`}></div>
                                            <Icon className={`mt-2 h-5 w-5 transition-all ${currentItem === globalEventIndex ? 'text-sky-500' : 'text-gray-500'}`} />
                                        </button>

                                        <div className={`absolute top-0 left-px h-2.5 w-[119px] bg-[image:linear-gradient(90deg,transparent_0px,transparent_9px,var(--line-color)_10px,var(--line-color)_10px)] bg-[length:10px_10px] transition-all [--line-color:theme(colors.gray.500)]`} />

                                        {currentItem === globalEventIndex && (
                                            <main 
                                                aria-hidden={currentItem !== globalEventIndex} 
                                                className={`absolute w-72 top-28 px-4 pt-1 bg-white z-50 ${globalEventIndex === 0 ? 'text-left' : 'text-center'}`}
                                                style={globalEventIndex === 0 ? { transform: 'translateX(-8%)' } : { transform: 'translateX(-50%)' }}
                                            >
                                                <h3 className="font-semibold tracking-tight text-gray-800">
                                                    {heading}
                                                </h3>
                                                <p className="text-[0.9rem] font-medium leading-relaxed tracking-tight text-gray-500">
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
