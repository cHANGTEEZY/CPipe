import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table";
import { createUserColumns } from "./data/columns";
import { ROLES, STATUSES, type User } from "./data/constants";
import { generateUsers } from "./data/generate-users";

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>(() => generateUsers(150));

  const columns = useMemo(
    () =>
      createUserColumns({
        onEdit: (user) => {
          toast.info("Edit user", {
            description: `${user.firstName} ${user.lastName} (${user.email})`,
          });
        },
        onDelete: (user) => {
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          toast.success("User removed", {
            description: `${user.firstName} ${user.lastName} was deleted.`,
          });
        },
      }),
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage user accounts and permissions.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKey={["firstName", "lastName", "email"]}
        searchPlaceholder="Search by name, email..."
        pageSize={10}
        facetedFilters={[
          {
            column: "role",
            title: "Role",
            options: ROLES.map((r) => ({ label: r, value: r })),
          },
          {
            column: "status",
            title: "Status",
            options: STATUSES.map((s) => ({ label: s, value: s })),
          },
        ]}
      />
    </div>
  );
};

export default UsersPage;
