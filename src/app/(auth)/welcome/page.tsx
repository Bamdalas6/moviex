import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Poster } from "@/components/ui/poster";
import { listFilms } from "@/server/queries/films";

export const metadata: Metadata = { title: "Welcome" };

/**
 * Onboarding. Uses its own warm palette from the design (cream / near-black)
 * rather than the app's blue sky, so it reads as a distinct "front door".
 */
export default async function WelcomePage() {
  const films = await listFilms({ sort: "top", limit: 3 });
  const [mid, left, right] = [films[1] ?? films[0], films[2], films[0]];

  return (
    <main
      id="main"
      className="relative flex w-full max-w-md flex-1 flex-col overflow-hidden bg-[#fbf6f1] text-[#1b1310] md:min-h-[780px] md:flex-none md:rounded-[32px] md:shadow-lift"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 16%, rgb(226 83 31 / 0.28) 0%, transparent 52%), radial-gradient(circle at 6% 52%, rgb(19 138 94 / 0.18) 0%, transparent 46%), radial-gradient(circle at 96% 58%, rgb(194 24 91 / 0.18) 0%, transparent 46%)",
      }}
    >
      <div aria-hidden="true" className="relative mt-12 h-[300px]">
        {left && (
          <Poster film={left} showTitle className="absolute top-[22px] left-[calc(50%-273px)] h-[234px] w-[156px] -rotate-5 rounded-3xl shadow-[0_18px_40px_rgb(0_0_0/0.35)]" sizes="156px" />
        )}
        {right && (
          <Poster film={right} showTitle className="absolute top-[22px] left-[calc(50%+117px)] h-[234px] w-[156px] rotate-5 rounded-3xl shadow-[0_18px_40px_rgb(0_0_0/0.35)]" sizes="156px" />
        )}
        {mid && (
          <Poster
            film={mid}
            showTitle
            priority
            className="absolute top-0 left-[calc(50%-90px)] z-10 h-[270px] w-[180px] rounded-[28px] shadow-[0_24px_50px_rgb(0_0_0/0.4)]"
            titleClassName="inset-x-3 bottom-4 text-center text-[23px]"
            sizes="180px"
          >
            <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white">
              <Icon name="star" size={11} fill="#FFB020" stroke="none" /> Top rated
            </span>
          </Poster>
        )}
      </div>

      <div className="mt-10 flex flex-col items-center px-7 text-center">
        <span className="text-[15px] font-semibold text-[#5c514b]">Welcome to</span>
        <h1 className="mt-1 text-[46px] leading-none font-extrabold tracking-[-1.6px]">Marquee</h1>
        <p className="mt-4 max-w-[310px] text-[15.5px] leading-relaxed text-[#5c514b]">
          Discover, rate and review the best of Nollywood and African cinema. Share posters for the films you love and see what
          other fans think.
        </p>
      </div>

      <div className="mt-auto flex flex-col items-center gap-2.5 px-7 pt-10 pb-11">
        <Link
          href="/signup"
          className="flex h-[54px] w-full max-w-[300px] items-center justify-center rounded-full bg-[#1b1310] text-base font-bold text-white shadow-[0_10px_26px_rgb(0_0_0/0.2)]"
        >
          Get started
        </Link>
        <Link href="/login" className="flex h-11 items-center px-3 text-[15px] font-semibold">
          I already have an account
        </Link>
        <Link href="/" className="text-sm font-semibold text-[#5c514b] underline-offset-4 hover:underline">
          Just browsing
        </Link>
      </div>
    </main>
  );
}
