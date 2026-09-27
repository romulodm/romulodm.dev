"use client";

import { useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

/*
 * Building blocks shared by every terminal output: the echoed prompt, the grey
 * "loading took N ms" line, the spinner, and the timing helpers behind them.
 */

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/**
 * Picks a fake loading time once per mounted output, so re-renders keep the
 * same number. Outputs only mount on the client, after the visitor opens the
 * interactive tab, which is why a random initial state cannot cause a hydration
 * mismatch here. Callers keep ranges below 1000 so no random value reads like a
 * four-digit year and muddles the `secret` riddle.
 */
export function useFakeLoadTime(min: number, max: number): number {
    const [ms] = useState(() => Math.floor(min + Math.random() * (max - min + 1)));
    return ms;
}

export function useIntlLocale(): string {
    return useLocale() === "pt" ? "pt-BR" : "en-US";
}

export function formatSeconds(ms: number, intlLocale: string): string {
    return new Intl.NumberFormat(intlLocale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(ms / 1000);
}

export type TimedState<T> =
    | { status: "loading" }
    | { status: "error" }
    | { status: "ready"; data: T; ms: number };

/**
 * Runs `load` once when the output mounts and reports how long it really took,
 * so network-backed commands print a true duration instead of a random one.
 * The loader is read through a ref: callers pass an inline function, and
 * re-running the request on every render is exactly what must not happen.
 */
export function useTimedLoad<T>(load: () => Promise<T>): TimedState<T> {
    const loadRef = useRef(load);
    const [state, setState] = useState<TimedState<T>>({ status: "loading" });

    useEffect(() => {
        let cancelled = false;
        const startedAt = performance.now();

        loadRef.current()
            .then((data) => {
                if (!cancelled) {
                    setState({ status: "ready", data, ms: Math.max(1, Math.round(performance.now() - startedAt)) });
                }
            })
            .catch(() => {
                if (!cancelled) setState({ status: "error" });
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}

export function Visitor(): JSX.Element {
    const t = useTranslations("terminal");
    return (
        <div className="text-blue-600 font-semibold dark:text-sky-400">
            {t("visitor")}@romulodm:~$&nbsp;
        </div>
    );
}

/** The echoed prompt line: `visitor@romulodm:~$ <command>`. */
export function Prompt({ command }: { command: string }): JSX.Element {
    return (
        <div className="flex flex-row">
            <Visitor />
            <div className="whitespace-pre font-semibold dark:text-white/80">{command}</div>
        </div>
    );
}

export function Muted({ children, className = "" }: { children: ReactNode; className?: string }): JSX.Element {
    return <div className={`text-gray-500 dark:text-neutral-400/90 ${className}`}>{children}</div>;
}

export function Output({ children, className = "" }: { children: ReactNode; className?: string }): JSX.Element {
    return <div className={`mt-2 text-gray-700 dark:text-neutral-300 ${className}`}>{children}</div>;
}

/** Inline command highlight, used through `t.rich(..., { cmd })`. */
export function Cmd({ children }: { children: ReactNode }): JSX.Element {
    return <span className="font-bold text-red-500">{children}</span>;
}

export function Spinner(): JSX.Element {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
        }, 80);

        return () => clearInterval(interval);
    }, []);

    return (
        <span aria-hidden="true" className="inline-block w-[1ch]">
            {SPINNER_FRAMES[frame]}
        </span>
    );
}
