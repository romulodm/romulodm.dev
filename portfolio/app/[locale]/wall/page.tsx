import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@romulo/database";
import { AVATAR_SELECT } from "@/lib/avatar";
import { WallClient } from "@/components/wall/WallClient";
import { Footer } from "@/components/Footer";
import Navbar from "@/components/navigation/Navbar";
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'

// Le a sessao do visitante no render (getServerSession, mais abaixo). Conteudo
// por usuario nao pode ser cacheado, e sem esta linha o Next tentaria gerar a
// pagina em contexto estatico — ler cookie ali aborta com DYNAMIC_SERVER_USAGE
// e devolve 500, que foi o bug de /blog/[slug].
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo.wall' })

  return buildPageMetadata({
    locale,
    path: 'wall',
    title: t('title'),
    description: t('description'),
  })
}

const WALL_PAGE_SIZE = 100

/** `?page=` vindo da URL: qualquer coisa que nao seja inteiro >= 1 vira 1. */
function parsePage(raw: string | undefined): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

export default async function WallPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string | undefined;

  const total = await prisma.wallMessage.count();
  const totalPages = Math.max(1, Math.ceil(total / WALL_PAGE_SIZE));
  // Pagina alem da ultima (link antigo, recado apagado) cai na ultima em vez
  // de mostrar um mural vazio.
  const page = Math.min(parsePage((await searchParams).page), totalPages);

  const [initialMessages, hasPosted, dbUser] = await Promise.all([
    prisma.wallMessage.findMany({
      skip: (page - 1) * WALL_PAGE_SIZE,
      take: WALL_PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, ...AVATAR_SELECT } } },
    }),
    userId
      ? prisma.wallMessage.findFirst({ where: { authorId: userId } }).then(Boolean)
      : Promise.resolve(false),
    // Os campos de avatar do visitante saem daqui, e nao da sessao: o JWT do
    // NextAuth e cacheado e ficaria velho no instante seguinte a uma troca de
    // avatar, obrigando o cliente a chamar session.update(). Esta query ja
    // existia para buscar `admin`, entao os campos extras custam zero.
    userId
      ? prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, admin: true, ...AVATAR_SELECT },
      })
      : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto px-4 py-24">
        <WallClient
          initialMessages={JSON.parse(JSON.stringify(initialMessages))}
          currentUser={dbUser ?? null}
          isAdmin={dbUser?.admin ?? false}
          hasPosted={hasPosted as boolean}
          total={total}
          page={page}
          totalPages={totalPages}
        />
      </main>
      <Footer />
    </div >

  );
}
