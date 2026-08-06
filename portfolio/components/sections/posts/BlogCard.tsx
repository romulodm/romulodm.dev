import { ArrowRight } from "lucide-react";
import type { StaticImageData } from "next/image";

type BadgeCategory = "programming" | "tutorial" | "interview" | "marketing";

interface BlogCardProps {
    image?: string | StaticImageData;
    category: BadgeCategory;
    categoryLabel: string;
    categoryIcon: string;
    title: string;
    excerpt: string;
    author?: { name: string; date: string; avatar?: string };
    variant?: "featured" | "compact";
}

const badgeStyles: Record<BadgeCategory, string> = {
    programming: "bg-[hsl(var(--badge-programming-bg))] text-[hsl(var(--badge-programming-fg))]",
    tutorial: "bg-[hsl(var(--badge-tutorial-bg))] text-[hsl(var(--badge-tutorial-fg))]",
    interview: "bg-[hsl(var(--badge-interview-bg))] text-[hsl(var(--badge-interview-fg))]",
    marketing: "bg-[hsl(var(--badge-marketing-bg))] text-[hsl(var(--badge-marketing-fg))]",
};

const BlogCard = ({
    image,
    category,
    categoryLabel,
    categoryIcon,
    title,
    excerpt,
    author,
    variant = "compact",
}: BlogCardProps) => {
    const isFeatured = variant === "featured";

    return (
        <article className={isFeatured ? "" : "py-6 first:pt-0 border-b border-border last:border-b-0"}>
            {isFeatured && image && (
                <div className="overflow-hidden rounded-lg mb-5">
                    <img
                        src={typeof image === "string" ? image : image.src}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500"
                        loading="lazy"
                    />
                </div>
            )}

            {!image && (
                <span
                    className={`inline-flex items-center gap-1.5 py-1 rounded-md text-xs font-semibold tracking-wide ${badgeStyles[category]}`}
                >
                    <span>{categoryIcon}</span>
                    {categoryLabel}
                </span>
            )}


            <h3
                className={`font-bold text-card-foreground mt-3 mb-2 leading-snug ${isFeatured ? "text-2xl" : "text-xl"
                    }`}
            >
                {title}
            </h3>

            <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-3">
                {excerpt}
            </p>

            <a
                href="#"
                className="inline-flex items-center gap-1.5 text-sm font-semibold group transition-colors text-purple-700 dark:text-purple-500/90 hover:text-purple-600 dark:hover:text-purple-500"
            >
                Read more
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
        </article>
    );
};

export default BlogCard;