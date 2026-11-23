import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

/**
 * The login / sign-up card: app icon, a centred title and one line of copy,
 * then the form. Solid (frosted at the edges) so it stands clear of the
 * moving poster wall behind it.
 */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main
      id="main"
      className="relative w-full max-w-[440px] self-start rounded-[28px] bg-card/95 px-6 pt-8 pb-7 shadow-[0_40px_120px_rgb(0_0_0/0.7),0_0_0_1px_rgb(255_255_255/0.08)] backdrop-blur-2xl md:self-auto md:px-9 md:pt-10 md:pb-9"
    >
      {/* Soft brand glow and a light top edge: the card catches the light. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px -z-10 rounded-[29px] opacity-80 blur-2xl"
        style={{ background: "radial-gradient(60% 50% at 50% 0%, rgb(75 99 255 / 0.45), transparent 70%)" }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="flex flex-col items-center text-center">
        <span
          className="flex size-14 items-center justify-center rounded-[18px] text-white shadow-[0_10px_28px_rgb(29_60_245/0.45)]"
          style={{ background: "linear-gradient(150deg, #5b74ff 0%, #1d3cf5 55%, #0f22b8 100%)" }}
        >
          <Icon name="ticket" size={28} strokeWidth={2.3} />
        </span>
        <h1 className="mt-5 text-[26px] leading-tight font-bold tracking-[-0.6px]">{title}</h1>
        <p className="mt-1.5 max-w-[320px] text-[15px] leading-relaxed text-sub">{subtitle}</p>
      </div>

      <div className="mt-7 flex flex-col gap-5">{children}</div>
    </main>
  );
}
