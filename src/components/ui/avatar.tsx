import { cn, initials } from "@/lib/utils";

/** Dark text on light avatar colours, white on dark ones (keeps 4.5:1 contrast). */
function inkFor(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1A1206" : "#FFFFFF";
}

export function Avatar({
  name,
  color,
  size = 40,
  className,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold", className)}
      style={{ width: size, height: size, background: color, color: inkFor(color), fontSize: Math.round(size * 0.34) }}
    >
      {initials(name)}
    </span>
  );
}
