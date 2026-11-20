"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { Burst } from "@/components/motion/effects";
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
  // Bumped on every save so the pop + particle burst replay (keyed remount).
  const [pops, setPops] = useState(0);

  const heart = (
    <Icon
      key={pops}
      name="heart"
      size={size}
      strokeWidth={2}
      className={cn(
        "drop-shadow-[0_1px_2px_rgb(0_0_0/0.4)] transition-transform group-hover/heart:scale-110 group-active/heart:scale-90",
        pops > 0 && "animate-pop",
      )}
      stroke="#fff"
      fill={optimistic ? "#F43F5E" : "rgb(0 0 0 / 0.45)"}
    />
  );

  const classes = cn("group/heart relative inline-flex size-10 items-center justify-center rounded-full", className);

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
        if (!optimistic) setPops((n) => n + 1);
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleWatchlist(filmId);
        });
      }}
      className={classes}
    >
      {heart}
      <Burst trigger={pops} colors={["#F43F5E", "#FF9EC4", "#FFB020", "#ffffff"]} />
    </button>
  );
}
