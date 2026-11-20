import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { iconButtonClass } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

/** Page body: comfortable reading width, clear of the phone tab bar. */
export function PageShell({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <main
      id="main"
      className={cn(
        "mx-auto flex w-full flex-col gap-6 px-5 pt-5 pb-28 md:px-8 md:pt-10 md:pb-16",
        wide ? "max-w-6xl" : "max-w-3xl",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] leading-tight font-bold tracking-[-0.6px] md:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-sub">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function IconLink({
  href,
  label,
  icon,
  variant = "outline",
}: {
  href: string;
  label: string;
  icon: IconName;
  variant?: "outline" | "glass" | "field";
}) {
  return (
    <Link href={href} aria-label={label} className={iconButtonClass(variant)}>
      <Icon name={icon} size={18} strokeWidth={2.2} />
    </Link>
  );
}

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "Show all",
  className,
}: {
  title: ReactNode;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-[22px] leading-tight font-bold tracking-[-0.4px]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[14px] text-sub">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-[14px] font-semibold underline underline-offset-4 hover:text-sub">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-card-line px-6 py-10 text-center">
      <p className="text-base font-semibold">{title}</p>
      {body && <p className="max-w-sm text-[15px] text-sub">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Attribution required by TMDB's API terms wherever its data or images appear. */
export function TmdbCredit({ className }: { className?: string }) {
  return (
    <p className={cn("text-[12.5px] text-sub", className)}>
      Film data and posters from{" "}
      <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
        TMDB
      </a>
      . This product uses the TMDB API but is not endorsed or certified by TMDB.
    </p>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-line", className)} />;
}
