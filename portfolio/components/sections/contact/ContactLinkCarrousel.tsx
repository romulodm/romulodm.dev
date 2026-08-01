'use client';

import './Contact.css';

import React from 'react';
import { AiFillInstagram } from 'react-icons/ai';
import { FaDiscord, FaGithub, FaLinkedin, FaTwitch } from 'react-icons/fa';
import { SiOnlyfans } from 'react-icons/si';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { TooltipProps } from '@mui/material/Tooltip';
import { LattesIcon } from '@/components/icons/LattesIcon'

interface ItemTooltipProps extends TooltipProps {
  color?: string;
}

const ItemTooltip = styled(({ className, ...props }: ItemTooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))<ItemTooltipProps>(({ color }) => ({
  '& .MuiTooltip-arrow': {
    color: color,
  },
  '& .MuiTooltip-tooltip': {
    backgroundColor: color,
    fontSize: '13px',
  },
}));

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
    <ItemTooltip title={title} placement="bottom" color={color}>
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

export default function LinkCarousel(): React.JSX.Element {
  const links: LinkItem[] = [
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

  return (
    <div className="flex w-full">
      <div className="relative pt-4 pb-2 overflow-hidden w-fit">
        <div className="flex gap-2 justify-center">
          {links.map((link, index) => (
            <Link key={index} {...link} />
          ))}
        </div>
        <div className="absolute top-0 left-0 w-28 h-full bg-gradient-to-r from-white via-transparent to-transparent pointer-events-none dark:from-neutral-950" />
        <div className="absolute top-0 right-0 w-28 h-full bg-gradient-to-l from-white via-transparent to-transparent pointer-events-none dark:from-neutral-950" />
      </div>
    </div>
  );
}
