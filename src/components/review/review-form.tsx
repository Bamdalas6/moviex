"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { FormMessage, Switch, TextAreaField, TextField } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/styles";
import { REVIEW_BODY_MAX, REVIEW_HEADLINE_MAX } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { deleteReview, saveReview } from "@/server/actions/reviews";

type Existing = { score: number; headline: string | null; body: string | null; spoiler: boolean } | null;

const WORDS = ["Tap a star", "Poor", "Not great", "Good", "Great", "Masterpiece"];

export function ReviewForm({ filmId, slug, existing }: { filmId: string; slug: string; existing: Existing }) {
  const [state, action, submitting] = useActionState<ActionState, FormData>(saveReview, {});
  const [score, setScore] = useState(existing?.score ?? 0);
  const [deleting, startDelete] = useTransition();
  const router = useRouter();

  if (state.ok) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-[20px] bg-field px-4 py-3.5">
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cta text-white">
          <Icon name="check" size={18} strokeWidth={2.8} />
        </span>
        <div className="flex-1">
          <p className="text-[15px] font-bold">{state.message}</p>
          <p className="text-[13px] text-sub">It&apos;s now visible on the film page.</p>
        </div>
        <Link href={`/films/${slug}`} className={buttonClass("primary", "md", "h-11 shadow-none")}>
          View
        </Link>
      </div>
    );
  }

  const errors = state.errors ?? {};

  return (
    <form action={action} className="flex flex-col gap-[18px]" noValidate>
      <input type="hidden" name="filmId" value={filmId} />
      <input type="hidden" name="score" value={score} />

      <fieldset className="flex flex-col items-center gap-1.5">
        <legend className="mb-2 text-center text-[22px] font-extrabold tracking-[-0.5px]">How would you rate it?</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((k) => {
            const on = k <= score;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={k === score}
                aria-label={`${k} ${k === 1 ? "star" : "stars"}`}
                onClick={() => setScore(k)}
                className="flex size-[52px] items-center justify-center transition active:scale-90"
              >
                <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true" fill={on ? "#FFB020" : "none"} stroke={on ? "#FFB020" : "var(--idle)"} strokeWidth="1.4" strokeLinejoin="round">
                  <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
                </svg>
              </button>
            );
          })}
        </div>
        <span aria-live="polite" className={cn("text-sm font-semibold", errors.score ? "text-accent" : "text-sub")}>
          {errors.score?.[0] ?? (score ? `${score} out of 5 · ${WORDS[score]}` : WORDS[0])}
        </span>
      </fieldset>

      <TextField
        label="Headline"
        name="headline"
        placeholder="Sum it up in a few words"
        maxLength={REVIEW_HEADLINE_MAX}
        defaultValue={(state.values?.headline as string) ?? existing?.headline ?? ""}
        errors={errors.headline}
        aside={<span className="text-[12.5px] text-sub">Optional</span>}
      />

      <TextAreaField
        label="Your review"
        name="body"
        rows={5}
        placeholder="What worked, what didn't? Leave it empty to just save your rating."
        maxLength={REVIEW_BODY_MAX}
        showCount
        defaultValue={(state.values?.body as string) ?? existing?.body ?? ""}
        errors={errors.body}
      />

      <Switch name="spoiler" label="Contains spoilers" description="Readers will tap to reveal it" defaultChecked={existing?.spoiler} />

      <FormMessage message={state.message} />

      <div className="flex gap-2.5 pt-0.5">
        <Link href={`/films/${slug}`} className={buttonClass("outline", "lg", "px-[22px] font-semibold")}>
          Cancel
        </Link>
        <button type="submit" disabled={submitting} className={buttonClass("primary", "lg", "flex-1 shadow-none")}>
          {submitting ? "Posting…" : existing?.body ? "Update review" : "Post review"}
        </button>
      </div>

      {existing && (
        <button
          type="button"
          disabled={deleting}
          onClick={() => {
            if (confirm("Delete your rating and review for this film?")) {
              startDelete(async () => {
                await deleteReview(filmId);
                router.push(`/films/${slug}`);
              });
            }
          }}
          className={buttonClass("danger", "md", "self-center")}
        >
          <Icon name="trash" size={16} /> {deleting ? "Deleting…" : "Delete my rating"}
        </button>
      )}
    </form>
  );
}
