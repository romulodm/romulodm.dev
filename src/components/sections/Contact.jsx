import './Contact.css'

import React from 'react';

import ContactForm from './ContactForm';
import LinkCarousel from './ContactLinkCarrousel';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col w-full h-fit justify-center gap-6 mb-10 text-center">
      <p className="text-gray-500">
        {t('contact.text')}
      </p>
      <LinkCarousel/>

      <ContactForm/>
      
    </div>
  );
}
