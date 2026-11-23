import type { Metadata } from "next";
import Link from "next/link";
import { DeleteRatingButton } from "@/components/account/delete-rating-button";
import { Icon, StarGlyph } from "@/components/icons";
import { EmptyState } from "@/components/layout/page";
import { Poster } from "@/components/ui/poster";
import { Stars } from "@/components/ui/stars";
import { buttonClass, chipClass } from "@/components/ui/styles";
import { cn, formatNumber, plural, timeAgo } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { awaitingReview, ratingsByOwner, reviewStats, type MyRatingsKind, type MyRatingsSort } from "@/server/queries/reviews";

export const metadata: Metadata = { title: "My reviews" };

type SearchParams = Promise<{ kind?: string; sort?: string }>;

const SORTS: { key: MyRatingsSort; label: string }[] = [
  { key: "recent", label: "Newest" },
  { key: "helpful", label: "Most helpful" },
  { key: "score", label: "Highest rated" },
];

export default async function MyReviewsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("/account/reviews");
  const params = await searchParams;
  const kind: MyRatingsKind = params.kind === "ratings" ? "ratings" : "reviews";
  const sort: MyRatingsSort = SORTS.some((s) => s.key === params.sort) ? (params.sort as MyRatingsSort) : "recent";

  const [items, stats, waiting] = await Promise.all([
    ratingsByOwner(user.id, kind, sort),
    reviewStats(user.id),
    kind === "reviews" ? awaitingReview(user.id, 3) : Promise.resolve([]),
  ]);

  const href = (patch: { kind?: MyRatingsKind; sort?: MyRatingsSort }) => {
    const next = { kind, sort, ...patch };
    const qs = new URLSearchParams();
    if (next.kind !== "reviews") qs.set("kind", next.kind);
    if (next.sort !== "recent") qs.set("sort", next.sort);
    const s = qs.toString();
    return s ? `/account/reviews?${s}` : "/account/reviews";
  };

  const tiles = [
    { label: "Reviews written", value: formatNumber(stats.reviews) },
    { label: "Ratings only", value: formatNumber(stats.ratingsOnly) },
    { label: "Average score", value: stats.average?.toFixed(1) ?? "–", star: true },
    { label: "Helpful votes received", value: formatNumber(stats.helpful) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-bold tracking-[-0.6px] md:text-[32px]">
            {kind === "reviews" ? "My reviews" : "My ratings"}
          </h1>
          <p className="mt-1 text-[15px] text-sub">Everything you&apos;ve dropped on Watch Nollywood, in one place.</p>
        </div>
        <Link href="/discover" className={buttonClass("primary", "md")}>
          <Icon name="pen" size={16} /> Review a film
        </Link>
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="flex flex-col gap-1 rounded-2xl border border-line p-4">
            <dt className="text-[13px] text-sub">{t.label}</dt>
            <dd className="flex items-center gap-1.5 text-[26px] leading-none font-bold">
              {t.star && <StarGlyph size={18} />}
              {t.value}
            </dd>
          </div>
        ))}
      </dl>

      {waiting.length > 0 && (
        <section aria-labelledby="waiting" className="flex flex-col gap-3 rounded-2xl bg-field p-5">
          <h2 id="waiting" className="text-[16px] font-semibold">
            You rated these — want to say more?
          </h2>
          <ul className="flex flex-col gap-2">
            {waiting.map((w) => (
              <li key={w.slug} className="flex items-center gap-3">
                <Poster film={w} showTitle={false} className="aspect-[2/3] w-9 shrink-0 rounded-md" sizes="36px" />
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{w.title}</span>
                <span className="flex items-center gap-1 text-[14px]">
                  <StarGlyph size={12} /> {w.score}
                </span>
                <Link href={`/films/${w.slug}/review`} className={buttonClass("outline", "sm")}>
                  Write review
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-4">
        <nav aria-label="What to show" className="flex gap-6 border-b border-line">
          {(["reviews", "ratings"] as const).map((k) => (
            <Link
              key={k}
              href={href({ kind: k })}
              aria-current={kind === k ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 pb-3 text-[15px] transition",
                kind === k ? "border-ink font-semibold" : "border-transparent text-sub hover:text-ink",
              )}
            >
              {k === "reviews" ? `Reviews (${stats.reviews})` : `Ratings only (${stats.ratingsOnly})`}
            </Link>
          ))}
        </nav>
        <nav aria-label="Sort" className="flex flex-wrap gap-2">
          {SORTS.filter((s) => kind === "reviews" || s.key !== "helpful").map((s) => (
            <Link key={s.key} href={href({ sort: s.key })} aria-current={sort === s.key ? "true" : undefined} className={chipClass(sort === s.key, "h-9")}>
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={kind === "reviews" ? "You haven't written any reviews yet" : "No score-only ratings"}
          body={kind === "reviews" ? "Find a film you've seen and tell other fans what you thought." : "Films you rate without writing a review show up here."}
          action={
            <Link href="/discover" className="font-semibold underline underline-offset-4">
              Discover films
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col">
          {items.map((r) => {
            const edited = r.updatedAt.getTime() - r.createdAt.getTime() > 60_000;
            return (
              <li key={r.id} className="flex gap-4 border-b border-line py-6 first:pt-0">
                <Link href={`/films/${r.film.slug}`} className="shrink-0">
                  <Poster film={r.film} showTitle={false} className="aspect-[2/3] w-16 rounded-xl md:w-20" sizes="80px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <Link href={`/films/${r.film.slug}`} className="text-[16px] font-semibold hover:underline">
                      {r.film.title} <span className="font-normal text-sub">({r.film.year})</span>
                    </Link>
                    <span className="text-[13px] text-sub">
                      {timeAgo(r.updatedAt)}
                      {edited && " · edited"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stars value={r.score} size={13} />
                    {r.spoiler && <span className="rounded-md bg-field px-1.5 py-0.5 text-[11px] font-semibold text-sub">Spoilers</span>}
                  </div>
                  {r.headline && <p className="text-[15px] font-semibold">{r.headline}</p>}
                  {r.body && <p className="line-clamp-3 text-[15px] leading-relaxed text-ink/90">{r.body}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {kind === "reviews" && (
                      <span className="mr-2 flex items-center gap-1.5 text-[13px] text-sub">
                        <Icon name="thumb" size={14} /> {plural(r.helpfulCount, "person", "people")} found this helpful
                      </span>
                    )}
                    {r.film.allowReviews && (
                      <Link href={`/films/${r.film.slug}/review`} className={buttonClass("outline", "sm")}>
                        {r.body ? "Edit" : "Write review"}
                      </Link>
                    )}
                    {r.body && (
                      <Link href={`/films/${r.film.slug}#review-${r.id}`} className={buttonClass("ghost", "sm")}>
                        View
                      </Link>
                    )}
                    <DeleteRatingButton filmId={r.film.id} title={r.film.title} hasReview={Boolean(r.body)} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
