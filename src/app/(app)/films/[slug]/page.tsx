import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Backdrop } from "@/components/film/backdrop";
import { QuickRate, RatingBars } from "@/components/film/film-widgets";
import { HeartButton } from "@/components/film/heart-button";
import { TrailerCard, trailerHref } from "@/components/film/trailer";
import { Tilt } from "@/components/motion/effects";
import { Icon, StarGlyph } from "@/components/icons";
import { EmptyState, IconLink, TmdbCredit } from "@/components/layout/page";
import { ReviewCard } from "@/components/review/review-card";
import { ShareButton } from "@/components/review/share-button";
import { Avatar } from "@/components/ui/avatar";
import { Poster } from "@/components/ui/poster";
import { buttonClass } from "@/components/ui/styles";
import { cn, formatRuntime, plural, timeAgo } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/session";
import { getFilmDetail, listCinemas } from "@/server/queries/films";
import { WhereToWatch } from "@/components/film/where-to-watch";
import { filmReviews } from "@/server/queries/reviews";
import { filmCredits } from "@/server/queries/people";
import { PersonPhoto } from "@/components/people/people-ui";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ sort?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const film = await getFilmDetail(slug);
  if (!film) return { title: "Film not found" };
  return {
    title: `${film.title} (${film.year})`,
    description: film.synopsis || `Ratings and reviews for ${film.title}.`,
    openGraph: { title: film.title, description: film.synopsis, images: film.posterUrl ? [film.posterUrl] : undefined },
  };
}

function Section({ title, children, className }: { title?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section data-reveal className={cn("flex flex-col gap-4 border-t border-line py-8", className)}>
      {title && <h2 className="text-[22px] font-bold tracking-[-0.4px]">{title}</h2>}
      {children}
    </section>
  );
}

export default async function FilmPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, { sort: sortParam }] = await Promise.all([params, searchParams]);
  const user = await getCurrentUser();
  const film = await getFilmDetail(slug, user?.id);
  if (!film) notFound();

  const sort = sortParam === "recent" ? "recent" : "helpful";
  const [reviews, cinemaList, credits] = await Promise.all([
    filmReviews(film.id, user?.id, sort),
    film.nowPlaying ? listCinemas() : Promise.resolve([]),
    filmCredits(film.id),
  ]);
  const castCredits = credits.filter((c) => c.role === "cast");
  const directorCredits = credits.filter((c) => c.role === "director");
  const pending = film.status !== "published";
  const canReview = film.allowReviews && !pending;
  const meta = [film.year, film.genres.join(", "), formatRuntime(film.runtimeMinutes), film.language].filter(Boolean).join(" · ");
  const reviewLabel = film.viewer?.hasReview ? "Edit your review" : "Write a review";

  return (
    <main id="main" className={cn("pb-28 md:pb-16", canReview && "pb-48")}>
      <section className="relative isolate text-white">
        <Backdrop films={[film]} />
        <div className="mx-auto max-w-6xl px-5 pt-5 pb-24 md:px-8 md:pt-8 md:pb-24">
          <div className="flex items-center justify-between">
            <IconLink href="/discover" label="Back to discover" icon="chevronLeft" variant="glass" />
            {!pending && (
              <div className="flex gap-2">
                <ShareButton path={`/films/${film.slug}`} title={film.title} label="Share film" variant="glass" />
                <HeartButton
                  filmId={film.id}
                  title={film.title}
                  saved={film.viewer?.saved ?? false}
                  signedIn={Boolean(user)}
                  returnTo={`/films/${film.slug}`}
                  className="border border-white/40 bg-black/20 backdrop-blur-md"
                  size={20}
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center gap-7 md:flex-row md:items-end md:gap-10">
            <div className="hero-recede shrink-0">
              <Tilt className="rounded-2xl" max={8}>
                <Poster
                  film={film}
                  priority
                  showTitle
                  sizes="(min-width: 768px) 260px, 220px"
                  className="aspect-[2/3] w-[220px] rounded-2xl shadow-[0_24px_48px_rgb(0_0_0/0.45)] ring-1 ring-white/15 md:w-[260px]"
                  titleClassName="inset-x-4 bottom-4 text-[26px] leading-none"
                />
              </Tilt>
            </div>
            <div className="flex flex-col items-center gap-2 text-center md:items-start md:pb-2 md:text-left">
              {(film.badge || film.nowPlaying) && (
                <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                  {film.nowPlaying && (
                    <a href="#where-to-watch" className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#222]">
                      <Icon name="cinema" size={13} /> In cinemas now
                    </a>
                  )}
                  {film.badge && <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#222]">{film.badge}</span>}
                </div>
              )}
              <h1 className="text-[34px] leading-[1.05] font-bold tracking-[-1px] md:text-[48px]">{film.title}</h1>
              <p className="text-[15px] text-white/85">{meta}</p>
              {!pending && (
                <p className="flex flex-wrap items-center justify-center gap-x-2 text-[15px] md:justify-start">
                  <span className="flex items-center gap-1 font-semibold">
                    <StarGlyph size={15} />
                    {film.avgRating?.toFixed(1) ?? "New"}
                  </span>
                  <span className="text-white/60">·</span>
                  <a href="#reviews" className="font-semibold underline underline-offset-4">
                    {plural(film.reviewCount, "review")}
                  </a>
                  <span className="text-white/60">·</span>
                  <span className="text-white/85">{plural(film.ratingCount, "rating")}</span>
                  {film.platform && (
                    <>
                      <span className="text-white/60">·</span>
                      <span className="text-white/85">Streaming on {film.platform}</span>
                    </>
                  )}
                </p>
              )}
              {film.trailerKey && (
                <Link href={trailerHref(film.slug)} className={buttonClass("white", "lg", "mt-3 gap-2.5 pr-6 pl-2")}>
                  <span className="play-pulse relative flex size-9 items-center justify-center rounded-full bg-cta text-white">
                    <Icon name="play" size={15} fill="currentColor" stroke="none" className="translate-x-px" />
                  </span>
                  Watch trailer
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-[minmax(0,1fr)_360px] md:px-8">
        <div className="min-w-0">
          {pending && (
            <p role="status" className="mt-2 rounded-xl bg-star/15 px-4 py-3 text-[14px] font-medium">
              {film.status === "pending"
                ? "Only you can see this page. It goes live once our moderators approve it (usually within 24 hours)."
                : "This upload wasn't approved by our moderators."}
            </p>
          )}

          {film.uploader && (
            <div className="flex items-center gap-4 py-6">
              <Avatar name={film.uploader.name} color={film.uploader.avatarColor} size={48} />
              <div>
                <p className="text-[16px] font-semibold">
                  Poster shared by{" "}
                  <Link href={`/u/${film.uploader.username}`} className="underline-offset-4 hover:underline">
                    {film.uploader.name}
                  </Link>
                </p>
                <p className="text-[14px] text-sub">
                  @{film.uploader.username} · {timeAgo(film.createdAt)}
                </p>
              </div>
            </div>
          )}

          {film.trailerKey && (
            <Section title="Trailer" className={cn(!film.uploader && "border-t-0")}>
              <TrailerCard
                slug={film.slug}
                videoKey={film.trailerKey}
                title={film.trailerName ?? `${film.title} trailer`}
                subtitle="Video details, play here or on YouTube"
              />
            </Section>
          )}

          <Section title="About this film" className={cn(!film.uploader && !film.trailerKey && "border-t-0")}>
            {film.synopsis && <p className="text-[16px] leading-relaxed">{film.synopsis}</p>}
            <dl className="grid gap-4 sm:grid-cols-2">
              {film.director && (
                <div>
                  <dt className="text-[14px] text-sub">Director</dt>
                  <dd className="text-[15px] font-semibold">
                    {directorCredits.length ? (
                      directorCredits.map((d, i) => (
                        <span key={d.slug}>
                          {i > 0 && " & "}
                          <Link href={`/people/${d.slug}`} className="underline-offset-4 hover:underline">
                            {d.name}
                          </Link>
                        </span>
                      ))
                    ) : (
                      <Link href={`/discover?q=${encodeURIComponent(film.director)}`} className="hover:underline">
                        {film.director}
                      </Link>
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-[14px] text-sub">Industry</dt>
                <dd className="text-[15px] font-semibold">{film.industry}</dd>
              </div>
            </dl>
            {castCredits.length > 0 ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-[14px] text-sub">Starring · tap a name for their profile, YouTube and socials</h3>
                <ul className="scrollbar-none -mx-5 flex gap-4 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0" aria-label="Cast">
                  {castCredits.map((c) => (
                    <li key={c.slug} className="w-[92px] shrink-0">
                      <Link href={`/people/${c.slug}`} className="group flex flex-col items-center gap-2 text-center">
                        <span className="transition duration-300 group-hover:-translate-y-1 group-hover:scale-105">
                          <PersonPhoto name={c.name} photoUrl={c.photoUrl} size={72} className="shadow-card" />
                        </span>
                        <span className="line-clamp-2 text-[13.5px] leading-tight font-semibold group-hover:underline">{c.name}</span>
                        {c.character && <span className="line-clamp-1 text-[12px] text-sub">{c.character}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : film.cast.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-[14px] text-sub">Starring</h3>
                <ul className="flex flex-wrap gap-2" aria-label="Cast">
                  {film.cast.map((name) => (
                    <li key={name}>
                      <Link
                        href={`/discover?q=${encodeURIComponent(name)}`}
                        className="flex items-center gap-2 rounded-full border border-card-line py-1 pr-3.5 pl-1 text-[14px] font-medium hover:border-ink"
                      >
                        <Avatar name={name} color="#6a6a6a" size={28} />
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          {!pending && (
            <>
              <Section title={<span id="where-to-watch" className="scroll-mt-28">Where to watch</span>}>
                <WhereToWatch film={film} cinemas={cinemaList} />
              </Section>

              <Section
                title={
                  <span className="flex items-center gap-2">
                    <StarGlyph size={20} /> {film.avgRating?.toFixed(1) ?? "–"} · {plural(film.ratingCount, "rating")}
                  </span>
                }
              >
                <RatingBars rows={film.distribution} className="max-w-md" />
              </Section>

              {canReview && (
                <Section className="md:hidden">
                  <QuickRate filmId={film.id} slug={film.slug} score={film.viewer?.score ?? null} signedIn={Boolean(user)} />
                </Section>
              )}

              <Section
                title={
                  <span id="reviews" className="flex scroll-mt-28 flex-wrap items-center justify-between gap-3">
                    <span>{plural(film.reviewCount, "review")}</span>
                    <nav aria-label="Sort reviews" className="flex gap-2 text-[14px] font-medium">
                      {(["helpful", "recent"] as const).map((key) => (
                        <Link
                          key={key}
                          href={key === "helpful" ? `/films/${film.slug}#reviews` : `/films/${film.slug}?sort=recent#reviews`}
                          scroll={false}
                          aria-current={sort === key ? "true" : undefined}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5",
                            sort === key ? "border-ink bg-ink text-page" : "border-card-line hover:border-ink",
                          )}
                        >
                          {key === "helpful" ? "Most helpful" : "Newest"}
                        </Link>
                      ))}
                    </nav>
                  </span>
                }
              >
                {!film.allowReviews ? (
                  <EmptyState title="Reviews are turned off" body="The uploader chose not to allow ratings and reviews for this film." />
                ) : reviews.length ? (
                  <div className="grid gap-x-12 gap-y-10 pt-2 lg:grid-cols-2">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} signedIn={Boolean(user)} bare />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No reviews yet" body="Be the first to tell other fans what you thought." />
                )}
              </Section>
            </>
          )}
          {film.posterUrl?.includes("image.tmdb.org") && <TmdbCredit className="border-t border-line py-6" />}
        </div>

        {canReview && (
          <aside aria-label="Rate this film" className="hidden md:block">
            <div className="sticky top-28 mt-8 flex flex-col gap-5 rounded-2xl border border-line p-6 shadow-lift">
              <p className="flex items-baseline gap-2">
                <span className="text-[26px] font-bold">{film.avgRating?.toFixed(1) ?? "–"}</span>
                <span className="text-[15px] text-sub">/ 5 · {plural(film.ratingCount, "rating")}</span>
              </p>
              <div className="rounded-xl border border-card-line p-3.5">
                <QuickRate filmId={film.id} slug={film.slug} score={film.viewer?.score ?? null} signedIn={Boolean(user)} />
              </div>
              <Link href={`/films/${film.slug}/review`} className={buttonClass("primary", "lg", "w-full")}>
                <Icon name="pen" size={18} /> {reviewLabel}
              </Link>
              <p className="text-center text-[13px] text-sub">Reviews are public and can be edited any time.</p>
            </div>
          </aside>
        )}
      </div>

      {canReview && (
        <div className="fixed inset-x-0 bottom-[calc(66px+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-4 border-t border-line bg-page px-5 py-3 md:hidden">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[15px] font-semibold">
              <StarGlyph size={13} /> {film.avgRating?.toFixed(1) ?? "New"}
              <span className="font-normal text-sub">· {plural(film.ratingCount, "rating")}</span>
            </p>
            <p className="truncate text-[13px] text-sub">
              {film.viewer?.score ? `You rated it ${film.viewer.score} of 5` : "Seen it? Share your take"}
            </p>
          </div>
          <Link href={`/films/${film.slug}/review`} className={buttonClass("primary", "md", "shrink-0")}>
            {reviewLabel}
          </Link>
        </div>
      )}
    </main>
  );
}
