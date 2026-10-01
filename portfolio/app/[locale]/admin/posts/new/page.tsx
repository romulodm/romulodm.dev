import "server-only"

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import { createPostId } from "@/lib/s3";
import NewPostClient from "./page-client";

export default async function NewPostPage() {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) redirect("/");

  // Generated up front so images uploaded before the first save already land
  // under this post's media prefix. The create route persists this same id.
  return <NewPostClient postId={createPostId()} />;
}