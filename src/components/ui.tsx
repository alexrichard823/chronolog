import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";
type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger";
type PageWidth = "narrow" | "standard" | "wide";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) {
  return cx(
    "ui-button",
    `ui-button-${variant}`,
    size !== "md" && `ui-button-${size}`,
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}

export type ButtonLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}

export type CardProps = HTMLAttributes<HTMLElement> & {
  muted?: boolean;
};

export function Card({ muted = false, className, ...props }: CardProps) {
  return (
    <section
      className={cx(muted ? "ui-card-muted" : "ui-card", className)}
      {...props}
    />
  );
}

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cx(
        "ui-badge",
        variant !== "neutral" && `ui-badge-${variant}`,
        className,
      )}
      {...props}
    />
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return <input className={cx("ui-control", className)} {...props} />;
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return <select className={cx("ui-control", className)} {...props} />;
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cx("ui-control", className)} {...props} />;
}

export type FieldProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
};

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
  ...props
}: FieldProps) {
  return (
    <div className={className} {...props}>
      <label className="ui-field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="ui-field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ui-field-help">{hint}</p>
      ) : null}
    </div>
  );
}

export type PageContainerProps = HTMLAttributes<HTMLDivElement> & {
  width?: PageWidth;
};

export function PageContainer({
  width = "standard",
  className,
  ...props
}: PageContainerProps) {
  const widthClass =
    width === "narrow"
      ? "ui-page-narrow"
      : width === "wide"
        ? "ui-page-wide"
        : "ui-page";

  return <div className={cx(widthClass, className)} {...props} />;
}

export type DividerProps = HTMLAttributes<HTMLHRElement>;

export function Divider({ className, ...props }: DividerProps) {
  return <hr className={cx("ui-divider", className)} {...props} />;
}
