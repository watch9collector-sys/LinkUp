"use client";

import { useState, type ReactNode } from "react";
import { inputClass, labelClass, textareaClass } from "./styles";

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  children?: ReactNode;
};

export function FormField({ id, label, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

type TextInputProps = {
  id: string;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ id, label, className = "", ...rest }: TextInputProps) {
  return (
    <FormField id={id} label={label}>
      <input id={id} className={[inputClass, className].join(" ")} {...rest} />
    </FormField>
  );
}

type PasswordInputProps = {
  id: string;
  label: string;
  labelAccessory?: ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({
  id,
  label,
  labelAccessory,
  className = "",
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {labelAccessory}
      </div>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={[inputClass, "mt-0 pr-11", className].join(" ")}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 touch-manipulation items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          <EyeIcon hidden={!visible} />
        </button>
      </div>
    </div>
  );
}

type TextAreaFieldProps = {
  id: string;
  label: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({
  id,
  label,
  className = "",
  ...rest
}: TextAreaFieldProps) {
  return (
    <FormField id={id} label={label}>
      <textarea
        id={id}
        className={[textareaClass, className].join(" ")}
        {...rest}
      />
    </FormField>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({
  id,
  label,
  className = "",
  children,
  ...rest
}: SelectFieldProps) {
  return (
    <FormField id={id} label={label}>
      <select
        id={id}
        className={[inputClass, className].join(" ")}
        {...rest}
      >
        {children}
      </select>
    </FormField>
  );
}
