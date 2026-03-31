'use client';

import React, { useState, useEffect } from 'react';
import { FiAtSign, FiUser } from 'react-icons/fi';
import { MdErrorOutline, MdSend } from 'react-icons/md';
import { BsSendCheck } from 'react-icons/bs';
import { CircularProgress } from '@mui/material';
import { useTranslations } from 'next-intl';

interface SubmitResponse {
  success: boolean;
  message: string;
}

export default function ContactForm(): React.JSX.Element {
  const t = useTranslations('contact');

  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_URL_EMAIL ?? '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_ACCESSKEY_EMAIL,
          email,
          name,
          message,
        }),
      });

      const result: SubmitResponse = await response.json();

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.message);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submitted) {
      const timeout = setTimeout(() => {
        setSubmitted(false);
        setEmail('');
        setName('');
        setMessage('');
      }, 9000);
      return () => clearTimeout(timeout);
    }
  }, [submitted]);

  return (
    <div className="relative flex h-fit justify-center">
      <form
        onSubmit={submit}
        className={`rounded-lg max-w-md w-full transition-all duration-300 ${submitted ? 'opacity-50 pointer-events-none scale-95' : 'opacity-100 scale-100'
          }`}
      >
        {error && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <div className="flex items-center">
              <MdErrorOutline className="flex-shrink-0 h-5 w-5 text-yellow-700" />
              <div className="ml-3">
                <p>{error || 'Something went wrong. Please try again.'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiAtSign className="text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              id="email"
              required
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="pl-10 py-2 bg-transparent dark:bg-neutral-900 dark:text-neutral-300 dark:placeholder-neutral-500 px-4 block w-full border border-gray-300 dark:border-neutral-700 rounded-md focus:border-primary/70 focus:outline-none"
              placeholder={t('form-email')}
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiUser className="text-gray-400" />
            </div>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              className="pl-10 py-2 bg-transparent dark:bg-neutral-900 dark:text-neutral-300 dark:placeholder-neutral-500 px-4 block w-full border border-gray-300 dark:border-neutral-700 rounded-md focus:border-primary/70 focus:outline-none"
              placeholder={t('form-name')}
            />
          </div>
        </div>

        <div className="mb-4">
          <textarea
            name="message"
            id="message"
            required
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            className="py-2 bg-transparent dark:bg-neutral-900 dark:text-neutral-300 dark:placeholder-neutral-500 px-4 block w-full border border-gray-300 dark:border-neutral-700 rounded-md focus:border-primary/70 focus:outline-none"
            placeholder={t('form-text')}
            rows={4}
          />
        </div>

        <div className="w-full flex justify-start">
          <button
            type="submit"
            className=" w-full text-sm flex justify-center gap-2 items-center px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-200"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={20} style={{ fontSize: '2px' }} color="secondary" />
            ) : (
              <>
                {t('form-button')}
                <MdSend />
              </>
            )}
          </button>
        </div>
      </form>

      {submitted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-neutral-950 bg-opacity-50 z-20 transition-all duration-300">
          <div className="send-email w-fit h-fit rounded-lg p-10 relative email-message">
            <BsSendCheck className="text-primary text-6xl mx-auto mb-4" />
            <h2 className="text-2xl dark:text-white font-bold mb-2">{t('sended-title')}</h2>
            <p className="text-gray-600 dark:text-white">{t('sended-content')}</p>
          </div>
        </div>
      )}
    </div>
  );
}