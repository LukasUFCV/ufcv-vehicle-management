import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "glass-control min-h-[120px] w-full rounded-xl border border-border px-3 py-2.5 text-sm text-app placeholder:text-soft",
        className
      )}
      {...props}
    />
  );
}
