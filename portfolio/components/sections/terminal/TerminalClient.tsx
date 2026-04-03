"use client";

import { useMemo, useState } from "react";
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

interface ResumePageClientProps {
    data: ResumeData;
    locale: string;
}

export default function TerminalClient({ data, locale }: ResumePageClientProps): JSX.Element {
    const t = useTranslations("terminal");

    // ✅ antes você fez useState(...) mas guardou o tuple inteiro
    const loadingTime = useMemo(() => Math.floor(Math.random() * 300), []);

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
        const CommandComponent = commands[textTypedByUser];

        const match = textTypedByUser.match(secretPassRegex);

        if (textTypedByUser === "clear") {
            setComponentsToShow([]);
        } else if (match) {
            const enteredPassword = match[1];

            if (enteredPassword === SECRET_PASSWORD) {
                setComponentsToShow((prev) => [
                    ...prev,
                    () => <SecretCorrectMessage command={textTypedByUser} />,
                ]);
            } else {
                setComponentsToShow((prev) => [
                    ...prev,
                    () => <SecretWrongMessage command={textTypedByUser} />,
                ]);
            }
        } else if (CommandComponent) {
            setComponentsToShow((prev) => [...prev, CommandComponent]);
        } else {
            setComponentsToShow((prev) => [
                ...prev,
                () => <UnknowMessage command={textTypedByUser} />,
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
                    <button
                        onClick={() => setDisplayedNavigationTab(0)}
                        className={`${displayedNavigationTab === 0
                            ? "bg-neutral-300 dark:bg-neutral-800"
                            : "cursor-pointer bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-900 dark:hover:dark:bg-neutral-800/70"
                            } dark:text-white flex cursor-default px-3 ml-1.5 py-1 flex-row w-56 h-8 rounded-lg items-center justify-between`}
                    >
                        <div className="flex flex-row items-center gap-2">
                            <VscTerminalPowershell />
                            <p>pwsh in romulodm</p>
                        </div>
                        <div className="flex flex-row items-center text-xs">
                            <VscChromeClose />
                        </div>
                    </button>

                    {showSecondNavigationTab ? (
                        <>
                            <button
                                onClick={() => setDisplayedNavigationTab(1)}
                                className={`${displayedNavigationTab === 1
                                    ? "bg-neutral-300 dark:bg-neutral-800"
                                    : "cursor-pointer bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-900 dark:hover:dark:bg-neutral-800/70"
                                    } dark:text-white flex cursor-default px-3 ml-1.5 py-1 flex-row w-56 h-8 rounded-lg items-center justify-between`}
                            >
                                <div className="flex flex-row items-center gap-2">
                                    <VscTerminalPowershell />
                                    <p>pwsh in romulodm</p>
                                </div>
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        closeNavigationTab();
                                    }}
                                    className="flex flex-row items-center text-xs"
                                >
                                    <VscChromeClose />
                                </button>
                            </button>

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

            <div className="flex flex-row p-2 h-110 overflow-auto border dark:bg-neutral-900 dark:border-neutral-800 rounded-bl-lg rounded-br-lg default-scroll">
                {displayedNavigationTab === 0 ? (
                    <TerminalExperience loadingTime={loadingTime} data={data} />
                ) : (
                    <TerminalFunctional
                        componentsToShow={componentsToShow}
                        textTypedByUser={textTypedByUser}
                        setTextTypedByUser={setTextTypedByUser}
                        checkMessageEntered={checkMessageEntered}
                    />
                )}
            </div>
        </div>
    );
}