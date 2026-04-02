import { Card } from "./Card";

export function StatCard({
  title,
  value,
  hint
}: {
  title: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card className="glass-panel-strong">
      <p className="text-sm text-soft">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-app">{value}</p>
      <p className="mt-2 text-xs text-soft">{hint}</p>
    </Card>
  );
}
