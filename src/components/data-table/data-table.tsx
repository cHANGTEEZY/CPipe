import * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  OnChangeFn,
  Row,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { cn } from "@/lib/utils";

interface FacetedFilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FacetedFilter {
  column: string;
  title: string;
  options: FacetedFilterOption[];
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: keyof TData | (keyof TData)[];
  searchPlaceholder?: string;
  facetedFilters?: FacetedFilter[];
  pageSize?: number;
  pageSizeOptions?: number[];
  loading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  facetedFilters,
  pageSize = 10,
  pageSizeOptions,
  loading,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [globalFilter, setGlobalFilter] = React.useState("");

  const searchKeyRef = React.useRef(searchKey);
  searchKeyRef.current = searchKey;

  // Explicitly handle state updates to ensure stability and proper re-renders
  const handleColumnVisibilityChange: OnChangeFn<VisibilityState> = (
    updater,
  ) => {
    setColumnVisibility((prev) =>
      typeof updater === "function" ? updater(prev) : updater,
    );
  };

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (
    updater,
  ) => {
    setColumnFilters((prev) =>
      typeof updater === "function" ? updater(prev) : updater,
    );
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting((prev) =>
      typeof updater === "function" ? updater(prev) : updater,
    );
  };

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    setPagination((prev) =>
      typeof updater === "function" ? updater(prev) : updater,
    );
  };

  // eslint-disable-next-line
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onPaginationChange: handlePaginationChange,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: React.useCallback(
      (row: Row<TData>, _columnId: string, filterValue: string) => {
        const keys = searchKeyRef.current;
        if (!keys || !filterValue) return true;
        const keyArr = Array.isArray(keys) ? keys : [keys];
        const searchLower = filterValue.toLowerCase();
        return keyArr.some((key) => {
          const value = row.original[key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchLower);
        });
      },
      [],
    ),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const rows = table.getRowModel().rows;
  const rowCount = rows.length;

  /** Fade/slide-in once on first non-empty paint; pagination and updates stay still. */
  const [rowIntroDone, setRowIntroDone] = React.useState(false);
  React.useEffect(() => {
    if (rowIntroDone || rowCount === 0) return;
    const staggerCap = 10;
    const staggerMs = 22;
    const durationMs = 200;
    const maxStagger = Math.min(rowCount - 1, staggerCap) * staggerMs;
    const t = window.setTimeout(() => {
      setRowIntroDone(true);
    }, durationMs + maxStagger + 24);
    return () => clearTimeout(t);
  }, [rowCount, rowIntroDone]);

  const stickyEndCell = (isHeader: boolean) =>
    cn(
      // Idle: solid page bg so scrolled cells don't show through. Hover: same blend as overlaying muted/50 on background (not transparent-muted over arbitrary layers).
      "sticky right-0 min-w-[4.5rem] md:min-w-[6rem] transition-colors [background-color:var(--background)]",
      isHeader
        ? "z-30"
        : "z-20 group-data-[state=selected]:bg-muted group-hover:[background-color:color-mix(in_oklab,var(--muted)_50%,var(--background))]",
    );

  return (
    <div className="space-y-4">
      {/* Pass states explicitly to ensure child components re-render when state changes */}
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        facetedFilters={facetedFilters}
        columnFilters={columnFilters}
        columnVisibility={columnVisibility}
        globalFilter={globalFilter}
      />
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <Table wrapperClassName="overflow-visible">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        header.column.columnDef.meta?.sticky === "end" &&
                          stickyEndCell(true),
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rowCount ? (
                rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "group",
                      !rowIntroDone &&
                        "animate-in fade-in-0 slide-in-from-bottom-1 duration-200 fill-mode-[backwards]",
                    )}
                    style={
                      !rowIntroDone
                        ? {
                            animationDelay: `${Math.min(index, 10) * 22}ms`,
                          }
                        : undefined
                    }
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.columnDef.meta?.sticky === "end" &&
                            stickyEndCell(false),
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                        Loading...
                      </div>
                    ) : (
                      "No results."
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination
        key={`pagination-${pagination.pageIndex}-${pagination.pageSize}`}
        table={table}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}
