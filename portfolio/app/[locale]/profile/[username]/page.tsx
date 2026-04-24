import { notFound } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";
import { getProfileByUsername } from "./actions";
import Navbar from "@/components/navigation/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@romulo/database";

type Props = { params: Promise<{ username: string }> };

export default async function Profile(props: Props) {
    const params = await props.params;
    const user = await getProfileByUsername(params.username);
    if (!user) notFound();

    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.admin ?? false;

    return (
        <main className="min-h-screen default-scroll bg-background">
            <Navbar />
            <ProfileClient profile={user} isAdmin={isAdmin} />
        </main>
    );
}