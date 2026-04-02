import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-soft shadow-slate-900/5",
        className
      )}
      {...props}
    />
  );
}
