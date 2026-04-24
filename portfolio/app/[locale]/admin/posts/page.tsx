import Link from 'next/link';
import { prisma } from '@romulo/database';
import { Plus } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { isAdminAuthenticated } from '@/lib/auth-helpers';
import { SUPPORTED_LOCALES } from '@/lib/locales';
import { formatDistanceToNow } from '@/lib/utils';

export default async function AdminPostsPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'admin.postsPage' });

  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect(`/${locale}`);

  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      postTags: { select: { tag: true } },
      translations: { select: { locale: true, title: true } },
    },
  });

  return (
    <main className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('total', { count: posts.length })}</p>
        </div>
        <Link href={`/${locale}/admin/posts/new`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
          <Plus className="h-4 w-4" />
          {t('newPost')}
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="mb-4 text-muted-foreground">{t('empty')}</p>
          <Link href={`/${locale}/admin/posts/new`} className="inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90">
            {t('createFirst')}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('columns.title')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('columns.status')}</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">{t('columns.locales')}</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">{t('columns.tags')}</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">{t('columns.updated')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => {
                const tags = post.postTags.map((tag) => tag.tag);
                const primary = post.translations[0];
                return (
                  <tr key={post.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="line-clamp-1 text-sm font-medium text-foreground">{primary?.title ?? t('untitled')}</div>
                      {post.status === 'PUBLISHED' && primary && <div className="mt-0.5 text-xs text-muted-foreground">/{primary.locale}/blog/{post.slug}</div>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {post.status === 'PUBLISHED' ? t('status.published') : t('status.draft')}
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 md:table-cell">
                      <div className="flex gap-1">
                        {SUPPORTED_LOCALES.map((localeMeta) => {
                          const hasTranslation = post.translations.some((translation) => translation.locale === localeMeta.code);
                          return (
                            <span key={localeMeta.code} title={hasTranslation ? localeMeta.label : t('missingTranslation', { locale: localeMeta.label })} className={`text-base leading-none ${hasTranslation ? 'opacity-100' : 'opacity-20'}`}>
                              {localeMeta.flag}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">#{tag}</span>)}
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 text-xs text-muted-foreground sm:table-cell">{formatDistanceToNow(post.updatedAt, locale)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <Link href={`/${locale}/admin/posts/${post.id}/edit`} className="text-xs font-medium text-primary transition hover:opacity-70">{t('actions.edit')}</Link>
                        {post.status === 'PUBLISHED' && primary && <Link href={`/${primary.locale}/blog/${post.slug}`} className="text-xs font-medium text-muted-foreground transition hover:text-foreground">{t('actions.view')}</Link>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
