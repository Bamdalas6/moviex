import { cn } from "@/lib/utils";

/** Class recipes shared by <button>, <Link> and <a>, so every control looks the same whatever element it is. */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "glass" | "white" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[transform,background-color,filter] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-cta text-white hover:brightness-110",
  secondary: "bg-field text-ink hover:brightness-95",
  outline: "border border-ink bg-card text-ink hover:bg-field",
  ghost: "text-ink underline-offset-4 hover:bg-field",
  /** Translucent, for use over photos and blurred backdrops. */
  glass: "border border-white/40 bg-white/15 text-white backdrop-blur-md hover:bg-white/25",
  white: "bg-white text-[#222222] hover:bg-white/90",
  danger: "bg-field text-accent hover:brightness-95",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

/** Round icon button. `outline` is the white circle with a hairline border used in page headers. */
export function iconButtonClass(variant: "outline" | "glass" | "field" | "plain" = "outline", className?: string) {
  return cn(
    "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition active:scale-95",
    variant === "outline" && "border border-card-line bg-card text-ink shadow-card hover:shadow-lift",
    variant === "glass" && "border border-white/40 bg-black/20 text-white backdrop-blur-md hover:bg-black/30",
    variant === "field" && "bg-field text-ink hover:brightness-95",
    variant === "plain" && "text-sub hover:bg-field",
    className,
  );
}

/** Filter pill: outlined when off, solid ink when on. */
export function chipClass(selected: boolean, className?: string) {
  return cn(
    "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition",
    selected ? "border-ink bg-ink text-page" : "border-card-line bg-card text-ink hover:border-ink",
    className,
  );
}

export const cardClass = "rounded-2xl border border-line bg-card";
export const inputClass =
  "h-14 w-full rounded-xl border border-card-line bg-card px-4 text-[15px] text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink aria-[invalid=true]:border-accent aria-[invalid=true]:ring-accent";
