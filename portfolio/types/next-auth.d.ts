import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            provider: "EMAIL_PASSWORD" | "GOOGLE";
            admin: boolean;
            username?: string | null;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        provider?: "EMAIL_PASSWORD" | "GOOGLE";
        admin?: boolean;
        username?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        provider?: "EMAIL_PASSWORD" | "GOOGLE";
        admin?: boolean;
        username?: string | null;
    }
}
