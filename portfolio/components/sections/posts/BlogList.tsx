import { getLocale, getTranslations } from "next-intl/server";

import { getHomeBlogPreview, type HomePreviewPost } from "@/lib/home-blog-preview";

import BlogPreviewGrid, { type PreviewItem } from "./BlogPreviewGrid";

/**
 * Curated blog preview at the bottom of the home page. Which posts appear, and
 * where, is configured in lib/home-blog-preview.ts.
 */
const BlogList = async () => {
    const locale = await getLocale();
    const [data, t] = await Promise.all([getHomeBlogPreview(locale), getTranslations("blogUi.card")]);

    const toItem = (post: HomePreviewPost): PreviewItem => ({
        post,
        // readingTime defaults to 0 when the editor leaves the field empty, and
        // "0 min read" says something false about the post.
        readingTime: post.readingTime > 0 ? t("readingTime", { minutes: post.readingTime }) : null,
    });

    const featured = data.featured.map(toItem);
    const list = data.list.map(toItem);
    const closing = data.closing ? toItem(data.closing) : null;

    if (featured.length === 0 && list.length === 0 && !closing) return null;

    return (
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <BlogPreviewGrid featured={featured} list={list} closing={closing} readMore={t("readMore")} />
        </section>
    );
};

export default BlogList;
