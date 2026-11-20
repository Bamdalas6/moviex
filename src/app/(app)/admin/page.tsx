import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageShell, PageTitle } from "@/components/layout/page";
import { Poster } from "@/components/ui/poster";
import { buttonClass, cardClass } from "@/components/ui/styles";
import { cn, timeAgo } from "@/lib/utils";
import { moderateFilm } from "@/server/actions/films";
import { requireAdmin } from "@/server/auth/session";
import { pendingFilms } from "@/server/queries/films";

export const metadata: Metadata = { title: "Moderation" };

export default async function ModerationPage() {
  await requireAdmin();
  const queue = await pendingFilms();

  return (
    <PageShell>
      <PageTitle title="Moderation" subtitle={`${queue.length} ${queue.length === 1 ? "upload" : "uploads"} waiting for review`} />
      {queue.length === 0 ? (
        <EmptyState title="All caught up" body="New poster uploads will appear here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {queue.map((film) => (
            <li key={film.id} className={cn(cardClass, "flex gap-4 p-4")}>
              <Poster film={{ ...film, posterSpoiler: false }} className="h-[150px] w-[100px] shrink-0 rounded-2xl" sizes="100px" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Link href={`/films/${film.slug}`} className="text-lg font-extrabold hover:underline">
                  {film.title} <span className="font-semibold text-sub">({film.year})</span>
                </Link>
                <p className="text-[13px] text-sub">
                  {[film.genres.join(", "), film.language, film.industry].filter(Boolean).join(" · ")}
                </p>
                {film.synopsis && <p className="line-clamp-3 text-sm">{film.synopsis}</p>}
                <p className="text-xs text-sub">
                  Uploaded by @{film.uploader?.username ?? "unknown"} · {timeAgo(film.createdAt)}
                  {film.posterSpoiler && " · marked as spoiler"}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <form action={moderateFilm.bind(null, film.id, "published")}>
                    <button type="submit" className={buttonClass("primary", "sm", "shadow-none")}>
                      Approve &amp; publish
                    </button>
                  </form>
                  <form action={moderateFilm.bind(null, film.id, "rejected")}>
                    <button type="submit" className={buttonClass("danger", "sm")}>
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
