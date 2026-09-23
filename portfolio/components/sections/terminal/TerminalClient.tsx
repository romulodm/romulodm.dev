"use client";

import { useRef, useState, type JSX, type ReactNode } from "react";
import { IoAddOutline } from "react-icons/io5";
import {
    VscChromeClose,
    VscChromeMaximize,
    VscChromeMinimize,
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
import CustomTooltip from "./CustomTooltip";
import { useTranslations } from "next-intl";

const SECRET_PASSWORD = process.env.NEXT_PUBLIC_TERMINAL_SECRET_PASSWORD ?? "";

type CommandComponent = () => JSX.Element;

interface CommandProps {
    command: string;
}

interface CommandsMap {
    [key: string]: CommandComponent;
}

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
};

const TAB_BASE_CLASS =
    "dark:text-white flex px-3 ml-1.5 py-1 flex-row w-56 h-8 rounded-lg items-center justify-between";
const TAB_ACTIVE_CLASS = "bg-neutral-300 dark:bg-neutral-800";
const TAB_INACTIVE_CLASS =
    "bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-900 dark:hover:bg-neutral-800/70";

interface TerminalTabProps {
    active: boolean;
    onSelect: () => void;
    /**
     * Rendered next to the label. Kept outside the select button because a
     * <button> inside another <button> is invalid HTML and breaks hydration.
     */
    trailing: ReactNode;
}

function TerminalTab({ active, onSelect, trailing }: TerminalTabProps): JSX.Element {
    return (
        <div className={`${TAB_BASE_CLASS} ${active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}`}>
            <button
                type="button"
                onClick={onSelect}
                className={`flex flex-1 h-full flex-row items-center gap-2 ${active ? "cursor-default" : "cursor-pointer"}`}
            >
                <VscTerminalPowershell />
                <span>pwsh in romulodm</span>
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

    function closeNavigationTab(): void {
        setDisplayedNavigationTab(0);
        setShowSecondNavigationTab(false);
        setComponentsToShow([DefaultMessage, InitialMessage]);
    }

    function checkMessageEntered(): void {
        const typed = textTypedByUser.trim();
        const CommandComponent = commands[typed.toLowerCase()];

        const match = typed.match(secretPassRegex);

        if (typed === "") {
            setComponentsToShow((prev) => [...prev, EmptyPromptMessage]);
        } else if (typed.toLowerCase() === "clear") {
            setComponentsToShow([]);
        } else if (match) {
            const enteredPassword = match[1];

            if (enteredPassword === SECRET_PASSWORD) {
                setComponentsToShow((prev) => [
                    ...prev,
                    () => <SecretCorrectMessage command={typed} />,
                ]);
            } else {
                setComponentsToShow((prev) => [
                    ...prev,
                    () => <SecretWrongMessage command={typed} />,
                ]);
            }
        } else if (CommandComponent) {
            setComponentsToShow((prev) => [...prev, CommandComponent]);
        } else {
            setComponentsToShow((prev) => [
                ...prev,
                () => <UnknowMessage command={typed} />,
            ]);
        }

        setTextTypedByUser("");
    }

    function openAndChangeTab(): void {
        setDisplayedNavigationTab(1);
        setShowSecondNavigationTab(true);
        setTextTypedByUser("");
        setShowTooltip(false);
    }

    return (
        <div className="flex flex-col overflow-hidden rounded-lg shadow-xl pt-10">
            <div className="flex flex-row justify-between bg-gray-100 w-full border-t rounded-tl-lg rounded-tr-lg shadow-3xl dark:bg-neutral-700 dark:border-neutral-700">
                <div className="flex flex-row items-center text-sm py-1.5">
                    <TerminalTab
                        active={displayedNavigationTab === 0}
                        onSelect={() => setDisplayedNavigationTab(0)}
                        trailing={
                            // Decorative: the first tab cannot be closed.
                            <span aria-hidden="true" className="flex flex-row items-center text-xs">
                                <VscChromeClose />
                            </span>
                        }
                    />

                    {showSecondNavigationTab ? (
                        <>
                            <TerminalTab
                                active={displayedNavigationTab === 1}
                                onSelect={() => setDisplayedNavigationTab(1)}
                                trailing={
                                    <button
                                        type="button"
                                        aria-label={t("close-tab")}
                                        onClick={closeNavigationTab}
                                        className="flex flex-row items-center text-xs cursor-pointer"
                                    >
                                        <VscChromeClose />
                                    </button>
                                }
                            />

                            <button
                                onClick={() => setShowSecondNavigationTab(true)}
                                className="flex cursor-pointer bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-900 dark:hover:dark:bg-neutral-800 dark:text-white px-3 ml-1.5 flex-row h-8 rounded-lg items-center justify-between"
                            >
                                <IoAddOutline />
                            </button>
                        </>
                    ) : showTooltip ? (
                        <CustomTooltip
                            position="top"
                            content={t("tooltip")}
                            onClose={() => setShowTooltip(false)}
                        >
                            <button
                                onClick={() => openAndChangeTab()}
                                className="flex cursor-pointer bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-900 dark:hover:dark:bg-neutral-800 dark:text-white px-3 ml-1.5 flex-row h-8 rounded-lg items-center justify-between"
                            >
                                <IoAddOutline />
                            </button>
                        </CustomTooltip>
                    ) : (
                        <button
                            onClick={() => openAndChangeTab()}
                            className="flex cursor-pointer bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-900 dark:hover:dark:bg-neutral-800 dark:text-white px-3 ml-1.5 flex-row h-8 rounded-lg items-center justify-between"
                        >
                            <IoAddOutline />
                        </button>
                    )}
                </div>

                <div className="flex flex-row">
                    <div className="flex cursor-pointer justify-center items-center px-4 dark:text-white hover:bg-neutral-300/80 dark:hover:bg-neutral-800/80">
                        <VscChromeMinimize />
                    </div>
                    <div className="flex cursor-pointer justify-center items-center px-4 dark:text-white hover:bg-neutral-300/80 dark:hover:bg-neutral-800/80">
                        <VscChromeMaximize />
                    </div>
                    <div className="flex cursor-pointer justify-center items-center px-4 dark:text-white hover:text-white hover:bg-red-500/90 dark:hover:bg-red-600/90 rounded-tr-lg">
                        <VscChromeClose />
                    </div>
                </div>
            </div>

            <div ref={scrollContainerRef} className="flex flex-row p-2 h-110 overflow-auto border dark:bg-neutral-900 dark:border-neutral-800 rounded-bl-lg rounded-br-lg default-scroll">
                {displayedNavigationTab === 0 ? (
                    <TerminalExperience data={data} />
                ) : (
                    <TerminalFunctional
                        componentsToShow={componentsToShow}
                        textTypedByUser={textTypedByUser}
                        setTextTypedByUser={setTextTypedByUser}
                        checkMessageEntered={checkMessageEntered}
                        scrollContainerRef={scrollContainerRef}
                    />
                )}
            </div>
        </div>
    );
}