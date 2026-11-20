import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/auth-forms";
import { IconLink } from "@/components/layout/page";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <main id="main" className="w-full max-w-[568px] md:rounded-2xl md:border md:border-line md:bg-card md:shadow-lift">
      <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-line px-4 py-3">
        <IconLink href="/login" label="Back to log in" icon="chevronLeft" variant="field" />
        <h1 className="text-center text-[16px] font-semibold">Sign up</h1>
      </div>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.3px]">Create your Marquee account</h2>
          <p className="mt-1 text-[15px] text-sub">Rate Nollywood and African films, share posters and see what other fans think.</p>
        </div>
        <SignupForm />
        <p className="text-center text-[14px] text-sub">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
