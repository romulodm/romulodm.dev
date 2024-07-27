import { FaBaby, FaBook, FaCarCrash, FaCode, FaPlaneDeparture, FaQuestionCircle, FaWifi } from 'react-icons/fa';
import { FaComputer } from 'react-icons/fa6';
import { MdOutlineWork } from 'react-icons/md';
import { IoTelescope } from 'react-icons/io5';

export const FAKE_OBJECT = {
    "2003": [
        {
            date: "2003-09-22",
            Icon: ({ className = "" }) => <FaBaby className={className} />,
        },
        {
            date: "2003-02-22",
            Icon: ({ className = "" }) => <FaQuestionCircle className={className} />,
        },
    ],
    "2008": [
        {
            date: "2008-06-22",
            Icon: ({ className = "" }) => <FaComputer className={className} />,
        },
        {
            date: "2008-07-05",
            Icon: ({ className = "" }) => <FaCarCrash className={className} />,
        },
    ],
    "2019": [
        {
            date: "2010-08-18",
            Icon: ({ className = "" }) => <FaCode className={className} />,
        },
        {
            date: "2003-09-22",
            Icon: ({ className = "" }) => <IoTelescope className={className} />,
        },
    ],
    "2024": [
        {
            date: "2012-02-15",
            Icon: ({ className = "" }) => <MdOutlineWork className={className} />,
        },
        {
            date: "2003-09-22",
            Icon: ({ className = "" }) => <FaQuestionCircle className={className} />,
        },
    ]
};

export default function FakeTimeline() {
    const timelineObject = FAKE_OBJECT;
    let globalIndex = 0;

    const handleSmoothScroll = (e) => {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="mt-5 w-full pb-5">
            
            <div className="-mx-2 flex md:hidden h-20 px-4 xl:mx-0 scroll-stylized">
                {Object.entries(timelineObject).map(([year, events]) => (
                    <div key={year} className="relative">
                        <header className="absolute left-0 -translate-x-1/2 select-none text-xs font-semibold text-gray-400">
                            {year}
                        </header>

                        <div
                            className="mt-4 grid"
                            style={{ gridTemplateColumns: `repeat(${events.length}, 80px)` }}
                        >
                            {events.map(({ heading, Icon }) => {
                                const eventIndex = globalIndex;
                                globalIndex += 1;

                                return (
                                    <section
                                        key={Icon + year}
                                        className="relative"
                                    >
                                        <a 
                                            key={eventIndex}
                                            href="#timeline"
                                            onClick={handleSmoothScroll}
                                            className="absolute flex -translate-x-1/2 flex-col items-center px-2 hfa:outline-none"
                                        >
                                            <span className="sr-only">{`${year} - ${heading}`}</span>
                                            <div className="h-6 w-0.5 transition-all bg-gray-500"/>
                                            <Icon className="mt-1 h-4 w-4 transition-all text-gray-500"/>
                                        </a>

                                        <div className={`absolute top-0 left-px h-2 w-[79px] bg-[image:linear-gradient(90deg,transparent_0px,transparent_9px,var(--line-color)_10px,var(--line-color)_10px)] bg-[length:10px_10px] transition-all [--line-color:theme(colors.gray.500)]`} />
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            
            
            <div className="-mx-4 hidden md:flex h-28  px-6 xl:mx-0 scroll-stylized">
                {Object.entries(timelineObject).map(([year, events]) => (
                    <div key={year} className="relative">
                        <header className="absolute left-0 -translate-x-1/2 select-none text-xs font-semibold text-gray-400">
                            {year}
                        </header>

                        <div
                            className="mt-6 grid"
                            style={{ gridTemplateColumns: `repeat(${events.length}, 120px)` }}
                        >
                            {events.map(({ heading, Icon }) => {
                                const eventIndex = globalIndex;
                                globalIndex += 1;

                                return (
                                    <section
                                        key={Icon + year}
                                        className="relative"
                                    >
                                        <a 
                                            key={eventIndex}
                                            href="#timeline"
                                            onClick={handleSmoothScroll}
                                            className="absolute flex -translate-x-1/2 flex-col items-center px-3 hfa:outline-none"
                                        >
                                            <span className="sr-only">{`${year} - ${heading}`}</span>
                                            <div className="h-8 w-0.5 transition-all bg-gray-500"/>
                                            <Icon className="mt-2 h-5 w-5 transition-all text-gray-500"/>
                                        </a>

                                        <div className={`absolute top-0 left-px h-2.5 w-[119px] bg-[image:linear-gradient(90deg,transparent_0px,transparent_9px,var(--line-color)_10px,var(--line-color)_10px)] bg-[length:10px_10px] transition-all [--line-color:theme(colors.gray.500)]`} />
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
