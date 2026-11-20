import { StarGlyph } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Read-only star row. Rounds to the nearest whole star like the design. */
export function Stars({ value, size = 12, className }: { value: number; size?: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span className={cn("inline-flex gap-0.5", className)} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((k) => (
        <StarGlyph key={k} size={size} filled={k <= filled} />
      ))}
    </span>
  );
}

/** Compact "★ 4.5" pill used in lists. */
export function RatingBadge({ value, className }: { value: number | null; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-bold", className)}>
      <StarGlyph size={13} />
      {value === null ? "–" : value.toFixed(1)}
      <span className="sr-only"> out of 5</span>
    </span>
  );
}
