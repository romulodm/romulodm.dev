import EditPostClient from './EditPostClient'
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth-helpers";

export default async function EditPostPage() {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) redirect("/");
  return <EditPostClient />
}