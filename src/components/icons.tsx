import type { SVGProps } from "react";

/** Stroke icon set lifted from the Marquee design (24×24 grid, currentColor). */
const PATHS = {
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  discover: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM15.5 8.5l-2 5-5 2 2-5z",
  upload: "M12 16V5M7 10l5-5 5 5M5 19h14",
  reviews: "M5 5h14v10H9l-4 4z",
  profile: "M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0",
  search: "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-3.5-3.5",
  back: "M15 5l-7 7 7 7",
  chevronRight: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6L6 18",
  bookmark: "M6 4h12v17l-6-4-6 4z",
  share: "M12 4v11M7 9l5-5 5 5M5 14v6h14v-6",
  pen: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  thumb: "M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2 3l-1 3h6a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7",
  flag: "M5 21V4h11l-1.5 4L16 12H5",
  arrowUpRight: "M7 17L17 7M9 7h8v8",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  filters: "M4 7h10M18 7h2M4 17h4M12 17h8M16 5a2 2 0 1 0 0 4a2 2 0 1 0 0-4zM10 15a2 2 0 1 0 0 4a2 2 0 1 0 0-4z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  shield: "M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6z",
  shieldCheck: "M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6zM8.5 12l2.5 2.5 4.5-5",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  ticket: "M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z",
  star: "M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z",
  comment: "M5 5h14v10H9l-4 4z",
  trash: "M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  heart: "M12 20s-7.5-4.4-9.2-9.1C1.7 7.6 3.9 4.5 7.2 4.5c2 0 3.4 1.1 4.8 2.8 1.4-1.7 2.8-2.8 4.8-2.8 3.3 0 5.5 3.1 4.4 6.4C19.5 15.6 12 20 12 20z",
  chevronLeft: "M15 6l-6 6 6 6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  play: "M7 5v14l11-7z",
  // Genre category icons
  drama: "M4 5h7v6a3.5 3.5 0 0 1-7 0zM13 9h7v6a3.5 3.5 0 0 1-7 0zM6 9h.01M9 9h.01M15 13h.01M18 13h.01M6 12c.8.6 2.2.6 3 0M15.2 17c.8-.6 2-.6 2.6 0",
  comedy: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM8 14c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4M9 9.5h.01M15 9.5h.01",
  action: "M13 3L5 13.5h6L10 21l8-10.5h-6z",
  crime: "M12 3a9 9 0 0 0-9 9M12 7a5 5 0 0 0-5 5c0 3 1 5 2 7M12 11v3c0 2 .6 4 1.5 6M17 12c0 2-.3 4-1 6M21 12a9 9 0 0 0-5.5-8.3",
  thriller: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z",
  romance: "M12 20s-7.5-4.4-9.2-9.1C1.7 7.6 3.9 4.5 7.2 4.5c2 0 3.4 1.1 4.8 2.8 1.4-1.7 2.8-2.8 4.8-2.8 3.3 0 5.5 3.1 4.4 6.4C19.5 15.6 12 20 12 20z",
  epic: "M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z",
  family: "M8 4a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM17 7a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5zM2.5 20c.6-3.5 2.8-6 5.5-6s4.9 2.5 5.5 6M14 20c.4-2.6 1.6-4.5 3-4.5s2.6 1.9 3 4.5",
  fantasy: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
  horror: "M6 20V10a6 6 0 0 1 12 0v10l-2-1.5L14 20l-2-1.5L10 20l-2-1.5zM10 10.5h.01M14 10.5h.01",
  documentary: "M3 7h12v10H3zM15 10.5l6-3.5v10l-6-3.5",
  cinema: "M4 4h16v12H4zM8 20h8M12 16v4",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
} as const;

/** Category icon per genre, used by the category bar. */
export const GENRE_ICONS: Record<string, IconName> = {
  Drama: "drama",
  Comedy: "comedy",
  Action: "action",
  Crime: "crime",
  Thriller: "thriller",
  Romance: "romance",
  Epic: "epic",
  Family: "family",
  Fantasy: "fantasy",
  Horror: "horror",
  Documentary: "documentary",
};

export type IconName = keyof typeof PATHS;

type IconProps = SVGProps<SVGSVGElement> & { name: IconName; size?: number; strokeWidth?: number };

export function Icon({ name, size = 20, strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export function StarGlyph({ size = 14, filled = true, className }: { size?: number; filled?: boolean; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill={filled ? "#FFB020" : "var(--idle)"}
    >
      <path d={PATHS.star} />
    </svg>
  );
}
