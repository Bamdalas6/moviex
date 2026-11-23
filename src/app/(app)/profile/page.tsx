import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

/** /profile is an alias for the signed-in user's public profile; signed out, it opens the onboarding. */
export default async function ProfileRedirect() {
  const user = await getCurrentUser();
  redirect(user ? `/u/${user.username}` : "/welcome");
}
