import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            provider: "EMAIL_PASSWORD" | "GOOGLE" | "GITHUB";
            admin: boolean;
            username?: string | null;
            /** False only for EMAIL_PASSWORD accounts that have not confirmed the address. */
            emailVerified: boolean;
            /** False while the account still has the username the system assigned. */
            usernameChosen: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        provider?: "EMAIL_PASSWORD" | "GOOGLE" | "GITHUB";
        admin?: boolean;
        username?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        provider?: "EMAIL_PASSWORD" | "GOOGLE" | "GITHUB";
        admin?: boolean;
        username?: string | null;
        emailVerified?: boolean;
        usernameChosen?: boolean;
    }
}