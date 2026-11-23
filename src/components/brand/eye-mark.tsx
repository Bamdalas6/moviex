/** The brand orange: the eye in the Watch Nollywood logo. */
export const EYE_ORANGE = "#FF7700";

/**
 * The eye from the Watch Nollywood logo as a crisp vector: an orange disc with a
 * white almond and an orange pupil. Used wherever the app shows its icon.
 */
export function EyeMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className={className}>
      <circle cx="20" cy="20" r="20" fill={EYE_ORANGE} />
      <ellipse cx="20" cy="20" rx="11" ry="7.2" fill="#F3F3F3" />
      <circle cx="20" cy="20" r="2.4" fill={EYE_ORANGE} />
    </svg>
  );
}

/**
 * Just the eye (almond + pupil), without the disc: drawn on an orange background
 * (the onboarding splash) it becomes the full mark. `width` is the almond's width.
 */
export function EyeGlyph({ width = 96, className }: { width?: number; className?: string }) {
  return (
    <svg viewBox="0 0 22 14.4" width={width} height={(width * 14.4) / 22} aria-hidden="true" className={className}>
      <ellipse cx="11" cy="7.2" rx="11" ry="7.2" fill="#F3F3F3" />
      <circle cx="11" cy="7.2" r="2.4" fill={EYE_ORANGE} />
    </svg>
  );
}
