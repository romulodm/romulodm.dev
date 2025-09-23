import React from 'react';

import { useTranslation } from 'react-i18next';

import { FaGithub, FaLinkedin, FaTwitch } from 'react-icons/fa';

export default function Footer({ showHand = false }: { showHand: boolean }) {
    const { t } = useTranslation('footer');

    const links = [
        {
          url: 'https://github.com/romulodm',
          icon: <FaGithub />,
          color: '#333',
          title: 'GitHub',
          id: 'github'
        },
        {
          url: 'https://www.linkedin.com/in/romulodm',
          icon: <FaLinkedin />,
          color: '#0a66c2',
          title: 'LinkedIn',
          id: 'linkedin'
        },
      ];

    return (
    <div className="flex flex-col w-full">
        
        {showHand && (
            <div className="flex w-full justify-center mb-8">
                <div className="text-center w-20 emoji-home">👋</div>
            </div>
        )}

        <footer className="w-full sm:mb-16 md:mb-0 z-50 bg-white dark:bg-[#09090b] flex gap-7 py-10 border-t dark:border-neutral-700 justify-between w-full items-center text-gray-400 dark:text-neutral-500 text-center text-sm">
            
            <div className="text-xs sm:text-[.87rem] flex flex-row dark:font-semibold">
                <p>© 2024 Romulo de Moraes, {t('rights')}</p>
            </div>

            <div className="flex justify-center items-center gap-3.5">
                {links.map((link, index) => (
                    <a
                    href={link.url}
                    key={index}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    >
                    <div className={`flex hover:text-gray-600 dark:hover:text-neutral-400 items-center text-xl sm:text-2xl`}>
                        {link.icon}
                    </div>
                    </a>
                ))}
            </div>
        </footer> 
    </div>
    )
}
