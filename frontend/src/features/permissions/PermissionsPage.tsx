import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/api";

type PermissionMatrix = {
  roles: Array<{ id: string; name: string }>;
  permissions: Array<{
    id: string;
    module: string;
    action: string;
  }>;
};

type UserPermissions = {
  user: { id: string; firstName: string; lastName: string };
  directPermissions: Array<{ permissionId: string; scope: string; permission: { module: string; action: string } }>;
};

export function PermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});

  const usersQuery = useQuery({
    queryKey: ["permissions-users"],
    queryFn: () => api<PaginatedResponse<{ id: string; firstName: string; lastName: string }>>("/users?pageSize=100")
  });
  const matrixQuery = useQuery({
    queryKey: ["permissions-matrix"],
    queryFn: () => api<PermissionMatrix>("/permissions/matrix")
  });
  const userPermissionsQuery = useQuery({
    queryKey: ["user-permissions", selectedUserId],
    queryFn: () => api<UserPermissions>(`/permissions/users/${selectedUserId}`),
    enabled: Boolean(selectedUserId)
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api(`/permissions/users/${selectedUserId}`, {
        method: "PUT",
        body: JSON.stringify({
          permissions: Object.entries(draft)
            .filter(([, scope]) => scope)
            .map(([permissionId, scope]) => ({ permissionId, scope }))
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", selectedUserId] });
    }
  });

  const currentScopes = useMemo(() => {
    const map: Record<string, string> = {};
    userPermissionsQuery.data?.directPermissions.forEach((permission) => {
      map[permission.permissionId] = permission.scope;
    });
    return map;
  }, [userPermissionsQuery.data]);

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Gestion des droits</h2>
          <p className="text-sm text-soft">Permissions directes par utilisateur et scopes métier.</p>
        </div>
        <div className="w-full max-w-sm">
          <Select
            value={selectedUserId}
            onChange={(event) => {
              setSelectedUserId(event.target.value);
              setDraft({});
            }}
          >
            <option value="">Choisir un utilisateur</option>
            {usersQuery.data?.data.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {matrixQuery.data?.permissions.map((permission) => {
          const currentValue = draft[permission.id] ?? currentScopes[permission.id] ?? "";

          return (
            <div
              key={permission.id}
              className="grid gap-3 rounded-xl border border-border bg-surface-strong p-3 md:grid-cols-[1fr,220px]"
            >
              <div>
                <p className="font-medium text-app">
                  {permission.module} · {permission.action}
                </p>
              </div>
              <Select
                value={currentValue}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [permission.id]: event.target.value
                  }))
                }
                disabled={!selectedUserId}
              >
                <option value="">Aucun</option>
                <option value="ALL">Tous</option>
                <option value="ATTACHMENT">Attache</option>
                <option value="LOCATION">Emplacement</option>
                <option value="MANAGER">Responsable</option>
                <option value="SELF">Individu</option>
              </Select>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={!selectedUserId || saveMutation.isPending}>
          Enregistrer les permissions
        </Button>
      </div>
    </Card>
  );
}
