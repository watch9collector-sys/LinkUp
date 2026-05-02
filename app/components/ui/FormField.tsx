import type { ReactNode } from "react";
import { inputClass, labelClass, textareaClass } from "./styles";

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
