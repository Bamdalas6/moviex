"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { toggleWatchlist } from "@/server/actions/social";

/**
 * Save-to-watchlist heart that sits on poster artwork (outlined white, filled
 * when saved). Signed-out visitors are sent to log in and brought back.
 */
export function HeartButton({
  filmId,
  title,
  saved,
  signedIn,
  returnTo,
  className,
  size = 24,
}: {
  filmId: string;
  title: string;
  saved: boolean;
  signedIn: boolean;
  returnTo: string;
  className?: string;
  size?: number;
}) {
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [, startTransition] = useTransition();

  const heart = (
    <Icon
      name="heart"
      size={size}
      strokeWidth={2}
      className="drop-shadow-[0_1px_2px_rgb(0_0_0/0.4)] transition-transform group-active/heart:scale-90"
      stroke="#fff"
      fill={optimistic ? "#F43F5E" : "rgb(0 0 0 / 0.45)"}
    />
  );

  const classes = cn("group/heart inline-flex size-10 items-center justify-center rounded-full", className);

  if (!signedIn) {
    return (
      <Link href={`/login?next=${encodeURIComponent(returnTo)}`} aria-label={`Log in to save ${title}`} className={classes}>
        {heart}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? `Remove ${title} from watchlist` : `Save ${title} to watchlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleWatchlist(filmId);
        });
      }}
      className={classes}
    >
      {heart}
    </button>
  );
}
