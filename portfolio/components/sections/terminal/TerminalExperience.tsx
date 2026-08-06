"use client";;
import { useTranslations } from "next-intl";

import type { ResumeData } from '@/data/resume';
import { ExperienceList } from "@/components/resume/ExperienceList";
import { EducationList } from "@/components/resume/EducationList";

import { useEffect, useState, type JSX } from "react";

interface TerminalExperienceProps {
    loadingTime: number;
    data: ResumeData;
}

export default function TerminalExperience({
    loadingTime = 10,
    data
}: TerminalExperienceProps): JSX.Element {
    const t = useTranslations("terminal")

    const parsedLoadingTime = Number(loadingTime)
    const anotherTime = Number.isFinite(parsedLoadingTime)
        ? parsedLoadingTime / 2 + 3
        : 0

    // Evita hydration mismatch — renderiza os tempos só no cliente
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

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
                        {`romulo.exe --${t("xp")}`}
                    </div>
                </div>
                <div className="text-gray-500 dark:text-neutral-400/90">
                    {t("loading-xp-title")}
                    <br />
                    {/* ↓ só renderiza o tempo após hidratação */}
                    {t("loading-xp")} {mounted ? anotherTime : null} ms.
                </div>
            </div>

            <div>
                <ExperienceList experiences={data.experience} />
            </div>

            <div className="font-mono text-sm">
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
                    {t("loading-education")} {mounted ? loadingTime : null} ms.
                </div>
            </div>

            <div className="pb-4">
                <EducationList education={data.education} />
            </div>
        </div>
    )
}