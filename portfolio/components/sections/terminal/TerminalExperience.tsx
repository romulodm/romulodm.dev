"use client";

import { useTranslations } from "next-intl";
import type { JSX } from "react";

import type { ResumeData } from '@/data/resume';
import { ExperienceList } from "@/components/resume/ExperienceList";
import { EducationList } from "@/components/resume/EducationList";

interface TerminalExperienceProps {
    data: ResumeData;
}

/**
 * Whole years since the earliest `start` in the list. The resume stores dates
 * as localized strings ("April 2022", "Abril 2022"), so only the four-digit
 * year is read, which keeps this independent of the locale.
 */
function yearsSinceFirstStart(items: ReadonlyArray<{ start: string }>): number {
    const years = items
        .map((item) => Number(item.start.match(/\d{4}/)?.[0]))
        .filter((year) => Number.isFinite(year));

    if (years.length === 0) return 0;
    return new Date().getFullYear() - Math.min(...years);
}

export default function TerminalExperience({ data }: TerminalExperienceProps): JSX.Element {
    const t = useTranslations("terminal");

    const educationYears = yearsSinceFirstStart(data.education);
    const experienceYears = yearsSinceFirstStart(data.experience);

    return (
        <div className="flex flex-col gap-4 px-2">
            <div className="font-mono text-sm">
                <div className="text-gray-500 dark:text-neutral-400/90">
                    Powershell 3.9.22
                </div>
                <div className="flex flex-nowrap gap-1">
                    <div className="text-blue-600 font-semibold dark:text-sky-400">
                        root@romulodm:~$&nbsp;
                    </div>
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">
                        {`romulo.exe --${t("education")}`}
                    </div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t("loading-education-title")}
                    <br />
                    {/* Server and client can disagree on the year only across New Year's Eve. */}
                    <span suppressHydrationWarning>
                        {t("loading-education", { years: educationYears })}
                    </span>
                </div>
            </div>

            <EducationList education={data.education} />

            <div className="font-mono text-sm">
                <div className="flex flex-nowrap gap-1">
                    <div className="text-blue-600 font-semibold dark:text-sky-400">
                        root@romulodm:~$&nbsp;
                    </div>
                    <div className="whitespace-nowrap font-semibold dark:text-white/80">
                        {`romulo.exe --${t("xp")}`}
                    </div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t("loading-xp-title")}
                    <br />
                    <span suppressHydrationWarning>
                        {t("loading-xp", { years: experienceYears })}
                    </span>
                </div>
            </div>

            <div>
                <ExperienceList experiences={data.experience} />
            </div>
        </div>
    )
}
