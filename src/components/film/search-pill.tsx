import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** The big rounded search field. A plain GET form, so it works without JavaScript and results are linkable. */
export function SearchPill({
  defaultValue,
  keep = {},
  className,
}: {
  defaultValue?: string;
  /** Filters to carry along with the new query. */
  keep?: Record<string, string | undefined>;
  className?: string;
}) {
  return (
    <form
      action="/discover"
      role="search"
      className={cn(
        "flex h-14 items-center gap-3 rounded-full border border-card-line bg-card pr-2 pl-5 text-ink shadow-[0_3px_12px_rgb(0_0_0/0.1)] transition focus-within:shadow-lift",
        className,
      )}
    >
      {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <Icon name="search" size={18} strokeWidth={2.4} className="shrink-0" />
      <label className="flex min-w-0 flex-1 flex-col">
        <span className="text-[12px] leading-tight font-semibold">Search Watch Nollywood</span>
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Films, actors, YouTube channels"
          className="min-w-0 bg-transparent text-[14px] leading-tight outline-none"
        />
      </label>
      <button type="submit" aria-label="Search" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cta text-white">
        <Icon name="search" size={16} strokeWidth={2.6} />
      </button>
    </form>
  );
}
