import { redirect } from "next/navigation";
import { prisma } from "@romulo/database";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import { Plus } from "lucide-react";

export default async function AdminPostsPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/");

  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      postTags: { select: { tag: true } },
    },
  });

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">{posts.length} posts no total</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">Nenhum post ainda</p>
          <Link
            href="/admin/posts/new"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
          >
            Criar primeiro post
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Título
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Tags
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Atualizado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {posts.map((post) => {
                const tags = post.postTags.map((t) => t.tag);

                return (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground line-clamp-1">
                        {post.title}
                      </div>
                      {post.status === "PUBLISHED" && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          /blog/{post.slug}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${post.status === "PUBLISHED"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                      >
                        {post.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                      </span>
                    </td>

                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs text-muted-foreground hidden sm:table-cell">
                      {formatDistanceToNow(post.updatedAt)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="text-primary hover:opacity-70 font-medium text-xs transition"
                        >
                          Editar
                        </Link>
                        {post.status === "PUBLISHED" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-muted-foreground hover:text-foreground font-medium text-xs transition"
                          >
                            Ver
                          </Link>
                        )}
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