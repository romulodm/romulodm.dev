import BlogCard from "./BlogCard";
import featuredImg from "./image.png";

const posts: {
    category: "tutorial" | "interview" | "marketing";
    categoryIcon: string;
    categoryLabel: string;
    title: string;
    excerpt: string;
}[] = [
        {
            category: "tutorial",
            categoryIcon: "📄",
            categoryLabel: "Tutorial",
            title: "How to rank higher on Google (6 easy steps)",
            excerpt:
                "Static websites are now used to bootstrap lots of websites and are becoming the basis for a variety of tools that even influence both web designers and developers.",
        },
        {
            category: "interview",
            categoryIcon: "🎙️",
            categoryLabel: "Interview",
            title: "How to schedule your tweets to send later",
            excerpt:
                "Static websites are now used to bootstrap lots of websites and are becoming the basis for a variety of tools that even.",
        },
        {
            category: "marketing",
            categoryIcon: "📊",
            categoryLabel: "Marketing",
            title: "12 SEO best practices that everyone should follow",
            excerpt:
                "Static websites are now used to bootstrap lots of websites and are becoming the basis.",
        },
    ];

const BlogList = () => {
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
                        categoryLabel="Programming"
                        title="Releasing code in large corporations is slow - and there is a good reason for it"
                        excerpt="One of the things I always loved about the web is its immediacy. You write a piece of code, publish it somewhere and people can access it."
                        author={{ name: "Michael Gough", date: "Posted on Jan 31" }}
                    />
                </div>

                {/* Sidebar posts */}
                <div className="flex flex-col">
                    {posts.map((post, i) => (
                        <BlogCard key={i} {...post} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BlogList;