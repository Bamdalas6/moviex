"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { ChipPicker, ChipRadio, FieldError, FormMessage, Switch, TextAreaField, TextField } from "@/components/ui/form";
import { buttonClass, cardClass } from "@/components/ui/styles";
import { GENRES, INDUSTRIES, LANGUAGES, MAX_GENRES_PER_FILM, POSTER_MAX_BYTES, POSTER_MIME_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { submitFilm, type UploadState } from "@/server/actions/films";

function formatBytes(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function UploadForm() {
  const [state, action, submitting] = useActionState<UploadState, FormData>(submitFilm, {});
  const inputRef = useRef<HTMLInputElement>(null);
  // React resets uncontrolled inputs (including <input type=file>) after every form action,
  // so the chosen File lives here and is attached at submit time. A failed validation
  // therefore never makes the user pick their poster again.
  const posterRef = useRef<File | null>(null);
  const [file, setFile] = useState<{ name: string; size: number; url: string; dims?: string } | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Free the object URL when the preview changes or the form unmounts.
  const previewUrl = file?.url;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function accept(selected: File | undefined) {
    setClientError(null);
    if (!selected) return;
    if (!(POSTER_MIME_TYPES as readonly string[]).includes(selected.type)) {
      setClientError("Use a JPG, PNG or WebP image");
      return;
    }
    if (selected.size > POSTER_MAX_BYTES) {
      setClientError("Posters can be up to 5 MB");
      return;
    }
    posterRef.current = selected;
    const url = URL.createObjectURL(selected);
    const next = { name: selected.name, size: selected.size, url };
    setFile(next);
    const img = new Image();
    img.onload = () => setFile((f) => (f?.url === url ? { ...f, dims: `${img.naturalWidth} × ${img.naturalHeight}` } : f));
    img.src = url;
  }

  function clear() {
    posterRef.current = null;
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const step = state.ok ? 3 : file ? 2 : 1;
  const steps = ["Poster", "Details", "Review"];

  const progress = (
    <ol className="grid grid-cols-3 gap-2" aria-label="Upload progress">
      {steps.map((label, i) => (
        <li key={label} className="flex flex-col gap-1.5" aria-current={step === i + 1 ? "step" : undefined}>
          <span className={cn("h-1 rounded-full", i < step ? "bg-ink" : "bg-line")} />
          <span className="text-[12.5px] font-semibold">
            {i + 1}&nbsp;&nbsp;{label}
          </span>
        </li>
      ))}
    </ol>
  );

  if (state.ok && state.film) {
    return (
      <div className="flex flex-col gap-4">
        {progress}
        <div className="flex flex-col items-center gap-4 pt-2.5">
          <div className="rounded-[26px] border border-line bg-card p-2.5 shadow-lift">
            {/* eslint-disable-next-line @next/next/no-img-element -- just-uploaded file, served by our own route */}
            <img src={state.film.posterUrl ?? file?.url} alt={`${state.film.title} poster`} className="h-[236px] w-[168px] rounded-[22px] object-cover" />
          </div>
          <h1 className="text-[28px] font-bold tracking-[-0.6px]">Submitted for review</h1>
          <section aria-label="Status" className={cn(cardClass, "flex w-full flex-col gap-3.5 p-[18px]")}>
            <p className="text-[14.5px] leading-relaxed text-sub">
              We&apos;ll publish <strong className="text-ink">{state.film.title}</strong> once a moderator approves it. This usually
              takes less than 24 hours.
            </p>
            <ol className="flex flex-col gap-3">
              <StatusStep state="done" label="Uploaded" note="Just now" />
              <StatusStep state="current" label="Under review" note="In progress" />
              <StatusStep state="todo" label="Published" note="Pending" />
            </ol>
          </section>
          <Link href={`/films/${state.film.slug}`} className={buttonClass("primary", "lg", "w-full shadow-none")}>
            View your upload
          </Link>
          <button
            type="button"
            onClick={() => {
              clear();
              setFormKey((k) => k + 1);
            }}
            className={buttonClass("ghost", "md")}
          >
            Upload another poster
          </button>
        </div>
      </div>
    );
  }

  const errors = state.errors ?? {};
  const v = state.values ?? {};
  const posterError = clientError ?? errors.poster?.[0];

  return (
    <form
      key={formKey}
      action={(formData) => {
        if (posterRef.current) formData.set("poster", posterRef.current);
        return action(formData);
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      {progress}
      <div className="mt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-[-0.6px] md:text-[32px]">Share a poster</h1>
        <p className="mt-1 text-[15px] text-sub">Add a film the community can rate and review.</p>
      </div>

      <input
        ref={inputRef}
        id="poster"
        type="file"
        accept={POSTER_MIME_TYPES.join(",")}
        className="sr-only"
        aria-describedby="poster-help poster-error"
        onChange={(e) => accept(e.target.files?.[0])}
      />

      {file ? (
        <div className={cn(cardClass, "flex items-center gap-3.5 p-3")}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
          <img src={file.url} alt="Selected poster preview" className="h-[108px] w-[76px] shrink-0 rounded-[14px] object-cover" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="truncate text-[15px] font-bold">{file.name}</p>
            <p className="text-[13px] text-sub">
              {formatBytes(file.size)}
              {file.dims && ` · ${file.dims}`}
            </p>
            <span className="h-1.5 rounded-full bg-cta" />
            <p className="text-[13px] font-semibold text-sub">Ready to upload</p>
          </div>
          <button type="button" onClick={clear} aria-label="Remove poster" className="flex size-10 shrink-0 items-center justify-center self-start rounded-full bg-field">
            <Icon name="close" size={16} strokeWidth={2.4} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-card-line bg-field px-5 py-10 text-center transition",
            dragging && "border-ink bg-card",
          )}
        >
          <span aria-hidden="true" className="flex size-[60px] items-center justify-center rounded-[20px] bg-card text-cta shadow-card">
            <Icon name="upload" size={26} strokeWidth={2.2} />
          </span>
          <p className="mt-1 text-lg font-bold">Drag your poster here</p>
          <p id="poster-help" className="text-[13.5px]">
            JPG, PNG or WebP, portrait 2:3, up to 5 MB
          </p>
          <label htmlFor="poster" className={buttonClass("primary", "md", "mt-1.5 cursor-pointer shadow-none")}>
            Choose file
          </label>
        </div>
      )}
      <FieldError id="poster-error" messages={posterError ? [posterError] : undefined} />

      <section aria-labelledby="details" className={cn(cardClass, "flex flex-col gap-3.5 px-[18px] py-5")}>
        <h2 id="details" className="text-[19px] font-extrabold tracking-[-0.3px]">
          Movie details
        </h2>
        <TextField label="Title" name="title" placeholder="e.g. Iyalode" defaultValue={v.title as string} errors={errors.title} required />
        <div className="grid grid-cols-2 gap-2.5">
          <TextField label="Release year" name="year" inputMode="numeric" placeholder={String(new Date().getFullYear())} defaultValue={v.year as string} errors={errors.year} />
          <TextField label="Runtime" name="runtime" placeholder="1h 50m" defaultValue={v.runtime as string} errors={errors.runtime} />
        </div>
        <TextField label="Director" name="director" placeholder="Optional" defaultValue={v.director as string} errors={errors.director} />
        <ChipPicker
          name="genres"
          legend="Genre"
          options={GENRES}
          max={MAX_GENRES_PER_FILM}
          defaultValue={(v.genres as string[]) ?? []}
          aside={<span className="text-[12.5px] text-sub">Up to {MAX_GENRES_PER_FILM}</span>}
          errors={errors.genres}
        />
        <ChipRadio name="language" legend="Main language" options={LANGUAGES} defaultValue={(v.language as string) || "English"} errors={errors.language} />
        <ChipRadio name="industry" legend="Industry" options={INDUSTRIES} defaultValue="Nollywood" />
        <TextAreaField label="Synopsis" name="synopsis" rows={3} maxLength={600} placeholder="A short, spoiler-free summary" defaultValue={v.synopsis as string} errors={errors.synopsis} />
      </section>

      <section aria-label="Settings" className={cn(cardClass, "px-[18px] py-1.5")}>
        <Switch name="allowReviews" label="Allow ratings & reviews" description="Others can rate and review once it's published" defaultChecked />
        <div className="h-px bg-card-line" />
        <Switch name="posterSpoiler" label="Artwork contains spoilers" description="The poster is blurred until people tap it" />
      </section>

      <div className="flex items-start gap-3 rounded-xl bg-field px-4 py-3.5">
        <Icon name="shieldCheck" size={20} className="mt-px shrink-0" />
        <p className="text-[13.5px] leading-snug">
          Every upload is checked by our moderation team, usually within 24 hours, before it&apos;s published for ratings.
        </p>
      </div>

      <label className="flex items-start gap-2.5 text-[13.5px] leading-snug">
        <input type="checkbox" name="rights" className="mt-0.5 size-5 shrink-0 accent-cta" aria-describedby="rights-error" />
        <span>I confirm I have the rights to share this artwork.</span>
      </label>
      <FieldError id="rights-error" messages={errors.rights} />

      <FormMessage message={state.message} />

      <button type="submit" disabled={submitting} className={buttonClass("primary", "lg", "justify-between pr-2 pl-6")}>
        {submitting ? "Uploading…" : "Submit for review"}
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-[14px] bg-white/20">
          <Icon name="arrowRight" size={16} strokeWidth={2.6} />
        </span>
      </button>
    </form>
  );
}

function StatusStep({ state, label, note }: { state: "done" | "current" | "todo"; label: string; note: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-7 items-center justify-center rounded-full",
          state === "done" && "bg-cta text-white",
          state === "current" && "border-2 border-cta",
          state === "todo" && "border-2 border-card-line",
        )}
      >
        {state === "done" && <Icon name="check" size={14} strokeWidth={3} />}
        {state === "current" && <span className="size-2.5 rounded-full bg-cta" />}
      </span>
      <span className={cn("flex-1 text-[15px] font-semibold", state === "todo" && "text-sub")}>{label}</span>
      <span className="text-[13px] text-sub">{note}</span>
    </li>
  );
}
