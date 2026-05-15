import * as React from "react";
import type {
  Table,
  Column,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/animate-ui/primitives/radix/dropdown-menu";
import { motion } from "motion/react";
import { Search, X, Columns3, Filter } from "lucide-react";
export interface FacetedFilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FacetedFilter {
  column: string;
  title: string;
  options: FacetedFilterOption[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: keyof TData | (keyof TData)[];
  searchPlaceholder?: string;
  facetedFilters?: FacetedFilter[];
  columnFilters?: ColumnFiltersState;
  columnVisibility?: VisibilityState;
  globalFilter?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
  facetedFilters,
  columnFilters,
  columnVisibility,
  globalFilter = "",
}: DataTableToolbarProps<TData>) {
  const isFiltered = (columnFilters?.length ?? 0) > 0;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchKey && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-9 text-foreground"
              value={globalFilter}
              onChange={(e) => {
                table.setGlobalFilter(e.target.value);
              }}
            />
          </div>
        )}

        {facetedFilters?.map((filter) => {
          const col = table.getColumn(filter.column);
          if (!col) return null;
          return (
            <DataTableFacetedFilter
              key={filter.column}
              column={col}
              title={filter.title}
              options={filter.options}
              columnFilters={columnFilters}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <DataTableViewOptions table={table} columnVisibility={columnVisibility} />
    </div>
  );
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  title?: string;
  options: FacetedFilterOption[];
  columnFilters?: ColumnFiltersState;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  columnFilters,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const filterValue =
    (columnFilters?.find((f) => f.id === column.id)?.value as string[]) ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed bg-background hover:bg-accent/50 transition-colors cursor-pointer  "
        >
          <Filter className="mr-2 h-4 w-4" />
          {title}
          {filterValue.length > 0 && (
            <>
              <Badge
                variant="secondary"
                className="ml-2 rounded-sm px-1 font-normal lg:hidden"
              >
                {filterValue.length}
              </Badge>
              <div className="hidden gap-1 lg:flex">
                {filterValue.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-sm px-1 font-normal"
                  >
                    {filterValue.length} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => filterValue.includes(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="ml-1 rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const isSelected = filterValue.includes(option.value);
          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={isSelected}
              onCheckedChange={() => {
                const next = isSelected
                  ? filterValue.filter((v) => v !== option.value)
                  : [...filterValue, option.value];
                column.setFilterValue(next.length > 0 ? next : undefined);
              }}
              onSelect={(e) => e.preventDefault()}
              className="gap-2"
            >
              <DropdownMenuItemIndicator
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                >
                  <motion.path
                    d="M4.5 12.75l6 6 9-13.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  />
                </motion.svg>
              </DropdownMenuItemIndicator>
              {option.icon && (
                <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              )}
              <span>{option.label}</span>
            </DropdownMenuCheckboxItem>
          );
        })}
        {filterValue.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                column.setFilterValue(undefined);
              }}
              className="justify-center text-center font-normal"
            >
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
  columnVisibility?: VisibilityState;
}

export function DataTableViewOptions<TData>({
  table,
  columnVisibility,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 bg-background hover:bg-accent/50 transition-colors cursor-pointer  "
        >
          <Columns3 className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide(),
          )
          .map((column) => {
            const isVisible = columnVisibility?.[column.id] !== false;

            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={isVisible}
                onCheckedChange={() => column.toggleVisibility(!isVisible)}
                onSelect={(e) => e.preventDefault()}
                className="gap-2 capitalize"
              >
                <DropdownMenuItemIndicator
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.path
                      d="M4.5 12.75l6 6 9-13.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    />
                  </motion.svg>
                </DropdownMenuItemIndicator>
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
