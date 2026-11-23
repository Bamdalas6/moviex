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
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5 md:h-20 md:px-8">
          <Logo />
        </div>
      </header>
      <div className="flex flex-1 justify-center px-4 py-6 md:items-center md:px-0 md:py-12">{children}</div>
    </div>
  );
}
