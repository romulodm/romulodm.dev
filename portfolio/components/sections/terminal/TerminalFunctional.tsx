import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState, type JSX, type RefObject } from "react";

type CommandComponent = () => JSX.Element;

/** Distance from the bottom (px) still treated as "at the bottom". */
const STICK_THRESHOLD_PX = 24;

interface TerminalFunctionalProps {
    componentsToShow: CommandComponent[];
    textTypedByUser: string;
    setTextTypedByUser: (text: string) => void;
    checkMessageEntered: () => void;
    /** The scrollable terminal body that wraps this component. */
    scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export default function TerminalFunctional({
    componentsToShow,
    textTypedByUser,
    setTextTypedByUser,
    checkMessageEntered,
    scrollContainerRef,
}: TerminalFunctionalProps): JSX.Element {
    const [messageHistory, setMessageHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    /*
     * Whether the view should follow new output. Submitting a command turns it
     * on; scrolling away from the bottom turns it off, so a visitor reading
     * older output is not yanked down while something like `matrix` or
     * `coffee` keeps growing.
     */
    const stickToBottomRef = useRef(false);

    const t = useTranslations("terminal");

    // Jump to the new output right after the command's output is committed,
    // before paint, so the visitor never sees the old scroll position.
    useLayoutEffect(() => {
        const container = scrollContainerRef.current;
        if (container && stickToBottomRef.current) {
            container.scrollTop = container.scrollHeight;
        }
    }, [componentsToShow, scrollContainerRef]);

    // Outputs keep growing after they mount (spinners, progress bars, fetched
    // data), so a size change also re-pins the view while it is following.
    useEffect(() => {
        const container = scrollContainerRef.current;
        const content = contentRef.current;
        if (!container || !content) return;

        const observer = new ResizeObserver(() => {
            if (stickToBottomRef.current) container.scrollTop = container.scrollHeight;
        });
        observer.observe(content);

        function onScroll(): void {
            if (!container) return;
            const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
            stickToBottomRef.current = distance <= STICK_THRESHOLD_PX;
        }
        container.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            observer.disconnect();
            container.removeEventListener("scroll", onScroll);
        };
    }, [scrollContainerRef]);

    function setCursorToEnd(inputElement: HTMLInputElement): void {
        setTimeout(() => {
            inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
        }, 0);
    }

    function checkEnter(e: React.KeyboardEvent<HTMLInputElement>): void {
        const inputElement = e.currentTarget;

        if (e.key === "Enter") {
            stickToBottomRef.current = true;
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
        <div ref={contentRef} className="flex flex-col px-2" onClick={() => inputRef.current?.focus()}>
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
