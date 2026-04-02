import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "border border-white/10 bg-brand-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-400",
  secondary:
    "glass-control border border-border text-app hover:border-brand-300/60",
  ghost: "text-soft hover:bg-brand-500/10 hover:text-app",
  danger: "border border-white/10 bg-red-600 text-white hover:bg-red-700"
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
