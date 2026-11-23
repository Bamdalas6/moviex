import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { YouTubeMark } from "@/components/film/youtube-mark";
import type { SocialLink, SocialNetwork } from "@/lib/socials";
import { cn, pickByKey, plural } from "@/lib/utils";
import type { ChannelCard as Channel, PersonCard as Person } from "@/server/queries/people";

/** Simple monochrome glyphs (24×24) for the social buttons; YouTube uses its red play badge. */
const GLYPHS: Record<Exclude<SocialNetwork, "youtube">, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </>
  ),
  x: <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />,
  tiktok: <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.8 2.4 4.5 5 4.6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  facebook: <path d="M14.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4A21 21 0 0 0 15.2 4.3c-2.4 0-3.9 1.4-3.9 4v2.2H8.7v3h2.6V21z" fill="currentColor" />,
  website: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5M12 3.5C9.5 6.1 8.5 8.9 8.5 12s1 5.9 3.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </>
  ),
  imdb: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M6.5 9.5v5M9.5 14.5v-5l1.5 3 1.5-3v5M15 9.5v5h1a2.5 2.5 0 0 0 0-5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  wikipedia: <path d="M3 6h4M10 6h4M17 6h4M5 6l4 12 3-8 3 8 4-12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
};

export function SocialGlyph({ network, size = 20 }: { network: SocialNetwork; size?: number }) {
  if (network === "youtube") return <YouTubeMark size={size + 2} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      {GLYPHS[network]}
    </svg>
  );
}

/** Grid of public profile links (open in a new tab). */
export function SocialButtons({ links, className }: { links: SocialLink[]; className?: string }) {
  return (
    <ul className={cn("grid gap-2.5 sm:grid-cols-2", className)}>
      {links.map((l) => (
        <li key={l.network}>
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ripple group flex items-center gap-3 rounded-xl border border-card-line px-4 py-3 transition hover:-translate-y-px hover:border-ink hover:shadow-card"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-field">
              <SocialGlyph network={l.network} size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{l.label}</span>
              <span className="block truncate text-[13px] text-sub">{l.detail}</span>
            </span>
            <Icon name="external" size={15} className="text-sub transition group-hover:text-ink" />
          </a>
        </li>
      ))}
    </ul>
  );
}

const AVATAR_COLORS = ["#E0565B", "#2F80ED", "#16A34A", "#9B51E0", "#F2994A", "#0EA5E9", "#D946EF", "#14B8A6"];

/** Round photo. People without one are left out of lists, so there is never an initials stand-in. */
export function PersonPhoto({ photoUrl, size, className }: { name: string; photoUrl: string | null; size: number; className?: string }) {
  if (!photoUrl) return null;
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-full bg-field", className)} style={{ width: size, height: size }}>
      <Image src={photoUrl} alt="" fill unoptimized sizes={`${size}px`} className="object-cover object-top" />
    </span>
  );
}

export function PersonCard({ person, className }: { person: Person; className?: string }) {
  return (
    <Link
      href={`/people/${person.slug}`}
      data-reveal
      title={person.name}
      className={cn("group flex min-w-0 flex-col items-center gap-2.5 rounded-2xl p-2 text-center transition hover:bg-field/70 sm:p-3", className)}
    >
      <span className="transition duration-300 group-hover:-translate-y-1 group-hover:scale-105">
        <PersonPhoto name={person.name} photoUrl={person.photoUrl} size={88} className="shadow-card ring-2 ring-page" />
      </span>
      {/* w-full keeps long names inside the card: they wrap onto a second line instead of spilling into the neighbour. */}
      <span className="w-full min-w-0">
        <span className="line-clamp-2 text-[13.5px] leading-snug font-semibold [overflow-wrap:anywhere] group-hover:underline sm:text-[14px]">
          {person.name}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-sub sm:text-[12.5px]">
          {person.role} · {plural(person.filmCount, "film")}
        </span>
      </span>
    </Link>
  );
}

/** Wide search result for a person: photo, who they are, and their social accounts at a glance. */
export function PersonResult({ person }: { person: Person }) {
  return (
    <Link
      href={`/people/${person.slug}`}
      data-reveal="left"
      className="group flex items-center gap-4 rounded-2xl border border-card-line p-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-card"
    >
      <PersonPhoto name={person.name} photoUrl={person.photoUrl} size={64} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[17px] font-bold group-hover:underline">{person.name}</span>
        <span className="block truncate text-[13.5px] text-sub">{person.headline ?? person.role}</span>
        <span className="mt-1 block text-[13px] font-medium">
          {plural(person.filmCount, "film")} on Watch Nollywood
          {person.socialCount > 0 && <span className="text-sub"> · {plural(person.socialCount, "social account")}</span>}
        </span>
      </span>
      <Icon name="chevronRight" size={18} strokeWidth={2.2} className="text-sub transition group-hover:translate-x-0.5" />
    </Link>
  );
}

const KIND_LABEL: Record<Channel["kind"], string> = {
  network: "Full movies",
  creator: "Creator channel",
  studio: "Studio",
  trailers: "Trailers",
};

/** A channel's own profile picture; the YouTube logo when it has none. */
export function ChannelAvatar({ channel, size, className }: { channel: Pick<Channel, "avatarUrl">; size: number; className?: string }) {
  return (
    <span
      className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-card", className)}
      style={{ width: size, height: size }}
    >
      {channel.avatarUrl ? (
        <Image src={channel.avatarUrl} alt="" fill unoptimized sizes={`${size}px`} className="object-cover" />
      ) : (
        <YouTubeMark size={Math.round(size * 0.5)} />
      )}
    </span>
  );
}

/** YouTube channel card: opens the channel page, with a direct "Open on YouTube" link. */
export function ChannelCard({ channel, className }: { channel: Channel; className?: string }) {
  return (
    <article data-reveal="scale" className={cn("group relative flex flex-col overflow-hidden rounded-2xl border border-card-line bg-card transition hover:-translate-y-1 hover:shadow-lift", className)}>
      <div className="relative aspect-[16/7] overflow-hidden bg-[#1a1a1a]">
        {channel.sampleTrailerKey ? (
          <Image
            src={`https://i.ytimg.com/vi/${channel.sampleTrailerKey}/hqdefault.jpg`}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 380px, 90vw"
            className="object-cover opacity-80 transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: `radial-gradient(circle at 20% 20%, ${pickByKey(AVATAR_COLORS, channel.name)}, #111 70%)` }}
          />
        )}
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute bottom-3 left-3 flex items-center gap-2.5">
          <ChannelAvatar channel={channel} size={44} />
          <YouTubeMark size={22} />
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[11.5px] font-semibold text-white backdrop-blur-sm">
          {KIND_LABEL[channel.kind]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-[16px] leading-snug font-bold">
          <Link href={`/channels/${channel.slug}`} className="after:absolute after:inset-0 hover:underline">
            {channel.name}
          </Link>
        </h3>
        <p className="text-[13px] text-sub">
          {[channel.language, channel.filmCount ? plural(channel.filmCount, "film") + " on Watch Nollywood" : null].filter(Boolean).join(" · ") || "YouTube"}
        </p>
        {channel.description && <p className="line-clamp-2 text-[14px] leading-relaxed">{channel.description}</p>}
        <a
          href={channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 mt-auto flex items-center gap-1.5 self-start pt-2 text-[14px] font-semibold underline-offset-4 hover:underline"
        >
          Open on YouTube <Icon name="external" size={14} />
        </a>
      </div>
    </article>
  );
}
