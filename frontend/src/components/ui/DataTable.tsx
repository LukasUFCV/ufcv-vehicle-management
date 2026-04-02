import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows
}: {
  columns: Array<Column<T>>;
  rows: T[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-strong">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-soft"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {rows.map((row, index) => (
              <tr key={index} className="align-top">
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-4 py-3 text-sm text-app", column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
