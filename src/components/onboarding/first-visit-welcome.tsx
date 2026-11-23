"use client";

import { useState } from "react";
import { WelcomeExperience, type RunwayPoster } from "./welcome-experience";

/**
 * The onboarding as a dialog over Home, for a signed-out visitor's first
 * visit (Home decides that from a cookie). "Just browsing" or Escape reveals
 * Home underneath; the cookie it sets keeps it from showing again.
 */
export function FirstVisitWelcome({ posters }: { posters: RunwayPoster[] }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return <WelcomeExperience posters={posters} onBrowse={() => setOpen(false)} />;
}
