"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { FieldError, FormMessage, TextField } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/styles";
import type { ActionState } from "@/lib/types";
import { login, signup } from "@/server/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);
  const errors = state.errors ?? {};

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField
        compact
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue={(state.values?.email as string) ?? ""}
        errors={errors.email}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="li-pass" className="text-[13px] font-semibold">
          Password
        </label>
        <div className="flex h-12 items-center rounded-xl border border-card-line bg-card/70 pr-1 pl-4 focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
          <input
            id="li-pass"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "li-pass-error" : undefined}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="flex size-11 items-center justify-center text-sub"
          >
            <Icon name="eye" size={20} />
          </button>
        </div>
        <FieldError id="li-pass-error" messages={errors.password} />
      </div>

      <FormMessage message={state.message} />

      <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "mt-1 w-full")}>
        {pending ? "Logging in…" : "Continue"}
      </button>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(signup, {});
  const errors = state.errors ?? {};
  const v = state.values ?? {};

  return (
    // Fits one screen: fields in pairs, no optional extras (favourite genres can be added later in Edit profile).
    <form action={action} className="flex flex-col gap-2.5 md:gap-3" noValidate>
      <div className="grid grid-cols-2 gap-2.5 md:gap-3">
        <TextField compact label="Full name" name="name" autoComplete="name" placeholder="Kemi Okafor" defaultValue={v.name as string} errors={errors.name} required />
        <TextField
          compact
          label="Username"
          name="username"
          prefix="@"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="kemi.frames"
          defaultValue={v.username as string}
          errors={errors.username}
          required
        />
      </div>
      <div className="grid gap-2.5 md:grid-cols-2 md:gap-3">
        <TextField compact label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" defaultValue={v.email as string} errors={errors.email} required />
        <TextField
          compact
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="8+ chars, number or symbol"
          errors={errors.password}
          required
        />
      </div>

      {/* Bot trap: hidden from people and screen readers; only scripts fill it in. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-sub">
        <input type="checkbox" name="terms" className="mt-px size-[18px] shrink-0 accent-cta" aria-describedby="terms-error" />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="font-semibold text-cta">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/terms#privacy" className="font-semibold text-cta">
            Privacy Policy
          </Link>
          , and will only share posters I have the right to.
        </span>
      </label>
      <FieldError id="terms-error" messages={errors.terms} />

      <FormMessage message={state.message} />

      <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "w-full")}>
        {pending ? "Creating account…" : "Agree and continue"}
      </button>
    </form>
  );
}
