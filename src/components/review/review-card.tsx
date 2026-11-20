"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { Poster } from "@/components/ui/poster";
import { Stars } from "@/components/ui/stars";
import { cardClass } from "@/components/ui/styles";
import type { ReviewItem } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { reportReview, toggleHelpful } from "@/server/actions/reviews";
import { toggleFollow } from "@/server/actions/social";
import { ShareButton } from "./share-button";

type Props = {
  review: ReviewItem;
  /** Feed cards show which film the review is about. */
  showFilm?: boolean;
  /** Short preview (home page): clamped text, no action row. */
  compact?: boolean;
  /** Render without the card frame (film page lists reviews on the open canvas). */
  bare?: boolean;
  signedIn: boolean;
};

const LONG_REVIEW = 220;

export function ReviewCard({ review, showFilm, compact, bare, signedIn }: Props) {
  const [revealed, setRevealed] = useState(!review.spoiler);
  const [expanded, setExpanded] = useState(false);
  const [reported, setReported] = useState(review.viewerReported);
  const [pending, startTransition] = useTransition();

  const [helpful, setHelpful] = useOptimistic(
    { voted: review.viewerVoted, count: review.helpfulCount },
    (state, voted: boolean) => ({ voted, count: state.count + (voted ? 1 : -1) }),
  );
  const [following, setFollowing] = useOptimistic(review.viewerFollows);

  const loginHref = `/login?next=${encodeURIComponent(showFilm ? "/reviews" : `/films/${review.film.slug}`)}`;
  const long = review.body.length > LONG_REVIEW;
  const clamp = compact || (long && !expanded);

  return (
    <article id={`review-${review.id}`} data-reveal className={cn("flex scroll-mt-28 flex-col gap-3.5", !bare && cn(cardClass, "p-5"))}>
      {showFilm && (
        <Link href={`/films/${review.film.slug}`} className="group flex items-center gap-3">
          <Poster film={review.film} showTitle={false} className="h-14 w-10 shrink-0 rounded-lg" sizes="40px" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold group-hover:underline">{review.film.title}</span>
            <span className="block text-[13px] text-sub">
              {review.film.year}
              {review.film.genre && ` · ${review.film.genre}`}
            </span>
          </span>
          <Icon name="chevronRight" size={16} strokeWidth={2.2} className="text-sub" />
        </Link>
      )}

      <header className="flex items-center gap-3">
        <Link href={`/u/${review.author.username}`} className="shrink-0">
          <Avatar name={review.author.name} color={review.author.avatarColor} size={44} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">
            <Link href={`/u/${review.author.username}`} className="hover:underline">
              {review.author.name}
            </Link>
          </p>
          <p className="truncate text-[13px] text-sub">@{review.author.username}</p>
        </div>
        {showFilm && !compact && !review.isOwn &&
          (signedIn ? (
            <button
              type="button"
              aria-pressed={following}
              onClick={() =>
                startTransition(async () => {
                  setFollowing(!following);
                  await toggleFollow(review.author.id);
                })
              }
              className={cn(
                "h-8 shrink-0 rounded-lg border px-3 text-[13px] font-semibold transition",
                following ? "border-line bg-field text-sub" : "border-ink text-ink hover:bg-field",
              )}
            >
              {following ? "Following" : "Follow"}
              <span className="sr-only"> {review.author.name}</span>
            </button>
          ) : (
            <Link href={loginHref} className="flex h-8 items-center rounded-lg border border-ink px-3 text-[13px] font-semibold">
              Follow
            </Link>
          ))}
      </header>

      <div className="flex items-center gap-2 text-[13px]">
        <Stars value={review.score} size={11} />
        <span className="text-sub">·</span>
        <time dateTime={review.createdAt.toISOString()} className="font-medium">
          {timeAgo(review.createdAt)}
        </time>
        {review.spoiler && <span className="rounded-md bg-field px-1.5 py-0.5 text-[11px] font-semibold text-sub">Spoilers</span>}
      </div>

      <div className="relative">
        <div className={cn(!revealed && "pointer-events-none blur-[6px] select-none")} aria-hidden={!revealed}>
          {review.headline && <h3 className="text-[15px] font-semibold">{review.headline}</h3>}
          <p className={cn("text-[15px] leading-relaxed whitespace-pre-line", review.headline && "mt-1", clamp && "line-clamp-3")}>
            {review.body}
          </p>
        </div>
        {!revealed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button type="button" onClick={() => setRevealed(true)} className="h-9 rounded-lg bg-ink px-4 text-[13px] font-semibold text-page">
              Contains spoilers · Show
            </button>
          </div>
        )}
      </div>
      {revealed && long && !compact && (
        <button type="button" onClick={() => setExpanded((e) => !e)} className="-mt-1 self-start text-[15px] font-semibold underline underline-offset-4">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {!compact && (
        <footer className="flex items-center gap-2 pt-0.5">
          {review.isOwn ? (
            <>
              <span className="flex h-9 items-center gap-1.5 text-[13px] text-sub">
                <Icon name="thumb" size={15} /> {helpful.count} found this helpful
              </span>
              <Link href={`/films/${review.film.slug}/review`} className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold underline underline-offset-4">
                Edit
              </Link>
            </>
          ) : signedIn ? (
            <button
              type="button"
              aria-pressed={helpful.voted}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setHelpful(!helpful.voted);
                  await toggleHelpful(review.id);
                })
              }
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold transition",
                helpful.voted ? "border-ink bg-ink text-page" : "border-card-line hover:border-ink",
              )}
            >
              <Icon name="thumb" size={15} /> Helpful · {helpful.count}
            </button>
          ) : (
            <Link href={loginHref} className="flex h-9 items-center gap-1.5 rounded-lg border border-card-line px-3 text-[13px] font-semibold">
              <Icon name="thumb" size={15} /> Helpful · {helpful.count}
            </Link>
          )}

          <div className="ml-auto flex items-center">
            <ShareButton path={`/films/${review.film.slug}#review-${review.id}`} title={`${review.author.name} on ${review.film.title}`} label="Share review" />
            {!review.isOwn && signedIn && (
              <button
                type="button"
                aria-label={reported ? "Review reported" : "Report review"}
                title={reported ? "Thanks — our moderators will take a look" : "Report review"}
                disabled={reported}
                onClick={() =>
                  startTransition(async () => {
                    setReported(true);
                    await reportReview(review.id);
                  })
                }
                className={cn("flex size-9 items-center justify-center rounded-full", reported ? "text-accent" : "text-sub hover:bg-field")}
              >
                <Icon name="flag" size={16} />
              </button>
            )}
          </div>
        </footer>
      )}
    </article>
  );
}
