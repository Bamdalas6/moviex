import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RatingBars } from "@/components/film/film-widgets";
import { Icon, StarGlyph, type IconName } from "@/components/icons";
import { EmptyState, PageShell } from "@/components/layout/page";
import { EditProfileForm, FollowButton, ThemeSwitcher } from "@/components/profile/profile-widgets";
import { ReviewCard } from "@/components/review/review-card";
import { ShareButton } from "@/components/review/share-button";
import { Avatar } from "@/components/ui/avatar";
import { Poster } from "@/components/ui/poster";
import { buttonClass, cardClass, chipClass } from "@/components/ui/styles";
import { THEME_COOKIE, type ThemePreference } from "@/lib/constants";
import type { FilmSummary } from "@/lib/types";
import { cn, formatCompact, formatMonthYear, timeAgo } from "@/lib/utils";
import { profileTabSchema } from "@/lib/validation";
import { logout } from "@/server/actions/auth";
import { getCurrentUser } from "@/server/auth/session";
import { filmsUploadedBy } from "@/server/queries/films";
import { reviewsByUser } from "@/server/queries/reviews";
import { activityFor, getProfile, watchlistFor, type ActivityItem } from "@/server/queries/users";

type Params = Promise<{ username: string }>;
type SearchParams = Promise<{ tab?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  return profile ? { title: `${profile.name} (@${profile.username})`, description: profile.bio ?? undefined } : { title: "Profile not found" };
}

const ACTIVITY_ICONS: Record<ActivityItem["kind"], IconName> = {
  rated: "star",
  reviewed: "pen",
  uploaded: "upload",
  followed: "profile",
  saved: "bookmark",
};

const STATUS_BADGE = {
  published: { label: "Published", className: "bg-white/95 text-[#222]" },
  pending: { label: "In review", className: "bg-star text-[#1a1206]" },
  rejected: { label: "Not approved", className: "bg-accent text-white" },
} as const;

export default async function ProfilePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const viewer = await getCurrentUser();
  const profile = await getProfile(username, viewer?.id);
  if (!profile) notFound();

  const self = profile.isSelf;
  const tabs = (self ? ["uploads", "reviews", "watchlist", "activity"] : ["uploads", "reviews"]) as string[];
  const parsedTab = profileTabSchema.parse(query.tab);
  const tab = tabs.includes(parsedTab) ? parsedTab : "uploads";

  const [uploads, reviews, saved, activity] = await Promise.all([
    tab === "uploads" ? filmsUploadedBy(profile.id, self) : Promise.resolve([]),
    tab === "reviews" ? reviewsByUser(profile.id, viewer?.id) : Promise.resolve([]),
    tab === "watchlist" && self ? watchlistFor(profile.id) : Promise.resolve([]),
    tab === "activity" && self ? activityFor(profile.id) : Promise.resolve([]),
  ]);

  const theme = ((await cookies()).get(THEME_COOKIE)?.value ?? "system") as ThemePreference;

  const stats = [
    { value: profile.stats.uploads, label: "Uploads", href: "?tab=uploads" },
    { value: profile.stats.reviews, label: "Reviews", href: "?tab=reviews" },
    { value: profile.stats.followers, label: "Followers" },
    { value: profile.stats.following, label: "Following" },
  ];

  return (
    <PageShell wide>
      <div className="grid items-start gap-10 md:grid-cols-[320px_minmax(0,1fr)] md:gap-14">
        <aside className="flex flex-col gap-6 md:sticky md:top-28">
          <div className="grid grid-cols-[1fr_auto] items-center gap-6 rounded-3xl bg-card p-6 shadow-[0_6px_24px_rgb(0_0_0/0.14)]">
            <div className="flex flex-col items-center text-center">
              <Avatar name={profile.name} color={profile.avatarColor} size={104} />
              <h1 className="mt-3 text-[26px] leading-tight font-bold tracking-[-0.6px]">{profile.name}</h1>
              <p className="text-[14px] text-sub">@{profile.username}</p>
            </div>
            <dl className="flex flex-col">
              {stats.map((s, i) => {
                const body = (
                  <>
                    <dd className="text-[20px] leading-tight font-bold">{formatCompact(s.value)}</dd>
                    <dt className="text-[12px] font-medium">{s.label}</dt>
                  </>
                );
                const cls = cn("flex flex-col py-2 pr-2", i > 0 && "border-t border-line");
                return s.href ? (
                  <Link key={s.label} href={s.href} scroll={false} className={cn(cls, "hover:underline")}>
                    {body}
                  </Link>
                ) : (
                  <div key={s.label} className={cls}>
                    {body}
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="flex gap-2.5">
            {self ? (
              <>
                <a href="#edit-profile" className={buttonClass("outline", "md", "flex-1")}>
                  Edit profile
                </a>
                <Link href="/upload" className={buttonClass("primary", "md", "flex-1")}>
                  <Icon name="plus" size={16} strokeWidth={2.4} /> Share a poster
                </Link>
              </>
            ) : viewer ? (
              <FollowButton userId={profile.id} following={profile.viewerFollows} name={profile.name} />
            ) : (
              <Link href={`/login?next=/u/${profile.username}`} className={buttonClass("primary", "md", "flex-1")}>
                Follow
              </Link>
            )}
            <ShareButton path={`/u/${profile.username}`} title={`${profile.name} on Watch Nollywood`} label="Share profile" variant="outline" />
          </div>
          {self && (
            <Link href="/account/reviews" className={buttonClass("secondary", "md", "-mt-3 w-full")}>
              <Icon name="reviews" size={16} /> Manage my reviews &amp; ratings
            </Link>
          )}

          <div className="flex flex-col gap-3 text-[15px]">
            {profile.bio && <p className="leading-relaxed">{profile.bio}</p>}
            {profile.location && (
              <p className="flex items-center gap-2.5 text-sub">
                <Icon name="discover" size={18} /> Lives in {profile.location}
              </p>
            )}
            <p className="flex items-center gap-2.5 text-sub">
              <Icon name="ticket" size={18} /> On Watch Nollywood since {formatMonthYear(profile.createdAt)}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="taste" className="flex flex-col gap-4">
            <h2 id="taste" className="text-[22px] font-bold tracking-[-0.4px]">
              {self ? "Your taste" : `${profile.name.split(" ")[0]}'s taste`}
            </h2>
            {profile.favoriteGenres.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Favourite genres">
                {profile.favoriteGenres.map((g) => (
                  <li key={g}>
                    <Link href={`/discover?genre=${g}`} className={chipClass(false, "h-9")}>
                      {g}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex max-w-lg items-center gap-6">
              <div className="shrink-0">
                <p className="flex items-center gap-1.5 text-[36px] leading-none font-bold tracking-[-1px]">
                  <StarGlyph size={22} /> {profile.taste.average?.toFixed(1) ?? "–"}
                </p>
                <p className="mt-1.5 text-[13px] text-sub">Average rating {self ? "you give" : "they give"}</p>
              </div>
              <RatingBars rows={profile.taste.distribution} show="count" />
            </div>
          </section>

          {profile.topFour.length > 0 && (
            <section aria-labelledby="top4" className="flex flex-col gap-4 border-t border-line pt-8">
              <h2 id="top4" className="text-[22px] font-bold tracking-[-0.4px]">
                Top {profile.topFour.length} favourites
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {profile.topFour.map((f) => (
                  <Link key={f.id} href={`/films/${f.slug}`} className="block">
                    <Poster film={f} showTitle className="aspect-[2/3] rounded-xl" titleClassName="inset-x-2 bottom-2 text-[12px] leading-tight sm:text-sm" sizes="160px" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <nav aria-label="Profile content" className="flex gap-6 border-b border-line">
            {tabs.map((t) => (
              <Link
                key={t}
                href={`?tab=${t}`}
                scroll={false}
                aria-current={tab === t ? "page" : undefined}
                className={cn(
                  "-mb-px border-b-2 pb-3 text-[15px] capitalize transition",
                  tab === t ? "border-ink font-semibold" : "border-transparent text-sub hover:text-ink",
                )}
              >
                {t}
              </Link>
            ))}
          </nav>

      {tab === "uploads" &&
        (uploads.length ? (
          <PosterGrid films={uploads} statusFor={(f) => STATUS_BADGE[(f as (typeof uploads)[number]).status]} />
        ) : (
          <EmptyState
            title={self ? "You haven't uploaded any posters yet" : "No uploads yet"}
            action={self ? <Link href="/upload" className="font-bold text-cta">Upload a poster</Link> : undefined}
          />
        ))}

      {tab === "watchlist" &&
        (saved.length ? (
          <PosterGrid films={saved} statusFor={() => ({ label: "Watchlist", className: "bg-white/90 text-[#0b1b3a]" })} />
        ) : (
          <EmptyState title="Your watchlist is empty" body="Tap the bookmark on any film to save it for later." />
        ))}

      {tab === "reviews" && (
        <div className="flex flex-col gap-3">
          {reviews.length ? (
            reviews.map((r) => <ReviewCard key={r.id} review={r} showFilm signedIn={Boolean(viewer)} />)
          ) : (
            <EmptyState title="No reviews yet" />
          )}
        </div>
      )}

      {tab === "activity" &&
        (activity.length ? (
          <ol className={cn(cardClass, "py-1")}>
            {activity.map((a, i) => (
              <li key={`${a.kind}-${a.href}-${i}`} className={cn(i && "border-t border-line")}>
                <Link href={a.href} className="flex items-center gap-3 px-4 py-3">
                  <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-field">
                    <Icon name={ACTIVITY_ICONS[a.kind]} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{a.text}</span>
                    <span className="mt-0.5 block text-xs text-sub">{timeAgo(a.at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="No activity yet" />
        ))}

      {self && viewer && (
        <section id="settings" aria-label="Settings" className={cn(cardClass, "mt-1 scroll-mt-24 py-1.5")}>
          <div className="flex flex-col gap-2.5 px-4 py-3">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-field">
                <Icon name="moon" size={18} />
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-semibold">Appearance</p>
                <p className="mt-px text-[12.5px] text-sub">{theme === "system" ? "Matches your device" : `Always ${theme}`}</p>
              </div>
            </div>
            <ThemeSwitcher current={theme} />
          </div>

          <details id="edit-profile" className="group scroll-mt-24 border-t border-line">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-field">
                <Icon name="profile" size={18} />
              </span>
              <span className="flex-1 text-[15px] font-semibold">Edit profile</span>
              <Icon name="chevronDown" size={16} className="text-sub transition group-open:rotate-180" />
            </summary>
            <EditProfileForm
              initial={{ name: viewer.name, bio: viewer.bio, location: viewer.location, genres: viewer.favoriteGenres }}
            />
          </details>

          <div className="flex items-center gap-3 border-t border-line px-4 py-2.5">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-field">
              <Icon name="shield" size={18} />
            </span>
            <span className="flex-1 text-[15px] font-semibold">Account</span>
            <span className="truncate text-[13px] text-sub">{viewer.email}</span>
          </div>

          {viewer.role === "admin" && (
            <Link href="/admin" className="flex items-center gap-3 border-t border-line px-4 py-2.5">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-field">
                <Icon name="shieldCheck" size={18} />
              </span>
              <span className="flex-1 text-[15px] font-semibold">Moderation queue</span>
              <Icon name="chevronRight" size={16} className="text-sub" />
            </Link>
          )}

          <form action={logout} className="border-t border-line p-4">
            <button
              type="submit"
              className="ripple flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e11d48] text-[15px] font-semibold text-white shadow-[0_8px_20px_rgb(225_29_72/0.3)] transition hover:-translate-y-px hover:bg-[#be123c] active:scale-[0.98]"
            >
              <Icon name="logout" size={18} /> Sign out
            </button>
          </form>
        </section>
      )}
        </div>
      </div>
    </PageShell>
  );
}

function PosterGrid({
  films,
  statusFor,
}: {
  films: FilmSummary[];
  statusFor: (film: FilmSummary) => { label: string; className: string };
}) {
  return (
    <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      {films.map((film) => {
        const status = statusFor(film);
        return (
          <li key={film.id}>
            <Link href={`/films/${film.slug}`} aria-label={`${film.title}, ${status.label}`} className="block">
              <Poster film={film} showTitle={false} className="aspect-[2/3] rounded-xl" sizes="200px">
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-b from-transparent to-black/55" />
                {!film.posterUrl && (
                  <span className="absolute inset-x-2 bottom-9 text-[13px] leading-tight font-extrabold text-white">{film.title}</span>
                )}
                <span
                  className={cn(
                    "absolute inset-x-1.5 bottom-1.5 flex h-6 items-center justify-center rounded-full text-[11px] font-bold",
                    status.className,
                  )}
                >
                  {status.label}
                </span>
              </Poster>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
