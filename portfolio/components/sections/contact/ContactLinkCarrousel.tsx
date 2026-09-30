'use client';

import './Contact.css';

import React from 'react';
import { AiFillInstagram } from 'react-icons/ai';
import { FaGithub, FaLinkedin, FaTwitch } from 'react-icons/fa';
import { SiOnlyfans } from 'react-icons/si';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { LattesIcon } from '@/components/icons/LattesIcon'

interface ItemTooltipProps {
  title: string;
  color: string;
  children: React.ReactElement;
}

/**
 * Tooltip tinted with the network's brand color. It uses the Radix primitive
 * directly instead of the shared `ui/tooltip`, whose dark chip and arrow
 * colors are fixed by class; here both come from the link's `color`.
 */
function ItemTooltip({ title, color, children }: ItemTooltipProps): React.JSX.Element {
  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="bottom"
            sideOffset={6}
            style={{ backgroundColor: color }}
            className="pointer-events-none z-50 select-none whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-medium text-white shadow-lg duration-150 ease-out animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1"
          >
            {title}
            <TooltipPrimitive.Arrow width={10} height={5} style={{ fill: color }} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

interface LinkItem {
  url: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  id: string;
}

interface LinkProps extends LinkItem { }

function Link({ url, icon, title, color, id }: LinkProps): React.JSX.Element {
  return (
    <ItemTooltip title={title} color={color}>
      <a
        href={url}
        target="_blank"
        id={id}
        rel="noopener noreferrer"
        className="link-carrousel block p-3.5 rounded-lg transition-transform bg-white dark:bg-neutral-900 duration-200 border-2 hover:-translate-y-1.5"
      >
        <div className="flex items-center text-lg">{icon}</div>
      </a>
    </ItemTooltip>
  );
}

const LINKS: LinkItem[] = [
  {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    icon: <SiOnlyfans />,
    color: '#4285f4',
    title: 'Onlyfans 🔥',
    id: 'onlyfans',
  },
  {
    url: 'https://www.twitch.tv/romulodm',
    icon: <FaTwitch />,
    color: '#9146ff',
    title: 'Twitch',
    id: 'twitch',
  },
  {
    url: 'https://www.linkedin.com/in/romulodm',
    icon: <FaLinkedin />,
    color: '#0a66c2',
    title: 'LinkedIn',
    id: 'linkedin',
  },
  {
    url: 'https://github.com/romulodm',
    icon: <FaGithub />,
    color: '#333',
    title: 'GitHub',
    id: 'github',
  },
  {
    url: 'http://lattes.cnpq.br/0179162809960172',
    icon: <LattesIcon />,
    color: '#00549f',
    title: 'Lattes',
    id: 'lattes',
  },
  {
    url: 'https://www.instagram.com/romulo_dmr',
    icon: <AiFillInstagram />,
    color: '#c13584',
    title: 'Instagram',
    id: 'instagram',
  },
  {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    icon: <SiOnlyfans />,
    color: '#4285f4',
    title: 'Onlyfans 🔥',
    id: 'onlyfans',
  },
];

/**
 * Largura de um item da fileira: 1.125rem (text-lg) + p-3.5 (0.875rem x 2)
 * + border-2 (0.125rem x 2) = 3.125rem.
 */
const LINK_SIZE = '3.125rem';
const LINK_GAP = '0.5rem';

/** Largura total da fileira de icones. O formulario usa isso como largura maxima. */
export const LINK_CARROUSEL_WIDTH =
  `calc(${LINKS.length} * ${LINK_SIZE} + ${LINKS.length - 1} * ${LINK_GAP})`;

export default function LinkCarousel(): React.JSX.Element {
  return (
    <div className="flex w-full">
      <div className="relative pt-4 pb-2 overflow-hidden w-fit">
        <div className="flex gap-2 justify-center">
          {LINKS.map((link, index) => (
            <Link key={index} {...link} />
          ))}
        </div>
        <div className="absolute top-0 left-0 w-28 h-full bg-gradient-to-r from-white via-transparent to-transparent pointer-events-none dark:from-neutral-950" />
        <div className="absolute top-0 right-0 w-28 h-full bg-gradient-to-l from-white via-transparent to-transparent pointer-events-none dark:from-neutral-950" />
      </div>
    </div>
  );
}
