"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { chipClass, inputClass } from "./styles";

export function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={id} className="text-[12.5px] font-semibold text-accent" role="alert">
      {messages[0]}
    </p>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  errors?: string[];
  hint?: ReactNode;
  aside?: ReactNode;
  prefix?: string;
  /** Shorter (48px), slightly see-through field for the login / sign-up card. */
  compact?: boolean;
};

export function TextField({ label, errors, hint, aside, prefix, compact, className, ...input }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = Boolean(errors?.length);
  const control = (
    <input
      id={id}
      aria-invalid={invalid}
      aria-describedby={invalid ? errorId : undefined}
      className={cn(inputClass, compact && "h-12 bg-card/70", prefix && "h-full border-0 bg-transparent px-0 focus:border-0 focus:ring-0", className)}
      {...input}
    />
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold">
          {label}
        </label>
        {aside}
      </div>
      {prefix ? (
        <div
          className={cn(
            "flex items-center gap-0.5 rounded-xl border border-card-line px-4 focus-within:border-ink focus-within:ring-1 focus-within:ring-ink",
            compact ? "h-12 bg-card/70" : "h-14 bg-card",
            invalid && "border-accent",
          )}
        >
          <span className="text-[15px] text-sub">{prefix}</span>
          {control}
        </div>
      ) : (
        control
      )}
      {hint && !invalid && <span className="text-[12.5px] text-sub">{hint}</span>}
      <FieldError id={errorId} messages={errors} />
    </div>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  errors?: string[];
  maxLength?: number;
  showCount?: boolean;
};

export function TextAreaField({ label, errors, showCount, maxLength, defaultValue, className, ...rest }: TextAreaProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [length, setLength] = useState(String(defaultValue ?? "").length);
  const invalid = Boolean(errors?.length);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        maxLength={maxLength}
        defaultValue={defaultValue}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(e) => setLength(e.target.value.length)}
        className={cn(
          "w-full resize-none rounded-xl border border-card-line bg-card px-4 py-3.5 text-[15px] leading-relaxed text-ink outline-none focus:border-ink focus:ring-1 focus:ring-ink aria-[invalid=true]:border-accent",
          className,
        )}
        {...rest}
      />
      <div className="flex justify-between gap-2">
        <FieldError id={errorId} messages={errors} />
        {showCount && maxLength && (
          <span className="ml-auto text-xs text-sub" aria-live="polite">
            {length} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

/** iOS-style switch backed by a real checkbox, so it submits with the form and works without JS. */
export function Switch({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 py-2.5">
      <span className="flex-1">
        <span className="block text-[15px] font-semibold">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-sub">{description}</span>}
      </span>
      <input id={id} type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative h-[30px] w-[50px] shrink-0 rounded-full bg-off transition peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-ink peer-checked:[&>span]:translate-x-5"
      >
        <span className="absolute top-[3px] left-[3px] size-6 rounded-full bg-white shadow transition-transform" />
      </span>
    </label>
  );
}

/** Multi-select chips that submit as repeated `name` values. */
export function ChipPicker({
  name,
  options,
  defaultValue = [],
  max,
  legend,
  aside,
  errors,
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string[];
  max?: number;
  legend: string;
  aside?: ReactNode;
  errors?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const errorId = useId();

  return (
    <fieldset className="flex flex-col gap-2.5" aria-describedby={errors?.length ? errorId : undefined}>
      <div className="flex items-baseline justify-between">
        <legend className="text-[13px] font-semibold">{legend}</legend>
        {aside}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option);
          const full = !on && max !== undefined && selected.length >= max;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              disabled={full}
              onClick={() => setSelected((s) => (on ? s.filter((x) => x !== option) : [...s, option]))}
              className={chipClass(on)}
            >
              {option}
            </button>
          );
        })}
      </div>
      {selected.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
      <FieldError id={errorId} messages={errors} />
    </fieldset>
  );
}

/** Single-select chips (radio semantics). */
export function ChipRadio({
  name,
  options,
  defaultValue,
  legend,
  errors,
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string;
  legend: string;
  errors?: string[];
}) {
  const errorId = useId();
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={errors?.length ? errorId : undefined}>
      <legend className="mb-2 text-[13px] font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="cursor-pointer">
            <input type="radio" name={name} value={option} defaultChecked={option === defaultValue} className="peer sr-only" />
            <span className="inline-flex h-10 items-center rounded-full border border-card-line bg-card px-4 text-sm font-medium text-ink transition hover:border-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-page peer-focus-visible:outline-2 peer-focus-visible:outline-ink">
              {option}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={errorId} messages={errors} />
    </fieldset>
  );
}

export function FormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  if (!message) return null;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "rounded-xl px-4 py-3 text-sm font-medium",
        ok ? "bg-field text-ink" : "bg-accent/10 text-accent",
      )}
    >
      {message}
    </p>
  );
}
