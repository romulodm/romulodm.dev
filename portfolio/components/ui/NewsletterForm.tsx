'use client'

import { useState, FormEvent } from 'react'
import { useTranslations } from 'next-intl'

export function NewsletterForm() {
  const t = useTranslations('newsletterForm')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message || t('successDefault'))
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || t('errorDefault'))
      }
    } catch {
      setStatus('error')
      setMessage(t('networkError'))
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-3">
          {t('title')}
        </h2>
        <p className="text-blue-100 mb-6">
          {t('subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('placeholder')}
            required
            disabled={status === 'loading' || status === 'success'}
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? t('subscribing') : t('subscribe')}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              status === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
