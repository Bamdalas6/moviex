import Image from "next/image";
import { Icon } from "@/components/icons";
import type { CinemaBranch, FilmDetail } from "@/lib/types";

const KIND_LABELS = { stream: "Stream", rent: "Rent", buy: "Buy" } as const;

export function mapsUrl(c: Pick<CinemaBranch, "chain" | "branch" | "city" | "country">) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.chain} ${c.branch} ${c.city} ${c.country}`)}`;
}

/** Group branches under their chain, keeping the chain's website once. */
export function groupByChain(branches: CinemaBranch[]) {
  const chains = new Map<string, { website: string | null; branches: CinemaBranch[] }>();
  for (const b of branches) {
    const entry = chains.get(b.chain) ?? { website: b.website, branches: [] };
    entry.branches.push(b);
    chains.set(b.chain, entry);
  }
  return [...chains.entries()].map(([chain, v]) => ({ chain, ...v }));
}

export function CinemaChains({ cinemas }: { cinemas: CinemaBranch[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {groupByChain(cinemas).map((c) => (
        <div key={c.chain} className="flex flex-col gap-2.5 rounded-xl bg-field p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">{c.chain}</p>
            {c.website && (
              <a
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 text-[13px] font-semibold underline underline-offset-4"
              >
                Showtimes <Icon name="external" size={13} />
              </a>
            )}
          </div>
          <ul className="flex flex-col gap-1.5">
            {c.branches.map((b) => (
              <li key={b.id}>
                <a
                  href={mapsUrl(b)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[14px] text-sub hover:text-ink"
                >
                  <Icon name="pin" size={14} className="shrink-0" />
                  {b.branch === b.city ? b.city : `${b.branch}, ${b.city}`}
                  {b.country !== "Nigeria" && ` (${b.country})`}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Cinemas (for films on the now-showing list) and streaming/rental services in Nigeria. */
export function WhereToWatch({
  film,
  cinemas,
}: {
  film: Pick<FilmDetail, "title" | "nowPlaying" | "providers" | "watchLink">;
  cinemas: CinemaBranch[];
}) {
  const groups = (["stream", "rent", "buy"] as const)
    .map((kind) => ({ kind, items: film.providers.filter((p) => p.kind === kind) }))
    .filter((g) => g.items.length);

  return (
    <div className="flex flex-col gap-6">
      {film.nowPlaying && (
        <div className="flex flex-col gap-4 rounded-2xl border border-line p-5">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cta/10 text-cta">
              <Icon name="cinema" size={22} />
            </span>
            <div>
              <p className="text-[16px] font-semibold">In cinemas now</p>
              <p className="text-[14px] text-sub">
                {film.title} is on Nigeria&apos;s now-showing list. Check times and book with a cinema near you.
              </p>
            </div>
          </div>
          <CinemaChains cinemas={cinemas} />
        </div>
      )}

      {groups.map((g) => (
        <div key={g.kind} className="flex flex-col gap-3">
          <h3 className="text-[15px] font-semibold">{KIND_LABELS[g.kind]}</h3>
          <ul className="flex flex-wrap gap-2.5">
            {g.items.map((p) => (
              <li key={p.name}>
                <a
                  href={film.watchLink ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-card-line py-2 pr-4 pl-2 text-[14px] font-medium transition hover:border-ink"
                >
                  {p.logoUrl ? (
                    <Image src={p.logoUrl} alt="" width={32} height={32} unoptimized className="size-8 rounded-lg" />
                  ) : (
                    <span className="size-8 rounded-lg bg-field" />
                  )}
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {!film.nowPlaying && !groups.length && (
        <p className="text-[15px] text-sub">Not currently showing in Nigerian cinemas or available on streaming services in Nigeria.</p>
      )}

      {groups.length > 0 && (
        <p className="text-[12.5px] text-sub">
          Streaming availability for Nigeria from JustWatch via TMDB.
          {film.watchLink && (
            <>
              {" "}
              <a href={film.watchLink} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                See all options
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
