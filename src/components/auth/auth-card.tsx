import Image from "next/image";
import type { ReactNode } from "react";

/**
 * The login / sign-up card: the Watch Nollywood logo, a centred title and one line of copy,
 * then the form. Frosted glass: the moving poster wall shows through, blurred,
 * and it's compact enough that either form fits on one screen without scrolling.
 */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main
      id="main"
      className="theme-dark relative w-full max-w-[440px] rounded-[28px] bg-card/60 px-5 pt-5 pb-4 shadow-[0_40px_120px_rgb(0_0_0/0.6),0_0_0_1px_rgb(255_255_255/0.12)] backdrop-blur-2xl backdrop-saturate-150 md:max-w-[520px] md:px-8 md:pt-7 md:pb-7"
    >
      {/* Soft brand glow and a light top edge: the card catches the light. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px -z-10 rounded-[29px] opacity-80 blur-2xl"
        style={{ background: "radial-gradient(60% 50% at 50% 0%, rgb(255 119 0 / 0.35), transparent 70%)" }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="flex flex-col items-center text-center">
        <Image src="/brand/watch-nollywood-on-dark.png" alt="Watch Nollywood" width={265} height={71} priority className="h-10 w-auto md:h-11" />
        <h1 className="mt-3 text-[23px] leading-tight font-bold tracking-[-0.5px]">{title}</h1>
        <p className="mt-1 max-w-[340px] text-[14px] leading-snug text-sub [@media(max-height:700px)]:hidden">{subtitle}</p>
      </div>

      <div className="mt-4 flex flex-col gap-3.5 md:mt-5 md:gap-4">{children}</div>
    </main>
  );
}
