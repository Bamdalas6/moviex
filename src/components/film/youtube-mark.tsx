import { cn } from "@/lib/utils";

/** Small YouTube-style play badge used next to channel names and on the "Watch on YouTube" button. */
export function YouTubeMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={(size * 14) / 20} viewBox="0 0 20 14" aria-hidden="true" className={cn("shrink-0", className)}>
      <rect width="20" height="14" rx="4" fill="#FF0033" />
      <path d="M8 4v6l5.2-3z" fill="#fff" />
    </svg>
  );
}
