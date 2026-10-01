'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Client-side behavior for the post body, which the page renders as a static
 * HTML string (dangerouslySetInnerHTML). Rendering the body itself in a client
 * component would ship the whole post twice (HTML + RSC payload), so this
 * component renders nothing in place and attaches delegated listeners to the
 * container identified by `targetId` instead:
 *
 * - code blocks: the copy button emitted by lib/rehype-code-blocks.ts;
 * - images: click (or Enter/Space) opens the image full-screen.
 */

const COPIED_RESET_MS = 2000

interface LightboxImage {
  src: string
  alt: string
}

export function PostBodyEnhancer({ targetId }: { targetId: string }) {
  const t = useTranslations('blogPost')
  const [image, setImage] = useState<LightboxImage | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const root = document.getElementById(targetId)
    if (!root) return

    // The HTML comes from a locale-agnostic pipeline; localize labels here.
    root.querySelectorAll<HTMLButtonElement>('[data-code-copy]').forEach((btn) => {
      btn.setAttribute('aria-label', t('copyCode'))
      btn.title = t('copyCode')
    })

    // Images that are already links keep their link behavior.
    const zoomable = Array.from(root.querySelectorAll<HTMLImageElement>('img')).filter(
      (img) => !img.closest('a'),
    )
    zoomable.forEach((img) => {
      img.dataset.zoomable = ''
      img.tabIndex = 0
      img.setAttribute('role', 'button')
      img.setAttribute('aria-label', img.alt ? `${t('expandImage')}: ${img.alt}` : t('expandImage'))
    })

    const timers = new Set<number>()

    const copy = async (btn: HTMLButtonElement) => {
      const code = btn.closest('.code-block')?.querySelector('pre code')
      if (!code) return
      try {
        await navigator.clipboard.writeText(code.textContent ?? '')
      } catch {
        // Clipboard API blocked (insecure context, denied permission): leave
        // the button as is rather than claiming a copy that did not happen.
        return
      }
      btn.dataset.copied = ''
      btn.setAttribute('aria-label', t('copied'))
      btn.title = t('copied')
      const timer = window.setTimeout(() => {
        delete btn.dataset.copied
        btn.setAttribute('aria-label', t('copyCode'))
        btn.title = t('copyCode')
        timers.delete(timer)
      }, COPIED_RESET_MS)
      timers.add(timer)
    }

    const open = (img: HTMLImageElement) => {
      openerRef.current = img
      setImage({ src: img.currentSrc || img.src, alt: img.alt })
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const btn = target.closest<HTMLButtonElement>('[data-code-copy]')
      if (btn && root.contains(btn)) {
        void copy(btn)
        return
      }
      if (target instanceof HTMLImageElement && 'zoomable' in target.dataset) {
        open(target)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (
        (event.key === 'Enter' || event.key === ' ') &&
        target instanceof HTMLImageElement &&
        'zoomable' in target.dataset
      ) {
        event.preventDefault()
        open(target)
      }
    }

    root.addEventListener('click', onClick)
    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('click', onClick)
      root.removeEventListener('keydown', onKeyDown)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [targetId, t])

  const close = useCallback(() => {
    setImage(null)
    openerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!image) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    closeButtonRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [image, close])

  if (!image) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || t('expandImage')}
      className="image-lightbox fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-black/85 p-4 backdrop-blur-sm md:p-8"
      onClick={close}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={close}
        aria-label={t('closeImage')}
        className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white md:right-5 md:top-5"
      >
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary post media, already an <img> in the body */}
      <img
        src={image.src}
        alt={image.alt}
        className="image-lightbox__img max-h-[85vh] max-w-full cursor-zoom-out rounded-lg object-contain shadow-2xl"
      />
      {image.alt && (
        <p className="max-w-3xl text-center text-sm text-white/80">{image.alt}</p>
      )}
    </div>,
    document.body,
  )
}
