import type { Metadata } from "next";
import Link from "next/link";
import { Icon, StarGlyph } from "@/components/icons";
import { EmptyState, PageShell, PageTitle } from "@/components/layout/page";
import { ReviewCard } from "@/components/review/review-card";
import { Poster } from "@/components/ui/poster";
import { buttonClass, chipClass } from "@/components/ui/styles";
import { cn } from "@/lib/utils";
import { reviewFeedSchema } from "@/lib/validation";
import { getCurrentUser } from "@/server/auth/session";
import { awaitingReview, reviewFeed } from "@/server/queries/reviews";

export const metadata: Metadata = { title: "Reviews" };

const FEEDS = [
  { key: "for-you", label: "For you" },
  { key: "following", label: "Following" },
  { key: "top", label: "Top" },
  { key: "latest", label: "Latest" },
] as const;

const STAR_FILTERS = [
  { key: "all", label: "All ratings" },
  { key: "5", label: "5 stars" },
  { key: "4", label: "4 stars" },
  { key: "3-", label: "3 and below" },
] as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ReviewsPage({ searchParams }: { searchParams: SearchParams }) {
  const { feed, stars } = reviewFeedSchema.parse(await searchParams);
  const user = await getCurrentUser();
  const [items, waiting] = await Promise.all([
    reviewFeed({ viewerId: user?.id, feed, stars }),
    user ? awaitingReview(user.id) : Promise.resolve([]),
  ]);

  const href = (patch: Partial<{ feed: string; stars: string }>) => {
    const next = { feed, stars, ...patch };
    const params = new URLSearchParams();
    if (next.feed !== "for-you") params.set("feed", next.feed);
    if (next.stars !== "all") params.set("stars", next.stars);
    const qs = params.toString();
    return qs ? `/reviews?${qs}` : "/reviews";
  };

  return (
    <PageShell>
      <PageTitle
        title="Reviews"
        subtitle="What Nollywood fans are saying"
        action={
          <div className="flex gap-2">
            {user && (
              <Link href="/account/reviews" className={buttonClass("secondary", "sm", "h-10")}>
                My reviews
              </Link>
            )}
            <Link href="/discover" className={buttonClass("outline", "sm", "h-10")}>
              <Icon name="pen" size={16} /> Write one
            </Link>
          </div>
        }
      />

      <nav aria-label="Review feed" className="-mt-2 flex gap-6 border-b border-line">
        {FEEDS.map((f) => (
          <Link
            key={f.key}
            href={href({ feed: f.key })}
            aria-current={feed === f.key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 pb-3 text-[15px] transition",
              feed === f.key ? "border-ink font-semibold text-ink" : "border-transparent text-sub hover:text-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {waiting.length > 0 && (
        <section aria-labelledby="waiting" className="flex flex-col gap-4 rounded-2xl bg-field p-5">
          <div>
            <h2 id="waiting" className="text-[17px] font-semibold">
              Waiting for your review
            </h2>
            <p className="mt-0.5 text-[14px] text-sub">You rated these but haven&apos;t written about them yet</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            {waiting.map((w) => (
              <Link key={w.slug} href={`/films/${w.slug}/review`} className="group flex flex-col gap-2">
                <Poster film={w} showTitle className="aspect-[2/3] rounded-xl" titleClassName="inset-x-2 bottom-2 text-[12.5px]" sizes="140px" />
                <span className="flex items-center gap-1 text-[13px] font-semibold group-hover:underline">
                  <StarGlyph size={11} /> {w.score} · Write review
                  <span className="sr-only"> for {w.title}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <nav aria-label="Filter by rating" className="scrollbar-none -mx-5 -my-1 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
        {STAR_FILTERS.map((f) => (
          <Link key={f.key} href={href({ stars: f.key })} aria-current={stars === f.key ? "true" : undefined} className={chipClass(stars === f.key)}>
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-4">
        {items.map((review) => (
          <ReviewCard key={review.id} review={review} showFilm signedIn={Boolean(user)} />
        ))}
        {!items.length &&
          (feed === "following" && !user ? (
            <EmptyState
              title="Log in to see who you follow"
              action={
                <Link href="/login?next=/reviews?feed=following" className="font-semibold underline underline-offset-4">
                  Log in
                </Link>
              }
            />
          ) : feed === "following" ? (
            <EmptyState title="Nothing from people you follow yet" body="Follow reviewers from the For you feed to fill this up." />
          ) : (
            <EmptyState title="No reviews match this filter yet" />
          ))}
      </div>
    </PageShell>
  );
}
