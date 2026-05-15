import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 50],
}: DataTablePaginationProps<TData>) {
  // Access state from table.getState()
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          {totalRows > 0 ? (
            <>
              Showing {pageIndex * pageSize + 1}
              &ndash;
              {Math.min((pageIndex + 1) * pageSize, totalRows)} of {totalRows}
            </>
          ) : (
            "Showing 0 of 0"
          )}
        </p>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          Rows per page:
          <select
            className="rounded border bg-background px-2 py-1 text-sm cursor-pointer  "
            value={pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            table.setPageIndex(0);
          }}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            table.previousPage();
          }}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 px-2">
          {getPageNumbers(pageIndex, pageCount).map((p, i) =>
            p === "..." ? (
              <span key={`ell-${i}`} className="px-1 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={`${p}-${i}`}
                type="button"
                variant={pageIndex === p ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 text-sm cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  table.setPageIndex(p as number);
                }}
              >
                {(p as number) + 1}
              </Button>
            ),
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            table.nextPage();
          }}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4 cursor-pointer" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            table.setPageIndex(pageCount - 1);
          }}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="h-4 w-4 cursor-pointer" />
        </Button>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages: (number | "...")[] = [0];
  if (current > 3) pages.push("...");

  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 3) pages.push("...");
  pages.push(total - 1);

  return pages;
}
