import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <AuthCard title="Create your account" subtitle="Rate Nollywood films, share posters and see what other fans think.">
      <SignupForm />
      <p className="text-center text-[14px] text-sub">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
