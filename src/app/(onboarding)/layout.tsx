import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

/**
 * Onboarding owns the whole screen: no header and no page fade (the splash
 * must start fully opaque). Signed-in visitors go straight to the app.
 */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/");
  return <div className="min-h-dvh bg-black">{children}</div>;
}
