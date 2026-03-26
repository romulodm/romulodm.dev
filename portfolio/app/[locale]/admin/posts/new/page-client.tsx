"use client";

import { useRouter } from "next/navigation";
import { PostEditor } from "@/components/editor/PostEditor";

export default function NewPostClient() {
    const router = useRouter();

    const handleSave = async (data: {
        title: string;
        contentMarkdown: string;
        coverImageUrl: string;
        tags: string[];
        status: "DRAFT" | "PUBLISHED";
    }) => {
        const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Failed to create post");

        await res.json();
        router.push("/admin/posts");
    };

    return (
        <PostEditor
            onSave={handleSave}
            onCancel={() => router.push("/admin/posts")}
        />
    );
}