import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "glass-control w-full rounded-xl border border-border px-3 py-2.5 text-sm text-app",
        className
      )}
      {...props}
    />
  );
}
