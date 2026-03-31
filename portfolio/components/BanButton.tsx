"use client";

import { useState } from "react";

interface Props {
    userId: string;
    initialBanned: boolean;
}

export default function BanButton({ userId, initialBanned }: Props) {
    const [banned, setBanned] = useState(initialBanned);
    const [loading, setLoading] = useState(false);

    async function toggle() {
        setLoading(true);
        const res = await fetch(`/api/admin/users/${userId}/ban`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ banned: !banned }),
        });

        if (res.ok) {
            setBanned((b) => !b);
        }
        setLoading(false);
    }

    return (
        <button
            onClick={toggle}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-md transition disabled:opacity-50 ${banned
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
        >
            {loading ? "..." : banned ? "Desbanir usuário" : "Banir usuário"}
        </button>
    );
}