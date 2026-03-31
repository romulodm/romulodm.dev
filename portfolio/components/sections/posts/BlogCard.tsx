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
                        className="w-full h-auto object-cover transition-transform duration-500 hover:scale-[1.02]"
                        loading="lazy"
                    />
                </div>
            )}

            <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-wide ${badgeStyles[category]}`}
            >
                <span>{categoryIcon}</span>
                {categoryLabel}
            </span>

            <h3
                className={`font-bold text-card-foreground mt-3 mb-2 leading-snug ${isFeatured ? "text-2xl" : "text-xl"
                    }`}
            >
                {title}
            </h3>

            {author && isFeatured && (
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {author.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-card-foreground leading-none">{author.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{author.date}</p>
                    </div>
                </div>
            )}

            <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-3">
                {excerpt}
            </p>

            <a
                href="#"
                className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold group transition-colors hover:text-primary/80"
            >
                Read more
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
        </article>
    );
};

export default BlogCard;