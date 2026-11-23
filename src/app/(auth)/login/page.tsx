import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";
import { safeNext } from "@/server/auth/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next, "/");

  return (
    <AuthCard title="Welcome back" subtitle="Log in to rate, review and keep your watchlist.">
      <LoginForm next={next} />
      <p className="text-center text-[14px] text-sub">
        New to Marquee?{" "}
        <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
      <Link href="/" className="-mt-2 text-center text-[13.5px] text-sub underline-offset-4 hover:text-ink hover:underline">
        Browse without an account
      </Link>
    </AuthCard>
  );
}
