import { IoChevronDown, IoChevronUp, IoSearchOutline } from "react-icons/io5";
import { LiaRandomSolid } from "react-icons/lia";
import * as Popover from '@radix-ui/react-popover';
import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const FilteringMenu = ({ onChange, filter }) => {
  const { t } = useTranslation('blog');

  const buttonRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(0);

  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [buttonRef.current]);

  const [showDropdown, setShowDropdown] = useState(false);
  const [showPortugueseDrop, setShowPortugueseDrop] = useState(false);
  const [showEnglishDrop, setShowEnglishDrop] = useState(false);

  return (
    <div className="grid gap-2.5 pt-2 pb-3 grid-cols-1 md:grid-cols-3">
      <div className="mt-1 relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IoSearchOutline className="text-gray-400" />
        </div>
        <input
          type="text"
          name="name"
          id="name"
          required
          className="pl-10  py-2 px-4 block w-full border border-gray-200 focus:border-blue-900 focus:ring-opacity-30 focus:outline-none focus:ring focus:ring-blue-900"
          placeholder={t('filter.search')}
        />
      </div>

      <button className="mt-1 px-4 py-2 border  w-full bg-blue-900 flex items-center gap-2 text-white focus:ring-neutral-500 focus:border-neutral-500">
        <LiaRandomSolid />
        {t('filter.random')}
      </button>

      <Popover.Root>
        <Popover.Trigger asChild>
          <button onClick={() => setShowDropdown(!showDropdown)} ref={buttonRef} className="mt-1 justify-between px-4 py-2 border w-full border-gray-200 flex items-center gap-2 text-gray-400">
            {t('filter.filter')}
            {showDropdown ? (
                <IoChevronUp />
              ) : (
                <IoChevronDown />
            )}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            style={{ width: buttonWidth }}
            className="border  p-2 bg-stone-50 animation-duration-400 will-change-transform opacity focus:outline-none"
            sideOffset={5}
          >
              <button 
                className="w-full py-2 px-3  items-center flex justify-between hover:bg-gray-100"
                onClick={() => setShowPortugueseDrop(!showPortugueseDrop)}
              >              <div className="flex gap-1 items-center">
                <img className="w-5 h-5 rounded-full object-cover" src="./br.svg"  />
                Português
              </div>
              {showPortugueseDrop ? (
                <IoChevronUp />
              ) : (
                <IoChevronDown />
              )}
            </button>

            <button 
              className="w-full py-2 px-3 items-center  flex justify-between hover:bg-gray-100"
              onClick={() => setShowEnglishDrop(!showEnglishDrop)}
            >
              <div className="flex gap-1 items-center">
                <img className="w-5 h-5 rounded-full object-cover" src="./us.svg"  />
                Inglês
              </div>
              {showEnglishDrop ? (
                <IoChevronUp />
              ) : (
                <IoChevronDown />
              )}
            </button>

          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

export default FilteringMenu;
