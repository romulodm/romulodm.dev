// app/[locale]/blog/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/ui/PostCard";
import { NewsletterForm } from "@/components/ui/NewsletterForm";
import Navigation from "@/components/navigation/Navigation";

export const metadata = {
  title: "Blog - Posts recentes",
  description: "Artigos sobre desenvolvimento web, JavaScript, TypeScript e muito mais.",
};

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
      postTags: { select: { tag: true } }, // <-- tags via relação
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="mt-20" />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tutoriais, dicas e experiências sobre desenvolvimento web fullstack
          </p>
        </div>

        <div className="mb-16">
          <NewsletterForm />
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">Nenhum post publicado ainda.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
