"use client";

import { useEffect } from "react";
import { buttonClass } from "@/components/ui/styles";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Hook point for an error tracker (Sentry etc.).
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-[15px] text-sub">Please try again. If it keeps happening, let us know{error.digest ? ` (ref ${error.digest})` : ""}.</p>
      <button type="button" onClick={reset} className={buttonClass("primary")}>
        Try again
      </button>
    </main>
  );
}
