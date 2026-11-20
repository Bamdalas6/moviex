import Link from "next/link";
import { buttonClass } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-8xl font-bold tracking-[-4px] text-cta">404</p>
      <h1 className="text-2xl font-bold">This scene was cut</h1>
      <p className="text-[15px] text-sub">We couldn&apos;t find the page you were looking for.</p>
      <div className="mt-2 flex gap-2.5">
        <Link href="/" className={buttonClass("primary")}>
          Back to home
        </Link>
        <Link href="/discover" className={buttonClass("outline")}>
          Discover films
        </Link>
      </div>
    </main>
  );
}
