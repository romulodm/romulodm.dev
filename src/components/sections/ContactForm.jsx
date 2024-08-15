import React, { useState, useEffect } from 'react';
import { FiAtSign, FiUser } from 'react-icons/fi';
import { MdErrorOutline, MdSend } from 'react-icons/md';
import { BsSendCheck } from 'react-icons/bs';
import { CircularProgress } from '@mui/material';
import { QuestionAnswer } from '@mui/icons-material';
import { FaQuestionCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function ContactForm() {
  const { t } = useTranslation('contact');


  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const response = await fetch(import.meta.env.VITE_URL_EMAIL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_key: import.meta.env.VITE_ACCESSKEY_EMAIL,
        email,
        name,
        message,
      }),
    });
    const result = await response.json();
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.message);
    }
    setLoading(false);
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
        className={`lg:px-6 rounded-lg max-w-md w-full transition-all duration-300 ${submitted ? 'opacity-50 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}
      >
        {error && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <div className="flex">
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
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 py-2 px-4 block w-full border border-gray-300 rounded-md focus:border-[#f9305b]/70 focus:ring-opacity-20 focus:outline-none focus:ring focus:ring-[#f9305b]"
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
              onChange={(e) => setName(e.target.value)}
              className="pl-10 py-2 px-4 block w-full border border-gray-300 rounded-md focus:border-[#f9305b]/70 focus:ring-opacity-20 focus:outline-none focus:ring focus:ring-[#f9305b]"
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
            onChange={(e) => setMessage(e.target.value)}
            className="py-2 px-4 block w-full border border-gray-300 rounded-md focus:border-[#f9305b]/70 focus:ring-opacity-20 focus:outline-none focus:ring focus:ring-[#f9305b]"
            placeholder={t('form-text')}
            rows="4"
          />
        </div>
        <div className='w-full flex justify-start'>
            <button
                type="submit"
                className="shadow-glow w-full text-sm inline-flex justify-center items-center px-4 py-2 bg-[#f9305b] text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-200"
                disabled={loading}
            >
                {loading ? (
                    <>
                    <CircularProgress size={20} style={{ fontSize: "2px" }} color="secondary" />
                    </>
                ) : (
                    <>
                    <MdSend className="mr-2" />
                    {t('form-button')}
                    </>
                )}
            </button>

        </div>
      </form>

      {submitted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-50 z-20 transition-all duration-300">
            <div className="send-email w-fit h-fit rounded-lg p-10 relative email-message">
                <BsSendCheck className="text-[#f9305b] text-6xl mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">{t('sended-title')}</h2>
                <p className="text-gray-600">{t('sended-content')}</p>
            </div>
        </div>
      )}
      
    </div>
  );
}
