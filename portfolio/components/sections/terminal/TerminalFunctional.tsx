import { useTranslations } from "next-intl";
import { useState, useRef, type JSX } from "react";

type CommandComponent = () => JSX.Element;

interface TerminalFunctionalProps {
    componentsToShow: CommandComponent[];
    textTypedByUser: string;
    setTextTypedByUser: (text: string) => void;
    checkMessageEntered: () => void;
}

export default function TerminalFunctional({
    componentsToShow,
    textTypedByUser,
    setTextTypedByUser,
    checkMessageEntered,
}: TerminalFunctionalProps): JSX.Element {
    const [messageHistory, setMessageHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const t = useTranslations("terminal");

    function setCursorToEnd(inputElement: HTMLInputElement): void {
        setTimeout(() => {
            inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
        }, 0);
    }

    function checkEnter(e: React.KeyboardEvent<HTMLInputElement>): void {
        const inputElement = e.currentTarget;

        if (e.key === "Enter") {
            setMessageHistory([...messageHistory, textTypedByUser]);
            setHistoryIndex(messageHistory.length + 1);
            checkMessageEntered();
            setTextTypedByUser("");
        } else if (e.key === "ArrowUp") {
            if (historyIndex > 0) {
                setHistoryIndex(historyIndex - 1);
                setTextTypedByUser(messageHistory[historyIndex - 1]);
                setCursorToEnd(inputElement);
            }
        } else if (e.key === "ArrowDown") {
            if (historyIndex < messageHistory.length - 1) {
                setHistoryIndex(historyIndex + 1);
                setTextTypedByUser(messageHistory[historyIndex + 1]);
            } else if (historyIndex === messageHistory.length - 1) {
                setHistoryIndex(messageHistory.length);
                setTextTypedByUser("");
            }
        }
    }

    return (
        <div className="flex flex-col px-2" onClick={() => inputRef.current?.focus()}>
            {componentsToShow.map((Component, index) => (
                <Component key={index} />
            ))}

            <div className="font-mono text-sm pb-2">
                <div className="flex items-center flex-nowrap">
                    <span className="text-blue-600 font-semibold dark:text-sky-400 whitespace-nowrap">
                        {t("visitor")}@romulodm:~$&nbsp;
                    </span>

                    <div className="relative flex items-center flex-1 cursor-text">
                        <span className="font-semibold dark:text-white/80 whitespace-pre">
                            {textTypedByUser}
                        </span>

                        <span className="inline-block w-[0.55em] h-[1.1em] bg-black/60 dark:bg-white/80 animate-blink align-middle" />

                        <input
                            ref={inputRef}
                            className="absolute inset-0 w-full opacity-0 cursor-text"
                            value={textTypedByUser}
                            onChange={(e) => setTextTypedByUser(e.target.value)}
                            onKeyDown={checkEnter}
                            autoFocus
                            spellCheck={false}
                            autoComplete="off"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
