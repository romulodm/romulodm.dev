import React from 'react';
import { AiFillInstagram } from 'react-icons/ai';
import { FaDiscord, FaGithub, FaLinkedin, FaTwitch } from 'react-icons/fa';
import { SiOnlyfans } from 'react-icons/si';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

import ContactForm from '../ContactForm';

const ItemTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
  ))(({ color }) => ({
    '& .MuiTooltip-arrow': {
      color: color,
    },
    '& .MuiTooltip-tooltip': {
      backgroundColor: color,
      fontSize: '13px',
    },
}));

function Link({ url, icon, title, color }) {
  return (
    <ItemTooltip title={title} placement="bottom" color={color}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3.5 rounded-lg transition-transform duration-200 border-2 hover:-translate-y-1.5"
        style={{ borderColor: color, color: color }}
      >
        <div className="flex items-center text-lg">
          {icon}
        </div>
      </a>
    </ItemTooltip>
  );
}

function LinkCarousel() {
  const links = [
    {
      url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
      icon: <SiOnlyfans />,
      color: '#4285f4',
      title: 'Onlyfans 🔥'
    },
    {
      url: 'https://www.twitch.tv/romulodm',
      icon: <FaTwitch />,
      color: '#9146ff',
      title: 'Twitch'
    },
    {
      url: 'https://www.linkedin.com/in/romulo-de-moraes-918793258/',
      icon: <FaLinkedin />,
      color: '#0a66c2',
      title: 'LinkedIn'
    },
    {
      url: 'https://github.com/romulodm',
      icon: <FaGithub />,
      color: '#333',
      title: 'GitHub'
    },
    {
      url: `https://discord.gg/JsDqrwZJ`,
      icon: <FaDiscord />,
      color: '#7289da',
      title: 'Discord'
    },
    {
      url: 'https://www.instagram.com/romulo_dmr',
      icon: <AiFillInstagram />,
      color: '#c13584',
      title: 'Instagram'
    },
    {
      url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
      icon: <SiOnlyfans />,
      color: '#4285f4',
      title: 'Onlyfans 🔥'
    },
  ];

  return (
    <div className="flex w-full justify-center">
      <div className="relative py-2 overflow-hidden w-fit">
        <div className="flex gap-2 justify-center">
          {links.map((link, index) => (
            <Link key={index} {...link} />
          ))}
        </div>
        <div className="absolute top-0 left-0 w-28 h-full bg-gradient-to-r from-white via-transparent to-transparent pointer-events-none"/>
        <div className="absolute top-0 right-0 w-28 h-full bg-gradient-to-l from-white via-transparent to-transparent pointer-events-none"/>
      </div>
    </div>
  );
}

export default function Contact() {
  return (
    <div className="flex flex-col w-full h-fit justify-center gap-6 mb-10 text-center">
      <p className="text-gray-500">
        Feel free to <span className="text-black">contact me</span> if you have any questions or suggestions. I am always open to new <span className="text-black">ideas and opportunities</span>.
      </p>
      <LinkCarousel />

      <ContactForm />

      <div className="text-center emoji-home">👋</div>

      
    </div>
  );
}
