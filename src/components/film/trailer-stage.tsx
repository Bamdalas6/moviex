"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { buttonClass } from "@/components/ui/styles";
import { YouTubeMark } from "./youtube-mark";

export type TrailerFacts = {
  videoKey: string;
  title: string;
  channel: string | null;
  channelUrl: string | null;
  typeLabel: string;
  published: string | null;
  watchUrl: string;
  filmTitle: string;
};

/**
 * Trailer page hero: the video's details first, with "Play here" (YouTube's
 * privacy-enhanced player, mounted only when asked for) and "Watch on YouTube".
 */
export function TrailerStage({ facts }: { facts: TrailerFacts }) {
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const play = () => {
    setPlaying(true);
    // On phones the details sit under the player, so bring the video into view.
    if (window.matchMedia("(max-width: 767px)").matches) {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="mt-6 grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_340px] md:gap-8">
      <div
        ref={playerRef}
        className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-[0_30px_80px_rgb(0_0_0/0.55)] ring-1 ring-white/10"
      >
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${facts.videoKey}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={facts.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="animate-trailer-in absolute inset-0 size-full"
          />
        ) : (
          <button type="button" onClick={play} aria-label={`Play ${facts.title} here`} className="group/play absolute inset-0 block size-full">
            <Image
              src={`https://i.ytimg.com/vi/${facts.videoKey}/hqdefault.jpg`}
              alt=""
              fill
              priority
              unoptimized
              sizes="(min-width: 768px) 700px, 100vw"
              className="object-cover transition duration-700 group-hover/play:scale-105 group-hover/play:brightness-75"
            />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className="play-pulse relative flex size-20 items-center justify-center rounded-full bg-white text-[#222] shadow-lift transition duration-300 group-hover/play:scale-110">
                <Icon name="play" size={30} fill="currentColor" stroke="none" className="translate-x-0.5" />
              </span>
            </span>
            <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1 text-[12.5px] font-semibold text-white backdrop-blur-sm">
              <YouTubeMark size={16} /> Tap to play here
            </span>
          </button>
        )}
      </div>

      <section aria-label="Video details" className="animate-trailer-in flex flex-col gap-4 rounded-2xl border border-white/15 bg-black/35 p-5 backdrop-blur-xl">
        <span className="self-start rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#222]">{facts.typeLabel}</span>
        <h1 className="text-[22px] leading-snug font-bold tracking-[-0.4px] md:text-[24px]">{facts.title}</h1>

        <dl className="flex flex-col gap-3 text-[14px]">
          {facts.channel && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/65">Channel</dt>
              <dd className="flex min-w-0 items-center gap-2 font-semibold">
                <YouTubeMark size={18} />
                {facts.channelUrl ? (
                  <a href={facts.channelUrl} target="_blank" rel="noopener noreferrer" className="truncate underline-offset-4 hover:underline">
                    {facts.channel}
                  </a>
                ) : (
                  <span className="truncate">{facts.channel}</span>
                )}
              </dd>
            </div>
          )}
          {facts.published && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/65">Published</dt>
              <dd className="font-semibold">{facts.published}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <dt className="text-white/65">Film</dt>
            <dd className="truncate font-semibold">{facts.filmTitle}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-white/65">Hosted on</dt>
            <dd className="font-semibold">YouTube</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2.5 pt-1">
          <button type="button" onClick={play} disabled={playing} className={buttonClass("white", "lg", "w-full gap-2 disabled:opacity-60")}>
            <Icon name="play" size={16} fill="currentColor" stroke="none" />
            {playing ? "Playing" : "Play here"}
          </button>
          <a href={facts.watchUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("glass", "lg", "w-full gap-2")}>
            <YouTubeMark size={20} /> Watch on YouTube
            <Icon name="external" size={15} className="opacity-70" />
          </a>
        </div>
        <p className="text-[12px] text-white/55">Trailer from YouTube, listed by TMDB. Opens in a new tab.</p>
      </section>
    </div>
  );
}
