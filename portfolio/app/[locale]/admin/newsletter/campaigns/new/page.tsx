// src/app/admin/newsletter/campaigns/new/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import Navbar from "@/components/navigation/Navbar";
import { ArrowLeft } from "lucide-react";
import CampaignForm from "../CampaignForm";

export default async function NewCampaignPage() {
  if (!(await isAdminAuthenticated())) redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mt-12" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/admin/newsletter/campaigns"
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova campanha</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Salve como rascunho primeiro, depois envie ou agende.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <CampaignForm mode="create" />
        </div>
      </main>
    </div>
  );
}
