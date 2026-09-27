'use client';

import type { ReactElement } from 'react';
import { FaBaby, FaCarCrash, FaCode, FaQuestionCircle } from 'react-icons/fa';
import { FaComputer } from 'react-icons/fa6';
import { MdOutlineWork } from 'react-icons/md';
import { IoTelescope } from 'react-icons/io5';

type IconComponent = (props: { className?: string }) => ReactElement;

interface FakeEvent {
    date: string;
    Icon: IconComponent;
}

/**
 * Timeline decorativa do HeroPowder. Puramente visual: espelha a `Timeline` real
 * (components/sections/TimelineClient.tsx), sem links nem interacao.
 */
export const FAKE_OBJECT: Record<string, FakeEvent[]> = {
    '2003': [
        { date: '2003-09-22', Icon: ({ className = '' }) => <FaBaby className={className} /> },
        { date: '2003-02-22', Icon: ({ className = '' }) => <FaQuestionCircle className={className} /> },
    ],
    '2008': [
        { date: '2008-06-22', Icon: ({ className = '' }) => <FaComputer className={className} /> },
        { date: '2008-07-05', Icon: ({ className = '' }) => <FaCarCrash className={className} /> },
    ],
    '2019': [
        { date: '2010-08-18', Icon: ({ className = '' }) => <FaCode className={className} /> },
        { date: '2003-09-22', Icon: ({ className = '' }) => <IoTelescope className={className} /> },
    ],
    '2024': [
        { date: '2012-02-15', Icon: ({ className = '' }) => <MdOutlineWork className={className} /> },
        { date: '2003-09-22', Icon: ({ className = '' }) => <FaQuestionCircle className={className} /> },
    ],
};

/** Medidas por breakpoint. O desktop usa 104px (e nao 120px) para caber no painel de 960px. */
const SIZES = {
    sm: { col: 72, row: 'h-20', gridTop: 'mt-4', tick: 'h-6', icon: 'mt-1 h-4 w-4', ruler: 'h-2' },
    md: { col: 104, row: 'h-24', gridTop: 'mt-6', tick: 'h-8', icon: 'mt-2 h-5 w-5', ruler: 'h-2.5' },
} as const;

function TimelineRow({ size, className }: { size: keyof typeof SIZES; className: string }) {
    const s = SIZES[size];

    return (
        <div className={className}>
            <div className={`mx-auto flex w-fit px-4 ${s.row}`}>
                {Object.entries(FAKE_OBJECT).map(([year, events]) => (
                    <div key={year} className="relative">
                        <header className="absolute left-0 -translate-x-1/3 select-none text-xs font-semibold text-gray-400 dark:text-neutral-500">
                            {year}
                        </header>

                        <div
                            className={`${s.gridTop} grid`}
                            style={{ gridTemplateColumns: `repeat(${events.length}, ${s.col}px)` }}
                        >
                            {events.map(({ date, Icon }, i) => (
                                <section key={`${year}-${i}`} className="relative">
                                    <div
                                        data-date={date}
                                        className="absolute flex -translate-x-1/3 flex-col items-center"
                                    >
                                        <div className={`${s.tick} w-0.5 bg-gray-500 dark:bg-neutral-600`} />
                                        <Icon className={`${s.icon} text-gray-500 dark:text-neutral-500`} />
                                    </div>

                                    <div
                                        aria-hidden
                                        className={`absolute left-px top-0 ${s.ruler} bg-[image:linear-gradient(90deg,transparent_0px,transparent_9px,var(--line-color)_10px,var(--line-color)_10px)] bg-[length:10px_10px] [--line-color:theme(colors.gray.500)] dark:[--line-color:theme(colors.neutral.600)]`}
                                        style={{ width: s.col - 1 }}
                                    />
                                </section>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function FakeTimeline() {
    return (
        <div aria-hidden className="w-full select-none">
            <TimelineRow size="sm" className="scroll-stylized -mx-2 md:hidden" />
            <TimelineRow size="md" className="hidden md:block" />
        </div>
    );
}
