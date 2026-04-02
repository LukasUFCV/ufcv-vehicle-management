import { Moon, MonitorCog, Sun } from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider";
import { cn } from "../../lib/cn";

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  const options = [
    { value: "light", label: "Clair", icon: Sun },
    { value: "dark", label: "Sombre", icon: Moon },
    { value: "auto", label: "Auto", icon: MonitorCog }
  ] as const;

  return (
    <div className="flex rounded-xl border border-border bg-surface-strong p-1">
      {options.map((option) => {
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition",
              preference === option.value ? "bg-brand-500 text-white" : "text-soft hover:text-app"
            )}
            aria-label={`Activer le thème ${option.label.toLowerCase()}`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
