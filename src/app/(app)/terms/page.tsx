import type { Metadata } from "next";
import { PageShell, PageTitle, TmdbCredit } from "@/components/layout/page";
import { cardClass } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Terms & privacy" };

export default function TermsPage() {
  return (
    <PageShell>
      <PageTitle title="Terms & privacy" subtitle="The short version of how Marquee works" />
      <article className={`${cardClass} flex flex-col gap-4 p-6 text-[15px] leading-relaxed`}>
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-extrabold">Community rules</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Only upload posters and artwork you have the right to share.</li>
            <li>Review films, not people. Harassment and hate speech are removed.</li>
            <li>Mark spoilers so other fans can choose whether to read them.</li>
            <li>Every upload is checked by a moderator before it is published.</li>
          </ul>
        </section>
        <section id="privacy" className="flex scroll-mt-24 flex-col gap-2">
          <h2 className="text-lg font-extrabold">Privacy</h2>
          <p>
            We store your name, username, email and the ratings, reviews and uploads you make. Your password is stored only as
            a salted scrypt hash. We use a single essential cookie to keep you signed in and one to remember your theme. We
            don&apos;t sell your data or use third-party trackers.
          </p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Film data</h2>
          <TmdbCredit className="text-[15px]" />
          <p className="text-[15px]">Streaming availability is provided by JustWatch via TMDB. Cinema showtimes are set by each cinema.</p>
        </section>
        <p className="text-sm text-sub">[YOUR COMPANY NAME] · [CONTACT EMAIL] — replace these before launch.</p>
      </article>
    </PageShell>
  );
}
