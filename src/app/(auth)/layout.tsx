import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/app-nav";
import { getCurrentUser } from "@/server/auth/session";

/** Auth screens: slim logo bar, then a centred card. Only for signed-out visitors. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5 md:h-20 md:px-8">
          <Logo />
        </div>
      </header>
      <div className="flex flex-1 justify-center md:items-center md:py-12">{children}</div>
    </div>
  );
}
