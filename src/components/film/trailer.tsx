"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * YouTube trailer player in a modal <dialog>. The iframe only mounts while the
 * dialog is open (no YouTube requests until someone presses play), uses the
 * privacy-enhanced youtube-nocookie.com domain, and is torn down on close so the
 * video stops.
 */
function TrailerDialog({ videoKey, title, open, onClose }: { videoKey: string; title: string; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // click on the backdrop
      }}
      aria-label={`${title} trailer`}
      className="trailer-dialog m-auto w-[min(1100px,94vw)] overflow-visible bg-transparent p-0 text-white backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="animate-trailer-in flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="truncate text-[15px] font-semibold">{title}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close trailer"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:rotate-90 hover:bg-white/25"
            >
              <Icon name="close" size={18} strokeWidth={2.4} />
            </button>
          </div>
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-[0_30px_80px_rgb(0_0_0/0.6)] ring-1 ring-white/10">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={`${title} trailer`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 size-full"
            />
          </div>
          <p className="text-[12.5px] text-white/60">Video from YouTube · trailer listed by TMDB</p>
        </div>
      )}
    </dialog>
  );
}

/** Any element that opens the trailer when clicked. */
export function TrailerTrigger({
  videoKey,
  title,
  className,
  children,
  label,
}: {
  videoKey: string;
  title: string;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={label ?? `Play ${title} trailer`} className={className}>
        {children}
      </button>
      <TrailerDialog videoKey={videoKey} title={title} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** 16:9 trailer thumbnail card with a pulsing play button. */
export function TrailerCard({ videoKey, title, subtitle, className }: { videoKey: string; title: string; subtitle?: string; className?: string }) {
  return (
    <TrailerTrigger videoKey={videoKey} title={title} className={cn("group/trailer block w-full text-left", className)}>
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
        <span className="absolute bottom-2.5 left-3 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">Trailer</span>
      </span>
      <span className="mt-2.5 block truncate text-[15px] font-semibold group-hover/trailer:underline">{title}</span>
      {subtitle && <span className="block truncate text-[13.5px] text-sub">{subtitle}</span>}
    </TrailerTrigger>
  );
}
