import { useState } from "react";

export default function TerminalFunctional({ componentsToShow, textTypedByUser, setTextTypedByUser, checkMessageEntered }) {
    const [messageHistory, setMessageHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    
    function setCursorToEnd(inputElement) {
        setTimeout(() => {
            inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
        }, 1);
    }

    function checkEnter(e) {
        const inputElement = e.currentTarget;
        
        if (e.key === "Enter") {
            setMessageHistory([...messageHistory, textTypedByUser]);
            setHistoryIndex(messageHistory.length + 1);
            checkMessageEntered(e);
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

            <div className="font-mono text-sm">
                <div className="flex items-center flex-nowrap gap-1">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <input
                        className="whitespace-nowrap outline-0 border-0 font-semibold flex-1"
                        value={textTypedByUser}
                        onChange={(e) => setTextTypedByUser(e.target.value)}
                        onKeyDown={checkEnter}
                    />
                </div>
            </div>
        </div>
    );
}
