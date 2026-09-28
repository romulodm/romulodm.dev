import { useTranslations } from "next-intl";
import BlogCard from "./BlogCard";
import featuredImg from "./image.png";

// Copy lives in messages/*.json under `home.blogPreview.posts.<category>`.
const posts: {
    category: "tutorial" | "interview" | "marketing";
    categoryIcon: string;
}[] = [
        { category: "tutorial", categoryIcon: "📄" },
        { category: "interview", categoryIcon: "🎙️" },
        { category: "marketing", categoryIcon: "📊" },
    ];

const BlogList = () => {
    const t = useTranslations("home.blogPreview");
    return (
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                {/* Featured post */}
                <div>
                    <BlogCard
                        variant="featured"
                        image={featuredImg}
                        category="programming"
                        categoryIcon="</>"
                        categoryLabel={t("featured.category")}
                        title={t("featured.title")}
                        excerpt={t("featured.excerpt")}
                        author={{ name: t("featured.author"), date: t("featured.date") }}
                    />
                </div>

                {/* Sidebar posts */}
                <div className="flex flex-col">
                    {posts.map((post, i) => (
                        <BlogCard
                            key={i}
                            {...post}
                            categoryLabel={t(`posts.${post.category}.category`)}
                            title={t(`posts.${post.category}.title`)}
                            excerpt={t(`posts.${post.category}.excerpt`)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BlogList;