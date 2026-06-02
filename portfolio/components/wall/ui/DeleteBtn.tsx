// components/wall/ui/DeleteBtn.tsx
"use client";
import { useState } from "react";

interface Props {
  msgId: string;
  onDeleted: (id: string) => void;
}

export function DeleteBtn({ msgId, onDeleted }: Props) {
  const [confirm, setConfirm]   = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wall/${msgId}`, { method: "DELETE" });
      if (res.ok) onDeleted(msgId);
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  };

  if (loading) {
    return (
      <svg className="w-3.5 h-3.5 animate-spin text-white/40" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"
                strokeDasharray="20 40" />
      </svg>
    );
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-white/40 text-[10px]">Delete?</span>
        <button
          onClick={handleDelete}
          className="text-red-400 hover:text-red-300 text-[10px] font-medium transition-colors"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-white/30 hover:text-white/60 text-[10px] transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title="Delete message"
      className="text-white/25 hover:text-red-400 transition-colors p-0.5"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
