"use client";

import { useRef, useState, type JSX, type ReactNode } from "react";
import { IoAddOutline } from "react-icons/io5";
import {
    VscChromeClose,
    VscChromeMaximize,
    VscChromeMinimize,
    VscChevronDown,
    VscTerminalPowershell,
} from "react-icons/vsc";

import type { ResumeData } from '@/data/resume';

import TerminalExperience from "./TerminalExperience";
import TerminalFunctional from "./TerminalFunctional";
import {
    DefaultMessage,
    EmptyPromptMessage,
    InitialMessage,
    HelpMessage,
    CatsMessage,
    InterMessage,
    UnknowMessage,
    WhoMessage,
    WhoamiMessage,
    SecretMessage,
    SecretHintMessage,
    SecretWrongMessage,
    SecretCorrectMessage,
    SpotifyMessage,
    FollowMessage,
    PingRomuloMessage,
    QuoteMessage,
    WeatherMessage,
    SudoMessage,
    DateMessage,
    NeoFetchMessage,
    UptimeMessage,
    MatrixMessage,
    HackBankMessage,
    CoffeeMessage,
    JokeMessage,
} from "./TerminalMessages";
import {
    BlogMessage,
    CompletionsMessage,
    CowsayMessage,
    GitLogMessage,
    HistoryMessage,
    ManMessage,
    NpmInstallMessage,
    PapersMessage,
    SeediconMessage,
    SlMessage,
    TopMessage,
    VisitorsMessage,
    WordmarkMessage,
} from "./TerminalExtraMessages";
import { suggestCommand } from "./catalog";
import CustomTooltip from "./CustomTooltip";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const SECRET_PASSWORD = process.env.NEXT_PUBLIC_TERMINAL_SECRET_PASSWORD ?? "";

type CommandComponent = () => JSX.Element;

interface CommandProps {
    command: string;
}

interface CommandsMap {
    [key: string]: CommandComponent;
}

function TopCommand(): JSX.Element {
    return <TopMessage colorful={false} />;
}

function HtopCommand(): JSX.Element {
    return <TopMessage colorful />;
}

/**
 * Commands without arguments, looked up by the exact (lowercased) input.
 * Commands that take arguments or need the terminal state are handled in
 * `checkMessageEntered`.
 */
const commands: CommandsMap = {
    help: HelpMessage,
    initial: InitialMessage,
    follow: FollowMessage,
    who: WhoMessage,
    whoami: WhoamiMessage,

    cats: CatsMessage,
    inter: InterMessage,
    spotify: SpotifyMessage,
    secret: SecretMessage,
    "secret --get_hint": SecretHintMessage,

    weather: WeatherMessage,
    "curl quote": QuoteMessage,
    "ping romulo": PingRomuloMessage,

    joke: JokeMessage,
    sudo: SudoMessage,
    date: DateMessage,
    neofetch: NeoFetchMessage,
    uptime: UptimeMessage,
    matrix: MatrixMessage,
    "hack bank": HackBankMessage,
    coffee: CoffeeMessage,

    papers: PapersMessage,
    visitors: VisitorsMessage,
    top: TopCommand,
    htop: HtopCommand,
    sl: SlMessage,
};

/** Small icon button in the tab strip: "+", the dropdown and a tab's close. */
const STRIP_ICON_CLASS =
    "flex items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-300/70 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white";

/** Minimise, maximise and close, at Windows' 46px caption-button width. */
const WINDOW_CONTROL_CLASS =
    "flex w-[46px] items-center justify-center text-neutral-700 transition-colors hover:bg-neutral-300/70 dark:text-neutral-200 dark:hover:bg-white/10";

interface TerminalTabProps {
    active: boolean;
    onSelect: () => void;
    /**
     * Rendered next to the label. Kept outside the select button because a
     * <button> inside another <button> is invalid HTML and breaks hydration.
     */
    trailing: ReactNode;
}

/**
 * The active tab shares the pane's background and sits flush with the bottom
 * of the strip, so it reads as the top of the pane (see `.terminal-tab-active`
 * in globals.css for the curved base). Inactive tabs float as rounded chips
 * 4px above the pane. The active tab is 4px taller to reach the pane, and its
 * pb-1 takes that extra height back out of the content box, so the labels of
 * both kinds of tab sit on the same line.
 */
function TerminalTab({ active, onSelect, trailing }: TerminalTabProps): JSX.Element {
    return (
        <div
            className={cn(
                "flex w-52 items-center gap-1 pl-3 pr-1.5 text-xs transition-colors",
                active
                    ? "terminal-tab-active h-9 rounded-t-lg pb-1 font-medium text-neutral-900 dark:text-white"
                    : "mb-1 h-8 rounded-lg text-neutral-600 hover:bg-neutral-300/60 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white",
            )}
        >
            <button
                type="button"
                onClick={onSelect}
                className={cn(
                    "flex h-full min-w-0 flex-1 items-center gap-2",
                    active ? "cursor-default" : "cursor-pointer",
                )}
            >
                <VscTerminalPowershell
                    className={cn("shrink-0 text-sm", active && "text-sky-600 dark:text-sky-400")}
                />
                <span className="truncate">pwsh in romulodm</span>
            </button>
            {trailing}
        </div>
    );
}

interface ResumePageClientProps {
    data: ResumeData;
    locale: string;
}

export default function TerminalClient({ data, locale }: ResumePageClientProps): JSX.Element {
    const t = useTranslations("terminal");

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [showTooltip, setShowTooltip] = useState<boolean>(true);

    const secretPassRegex = /^secret --pass (\d{4})$/;

    const [showSecondNavigationTab, setShowSecondNavigationTab] =
        useState<boolean>(false);
    const [displayedNavigationTab, setDisplayedNavigationTab] =
        useState<number>(0);
    const [componentsToShow, setComponentsToShow] = useState<CommandComponent[]>([
        DefaultMessage,
        InitialMessage,
    ]);
    const [textTypedByUser, setTextTypedByUser] = useState<string>("");
    const [commandHistory, setCommandHistory] = useState<string[]>([]);

    function closeNavigationTab(): void {
        setDisplayedNavigationTab(0);
        setShowSecondNavigationTab(false);
        setComponentsToShow([DefaultMessage, InitialMessage]);
    }

    function pushOutput(component: CommandComponent): void {
        setComponentsToShow((prev) => [...prev, component]);
    }

    function showCompletions(typed: string, options: string[]): void {
        pushOutput(() => <CompletionsMessage typed={typed} options={options} />);
    }

    function checkMessageEntered(): void {
        const typed = textTypedByUser.trim();
        const lower = typed.toLowerCase();
        const head = lower.split(/\s+/)[0] ?? "";
        // Argument with its original casing: seedicon seeds are case-sensitive.
        const rest = typed.slice(head.length).trim();

        const history = typed ? [...commandHistory, typed] : commandHistory;
        if (typed) setCommandHistory(history);

        // Own keys only: "constructor" or "toString" would otherwise resolve to
        // Object.prototype members and be rendered as components.
        const CommandComponent = Object.hasOwn(commands, lower) ? commands[lower] : undefined;
        const match = typed.match(secretPassRegex);

        if (typed === "") {
            pushOutput(EmptyPromptMessage);
        } else if (lower === "clear") {
            setComponentsToShow([]);
        } else if (lower === "exit") {
            closeNavigationTab();
        } else if (lower === "history") {
            pushOutput(() => <HistoryMessage entries={history} />);
        } else if (lower === "git log" || lower === "git log --oneline") {
            pushOutput(() => <GitLogMessage command={typed} oneline={lower.endsWith("--oneline")} />);
        } else if (lower === "blog" || lower === "blog --latest") {
            pushOutput(() => <BlogMessage command={typed} latestOnly={lower.endsWith("--latest")} />);
        } else if (lower === "npm install" || lower === "npm i") {
            pushOutput(() => <NpmInstallMessage command={typed} />);
        } else if (head === "cowsay") {
            pushOutput(() => <CowsayMessage command={typed} text={rest} />);
        } else if (head === "seedicon") {
            pushOutput(() => <SeediconMessage command={typed} text={rest} />);
        } else if (head === "wordmark" || head === "woodmark") {
            pushOutput(() => <WordmarkMessage command={typed} text={rest} />);
        } else if (head === "man") {
            pushOutput(() => <ManMessage command={typed} topic={rest.toLowerCase()} />);
        } else if (match) {
            const enteredPassword = match[1];

            if (enteredPassword === SECRET_PASSWORD) {
                pushOutput(() => <SecretCorrectMessage command={typed} />);
            } else {
                pushOutput(() => <SecretWrongMessage command={typed} />);
            }
        } else if (CommandComponent) {
            pushOutput(CommandComponent);
        } else {
            const suggestion = suggestCommand(typed);
            pushOutput(() => <UnknowMessage command={typed} suggestion={suggestion} />);
        }

        setTextTypedByUser("");
    }

    function openAndChangeTab(): void {
        setDisplayedNavigationTab(1);
        setShowSecondNavigationTab(true);
        setTextTypedByUser("");
        setShowTooltip(false);
    }

    // With both tabs open there is nothing left for "+" to do, so it is drawn
    // as decoration only, like the window controls.
    const addTabButton = showSecondNavigationTab ? (
        <span aria-hidden="true" className={cn(STRIP_ICON_CLASS, "size-7")}>
            <IoAddOutline />
        </span>
    ) : (
        <button
            type="button"
            aria-label={t("new-tab")}
            onClick={openAndChangeTab}
            className={cn(STRIP_ICON_CLASS, "size-7 cursor-pointer")}
        >
            <IoAddOutline />
        </button>
    );

    return (
        // pt-10 leaves room above the window for the "you can use this
        // terminal" hint, which would otherwise be clipped by the section.
        <div className="pt-10">
            <div className="rounded-xl border border-neutral-300 bg-neutral-200 shadow-xl shadow-black/5 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40">
                <div className="flex h-10 select-none items-end justify-between rounded-t-[11px]">
                    <div className="flex items-end gap-1 pl-2">
                        <TerminalTab
                            active={displayedNavigationTab === 0}
                            onSelect={() => setDisplayedNavigationTab(0)}
                            trailing={
                                // The first tab cannot be closed.
                                <span aria-hidden="true" className={cn(STRIP_ICON_CLASS, "size-5")}>
                                    <VscChromeClose className="text-xs" />
                                </span>
                            }
                        />

                        {showSecondNavigationTab && (
                            <TerminalTab
                                active={displayedNavigationTab === 1}
                                onSelect={() => setDisplayedNavigationTab(1)}
                                trailing={
                                    <button
                                        type="button"
                                        aria-label={t("close-tab")}
                                        onClick={closeNavigationTab}
                                        className={cn(STRIP_ICON_CLASS, "size-5 cursor-pointer")}
                                    >
                                        <VscChromeClose className="text-xs" />
                                    </button>
                                }
                            />
                        )}

                        <div className="mb-1 flex h-8 items-center gap-0.5 pl-0.5">
                            {showTooltip && !showSecondNavigationTab ? (
                                <CustomTooltip
                                    position="top"
                                    content={t("tooltip")}
                                    closeLabel={t("dismiss-tooltip")}
                                    onClose={() => setShowTooltip(false)}
                                >
                                    {addTabButton}
                                </CustomTooltip>
                            ) : (
                                addTabButton
                            )}

                            <span aria-hidden="true" className={cn(STRIP_ICON_CLASS, "h-7 w-5")}>
                                <VscChevronDown className="text-xs" />
                            </span>
                        </div>
                    </div>

                    <div className="flex self-stretch">
                        <span aria-hidden="true" className={WINDOW_CONTROL_CLASS}>
                            <VscChromeMinimize />
                        </span>
                        <span aria-hidden="true" className={WINDOW_CONTROL_CLASS}>
                            <VscChromeMaximize />
                        </span>
                        {/* #c42b1c is the close-button red of Windows 11. */}
                        <span
                            aria-hidden="true"
                            className={cn(
                                WINDOW_CONTROL_CLASS,
                                "rounded-tr-[11px] hover:bg-[#c42b1c] hover:text-white dark:hover:bg-[#c42b1c] dark:hover:text-white",
                            )}
                        >
                            <VscChromeClose />
                        </span>
                    </div>
                </div>

                <div
                    ref={scrollContainerRef}
                    className="terminal-scroll flex h-110 flex-row overflow-auto rounded-b-[11px] bg-white p-3 dark:bg-neutral-900"
                >
                    {displayedNavigationTab === 0 ? (
                        <TerminalExperience data={data} />
                    ) : (
                        <TerminalFunctional
                            componentsToShow={componentsToShow}
                            textTypedByUser={textTypedByUser}
                            setTextTypedByUser={setTextTypedByUser}
                            checkMessageEntered={checkMessageEntered}
                            scrollContainerRef={scrollContainerRef}
                            history={commandHistory}
                            onShowCompletions={showCompletions}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
