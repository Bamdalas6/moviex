import Link from "next/link";
import { GENRE_ICONS, Icon } from "@/components/icons";
import { GENRES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Icon category strip (genre filter). The active item is underlined; the rest
 * are muted until hovered. Scrolls sideways when it doesn't fit.
 */
export function CategoryBar({ active, hrefFor, className }: { active?: string; hrefFor: (genre?: string) => string; className?: string }) {
  const items = [{ label: "All", icon: "grid" as const, value: undefined }, ...GENRES.map((g) => ({ label: g, icon: GENRE_ICONS[g]!, value: g }))];

  return (
    <nav aria-label="Genres" className={cn("scrollbar-none -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0", className)}>
      <ul className="flex min-w-max gap-7 md:gap-9">
        {items.map((item) => {
          const on = item.value === active;
          return (
            <li key={item.label}>
              <Link
                href={hrefFor(item.value)}
                aria-current={on ? "true" : undefined}
                scroll={false}
                className={cn(
                  "flex flex-col items-center gap-1.5 border-b-2 pt-1 pb-2.5 text-[12px] font-semibold transition",
                  on ? "border-ink text-ink" : "border-transparent text-sub hover:border-card-line hover:text-ink",
                )}
              >
                <Icon name={item.icon} size={24} strokeWidth={1.6} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
