import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("glass-panel min-w-0 rounded-2xl border border-border p-5", className)}
      {...props}
    />
  );
}
