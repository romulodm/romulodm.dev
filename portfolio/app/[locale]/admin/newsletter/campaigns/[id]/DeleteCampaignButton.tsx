'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        startTransition(() => router.push("/admin/newsletter/campaigns"));
      }
    } catch {
      setDeleting(false);
    }
  };

  if (confirmOpen) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Tem certeza?</span>
        <button
          onClick={() => setConfirmOpen(false)}
          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg
                     hover:bg-red-700 transition-colors flex items-center gap-1
                     disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Excluir
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmOpen(true)}
      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      title="Excluir campanha"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
