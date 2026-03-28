"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/navigation/Navbar";

interface BannedUser {
    id: string;
    username: string;
    email: string;
    bannedAt: string | null;
}

export default function BannedUsersPage() {
    const [users, setUsers] = useState<BannedUser[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchBanned() {
        const res = await fetch("/api/admin/users/banned");
        const data = await res.json();
        setUsers(data.users);
        setLoading(false);
    }

    useEffect(() => { fetchBanned(); }, []);

    async function unban(id: string) {
        await fetch(`/api/admin/users/${id}/ban`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ banned: false }),
        });
        fetchBanned();
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-10 mt-12">
                <h1 className="text-2xl font-bold mb-6 text-black dark:text-white">
                    Usuários Banidos
                </h1>

                {loading && <p className="text-gray-400">Carregando...</p>}

                {!loading && users.length === 0 && (
                    <p className="text-gray-500 mt-10 text-center">
                        Nenhum usuário banido 🎉
                    </p>
                )}

                <div className="space-y-3">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 bg-red-50 dark:bg-red-950"
                        >
                            <div>
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                    {user.username}
                                </p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                                {user.bannedAt && (
                                    <p className="text-xs text-red-400">
                                        Banido em {new Date(user.bannedAt).toLocaleDateString("pt-BR")}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => unban(user.id)}
                                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                            >
                                Desbanir
                            </button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}