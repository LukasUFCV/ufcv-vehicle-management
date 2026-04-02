import { Card } from "./Card";

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="text-center">
      <p className="text-base font-semibold text-app">{title}</p>
      <p className="mt-2 text-sm text-soft">{description}</p>
    </Card>
  );
}
