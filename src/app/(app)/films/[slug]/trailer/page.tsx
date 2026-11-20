import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Backdrop } from "@/components/film/backdrop";
import { QuickRate } from "@/components/film/film-widgets";
import { HeartButton } from "@/components/film/heart-button";
import { TrailerCard, trailerHref } from "@/components/film/trailer";
import { TrailerStage } from "@/components/film/trailer-stage";
import { Icon, StarGlyph } from "@/components/icons";
import { EmptyState, IconLink } from "@/components/layout/page";
import { ReviewCard } from "@/components/review/review-card";
import { ShareButton } from "@/components/review/share-button";
import { Poster } from "@/components/ui/poster";
import { buttonClass } from "@/components/ui/styles";
import { GENRES } from "@/lib/constants";
import type { FilmDetail } from "@/lib/types";
import { cn, formatRuntime, plural } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/session";
import { getFilmDetail, listFilms } from "@/server/queries/films";
import { filmReviews } from "@/server/queries/reviews";
import { youtubeDetails, youtubeThumb, youtubeWatchUrl } from "@/server/youtube";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const film = await getFilmDetail(slug);
  if (!film?.trailerKey) return { title: "Trailer not found" };
  return {
    title: `${film.title} trailer`,
    description: `Watch the ${film.title} (${film.year}) trailer, then rate and review the film.`,
    openGraph: { title: `${film.title} trailer`, images: [youtubeThumb(film.trailerKey)] },
  };
}

function typeLabel(trailer: FilmDetail["trailer"]) {
  // TMDB's "official" flag is often missing even for studio uploads, so only claim it when set.
  const type = trailer?.type ?? "Trailer";
  return trailer?.official ? `Official ${type.toLowerCase()}` : type;
}

function publishedLabel(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section data-reveal className={cn("flex flex-col gap-4 border-t border-line py-8", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-bold tracking-[-0.4px]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function TrailerPage({ params }: { params: Params }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const film = await getFilmDetail(slug, user?.id);
  if (!film?.trailerKey || film.status !== "published") notFound();

  const genre = GENRES.find((g) => g === film.genres[0]);
  const [video, reviews, sameGenre, latest] = await Promise.all([
    youtubeDetails(film.trailerKey),
    filmReviews(film.id, user?.id, "helpful", 4),
    genre ? listFilms({ genre, withTrailer: true, sort: "top", limit: 7 }) : Promise.resolve([]),
    listFilms({ withTrailer: true, sort: "recent", limit: 7 }),
  ]);
  const others = sameGenre.filter((f) => f.id !== film.id);
  const more = (others.length >= 3 ? others : latest.filter((f) => f.id !== film.id)).slice(0, 6);

  const canReview = film.allowReviews;
  const reviewLabel = film.viewer?.hasReview ? "Edit your review" : "Write a review";
  const meta = [film.year, film.genres.slice(0, 3).join(", "), formatRuntime(film.runtimeMinutes)].filter(Boolean).join(" · ");

  return (
    <main id="main" className="pb-28 md:pb-16">
      <section className="relative isolate text-white">
        <Backdrop films={[film]} />
        <div className="mx-auto max-w-6xl px-5 pt-5 pb-20 md:px-8 md:pt-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <IconLink href={`/films/${film.slug}`} label={`Back to ${film.title}`} icon="chevronLeft" variant="glass" />
              <nav aria-label="Breadcrumb" className="min-w-0 truncate text-[14px] text-white/80">
                <Link href={`/films/${film.slug}`} className="font-semibold text-white hover:underline">
                  {film.title}
                </Link>
                <span className="px-1.5">/</span>
                Trailer
              </nav>
            </div>
            <ShareButton path={trailerHref(film.slug)} title={`${film.title} trailer`} label="Share trailer" variant="glass" />
          </div>

          <TrailerStage
            facts={{
              videoKey: film.trailerKey,
              title: video?.title ?? film.trailerName ?? `${film.title} trailer`,
              channel: video?.channel ?? null,
              channelUrl: video?.channelUrl ?? null,
              typeLabel: typeLabel(film.trailer),
              published: publishedLabel(film.trailer?.publishedAt),
              watchUrl: youtubeWatchUrl(film.trailerKey),
              filmTitle: `${film.title} (${film.year})`,
            }}
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Section title="About the film" className="border-t-0">
          <div className="film-card group flex gap-4 md:gap-6">
            <Link href={`/films/${film.slug}`} className="lift shrink-0">
              <Poster film={film} showTitle={false} className="shine aspect-[2/3] w-28 rounded-xl shadow-card md:w-36" sizes="144px" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Link href={`/films/${film.slug}`} className="text-[20px] leading-tight font-bold tracking-[-0.3px] hover:underline md:text-[24px]">
                {film.title}
              </Link>
              <p className="text-[14px] text-sub">{meta}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-[14px]">
                <span className="flex items-center gap-1 font-semibold">
                  <StarGlyph size={14} /> {film.avgRating?.toFixed(1) ?? "New"}
                </span>
                <span className="text-sub">· {plural(film.ratingCount, "rating")}</span>
                <span className="text-sub">· {plural(film.reviewCount, "review")}</span>
              </p>
              {film.director && <p className="text-[14px] text-sub">Directed by {film.director}</p>}
              {film.synopsis && <p className="line-clamp-3 text-[15px] leading-relaxed">{film.synopsis}</p>}
              <div className="mt-1 flex flex-wrap items-center gap-2.5">
                <Link href={`/films/${film.slug}`} className={buttonClass("outline", "md")}>
                  View film page
                </Link>
                <HeartButton
                  filmId={film.id}
                  title={film.title}
                  saved={film.viewer?.saved ?? false}
                  signedIn={Boolean(user)}
                  returnTo={trailerHref(film.slug)}
                  className="size-11 rounded-xl bg-[#222]"
                  size={20}
                />
              </div>
            </div>
          </div>
        </Section>

        {canReview && (
          <Section title="Seen it? Rate and review">
            <div className="flex flex-col gap-4 rounded-2xl border border-line p-5 shadow-card md:flex-row md:items-center md:justify-between">
              <QuickRate filmId={film.id} slug={film.slug} score={film.viewer?.score ?? null} signedIn={Boolean(user)} className="md:flex-1" />
              <Link href={`/films/${film.slug}/review`} className={buttonClass("primary", "lg", "shrink-0")}>
                <Icon name="pen" size={18} /> {reviewLabel}
              </Link>
            </div>
          </Section>
        )}

        <Section
          title={`What fans think · ${plural(film.reviewCount, "review")}`}
          action={
            film.reviewCount > reviews.length && (
              <Link href={`/films/${film.slug}#reviews`} className="text-[15px] font-semibold underline underline-offset-4">
                See all reviews
              </Link>
            )
          }
        >
          {!canReview ? (
            <EmptyState title="Reviews are turned off" body="The uploader chose not to allow ratings and reviews for this film." />
          ) : reviews.length ? (
            <div className="grid gap-x-12 gap-y-10 pt-2 lg:grid-cols-2">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} signedIn={Boolean(user)} bare />
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews yet" body="Watched it after the trailer? Be the first to tell other fans what you thought." />
          )}
        </Section>

        {more.length > 0 && (
          <Section title="More trailers">
            <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((f) => (
                <div key={f.id} data-reveal="scale">
                  <TrailerCard slug={f.slug} videoKey={f.trailerKey!} title={f.title} subtitle={`${f.year} · ${f.genres.slice(0, 2).join(", ")}`} />
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </main>
  );
}
