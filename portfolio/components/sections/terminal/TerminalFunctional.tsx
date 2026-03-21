import { useState } from "react";

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
    checkMessageEntered 
}: TerminalFunctionalProps): JSX.Element {
    const [messageHistory, setMessageHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    
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
        <div className="flex flex-col">
            {componentsToShow.map((Component, index) => (
                <Component key={index} />
            ))}

            <div className="font-mono text-sm pb-2">
                <div className="flex items-center flex-nowrap gap-1">
                    <div className="text-blue-600 font-semibold dark:text-sky-400">visitor@romulodm:~$&nbsp;</div>
                    <input
                        className="bg-transparent dark:text-white/80 whitespace-nowrap outline-0 border-0 font-semibold flex-1 dark:caret-white"
                        value={textTypedByUser}
                        onChange={(e) => setTextTypedByUser(e.target.value)}
                        onKeyDown={checkEnter}
                    />
                </div>
            </div>
        </div>
    );
}
