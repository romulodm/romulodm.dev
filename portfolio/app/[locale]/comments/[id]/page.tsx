import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navigation/Navbar";
import { CommentCard } from "@/components/comments/CommentCard";
import { cache } from "react";
import { getCommentById } from "@/lib/comments";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { getTranslations } from "next-intl/server";

// getCommentById le a sessao para marcar o voto do visitante — conteudo por
// usuario, nao cacheavel, e ler cookie em render estatico daria 500.
export const dynamic = "force-dynamic";

/**
 * generateMetadata e o componente abaixo precisam do mesmo comentario e rodam
 * no mesmo request. Sem esta memoizacao a query roda duas vezes por page view
 * — e ela nao e barata: findUnique com author, votes, post + translations,
 * parent + author + votes, e replies aninhadas em dois niveis, cada uma
 * puxando author e votes de novo.
 *
 * O Next memoiza `fetch`, nao chamada de Prisma; e `lib/comments.ts` e
 * "use server", entao importar de la e chamada de funcao normal, sem
 * deduplicacao. `cache()` do React resolve, com escopo de um request.
 *
 * O wrapper mora aqui e nao em lib/comments.ts porque modulo "use server"
 * exige que todo export seja funcao async declarada — `cache()` devolve um
 * wrapper e o Next rejeita.
 */
const getComment = cache(getCommentById);

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;

    const comment = await getComment(id);
    const t = await getTranslations("commentPage");

    if (!comment) return { title: t("notFound") };

    return {
        title: t("metaTitle", { username: comment.author.username, post: comment.post.title }),
    };
}

export default async function CommentPage({ params }: PageProps) {
    const { id } = await params;

    const comment = await getComment(id);

    if (!comment) notFound();

    const t = await getTranslations("commentPage");
    const isReply = !!comment.parentId;
    const postId = comment.post.id;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="max-w-2xl min-h-screen mx-auto px-4 py-24">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
                    <Link href="/blog" className="hover:text-foreground transition-colors">
                        {t("breadcrumb.blog")}
                    </Link>
                    <span>/</span>
                    <Link
                        href={`/blog/${comment.post.slug}`}
                        className="hover:text-foreground transition-colors truncate max-w-[200px]"
                    >
                        {comment.post.title}
                    </Link>
                    <span>/</span>
                    <span className="text-foreground">{t("breadcrumb.comment")}</span>
                </nav>

                {/* Parent comment context (when this is a reply) */}
                {isReply && comment.parent && (
                    <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            {t("replyingTo", { username: comment.parent.author.username })}
                        </p>
                        <div className="rounded-lg border border-border/60 bg-accent/30 p-4 opacity-80 pointer-events-none select-none">
                            <CommentCard
                                comment={comment.parent}
                                postId={postId}
                                depth={0}
                                threadDepth={comment.depth - 1}
                                showContext={false}
                            />
                        </div>
                    </div>
                )}

                {/* The comment itself */}
                <div className="rounded-lg border border-border bg-background p-4">
                    <CommentCard
                        comment={comment}
                        postId={postId}
                        depth={0}
                        threadDepth={comment.depth}
                        showContext={!isReply}
                        onReplySuccess={undefined}
                    />
                </div>

                {/* Back to post */}
                <div className="mt-8 pt-6 border-t border-border">
                    <Link
                        href={`/blog/${comment.post.slug}`}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {t("backToPost", { title: comment.post.title })}
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
