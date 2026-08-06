import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@romulo/database";
import { WallClient } from "@/components/wall/WallClient";
import { Footer } from "@/components/Footer";
import Navbar from "@/components/navigation/Navbar";
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'

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

export default async function WallPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string | undefined;

  const [initialMessages, hasPosted, dbUser] = await Promise.all([
    prisma.wallMessage.findMany({
      take: 21,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, username: true, image: true } } },
    }),
    userId
      ? prisma.wallMessage.findFirst({ where: { authorId: userId } }).then(Boolean)
      : Promise.resolve(false),
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { admin: true } })
      : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto px-4 py-24">
        <WallClient
          initialMessages={JSON.parse(JSON.stringify(initialMessages))}
          currentUser={
            session?.user
              ? {
                id: userId!,
                username: (session.user.name ?? session.user.email ?? "You") as string,
                image: (session.user.image ?? null) as string | null,
              }
              : null
          }
          isAdmin={dbUser?.admin ?? false}
          hasPosted={hasPosted as boolean}
        />
      </main>
      <Footer />
    </div >

  );
}
