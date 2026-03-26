import "server-only"

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import NewPostClient from "./page-client";

export default async function NewPostPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/");
  }

  return <NewPostClient />;
}