import { notFound } from "next/navigation";
import ProfileClient from "@/components/profile/ProfileClient";
import { getProfileByUsername, getWallMessages } from "./actions";
import Navbar from "@/components/navigation/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@romulo/database";

type Props = { params: Promise<{ username: string }> };

export default async function Profile(props: Props) {
    const params = await props.params;
    const [user, session] = await Promise.all([
        getProfileByUsername(params.username),
        getServerSession(authOptions),
    ]);

    if (!user) notFound();

    const sessionUserId = (session?.user as any)?.id as string | undefined;
    const isAdmin = (session?.user as any)?.admin ?? false;
    const isMe = sessionUserId === user.id;

    const [wallMessages, newsletterSub, linkedDonations] = await Promise.all([
        getWallMessages(user.id),

        // Newsletter — only relevant for the account owner
        isMe
            ? prisma.newsletterSubscriber.findUnique({
                where: { email: user.email },
                select: {
                    isConfirmed: true,
                    subscribedAt: true,
                    preferredLocale: true,
                    unsubscribedAt: true,
                },
            })
            : Promise.resolve(null),

        // Donations — everyone can see public ones; owner sees all
        prisma.donation.findMany({
            where: {
                userId: user.id,
                status: "COMPLETED",
                ...(isMe ? {} : { isPrivate: false }),
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                coffees: true,
                amount: true,
                currency: true,
                message: true,
                isPrivate: true,
                createdAt: true,
                provider: true,
            },
        }),
    ]);

    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <ProfileClient
                profile={user}
                isAdmin={isAdmin}
                isMe={isMe}
                sessionId={sessionUserId ?? null}
                wallMessages={wallMessages}
                linkedDonations={linkedDonations}
                newsletterSub={
                    newsletterSub
                        ? {
                            isConfirmed: newsletterSub.isConfirmed,
                            subscribedAt:
                                newsletterSub.subscribedAt?.toISOString() ?? null,
                            preferredLocale:
                                (newsletterSub as any).preferredLocale ?? "en",
                            unsubscribedAt:
                                newsletterSub.unsubscribedAt?.toISOString() ?? null,
                        }
                        : null
                }
            />
        </main>
    );
}