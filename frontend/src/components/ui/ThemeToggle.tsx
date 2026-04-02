import { Moon, MonitorCog, Sun } from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";
import { cn } from "../../lib/cn";
import type { ThemePreference } from "../../theme/theme.utils";

type ThemeToggleProps = {
  className?: string;
  buttonClassName?: string;
  showLabels?: boolean;
  stretch?: boolean;
  onSelect?: (value: ThemePreference) => void;
};

export function ThemeToggle({
  className,
  buttonClassName,
  showLabels = false,
  stretch = false,
  onSelect
}: ThemeToggleProps) {
  const { preference, setPreference } = useTheme();

  const options = [
    { value: "light", label: "Clair", icon: Sun },
    { value: "dark", label: "Sombre", icon: Moon },
    { value: "auto", label: "Auto", icon: MonitorCog }
  ] as const;

  return (
    <div className={cn("glass-control flex flex-wrap rounded-xl border border-border p-1", className)}>
      {options.map((option) => {
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setPreference(option.value);
              onSelect?.(option.value);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition",
              stretch && "flex-1 justify-center",
              preference === option.value
                ? "bg-brand-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                : "text-soft hover:bg-white/55 hover:text-app dark:hover:bg-white/5",
              buttonClassName
            )}
            aria-label={`Activer le thème ${option.label.toLowerCase()}`}
          >
            <Icon className="h-4 w-4" />
            <span className={cn(showLabels ? "inline" : "hidden sm:inline")}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
