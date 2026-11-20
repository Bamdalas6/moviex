import type { Metadata } from "next";
import { UploadForm } from "@/components/film/upload-form";
import { IconLink } from "@/components/layout/page";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Upload a poster" };

export default async function UploadPage() {
  await requireUser("/upload");
  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-col gap-4 px-5 pt-4 pb-28 md:pt-10 md:pb-16">
      <header className="grid grid-cols-[40px_1fr_40px] items-center border-b border-line pb-4">
        <IconLink href="/" label="Close" icon="close" />
        <span className="text-center text-[16px] font-semibold">New upload</span>
      </header>
      <UploadForm />
    </main>
  );
}
