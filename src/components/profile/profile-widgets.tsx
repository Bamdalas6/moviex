"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import { ChipPicker, FormMessage, TextAreaField, TextField } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/styles";
import { GENRES, type ThemePreference } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { setTheme, updateProfile } from "@/server/actions/account";
import { toggleFollow } from "@/server/actions/social";

export function FollowButton({ userId, following, name }: { userId: string; following: boolean; name: string }) {
  const [optimistic, setOptimistic] = useOptimistic(following);
  const [, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleFollow(userId);
        })
      }
      className={buttonClass(optimistic ? "outline" : "primary", "md", "flex-1")}
    >
      {optimistic ? "Following" : "Follow"}
      <span className="sr-only"> {name}</span>
    </button>
  );
}

const MODES: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeSwitcher({ current }: { current: ThemePreference }) {
  const [optimistic, setOptimistic] = useOptimistic(current);
  const [, startTransition] = useTransition();

  function choose(mode: ThemePreference) {
    // Apply instantly on the client, persist via cookie on the server.
    if (mode === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", mode);
    startTransition(async () => {
      setOptimistic(mode);
      await setTheme(mode);
    });
  }

  return (
    <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-3 gap-0.5 rounded-full bg-field p-[3px]">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          role="radio"
          aria-checked={optimistic === m.value}
          onClick={() => choose(m.value)}
          className={cn(
            "h-9 rounded-full text-[13.5px] font-semibold transition",
            optimistic === m.value ? "bg-card text-ink shadow-card" : "text-sub hover:text-ink",
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export function EditProfileForm({
  initial,
}: {
  initial: { name: string; bio: string | null; location: string | null; genres: string[] };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {});
  const v = state.values ?? {};
  const errors = state.errors ?? {};

  return (
    <form action={action} className="flex flex-col gap-3.5 px-4 pt-1 pb-4" noValidate>
      <TextField label="Name" name="name" defaultValue={(v.name as string) ?? initial.name} errors={errors.name} autoComplete="name" />
      <TextField label="Location" name="location" defaultValue={(v.location as string) ?? initial.location ?? ""} errors={errors.location} placeholder="City, Country" />
      <TextAreaField label="Bio" name="bio" rows={3} maxLength={200} showCount defaultValue={(v.bio as string) ?? initial.bio ?? ""} errors={errors.bio} />
      <ChipPicker name="genres" legend="Favourite genres" options={GENRES} defaultValue={initial.genres} errors={errors.genres} />
      <FormMessage message={state.message} ok={state.ok} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "md", "self-start shadow-none")}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
