import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { HomePreviewPost } from "@/lib/home-blog-preview";
import { mediaUrl } from "@/lib/media";

/**
 * One post in the home page blog preview.
 *
 * No hooks on purpose: it is rendered inside BlogPreviewGrid, a client
 * component, and every translated string arrives already formatted through
 * props. Dividers between entries belong to the grid, not to the card, since
 * only the grid knows which entry ends a column.
 *
 * The whole entry is one link. On hover it takes the card background and
 * nothing else; the negative margin cancels the padding that background needs,
 * so at rest the text lines up with the rest of the section.
 */
interface BlogCardProps {
    post: HomePreviewPost;
    /** Already formatted, e.g. "10 min read"; null when the post has no reading time set. */
    readingTime: string | null;
    readMore: string;
    /** featured: cover image and larger title. compact: every other entry. */
    variant?: "featured" | "compact";
}

const BlogCard = ({ post, readingTime, readMore, variant = "compact" }: BlogCardProps) => {
    const isFeatured = variant === "featured";

    return (
        <article>
            <Link
                href={`/blog/${post.slug}`}
                className={`group block rounded-lg transition-colors duration-200 hover:bg-card ${isFeatured ? "-m-4 p-4" : "-mx-4 px-4 py-6"}`}
            >
                {isFeatured && post.coverImageUrl && (
                    <div className="relative overflow-hidden rounded-lg mb-5 aspect-[1200/630] bg-muted">
                        {/* alt is empty: the title right below is part of the same link,
                            so a description here would only be read twice. */}
                        <Image
                            src={mediaUrl(post.coverImageUrl)}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-cover"
                        />
                    </div>
                )}

                <p className="inline-flex flex-wrap items-center gap-1.5 text-xs font-semibold tracking-wide text-card-foreground">
                    <span aria-hidden="true">{post.icon}</span>
                    {post.tag && <span>{post.tag}</span>}
                    {readingTime && (
                        <span className="font-normal text-muted-foreground">
                            {post.tag && <span aria-hidden="true">· </span>}
                            {readingTime}
                        </span>
                    )}
                </p>

                <h3
                    className={`font-bold text-card-foreground mt-3 mb-2 leading-snug ${isFeatured ? "text-2xl" : "text-xl"}`}
                >
                    {post.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-3">
                    {post.description}
                </p>

                <span className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors text-purple-700 dark:text-purple-500/90 group-hover:text-purple-600 dark:group-hover:text-purple-500">
                    {readMore}
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
            </Link>
        </article>
    );
};

export default BlogCard;
