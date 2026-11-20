import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/auth-forms";
import { buttonClass } from "@/components/ui/styles";
import { safeNext } from "@/server/auth/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next, "/");

  return (
    <main id="main" className="w-full max-w-[568px] md:rounded-2xl md:border md:border-line md:bg-card md:shadow-lift">
      <div className="border-b border-line py-5 text-center">
        <h1 className="text-[16px] font-semibold">Log in</h1>
      </div>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.3px]">Welcome back to Marquee</h2>
          <p className="mt-1 text-[15px] text-sub">The best of Nollywood, rated by real fans.</p>
        </div>
        <LoginForm next={next} />
        <div className="flex items-center gap-4 text-[13px] text-sub">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>
        <Link href="/signup" className={buttonClass("outline", "lg", "w-full")}>
          Create an account
        </Link>
        <Link href="/" className="text-center text-[14px] font-semibold underline underline-offset-4">
          Browse without an account
        </Link>
      </div>
    </main>
  );
}
