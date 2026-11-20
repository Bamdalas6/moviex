import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { YouTubeMark } from "./youtube-mark";

export const trailerHref = (slug: string) => `/films/${slug}/trailer`;

/**
 * 16:9 trailer thumbnail with a pulsing play button. It opens the trailer page
 * (video details first, then play here or on YouTube), it doesn't play inline.
 */
export function TrailerCard({
  slug,
  videoKey,
  title,
  subtitle,
  className,
}: {
  slug: string;
  videoKey: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <Link href={trailerHref(slug)} className={cn("group/trailer block w-full text-left", className)}>
      <span className="relative block aspect-video overflow-hidden rounded-2xl bg-black shadow-card">
        <Image
          src={`https://i.ytimg.com/vi/${videoKey}/hqdefault.jpg`}
          alt=""
          fill
          unoptimized
          sizes="(min-width: 1024px) 360px, 80vw"
          className="object-cover transition duration-500 group-hover/trailer:scale-110 group-hover/trailer:brightness-75"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="play-pulse relative flex size-14 items-center justify-center rounded-full bg-white/95 text-[#222] shadow-lift transition duration-300 group-hover/trailer:scale-110">
            <Icon name="play" size={22} fill="currentColor" stroke="none" className="translate-x-0.5" />
          </span>
        </span>
        <span className="absolute bottom-2.5 left-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
          <YouTubeMark size={13} /> Trailer
        </span>
      </span>
      <span className="mt-2.5 block truncate text-[15px] font-semibold group-hover/trailer:underline">{title}</span>
      {subtitle && <span className="block truncate text-[13.5px] text-sub">{subtitle}</span>}
    </Link>
  );
}
