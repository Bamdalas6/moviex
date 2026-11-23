import type { Metadata } from "next";
import { WelcomeExperience } from "@/components/onboarding/welcome-experience";
import { runwayPosters } from "@/server/queries/onboarding";

export const metadata: Metadata = { title: "Welcome" };

/**
 * Onboarding: a full-screen splash that morphs into the app icon, then a 3D
 * runway of real Nollywood posters behind the welcome copy. First-time
 * visitors also get it over Home (see FirstVisitWelcome).
 */
export default async function WelcomePage() {
  return <WelcomeExperience posters={await runwayPosters()} />;
}
