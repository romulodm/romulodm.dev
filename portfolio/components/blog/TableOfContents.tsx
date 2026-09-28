'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Heading {
  id: string;
  text: string;
  level: number;
}

const NAVBAR_HEIGHT = 90;

/**
 * The comments block lives inside <article>, so a plain `article h1, h2, h3`
 * query also picks up headings rendered inside it. The only one the TOC wants
 * from there is the section title, which carries a fixed `id="comments"` set by
 * CommentsSection. Matching on that id instead of on the heading text keeps it
 * working in every locale (the old /comentario|comment/ test missed the accent
 * in "comentário") and gives the link a target React itself renders, so a
 * re-render of the comments block cannot strip an id assigned here.
 */
const COMMENTS_CONTAINER = '#comments-section';

function collectHeadings(): Heading[] {
  const elements = Array.from(document.querySelectorAll('article h1, article h2, article h3')).filter(
    (element) => element.id === 'comments' || !element.closest(COMMENTS_CONTAINER),
  );

  elements.forEach((element) => {
    if (!element.id) {
      element.id = element.textContent?.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim() ?? Math.random().toString(36).slice(2);
    }
  });

  return elements.map((element) => ({ id: element.id, text: element.textContent ?? '', level: Number(element.tagName[1]) }));
}

function getActiveId(headings: Heading[]): string {
  for (let i = headings.length - 1; i >= 0; i -= 1) {
    const element = document.getElementById(headings[i].id);
    if (!element) continue;
    if (element.getBoundingClientRect().top <= NAVBAR_HEIGHT + 320) return headings[i].id;
  }

  return headings[0]?.id ?? '';
}

export function TableOfContents() {
  const t = useTranslations('blogUi.toc');
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingsRef = useRef<Heading[]>([]);

  useEffect(() => {
    setHeadings([]);
    setActiveId('');
    headingsRef.current = [];

    let mutationObserver: MutationObserver | null = null;

    const onScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      if (isScrollingRef.current || headingsRef.current.length === 0) return;
      setActiveId(getActiveId(headingsRef.current));
    };

    function setup() {
      const found = collectHeadings();
      if (found.length === 0) return false;
      headingsRef.current = found;
      setHeadings(found);
      setActiveId(getActiveId(found));
      return true;
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    if (!setup()) {
      const article = document.querySelector('article') ?? document.body;
      mutationObserver = new MutationObserver(() => {
        if (setup()) mutationObserver?.disconnect();
      });
      mutationObserver.observe(article, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      mutationObserver?.disconnect();
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [pathname]);

  function scrollToHeading(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;

    isScrollingRef.current = true;
    setActiveId(id);

    const top = element.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
    window.scrollTo({ top, behavior: 'smooth' });

    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 700);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (headings.length === 0) return null;

  return (
    <div className="space-y-3 p-5">
      <h3 className="type-small font-semibold text-foreground">{t('title')}</h3>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <a key={heading.id} href={`#${heading.id}`} onClick={(event) => scrollToHeading(event, heading.id)} className={['block text-xs leading-snug transition-colors hover:text-foreground', heading.level === 3 ? 'pl-3' : '', activeId === heading.id ? 'font-semibold text-primary' : 'text-muted-foreground'].join(' ')}>
            {heading.text}
          </a>
        ))}
      </nav>
      {showScrollTop && (
        <button onClick={scrollToTop} className="flex w-full items-center gap-1.5 border-t border-border pt-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ChevronUp className="h-3.5 w-3.5" />
          {t('scrollToTop')}
        </button>
      )}
    </div>
  );
}
