'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useTranslations } from 'next-intl';

import NewsletterCard from '../newsletter/NewsletterCard';
import ApoiaseCard from '../support/ApoiaseCard';

const SLIDE_COUNT = 2;
const AUTOPLAY_INTERVAL = 5000;

export function BlogCarrousel() {
  const t = useTranslations('blogUi.carousel');
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying] = useState(false);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || !isPlaying) return;
    const timer = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [emblaApi, isPlaying]);

  return (
    <div className="w-full">
      <div className="relative overflow-hidden text-secondary-foreground">
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="relative">
            <div className="overflow-hidden bg-secondary/20 pb-10 dark:bg-secondary/10" ref={emblaRef}>
              <div className="flex">
                <div className="min-w-0 flex-[0_0_100%]"><NewsletterCard /></div>
                <div className="min-w-0 flex-[0_0_100%]"><ApoiaseCard /></div>
              </div>
            </div>

            <div className="hidden sm:inline">
              <button onClick={() => emblaApi?.scrollPrev()} className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-1 text-foreground transition-colors hover:bg-foreground/10" aria-label={t('previousSlide')}>
                <ChevronLeft size={24} />
              </button>
              <button onClick={() => emblaApi?.scrollNext()} className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-1 text-foreground transition-colors hover:bg-foreground/10" aria-label={t('nextSlide')}>
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className="-mt-12 flex items-center justify-center gap-3 pb-4">
            {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
              <button key={index} onClick={() => scrollTo(index)} className={`relative h-2 rounded-full transition-all ${index === selectedIndex ? 'w-8 bg-foreground/40' : 'w-2 bg-foreground/20 hover:bg-foreground/40'}`}>
                {index === selectedIndex && <div className={`absolute inset-0 rounded-full bg-foreground ${isPlaying ? 'origin-left animate-carousel-progress' : ''}`} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
