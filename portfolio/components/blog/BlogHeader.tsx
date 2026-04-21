'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  LayoutGrid,
  LayoutList,
  Loader2,
  Shuffle,
  SlidersHorizontal,
  Tag,
  Search,
  X,
} from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type PostSortOption = 'newest' | 'oldest' | 'most_liked' | 'most_viewed';
export type PostLayout = 'grid' | 'list';

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

interface BlogHeaderProps {
  allTags: string[];
  posts: Post[];
  sort: PostSortOption;
  onSortChange: (sort: PostSortOption) => void;
  onTagFilter: (tag: string | null) => void;
  activeTag: string | null;
  onRandom: () => void;
  loadingRandom: boolean;
  layout: PostLayout;
  onLayoutChange: (layout: PostLayout) => void;
}

interface GoHit {
  slug: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  tags: string[];
  score: number;
}

// ── Tooltip CSS puro ──────────────────────────────────────────────────────────

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div className="
        pointer-events-none
        absolute left-1/2 -translate-x-1/2
        bottom-[calc(100%+8px)]
        whitespace-nowrap rounded-lg
        bg-neutral-900 dark:bg-neutral-800 px-2.5 py-1.5
        text-xs font-medium text-white shadow-lg
        opacity-0 scale-95 -translate-y-1
        group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0
        transition-all duration-150 ease-out z-[99]
      ">
        <span className="
          absolute left-1/2 -translate-x-1/2 top-full w-0 h-0
          border-l-[5px] border-l-transparent
          border-r-[5px] border-r-transparent
          border-t-[5px] border-t-neutral-900 dark:border-t-neutral-800
        " />
        {label}
      </div>
    </div>
  );
}

const H = 'h-10';

export function BlogHeader({
  allTags,
  posts,
  sort,
  onSortChange,
  onTagFilter,
  activeTag,
  onRandom,
  loadingRandom,
  layout,
  onLayoutChange,
}: BlogHeaderProps) {
  const t = useTranslations('blogUi.header');
  const locale = useLocale();
  const router = useRouter();

  const sortOptions: Array<{ value: PostSortOption; label: string }> = [
    { value: 'newest', label: t('sort.newest') },
    { value: 'most_liked', label: t('sort.mostLiked') },
    { value: 'most_viewed', label: t('sort.mostViewed') },
    { value: 'oldest', label: t('sort.oldest') },
  ];

  function handleTagChange(value: string) {
    if (value === 'all' || value === activeTag) onTagFilter(null);
    else onTagFilter(value);
  }

  // ── Busca inline ──────────────────────────────────────────────────────────

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GoHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setHits([]); setShowResults(false); setLoading(false); return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&locale=${locale}&limit=6`,
          { signal: abortRef.current.signal }
        );
        const data = await res.json();
        setHits(data.hits ?? []);
        setShowResults(true);
      } catch { /* AbortError silenciosa */ }
      finally { setLoading(false); }
    }, 200);
  }, [query, locale]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node))
        setShowResults(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleHitClick(slug: string) {
    router.push(`/${locale}/blog/${slug}`);
    setShowResults(false);
    setQuery('');
  }

  function clearSearch() {
    setQuery(''); setHits([]); setShowResults(false); setLoading(false);
  }

  // ── Blocos reutilizáveis ──────────────────────────────────────────────────

  const LayoutToggles = (
    <div className={`flex shrink-0 items-stretch rounded-xs border border-border ${H}`}>
      <Tip label={t('gridView')}>
        <button
          onClick={() => onLayoutChange('grid')}
          className={`flex items-center justify-center rounded-l-xs px-3 transition-colors ${H} ${layout === 'grid'
              ? 'bg-primary/20 text-foreground hover:bg-primary/30 dark:bg-primary/10 dark:hover:bg-primary/20'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
          <LayoutGrid size={15} />
        </button>
      </Tip>
      <Tip label={t('listView')}>
        <button
          onClick={() => onLayoutChange('list')}
          className={`flex items-center justify-center rounded-r-xs border-l border-border px-3 transition-colors ${H} ${layout === 'list'
              ? 'bg-primary/20 text-foreground hover:bg-primary/30 dark:bg-primary/10 dark:hover:bg-primary/20'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
          <LayoutList size={15} />
        </button>
      </Tip>
    </div>
  );

  const RandomBtn = ({ className = '' }: { className?: string }) => (
    <Button
      variant="outline"
      onClick={onRandom}
      disabled={posts.length === 0 || loadingRandom}
      className={`gap-2 rounded-xs border-border bg-primary/20 hover:bg-primary/30 hover:text-black dark:bg-primary/10 dark:hover:bg-primary/20 dark:hover:text-white ${H} ${className}`}
    >
      {loadingRandom
        ? <Loader2 size={15} className="shrink-0 animate-spin" />
        : <Shuffle size={15} className="shrink-0" />
      }
      <span className="truncate text-sm">
        {loadingRandom ? t('random.loading') : t('random.action')}
      </span>
    </Button>
  );

  const SortSelect = ({ className = '' }: { className?: string }) => (
    <Select value={sort} onValueChange={(v) => onSortChange(v as PostSortOption)}>
      <SelectTrigger className={`rounded-xs border-border ${H} ${className}`}>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="shrink-0 text-muted-foreground" />
          <SelectValue placeholder={t('sort.placeholder')} />
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-xs border-border dark:bg-background">
        {sortOptions.map(o => (
          <SelectItem key={o.value} value={o.value} className="hover:cursor-pointer">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const TagSelect = ({ className = '' }: { className?: string }) => (
    <Select value={activeTag ?? 'all'} onValueChange={handleTagChange}>
      <SelectTrigger className={`rounded-xs border-border ${H} ${className}`}>
        <div className="flex items-center gap-2">
          <Tag size={15} className="shrink-0 text-muted-foreground" />
          <SelectValue placeholder={t('tag.placeholder')} />
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-xs border-border dark:bg-background">
        <SelectItem value="all" className="hover:cursor-pointer">{t('tag.all')}</SelectItem>
        {allTags.map(tag => (
          <SelectItem key={tag} value={tag} className="hover:cursor-pointer">#{tag}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const SearchInput = (
    <div ref={searchWrapperRef} className={`relative w-full ${H}`}>
      <div className={`flex items-center gap-2 rounded-xs border border-border bg-background px-3 transition-colors focus-within:border-foreground/30 ${H}`}>
        {loading
          ? <Loader2 size={15} className="shrink-0 text-muted-foreground animate-spin" />
          : <Search size={15} className="shrink-0 text-muted-foreground" />
        }
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); if (e.target.value.length >= 2) setShowResults(true); }}
          onFocus={() => { if (hits.length > 0) setShowResults(true); }}
          placeholder="Buscar posts..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button onClick={clearSearch} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {showResults && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-y-auto rounded-xl border border-border bg-background shadow-xl">
          {hits.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs text-muted-foreground">
                  {hits.length} resultado{hits.length !== 1 ? 's' : ''}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Motor Go · TF-IDF + BK-tree
                </span>
              </div>
              <ul>
                {hits.map(hit => (
                  <li key={hit.slug}>
                    <button
                      onClick={() => handleHitClick(hit.slug)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted text-left transition-colors"
                    >
                      {hit.coverImageUrl && (
                        <Image src={hit.coverImageUrl} alt="" width={36} height={36}
                          className="w-9 h-9 rounded-lg object-cover shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1
                            [&_mark]:bg-primary/20 [&_mark]:text-primary [&_mark]:rounded-sm"
                          dangerouslySetInnerHTML={{ __html: hit.title }} />
                        {hit.summary && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1
                              [&_mark]:bg-primary/20 [&_mark]:text-primary [&_mark]:rounded-sm"
                            dangerouslySetInnerHTML={{ __html: hit.summary }} />
                        )}
                        {hit.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {hit.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-1">
                        {hit.score.toFixed(3)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado para <strong className="text-foreground">"{query}"</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-4 w-full">
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl pb-4 md:px-0">

          {/* ════════════════════════════════════════════════════
              DESKTOP — uma linha com todos os controles + search
              ════════════════════════════════════════════════════ */}
          <div className="hidden md:flex items-center gap-3">
            {/* Controles — flex-[3] */}
            <div className={`flex flex-1 items-center gap-2 ${H}`}>
              {LayoutToggles}
              <RandomBtn className="flex-1" />
              <SortSelect className="flex-1 min-w-0" />
              <TagSelect className="flex-1 min-w-0" />
            </div>
            {/* Search — flex-[1.2] */}
            <div className="flex-[1.2]">
              {SearchInput}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════
              MOBILE — 4 linhas empilhadas
              ════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-2 md:hidden">
            {/* Linha 1: toggles + random (preenche tudo) */}
            <div className={`flex items-center gap-2 ${H}`}>
              {LayoutToggles}
              <RandomBtn className="flex-1" />
            </div>
            {/* Linha 2: sort */}
            <SortSelect className="w-full" />
            {/* Linha 3: tag */}
            <TagSelect className="w-full" />
            {/* Linha 4: search */}
            {SearchInput}
          </div>

        </div>
      </div>
    </div>
  );
}