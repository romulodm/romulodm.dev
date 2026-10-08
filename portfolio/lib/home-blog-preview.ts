import "server-only"

import { prisma } from "@romulo/database"
import { unstable_cache } from "next/cache"

type PreviewEntry = {
    slug: string
    /** Shown before the post's tag, like the category badges this section had before. */
    icon: string
}

/**
 * Posts shown in the blog preview at the bottom of the home page.
 *
 * The section is curated, not "latest posts": it closes the "projects I built"
 * part of the home, so it always shows the same five articles, picked by slug.
 *
 * - `featured`: the only posts allowed in the large card with the cover image.
 *   One of them is drawn on every page load (see BlogPreviewGrid); the other
 *   one drops into the list beside it.
 * - `list`: always in the list on the right, never in the large card.
 * - `closing`: the full-width entry under the grid.
 *
 * Slugs are matched exactly against `Post.slug`. A slug that does not exist or
 * is not published is skipped (and logged on the server), so the section never
 * links to a 404. Editing a post's slug in the admin means editing it here too.
 */
export const HOME_BLOG_PREVIEW = {
    featured: [
        { slug: "seedicon-os-avatares-desse-blog-viraram-meu-primeiro-pacote-no-npm", icon: "📦" },
        { slug: "recriamos-o-msn-na-web-e-o-que-mais-chamou-atencao-foi-o-que-ja-tinha-20-anos", icon: "💬" },
    ],
    list: [
        { slug: "pac-man-e-2048-os-jogos-que-fiz-antes-de-saber-o-que-estava-fazendo", icon: "👾" },
        { slug: "um-xadrez-em-go-feito-em-cinco-dias-e-os-bugs-que-achei-quase-tres-anos-depois", icon: "♟️" },
    ],
    closing: { slug: "o-nda-escondeu-meu-melhor-trabalho-entao-construi-algo-que-eu-pudesse-mostrar", icon: "📄" },
} as const satisfies {
    featured: readonly PreviewEntry[]
    list: readonly PreviewEntry[]
    closing: PreviewEntry
}

/** Same TTL as the blog index, so a post published there shows up here at the same time. */
export const HOME_BLOG_PREVIEW_REVALIDATE_SECONDS = 300

export type HomePreviewPost = {
    slug: string
    title: string
    /** The hand-written summary when there is one; the generated excerpt otherwise. */
    description: string
    coverImageUrl: string | null
    readingTime: number
    icon: string
    /** First tag in alphabetical order, capitalized; null for an untagged post. */
    tag: string | null
}

export type HomeBlogPreviewData = {
    featured: HomePreviewPost[]
    list: HomePreviewPost[]
    closing: HomePreviewPost | null
}

const ALL_ENTRIES: readonly PreviewEntry[] = [
    ...HOME_BLOG_PREVIEW.featured,
    ...HOME_BLOG_PREVIEW.list,
    HOME_BLOG_PREVIEW.closing,
]
const ALL_SLUGS = ALL_ENTRIES.map((entry) => entry.slug)

// Tags are stored as typed in the admin ("architecture"); the badge reads
// better as a label ("Architecture"), like the categories it replaced.
const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1)

async function loadHomeBlogPreview(locale: string): Promise<HomeBlogPreviewData> {
    const rows = await prisma.post.findMany({
        where: {
            slug: { in: ALL_SLUGS },
            status: "PUBLISHED",
            publishedAt: { not: null },
        },
        select: {
            slug: true,
            readingTime: true,
            coverImageUrl: true,
            postTags: { select: { tag: true }, orderBy: { tag: "asc" } },
            translations: {
                select: { locale: true, title: true, summary: true, excerpt: true },
            },
        },
    })

    const rowsBySlug = new Map(rows.map((row) => [row.slug, row]))

    const toPost = (entry: PreviewEntry): HomePreviewPost | null => {
        const row = rowsBySlug.get(entry.slug)
        if (!row) return null

        // Same fallback as the blog index: a post not translated into the
        // visitor's locale still shows, in whatever language it has.
        const t = row.translations.find((tr) => tr.locale === locale) ?? row.translations[0]
        if (!t) return null

        const firstTag = row.postTags[0]?.tag

        return {
            slug: row.slug,
            title: t.title,
            // The generated excerpt is the first 160 characters of the body, which
            // for some posts is the "too lazy to read" TL;DR line. The summary is
            // written for exactly this kind of card, so it wins when present.
            description: t.summary || t.excerpt || "",
            coverImageUrl: row.coverImageUrl,
            readingTime: row.readingTime,
            icon: entry.icon,
            tag: firstTag ? capitalize(firstTag) : null,
        }
    }

    const pick = (entries: readonly PreviewEntry[]) =>
        entries.flatMap((entry) => {
            const post = toPost(entry)
            return post ? [post] : []
        })

    const data: HomeBlogPreviewData = {
        featured: pick(HOME_BLOG_PREVIEW.featured),
        list: pick(HOME_BLOG_PREVIEW.list),
        closing: toPost(HOME_BLOG_PREVIEW.closing),
    }

    const shown = new Set(
        [...data.featured, ...data.list, ...(data.closing ? [data.closing] : [])].map((p) => p.slug),
    )
    const missing = ALL_SLUGS.filter((slug) => !shown.has(slug))
    if (missing.length > 0) {
        // Runs only on a cache miss, so this does not flood the log. A typo in
        // HOME_BLOG_PREVIEW or an unpublished post would otherwise just make an
        // entry silently disappear from the home page.
        console.warn(
            `[home-blog-preview] skipped ${missing.length} slug(s) not found or not published: ${missing.join(", ")}`,
        )
    }

    return data
}

export function getHomeBlogPreview(locale: string): Promise<HomeBlogPreviewData> {
    return unstable_cache(
        () => loadHomeBlogPreview(locale),
        // The entries are part of the key so that editing HOME_BLOG_PREVIEW can
        // never be answered by an entry cached for the previous list.
        ["home-blog-preview", locale, JSON.stringify(ALL_ENTRIES)],
        { revalidate: HOME_BLOG_PREVIEW_REVALIDATE_SECONDS },
    )()
}
