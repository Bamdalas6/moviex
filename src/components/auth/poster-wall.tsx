import Image from "next/image";
import type { RunwayPoster } from "@/components/onboarding/welcome-experience";
import { cn } from "@/lib/utils";

/** Columns on the widest screens; narrower screens hide the outer ones (see `hidden` below). */
const COLUMNS = 7;
const PER_COLUMN = 8;

/**
 * Login / sign-up backdrop: columns of real posters drifting up and down at
 * different speeds, tilted slightly and dimmed so the form stays readable.
 * Pure CSS (each column holds its posters twice and moves by one copy per
 * loop), so it costs no JavaScript; reduced motion keeps it still.
 */
export function PosterWall({ posters }: { posters: RunwayPoster[] }) {
  if (!posters.length) return null;
  const columns = Array.from({ length: COLUMNS }, (_, c) =>
    Array.from({ length: PER_COLUMN }, (_, i) => posters[(c * 5 + i * 3) % posters.length]!),
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="absolute -inset-x-[10%] -inset-y-[20%] flex -rotate-6 justify-center gap-3 md:gap-4">
        {columns.map((column, c) => (
          <div
            key={c}
            // Phones show 3 columns, tablets 5, desktops all 7.
            className={cn("w-[34vw] shrink-0 md:w-[20vw] lg:w-[15vw]", (c === 0 || c === 6) && "hidden lg:block", (c === 1 || c === 5) && "hidden md:block")}
          >
            <div
              className={c % 2 ? "wall-down" : "wall-up"}
              style={{ "--wall-speed": `${60 + ((c * 17) % 5) * 9}s` } as React.CSSProperties}
            >
              {[...column, ...column].map((p, i) => (
                <div key={i} className="relative mb-3 aspect-[2/3] overflow-hidden rounded-2xl bg-white/5 md:mb-4">
                  <Image src={p.src} alt="" fill unoptimized sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Fade the wall so the card pops: near-black where the card sits, posters showing through at the edges. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(42% 60% at 50% 50%, rgb(0 0 0 / 0.93), rgb(0 0 0 / 0.8) 60%, rgb(0 0 0 / 0.66)), radial-gradient(40% 30% at 50% 0%, rgb(255 119 0 / 0.16), transparent)",
        }}
      />
    </div>
  );
}
