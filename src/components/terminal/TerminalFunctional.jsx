import './Terminal.css'
import { useState } from 'react';
import { DefaultMessage, HelpMessage, FollowMessage, CatMessage, InterMessage, UnknowMessage } from './TerminalMessages';

const commands = {
    "help": HelpMessage,
    "follow": FollowMessage,
    "cat": CatMessage,
    "inter": InterMessage,
};

export default function TerminalFunctional() {
    const [componentsToShow, setComponentsToShow] = useState([DefaultMessage, FollowMessage]);
    const [textTypedByUser, setTextTypedByUser] = useState("");

    function checkMessageEntered(e) {
        if (e.key === "Enter") {
            const CommandComponent = commands[textTypedByUser];
            if (textTypedByUser == "clear"){
                setComponentsToShow([]);
            }
            else if (CommandComponent) {
                setComponentsToShow([...componentsToShow, CommandComponent]);
            } else {
                setComponentsToShow([...componentsToShow, UnknowMessage]);
            }
            setTextTypedByUser("");
        }
    }

    return (
        <div className="flex flex-col">
            {componentsToShow.map((Component, index) => (
                <Component key={index} />
            ))}

            <div className="font-mono text-sm">
                <div className="flex items-centerflex-nowrap">
                    <div className="text-blue-600 font-semibold">visitor@romulodm:~$&nbsp;</div>
                    <input
                        className="whitespace-nowrap outline-0 border-0 font-semibold flex-1"
                        value={textTypedByUser}
                        onChange={(e) => setTextTypedByUser(e.target.value)}
                        onKeyDown={checkMessageEntered}
                    />
                </div>
            </div>
        </div>
    );
}
