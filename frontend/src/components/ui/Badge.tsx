import { cn } from "../../lib/cn";

export function Badge({
  children,
  tone = "neutral"
}: {
  children: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-muted text-soft",
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    danger: "bg-red-500/15 text-red-700 dark:text-red-300",
    info: "bg-brand-500/15 text-brand-700 dark:text-brand-300"
  };

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
