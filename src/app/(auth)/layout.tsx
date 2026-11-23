import { redirect } from "next/navigation";
import { PosterWall } from "@/components/auth/poster-wall";
import { Logo } from "@/components/layout/app-nav";
import { getCurrentUser } from "@/server/auth/session";
import { runwayPosters } from "@/server/queries/onboarding";

/**
 * Auth screens: a moving wall of posters behind a slim glass logo bar and a
 * centred card. Only for signed-out visitors.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/");
  const posters = await runwayPosters();
  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <PosterWall posters={posters} />
      <header className="border-b border-white/10 bg-black/45 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-5 md:h-16 md:px-8">
          <Logo onDark />
        </div>
      </header>
      {/* Centred in the space under the header; compact enough that the whole form fits without scrolling. */}
      <div className="flex flex-1 items-center justify-center px-4 py-3 md:px-0 md:py-6">{children}</div>
    </div>
  );
}
