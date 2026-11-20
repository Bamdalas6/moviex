"use client";

import { useTransition } from "react";
import { Icon } from "@/components/icons";
import { deleteReview } from "@/server/actions/reviews";

/** Deletes the user's rating (and review text) for a film after confirmation. */
export function DeleteRatingButton({ filmId, title, hasReview }: { filmId: string; title: string; hasReview: boolean }) {
  const [pending, startTransition] = useTransition();
  const what = hasReview ? "review and rating" : "rating";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete your ${what} for ${title}? This can't be undone.`)) {
          startTransition(() => deleteReview(filmId));
        }
      }}
      className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-accent hover:bg-field disabled:opacity-50"
    >
      <Icon name="trash" size={15} />
      {pending ? "Deleting…" : "Delete"}
      <span className="sr-only"> your {what} for {title}</span>
    </button>
  );
}
