import type { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Pin column to the end of the row; keeps it visible during horizontal scroll. */
    sticky?: "end";
  }
}
