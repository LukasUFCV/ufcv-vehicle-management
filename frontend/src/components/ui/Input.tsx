import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "glass-control w-full rounded-xl border border-border px-3 py-2.5 text-sm text-app placeholder:text-soft",
        className
      )}
      {...props}
    />
  );
}
