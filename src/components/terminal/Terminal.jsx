import { useEffect, useState } from "react";
import { HiChevronDown } from "react-icons/hi";
import { IoAddOutline } from "react-icons/io5";
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscTerminalPowershell } from "react-icons/vsc";
import TerminalExperience from "./TerminalExperience";
import TerminalFunctional from "./TerminalFunctional";

export default function Terminal() {
  const [showSecondNavigationTab, setShowSecondNavigationTab] = useState(false);
  const [displayedNavigationTab, setDisplayedNavigationTab] = useState(0);
  
  function closeNavigationTab() {
    setDisplayedNavigationTab(0);
    setShowSecondNavigationTab(false);
  }

  return (
    <div className="flex flex-col rounded-lg overflow-hidden border rounded-xl shadow-3xl">
      <div className="flex flex-row justify-between bg-gray-300 w-full">
        <div className="flex flex-row items-center text-sm py-1.5">
          <button
            onClick={() => setDisplayedNavigationTab(0)}
            className="flex cursor-default px-3 ml-1.5 py-1 flex-row w-56 h-8 rounded-lg bg-gray-200 items-center justify-between"
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
              className="flex cursor-default px-3 ml-1.5 flex-row w-56 h-8 rounded-lg bg-gray-200 items-center justify-between"
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
            <button 
              onClick={() => setShowSecondNavigationTab(true)}
              className="flex px-3 ml-1.5 flex-row h-8 rounded-lg bg-gray-200 items-center justify-between"
            >
              <IoAddOutline />
            </button>
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

      <div className="flex flex-row p-2 h-96 overflow-auto">
          {displayedNavigationTab === 0 ? (
            <TerminalExperience/>
          ) : (
            <TerminalFunctional/>
          )}

      </div>
    </div>
  );
}
