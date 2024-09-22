import { IoChevronDown, IoChevronUp, IoSearchOutline } from 'react-icons/io5';
import { LiaRandomSolid } from 'react-icons/lia';
import * as Popover from '@radix-ui/react-popover';
import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const FilteringMenu = ({ onChange, filter }) => {
  const { t } = useTranslation('blog');
  const [search, setSearch] = useState(filter.search || '');
  const [language, setLanguage] = useState(filter.language || 'all');
  
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    onChange({ ...filter, search: e.target.value });
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    onChange({ ...filter, language: lang });
  };

  return (
    <div className="grid gap-2.5 pt-2 pb-3 grid-cols-1 md:grid-cols-3">
      <div className="mt-1 relative w-full">
        <div className="absolute dark:text-neutral-500 inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IoSearchOutline className="text-gray-400 dark:text-neutral-500" />
        </div>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          className="pl-10 dark:text-neutral-500 py-2 px-4 block w-full border border-gray-200 bg-transparent dark:bg-neutral-900 dark:border-neutral-600 focus:border-blue-900 focus:ring-opacity-30 focus:outline-none focus:ring focus:ring-blue-900"
          placeholder={t('filter.search')}
        />
      </div>

      <button className="mt-1 px-4 py-2 border-0 w-full bg-blue-900 dark:bg-sky-800 flex items-center gap-2 text-white focus:ring-neutral-500 focus:border-neutral-500">
        <LiaRandomSolid />
        {t('filter.random')}
      </button>

      <Popover.Root>
        <Popover.Trigger asChild>
          <button className="mt-1 justify-between px-4 py-2 dark:bg-neutral-900 dark:border-neutral-600 border w-full border-gray-200 flex items-center gap-2 text-gray-400">
            {t('filter.language')}
            <IoChevronDown />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="border p-2 bg-white dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-600">
            <button onClick={() => handleLanguageChange('all')} className="w-full py-2 px-3 items-center flex justify-between hover:bg-gray-100 dark:hover:bg-neutral-800">
              {t('filter.all-languages')}
            </button>
            <button onClick={() => handleLanguageChange('Portuguese')} className="w-full py-2 px-3 items-center flex justify-between hover:bg-gray-100 dark:hover:bg-neutral-800">
              Português
            </button>
            <button onClick={() => handleLanguageChange('English')} className="w-full py-2 px-3 items-center flex justify-between hover:bg-gray-100 dark:hover:bg-neutral-800">
              English
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

export default FilteringMenu;
