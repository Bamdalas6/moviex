import Link from "next/link";
import { YouTubeMark } from "@/components/film/youtube-mark";
import { Icon } from "@/components/icons";
import { plural } from "@/lib/utils";
import type { PersonCard } from "@/server/queries/people";
import { PersonPhoto, SocialGlyph } from "./people-ui";

/**
 * "Top result" for a search that names a person: shown right under the search
 * box, so their profile, YouTube and socials appear as soon as you search.
 */
export function TopPerson({ person }: { person: PersonCard }) {
  const youtube = person.socials.find((s) => s.network === "youtube");
  const others = person.socials.filter((s) => s.network !== "youtube").slice(0, 4);
  const firstName = person.name.split(" ")[0];
  const ytSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${person.name} full movie`)}`;

  return (
    <section
      aria-label={`${person.name}, top result`}
      className="animate-trailer-in flex max-w-2xl flex-col gap-4 rounded-2xl border border-white/20 bg-black/35 p-4 backdrop-blur-xl sm:flex-row sm:items-center"
    >
      <Link href={`/people/${person.slug}`} className="group flex min-w-0 flex-1 items-center gap-4">
        <PersonPhoto name={person.name} photoUrl={person.photoUrl} size={72} className="ring-2 ring-white/30" />
        <span className="min-w-0">
          <span className="block text-[11.5px] font-semibold tracking-wide text-white/70 uppercase">Top result · {person.role}</span>
          <span className="block truncate text-[19px] font-bold group-hover:underline">{person.name}</span>
          <span className="block truncate text-[13.5px] text-white/80">
            {person.headline ? `${person.headline.charAt(0).toUpperCase()}${person.headline.slice(1)}` : plural(person.filmCount, "film")}
          </span>
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={youtube?.url ?? ytSearch}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={youtube ? `${person.name} on YouTube` : `Find ${person.name}'s movies on YouTube`}
          className="flex h-10 items-center gap-2 rounded-full bg-white px-3.5 text-[13.5px] font-semibold text-[#222] transition hover:-translate-y-px"
        >
          <YouTubeMark size={18} /> {youtube ? "Channel" : `${firstName} on YouTube`}
        </a>
        {others.map((s) => (
          <a
            key={s.network}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${person.name} on ${s.label}`}
            title={`${s.label}: ${s.detail}`}
            className="flex size-10 items-center justify-center rounded-full border border-white/30 bg-white/10 transition hover:-translate-y-px hover:bg-white/25"
          >
            <SocialGlyph network={s.network} size={17} />
          </a>
        ))}
        <Link href={`/people/${person.slug}`} aria-label={`Open ${person.name}'s profile`} className="flex size-10 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30">
          <Icon name="chevronRight" size={18} strokeWidth={2.4} />
        </Link>
      </div>
    </section>
  );
}
