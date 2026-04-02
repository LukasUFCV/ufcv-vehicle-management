import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/api";

type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string | null;
  status: string;
  roles: string[];
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    temporaryPassword: "Demo123!",
    status: "PENDING",
    roleKeys: "USER"
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api<PaginatedResponse<UserRecord>>("/users?pageSize=50")
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api("/users", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          roleKeys: [form.roleKeys],
          locationIds: []
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        temporaryPassword: "Demo123!",
        status: "PENDING",
        roleKeys: "USER"
      });
    }
  });

  const getStatusTone = (status: UserRecord["status"]) =>
    status === "ACTIVE" ? "success" : status === "PENDING" ? "warning" : "neutral";

  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <Card>
        <h2 className="text-lg font-semibold">Utilisateurs</h2>
        <div className="mt-4">
          <DataTable
            getRowKey={(user) => user.id}
            mobileCard={(user) => (
              <Card className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-app">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="break-words text-sm text-soft">{user.email}</p>
                  </div>
                  <Badge tone={getStatusTone(user.status)}>{user.status}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-soft">Poste</p>
                    <p className="mt-1 break-words text-sm text-app">
                      {user.jobTitle ?? "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-soft">Rôles</p>
                    <p className="mt-1 break-words text-sm text-app">{user.roles.join(", ")}</p>
                  </div>
                </div>
              </Card>
            )}
            columns={[
              {
                key: "name",
                header: "Nom",
                cell: (user: UserRecord) => (
                  <div>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-soft">{user.email}</p>
                  </div>
                )
              },
              {
                key: "job",
                header: "Poste",
                cell: (user: UserRecord) => user.jobTitle ?? "Non renseigné"
              },
              {
                key: "status",
                header: "Statut",
                cell: (user: UserRecord) => (
                  <div className="space-y-2">
                    <Badge tone={getStatusTone(user.status)}>{user.status}</Badge>
                    <p className="text-xs text-soft">{user.roles.join(", ")}</p>
                  </div>
                )
              }
            ]}
            rows={usersQuery.data?.data ?? []}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Créer un compte</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <Input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} placeholder="Prénom" />
          <Input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} placeholder="Nom" />
          <Input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="E-mail" />
          <Input value={form.temporaryPassword} onChange={(event) => setForm((current) => ({ ...current, temporaryPassword: event.target.value }))} placeholder="Mot de passe temporaire" />
          <Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
            <option value="PENDING">En attente</option>
            <option value="ACTIVE">Actif</option>
          </Select>
          <Select value={form.roleKeys} onChange={(event) => setForm((current) => ({ ...current, roleKeys: event.target.value }))}>
            <option value="USER">Utilisateur courant</option>
            <option value="POTENTIAL_USER">Utilisateur potentiel</option>
            <option value="APPROVER">Approbateur</option>
            <option value="ADMIN">Administrateur</option>
          </Select>
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            Ajouter
          </Button>
        </form>
      </Card>
    </section>
  );
}
