import { IoChevronDown, IoSearchOutline } from 'react-icons/io5';
import { LiaRandomSolid } from 'react-icons/lia';
import * as Popover from '@radix-ui/react-popover';
import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function FilteringMenu({ onChange, filter, blogs }) {
  const { t } = useTranslation('blog');

  const buttonRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(null);
  const [theme, setTheme] = useState(filter.theme || 'all');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [buttonRef.current]);

  const categoriesWithCount = blogs.reduce((acc, blog) => {
    blog.categories.forEach(category => {
      acc[category] = acc[category] ? acc[category] + 1 : 1;
    });
    return acc;
  }, {});

  const allBlogsCount = blogs.length;

  const [search, setSearch] = useState(filter.search || '');
  
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    onChange({ ...filter, search: e.target.value });
  };

  const handleThemeChange = (theme) => {
    setTheme(theme);
    onChange({ ...filter, theme });
    setIsPopoverOpen(false);
  };

  const getRandomSlug = () => {
    if (blogs.length > 0) {
      const randomIndex = Math.floor(Math.random() * blogs.length);
      return blogs[randomIndex].slug.current;
    }
    return null;
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
          className="pl-10 dark:text-neutral-500 py-2 px-4 block w-full border border-gray-200 bg-transparent dark:bg-neutral-900 dark:border-neutral-700 focus:border-blue-900 focus:ring-opacity-30 focus:outline-none focus:ring focus:ring-blue-900"
          placeholder={t('filter.search')}
        />
      </div>

      <Link to={'/blog/post/' + getRandomSlug()}
        className="mt-1 px-4 py-2 border-0 w-full bg-blue-900 dark:bg-sky-800 flex items-center gap-2 text-white focus:ring-neutral-500 focus:border-neutral-500"
      >
        <LiaRandomSolid />
        {t('filter.random')}
      </Link>

      <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <Popover.Trigger asChild>
          <button ref={buttonRef} className="mt-1 justify-between px-4 py-2 dark:bg-neutral-900 dark:border-neutral-700 border w-full border-gray-200 flex items-center gap-2 text-gray-400">
            {theme === 'all' ? t('filter.filter') : theme }
            <IoChevronDown />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            style={{ width: buttonWidth || 'auto' }} 
            className="border shadow-2xl p-2 bg-white dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700"
            sideOffset={5}
          >
            <button
              onClick={() => handleThemeChange('all')}
              className="w-full py-2 px-3 items-center flex justify-between hover:bg-gray-100 dark:hover:bg-neutral-800">
              {t('filter.filter-all')} ({allBlogsCount})
            </button>
            {Object.keys(categoriesWithCount).map(category => (
              <button
                key={category}
                onClick={() => handleThemeChange(category)}
                className="w-full py-2 px-3 items-center flex justify-between hover:bg-gray-100 dark:hover:bg-neutral-800">
                {category} ({categoriesWithCount[category]})
              </button>
            ))}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
