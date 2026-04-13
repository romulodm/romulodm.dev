// components/blog/BlogCarrousel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

import NewsletterCard from '../newsletter/NewsletterCard';
import ApoiaseCard from '../support/ApoiaseCard';

const SLIDE_COUNT = 2;
const AUTOPLAY_INTERVAL = 5000;

export function BlogCarrousel() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const scrollTo = useCallback(
        (index: number) => emblaApi?.scrollTo(index),
        [emblaApi]
    );

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

    // Autoplay
    useEffect(() => {
        if (!emblaApi || !isPlaying) return;
        const timer = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_INTERVAL);
        return () => clearInterval(timer);
    }, [emblaApi, isPlaying]);

    return (
        <div className="w-full">
            <div className="relative text-secondary-foreground overflow-hidden">

                <div className="max-w-7xl mx-auto relative z-10">

                    {/* Slides */}
                    <div className="relative">
                        <div className="overflow-hidden bg-secondary/20 dark:bg-secondary/10 pb-10" ref={emblaRef}>
                            <div className="flex">
                                <div className="flex-[0_0_100%] min-w-0">
                                    <NewsletterCard />
                                </div>
                                <div className="flex-[0_0_100%] min-w-0">
                                    <ApoiaseCard />
                                </div>
                            </div>
                        </div>

                        <div className='hidden sm:inline'>
                            <button
                                onClick={() => emblaApi?.scrollPrev()}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-foreground/10 transition-colors z-20 text-foreground"
                                aria-label="Slide anterior"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={() => emblaApi?.scrollNext()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-foreground/10 transition-colors z-20 text-foreground"
                                aria-label="Próximo slide"
                            >
                                <ChevronRight size={24} />
                            </button>

                        </div>
                        {/* Setas agora dentro do relative do slider */}
                    </div>

                    <div className="flex items-center justify-center gap-3 pb-4 -mt-12">
                        {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => scrollTo(index)}
                                className={`relative h-2 rounded-full transition-all ${index === selectedIndex
                                    ? 'w-8 bg-foreground/40'
                                    : 'w-2 bg-foreground/20 hover:bg-foreground/40'
                                    }`}
                            >
                                {index === selectedIndex && (
                                    <div
                                        className={`absolute inset-0 bg-foreground rounded-full ${isPlaying ? 'origin-left animate-carousel-progress' : ''
                                            }`}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}