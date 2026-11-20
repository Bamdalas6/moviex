import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState, IconLink } from "@/components/layout/page";
import { ReviewForm } from "@/components/review/review-form";
import { Poster } from "@/components/ui/poster";
import { requireUser } from "@/server/auth/session";
import { getFilmForReview } from "@/server/queries/films";
import { getOwnRating } from "@/server/queries/reviews";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const film = await getFilmForReview((await params).slug);
  return { title: film ? `Review ${film.title}` : "Review" };
}

export default async function ReviewPage({ params }: { params: Params }) {
  const { slug } = await params;
  const user = await requireUser(`/films/${slug}/review`);
  const film = await getFilmForReview(slug);
  if (!film) notFound();

  const existing = await getOwnRating(user.id, film.id);
  const meta = [film.year, film.genres.slice(0, 2).join(", "), film.director].filter(Boolean).join(" · ");

  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-col px-5 pt-4 pb-28 md:pt-10 md:pb-16">
      <div className="grid grid-cols-[40px_1fr_40px] items-center border-b border-line pb-4">
        <IconLink href={`/films/${film.slug}`} label="Close" icon="close" />
        <h1 className="text-center text-[16px] font-semibold">{existing ? "Edit your review" : "Rate & review"}</h1>
      </div>

      <div className="flex items-center gap-4 py-6">
        <Poster film={film} showTitle={false} sizes="72px" className="aspect-[2/3] w-[72px] shrink-0 rounded-xl shadow-card" />
        <div className="min-w-0">
          <p className="text-[22px] leading-tight font-bold tracking-[-0.4px]">{film.title}</p>
          <p className="mt-1 text-[14px] text-sub">{meta}</p>
        </div>
      </div>

      <section aria-label="Your review" className="border-t border-line pt-6">
        {film.allowReviews ? (
          <ReviewForm
            filmId={film.id}
            slug={film.slug}
            existing={existing && { score: existing.score, headline: existing.headline, body: existing.body, spoiler: existing.spoiler }}
          />
        ) : (
          <EmptyState title="Reviews are turned off" body="The uploader chose not to allow ratings and reviews for this film." />
        )}
      </section>
    </main>
  );
}
