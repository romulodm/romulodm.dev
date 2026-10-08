'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { markdownToHtml } from '@/lib/markdown';
import { formatDistanceToNow } from '@/lib/utils';
import { useAdminUser } from '@/components/admin/AdminUserContext';
import {
  OtherPostsList,
  PostBody,
  PostByline,
  PostCover,
  PostSummary,
  PostTagList,
  PostTitle,
  PostYoutubeEmbed,
  type OtherPost,
} from '@/components/blog/PostArticle';
import { PostBodyEnhancer } from '@/components/blog/PostBodyEnhancer';
import { PostReactionSidebarView } from '@/components/blog/PostReactionsSidebar';
import { PostStatsMobileView } from '@/components/blog/PostStatsMobile';
import { TableOfContents } from '@/components/blog/TableOfContents';

/**
 * Preview do post no editor, montado com as mesmas pecas da pagina publica
 * (components/blog/PostArticle) para que o que aparece aqui seja o que vai ao ar.
 *
 * Diferencas intencionais em relacao a /blog/[slug]:
 * - sem Navbar/Footer do site (o admin tem a propria moldura);
 * - views/likes/comentarios sao ficticios e nada e registrado no banco;
 * - sem secao de comentarios.
 */

const FAKE_STATS = { views: 128, likes: 12, comments: 4 };

interface AdminPostListItem {
  id: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  translations: { locale: string; title: string }[];
}

interface PostPreviewProps {
  postId: string;
  /** Idioma do post (nao da interface do admin). */
  locale: string;
  title: string;
  contentMarkdown: string;
  coverImageUrl?: string;
  tags: string[];
  summary?: string;
  youtubeUrl?: string;
  readingTime: number;
  /** Data de publicacao, se o post ja foi publicado; senao usa "agora". */
  publishedAt?: string | Date | null;
}

function useOtherPosts(postId: string, locale: string) {
  const [posts, setPosts] = useState<OtherPost[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/posts')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: AdminPostListItem[]) => {
        if (cancelled) return;
        // Mesmo criterio de getCachedRelatedPosts na pagina do post.
        const related = data
          .filter((p) => p.id !== postId && p.status === 'PUBLISHED' && p.publishedAt)
          .map((p) => ({ post: p, translation: p.translations.find((tr) => tr.locale === locale) }))
          .filter((item) => item.translation)
          .sort((a, b) => new Date(b.post.publishedAt!).getTime() - new Date(a.post.publishedAt!).getTime())
          .slice(0, 3)
          .map(({ post, translation }) => ({
            id: post.id,
            slug: post.slug,
            title: translation!.title,
            publishedAt: post.publishedAt,
          }));
        setPosts(related);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [postId, locale]);

  return posts;
}

export function PostPreview({
  postId,
  locale,
  title,
  contentMarkdown,
  coverImageUrl,
  tags,
  summary,
  youtubeUrl,
  readingTime,
  publishedAt,
}: PostPreviewProps) {
  const t = useTranslations('blogPost');
  const tSidebar = useTranslations('blogUi.sidebar');
  const tEditor = useTranslations('admin.postEditor.preview');
  const adminUser = useAdminUser();
  const otherPosts = useOtherPosts(postId, locale);
  const [html, setHtml] = useState('');
  const [liked, setLiked] = useState(false);
  // Fixado no mount: "agora mesmo" nao deve mudar enquanto o preview esta aberto.
  const [renderedAt] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    markdownToHtml(contentMarkdown, { codeBlockChrome: true }).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, [contentMarkdown]);

  const displayTitle = title.trim() || tEditor('untitled');
  const author = {
    name: adminUser?.username ?? 'admin',
    avatarUrl: adminUser?.image ?? null,
  };
  const publishedDate = publishedAt ? new Date(publishedAt) : renderedAt;

  const stats = {
    views: FAKE_STATS.views,
    likes: FAKE_STATS.likes + (liked ? 1 : 0),
    comments: FAKE_STATS.comments,
    liked,
    onLike: () => setLiked((value) => !value),
  };

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto md:px-4 py-8 flex gap-2 relative">
        <aside className="hidden md:flex flex-col items-center w-16 shrink-0">
          <div className="sticky top-20">
            <PostReactionSidebarView {...stats} />
          </div>
        </aside>

        <main className="flex-1 min-w-0 max-w-4xl md:px-4 pb-12">
          <article className="rounded-lg shadow-sm">
            {coverImageUrl && <PostCover coverKey={coverImageUrl} alt={displayTitle} />}

            <div className="p-4 md:p-6">
              <PostTagList tags={tags} />

              <PostTitle>{displayTitle}</PostTitle>

              <div className="flex flex-col gap-2 mb-8 pb-2 border-b border-border">
                <PostByline
                  author={author}
                  publishedLabel={t('published', { time: formatDistanceToNow(publishedDate, locale) })}
                  readingTimeLabel={readingTime > 0 ? t('readingTime', { minutes: readingTime }) : null}
                />

                {summary?.trim() && <PostSummary>{summary}</PostSummary>}

                <PostStatsMobileView {...stats} />
              </div>

              {youtubeUrl && <PostYoutubeEmbed url={youtubeUrl} title={t('videoTitle')} />}

              <PostBody id="post-preview-body" html={html} />
              {/* Remonta quando o HTML muda: o enhancer marca imagens e botoes
                  de copiar no mount, e o HTML chega depois (markdown e async). */}
              {html && <PostBodyEnhancer key={html} targetId="post-preview-body" />}
            </div>
          </article>
        </main>

        <div className="hidden w-64 shrink-0 xl:block">
          <OtherPostsList
            title={tSidebar('otherPosts')}
            posts={otherPosts}
            locale={locale}
            formatDate={(date) => formatDistanceToNow(date, locale)}
          />
          <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-3">
            {/* O TOC coleta os headings no mount e so observa mutacoes se nao
                achar nenhum. Aqui o titulo (h1) ja existe no mount e o corpo
                chega depois (markdown e async), entao ele parava no titulo.
                Montar so com o HTML pronto, e remontar quando ele muda,
                reproduz o que acontece na pagina, onde o corpo vem do servidor. */}
            {html && <TableOfContents key={html} />}
          </div>
        </div>
      </div>
    </div>
  );
}
