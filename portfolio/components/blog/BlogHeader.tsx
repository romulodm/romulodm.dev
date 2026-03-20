// components/blog/BlogHeader.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Shuffle, ChevronDown, Tag, Heart, Eye, Rss, Lightbulb, Code2, Mail, BookOpen, SlidersHorizontal } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/format-number';


const carouselSlides = [
    {
        icon: Mail,
        title: 'Quer receber novos posts? 📬',
        description: 'Inscreva-se na nossa newsletter e fique por dentro de tudo.',
        action: 'Inscrever-se',
        href: '#newsletter',
    },
    {
        icon: BookOpen,
        title: 'Como este site foi criado? 🚀',
        description: 'Descubra as tecnologias e o processo por trás deste blog.',
        action: 'Ler postagem',
        href: '/post/como-o-site-foi-publicado',
    },
    {
        icon: Lightbulb,
        title: 'Tem uma ideia de post? 💡',
        description: 'Envie sua sugestão e ela pode virar o próximo artigo!',
        action: 'Enviar sugestão',
        href: '#suggest',
    },
];

export type PostSortOption = 'newest' | 'oldest' | 'most_liked' | 'most_viewed';

const SORT_OPTIONS: { value: PostSortOption; label: string }[] = [
    { value: 'newest', label: 'Mais recentes' },
    { value: 'most_liked', label: 'Mais curtidos' },
    { value: 'most_viewed', label: 'Mais vistos' },
    { value: 'oldest', label: 'Mais antigos' },
];

const CAROUSEL_SLIDES = [
    {
        id: 'newsletter',
        icon: Rss,
        title: 'Quer receber novos posts?',
        description: 'Inscreva-se na newsletter e fique por dentro de tudo.',
        cta: 'Inscrever-se',
        ctaHref: '#newsletter',
        accent: '#2563eb',
        bg: 'from-[#0f172a] to-[#1e3a5f]',
        dots: ['#3b82f6', '#60a5fa', '#93c5fd'],
    },
    {
        id: 'how-built',
        icon: Code2,
        title: 'Como este site foi construído?',
        description: 'Veja o post que escrevi sobre o código e arquitetura por trás disso.',
        cta: 'Ver post',
        ctaHref: '/blog/como-este-site-foi-construido',
        accent: '#0891b2',
        bg: 'from-[#0c1a2e] to-[#0e3045]',
        dots: ['#0ea5e9', '#38bdf8', '#7dd3fc'],
    },
    {
        id: 'suggest',
        icon: Lightbulb,
        title: 'Quer sugerir um tema?',
        description: 'Envie uma sugestão de assunto que você quer ver por aqui.',
        cta: 'Enviar sugestão',
        ctaHref: '#suggest',
        accent: '#0d9488',
        bg: 'from-[#0a1f1e] to-[#0d3330]',
        dots: ['#14b8a6', '#2dd4bf', '#5eead4'],
    },
];

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    publishedAt: Date | string | null;
    likes: number;
    views: number;
    commentsCount: number;
    postTags: { tag: string }[];
}

interface Props {
    allTags: string[];
    posts: Post[];
    sort: PostSortOption;
    onSortChange: (sort: PostSortOption) => void;
    onTagFilter: (tag: string | null) => void;
    activeTag: string | null;
    onRandom: () => void;
}

export function BlogHeader({
    allTags,
    posts,
    sort,
    onSortChange,
    onTagFilter,
    activeTag,
    onRandom,
}: Props) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

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
        const timer = setInterval(() => emblaApi.scrollNext(), 5000);
        return () => clearInterval(timer);
    }, [emblaApi, isPlaying]);


    const goToRandomPost = () => {
        if (posts.length === 0) return;
        const random = posts[Math.floor(Math.random() * posts.length)];
    };


    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const sortRef = useRef<HTMLDivElement>(null);

    const goTo = useCallback((idx: number) => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentSlide((idx + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
        setTimeout(() => setIsAnimating(false), 400);
    }, [isAnimating]);

    const startAutoplay = useCallback(() => {
        autoplayRef.current = setInterval(() => {
            setCurrentSlide((s) => (s + 1) % CAROUSEL_SLIDES.length);
        }, 5000);
    }, []);

    useEffect(() => {
        startAutoplay();
        return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
    }, [startAutoplay]);

    const resetAutoplay = () => {
        if (autoplayRef.current) clearInterval(autoplayRef.current);
        startAutoplay();
    };

    // Close sort dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
                setSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const slide = CAROUSEL_SLIDES[currentSlide];
    const SlideIcon = slide.icon;

    return (
        <div className="w-full space-y-4">

            <div
                className="relative bg-primary text-primary-foreground overflow-hidden"
                onMouseEnter={() => setIsPlaying(false)}
                onMouseLeave={() => setIsPlaying(true)}
            >
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-6 left-1/3 w-16 h-16 rounded-full bg-primary-foreground/10" />
                    <div className="absolute top-3 right-1/4 w-24 h-24 rounded-full bg-primary-foreground/[0.08]" />
                    <div className="absolute bottom-4 left-1/2 w-10 h-10 rounded-full bg-primary-foreground/10" />
                    <div className="absolute top-10 right-1/3 w-6 h-6 rounded-full bg-primary-foreground/15" />
                    <div className="absolute bottom-8 right-1/4 w-8 h-8 rounded-full bg-primary-foreground/10" />
                </div>

                <div className="max-w-3xl mx-auto px-4 py-10 relative z-10">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {carouselSlides.map((slide, index) => (
                                <div key={index} className="flex-[0_0_100%] min-w-0">
                                    <div className="flex flex-col items-center justify-center text-center min-h-[140px] py-4">
                                        <slide.icon className="mb-2 opacity-70" size={28} />
                                        <h2 className="text-xl md:text-2xl font-bold mb-1">{slide.title}</h2>
                                        <p className="text-sm opacity-80 mb-4 max-w-xs">{slide.description}</p>
                                        {slide.href.startsWith('/') ? (
                                            <Button variant="secondary" size="sm">
                                                {slide.action}
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" size="sm">
                                                {slide.action}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dots with progress animation */}
                    <div className="flex justify-center gap-2 mt-4 relative z-30">
                        {carouselSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => scrollTo(index)}
                                className={`relative h-2 rounded-full transition-all ${index === selectedIndex
                                    ? 'w-8 bg-primary-foreground/30'
                                    : 'w-2 bg-primary-foreground/30 hover:bg-primary-foreground/50'
                                    }`}
                            >
                                {index === selectedIndex && isPlaying && (
                                    <div className="absolute inset-0 bg-primary-foreground rounded-full origin-left animate-carousel-progress" />
                                )}
                                {index === selectedIndex && !isPlaying && (
                                    <div className="absolute inset-0 bg-primary-foreground rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Arrows */}
                <button
                    onClick={() => emblaApi?.scrollPrev()}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-primary-foreground/10 transition-colors z-20"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={() => emblaApi?.scrollNext()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-primary-foreground/10 transition-colors z-20"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Filters Bar */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto md:px-0 pb-4 grid grid-cols-3 gap-3">
                    <div className="w-full">
                        <Select value={sort} onValueChange={(value) => onSortChange(value as PostSortOption)}>
                            <SelectTrigger className="w-full">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal size={16} className="shrink-0 text-muted-foreground" />
                                    <SelectValue placeholder="Ordenar por" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((opt) => (
                                    <SelectItem
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${sort === opt.value ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'}`}
                                        onClick={() => { onSortChange(opt.value) }}
                                        value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                    </div>

                    <Button variant="outline" onClick={goToRandomPost} className="flex items-center w-full gap-2 bg-primary py-3" disabled={posts.length === 0}>
                        <Shuffle size={16} />
                        Post aleatório
                    </Button>

                    <div className="w-full">
                        <Select
                            value={activeTag ?? "all"}
                            onValueChange={(value) => {
                                if (value === "all") return onTagFilter(null);
                                // se clicar na mesma tag, "desliga" o filtro (igual seu toggle anterior)
                                if (value === activeTag) return onTagFilter(null);
                                return onTagFilter(value);
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <div className="flex items-center gap-2">
                                    <Tag size={16} className="shrink-0 text-muted-foreground" />
                                    <SelectValue placeholder="Filtrar por tag" />
                                </div>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">Todas as tags</SelectItem>
                                {allTags.map((tag) => (
                                    <SelectItem key={tag} value={tag}>
                                        #{tag}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* ── Barra de controles ── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Dropdown de ordenação */}
                <div ref={sortRef} className="relative">
                    <button
                        onClick={() => setSortOpen((o) => !o)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:border-gray-400 dark:hover:border-gray-500 bg-background border-border text-foreground min-w-[160px] justify-between"
                    >
                        <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>
                        <ChevronDown
                            size={14}
                            className="text-muted-foreground transition-transform"
                            style={{ transform: sortOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                    </button>

                    {sortOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-48 rounded-xl border border-border bg-background shadow-xl z-50 overflow-hidden">
                            {SORT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => { onSortChange(opt.value); setSortOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${sort === opt.value ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Botão post aleatório */}
                <button
                    onClick={onRandom}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, #2563eb, #0891b2)',
                        color: '#fff',
                    }}
                >
                    <Shuffle size={14} />
                    Post aleatório
                </button>

                {/* Filtro por tags */}
                {allTags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tag size={14} className="text-muted-foreground shrink-0" />
                        <button
                            onClick={() => onTagFilter(null)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeTag === null
                                ? 'bg-foreground text-background border-foreground'
                                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                                }`}
                        >
                            Todos
                        </button>
                        {allTags.slice(0, 8).map((tag) => (
                            <button
                                key={tag}
                                onClick={() => onTagFilter(tag === activeTag ? null : tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeTag === tag
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                                    }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Badge de linguagem + stats para usar nos PostCards ──
export function PostMetaBadges({ likes, views }: { likes: number; views: number }) {
    return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {/* Views */}
            <span className="flex items-center gap-1">
                <Eye size={15} className="mt-[1px]" />
                {formatCount(views)}
            </span>

            {/* Likes */}
            <span className="flex items-center gap-1">
                <Heart size={15} className="mt-[1px]" />
                {formatCount(likes)}
            </span>
        </div>
    );
}