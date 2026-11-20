"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Icon } from "@/components/icons";
import { ChipPicker, FieldError, FormMessage, TextField } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/styles";
import { GENRES } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { login, signup } from "@/server/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);
  const errors = state.errors ?? {};

  return (
    <form action={action} className="flex flex-col gap-3.5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField
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
        <div className="flex h-14 items-center rounded-xl border border-card-line bg-card pr-1 pl-4 focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
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
    <form action={action} className="flex flex-col gap-3.5" noValidate>
      <TextField label="Full name" name="name" autoComplete="name" placeholder="Kemi Okafor" defaultValue={v.name as string} errors={errors.name} required />
      <TextField
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
      <TextField label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" defaultValue={v.email as string} errors={errors.email} required />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="Use 8+ characters with a number or symbol."
        errors={errors.password}
        required
      />
      <ChipPicker
        name="genres"
        legend="What do you like to watch?"
        aside={<span className="text-[12.5px] text-sub">Optional</span>}
        options={GENRES}
        defaultValue={(v.genres as string[]) ?? ["Comedy", "Drama"]}
      />

      <label className="flex cursor-pointer items-start gap-2.5 pt-0.5 text-[13.5px] leading-snug text-sub">
        <input type="checkbox" name="terms" className="mt-0.5 size-5 shrink-0 accent-cta" aria-describedby="terms-error" />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="font-semibold text-cta">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/terms#privacy" className="font-semibold text-cta">
            Privacy Policy
          </Link>
          , and I&apos;ll only upload posters I have the right to share.
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
