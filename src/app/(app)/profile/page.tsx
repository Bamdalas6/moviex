import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";

/** /profile is an alias for the signed-in user's public profile. */
export default async function ProfileRedirect() {
  const user = await requireUser("/profile");
  redirect(`/u/${user.username}`);
}
