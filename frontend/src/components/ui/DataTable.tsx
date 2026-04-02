import type { Key, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  mobileCard
}: {
  columns: Array<Column<T>>;
  rows: T[];
  getRowKey?: (item: T, index: number) => Key;
  mobileCard?: (item: T) => ReactNode;
}) {
  return (
    <>
      {mobileCard ? (
        <div className="grid gap-3 md:hidden">
          {rows.length ? (
            rows.map((row, index) => (
              <div key={getRowKey?.(row, index) ?? index}>{mobileCard(row)}</div>
            ))
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-soft">
              Aucune donnée à afficher.
            </div>
          )}
        </div>
      ) : null}

      <div className={cn("overflow-hidden rounded-2xl border border-border", mobileCard && "hidden md:block")}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-strong">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-normal px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-soft"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {rows.map((row, index) => (
                <tr key={getRowKey?.(row, index) ?? index} className="align-top">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "whitespace-normal break-words px-4 py-3 text-sm text-app",
                        column.className
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
