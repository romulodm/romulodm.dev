'use client';

import './Contact.css';

import React from 'react';
import ContactForm from './ContactForm';
import LinkCarousel from './ContactLinkCarrousel';
import { useTranslations } from 'next-intl';

export default function Contact(): React.JSX.Element {
  const t = useTranslations('contact');

  return (
    <div className="flex flex-col w-full h-fit justify-center gap-6 mb-5 text-center">
      <LinkCarousel />
    </div>
  );
}
