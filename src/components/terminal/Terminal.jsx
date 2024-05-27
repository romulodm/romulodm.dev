import './Terminal.css';
import { useState } from "react";
import { IoAddOutline } from "react-icons/io5";
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscTerminalPowershell } from "react-icons/vsc";
import TerminalExperience from "./TerminalExperience";
import TerminalFunctional from "./TerminalFunctional";
import { DefaultMessage, InitialMessage, HelpMessage, CatsMessage, InterMessage, UnknowMessage, WhoMessage, WhoamiMessage, SecretMessage, SecretHintMessage, SecretWrongMessage, SecretCorrectMessage, SpotifyMessage } from './TerminalMessages';
import CustomTooltip from '../CustomTooltip';

const SECRET_PASSWORD = import.meta.env.VITE_TERMINAL_SECRET_PASSWORD;

const commands = {
    "help": HelpMessage,
    "initial": InitialMessage,
    "follow": InitialMessage,
    "who": WhoMessage,
    "whoami": WhoamiMessage,
    "cats": CatsMessage,
    "inter": InterMessage,
    "spotify": SpotifyMessage,
    "secret": SecretMessage,
    "secret --get_hint": SecretHintMessage,
};

export default function Terminal() {
    const loadingTime = useState(Math.floor(Math.random() * 300));
    const [showTooltip, setShowTooltip] = useState(true);

    const secretPassRegex = /^secret --pass (\d{4})$/;

    const [showSecondNavigationTab, setShowSecondNavigationTab] = useState(false);
    const [displayedNavigationTab, setDisplayedNavigationTab] = useState(0);
    const [componentsToShow, setComponentsToShow] = useState([DefaultMessage, InitialMessage]);
    const [textTypedByUser, setTextTypedByUser] = useState("");

    function closeNavigationTab() {
        setDisplayedNavigationTab(0);
        setShowSecondNavigationTab(false);
        setComponentsToShow([DefaultMessage, InitialMessage]);
    }

    function checkMessageEntered() {
        const CommandComponent = commands[textTypedByUser];

        // checking password typed:
        const match = textTypedByUser.match(secretPassRegex);
        //

        if (textTypedByUser === "clear") {
            setComponentsToShow([]);
        } else if (match) {
            const enteredPassword = match[1];
            if (enteredPassword === SECRET_PASSWORD) {
                setComponentsToShow([...componentsToShow, () => <SecretCorrectMessage command={textTypedByUser}/>]);
            } else {
                setComponentsToShow([...componentsToShow, () => <SecretWrongMessage command={textTypedByUser}/>]);
            }
        } 
        else if (CommandComponent) {
            setComponentsToShow([...componentsToShow, CommandComponent]);
        } else {
            setComponentsToShow([...componentsToShow, () => <UnknowMessage command={textTypedByUser} />]);
        }
        setTextTypedByUser("");
    }

    function openAndChangeTab() {
        setDisplayedNavigationTab(1);
        setShowSecondNavigationTab(true);
        setTextTypedByUser("");
        setShowTooltip(false);
    }

    return (
        <div className="flex flex-col overflow-hidden rounded-lg shadow-xl">
            <div className="flex flex-row justify-between bg-gray-100 w-full border-t rounded-tl-lg rounded-tr-lg shadow-3xl">
                <div className="flex flex-row items-center text-sm py-1.5">
                    <button
                        onClick={() => setDisplayedNavigationTab(0)}
                        className={`${displayedNavigationTab === 0 ? 'active-nav' : 'desactive-nav'} flex cursor-default px-3 ml-1.5 py-1 flex-row w-56 h-8 rounded-lg items-center justify-between`}
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
                                className={`${displayedNavigationTab === 1 ? 'active-nav' : 'desactive-nav'} flex cursor-default px-3 ml-1.5 py-1 flex-row w-56 h-8 rounded-lg items-center justify-between`}
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
                                className="flex px-3 ml-1.5 flex-row h-8 rounded-lg bg-gray-200 items-center justify-between"
                            >
                                <IoAddOutline />
                            </button>
                        </>
                    ) : (
                        showTooltip ? (
                            <CustomTooltip position="bottom" content={'You can use this terminal'} onClose={() => setShowTooltip(false)}>
                                <button 
                                    onClick={() => openAndChangeTab()}
                                    className="flex px-3 ml-1.5 flex-row h-8 rounded-lg bg-gray-200 items-center justify-between"
                                >
                                    <IoAddOutline />
                                </button>
                            </CustomTooltip>
                        ) : (
                            <button 
                                onClick={() => openAndChangeTab()}
                                className="flex px-3 ml-1.5 flex-row h-8 rounded-lg bg-gray-200 items-center justify-between"
                            >
                                <IoAddOutline />
                            </button>
                        )
                    )}
                </div>

                <div className="flex flex-row">
                    <div className="flex justify-center items-center px-4">
                        <VscChromeMinimize />
                    </div>
                    <div className="flex justify-center items-center px-4">
                        <VscChromeMaximize />
                    </div>
                    <div className="flex justify-center items-center px-4">
                        <VscChromeClose />
                    </div>
                </div>
            </div>

            <div className="flex flex-row p-2 h-110 overflow-auto border rounded-bl-lg rounded-br-lg">
                {displayedNavigationTab === 0 ? (
                    <TerminalExperience loadingTime={loadingTime}/>
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
