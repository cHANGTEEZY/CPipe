import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/data-table";
import { Badge } from "@/lib/badge";
import type { User } from "./constants";

export type UserTableActions = {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
};

export function createUserColumns(
  actions: UserTableActions,
): ColumnDef<User>[] {
  return [
    {
      id: "firstName",
      accessorKey: "firstName",
      enableHiding: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img
            src={row.original.avatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
          />
          <div>
            <p className="font-medium">
              {row.original.firstName} {row.original.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              @{row.original.username}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue("email")}</span>
      ),
      enableHiding: true,
    },
    {
      id: "phone",
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue("phone")}</span>
      ),
      enableHiding: true,
    },
    {
      id: "role",
      accessorKey: "role",
      enableColumnFilter: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => <Badge label={row.getValue("role")} variant="role" />,
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: "status",
      accessorKey: "status",
      enableColumnFilter: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge label={row.getValue("status")} variant="status" />
      ),
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: "joinDate",
      accessorKey: "joinDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("joinDate")}
        </span>
      ),
      enableHiding: true,
    },
    {
      id: "actions",
      meta: { sticky: "end" },
      enableHiding: false,
      enableSorting: false,
      header: ({ column }) => (
        <div className="flex w-full justify-end">
          <DataTableColumnHeader column={column} title="Actions" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DataTableRowActions
            onEdit={() => actions.onEdit(row.original)}
            onDelete={() => actions.onDelete(row.original)}
            confirmTitle="Remove user?"
            confirmDescription={
              <>
                This will remove{" "}
                <span className="font-medium text-foreground">
                  {row.original.firstName} {row.original.lastName}
                </span>{" "}
                from the list.
              </>
            }
          />
        </div>
      ),
    },
  ];
}
