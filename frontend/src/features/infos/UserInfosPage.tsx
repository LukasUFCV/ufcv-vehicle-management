import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/api";

type UserInfo = {
  id: string;
  label: string;
  valueText?: string | null;
  visibility: string;
  infoType: { label: string };
};

export function UserInfosPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [label, setLabel] = useState("");
  const [valueText, setValueText] = useState("");
  const [infoTypeId, setInfoTypeId] = useState("");

  const usersQuery = useQuery({
    queryKey: ["user-infos-users"],
    queryFn: () => api<PaginatedResponse<{ id: string; firstName: string; lastName: string }>>("/users?pageSize=100")
  });
  const infoTypesQuery = useQuery({
    queryKey: ["user-info-types"],
    queryFn: () => api<{ data: Array<{ id: string; label: string }> }>("/infos/types?entityType=USER")
  });
  const infosQuery = useQuery({
    queryKey: ["user-infos", selectedUserId],
    queryFn: () => api<{ data: UserInfo[] }>(`/infos/users/${selectedUserId}`),
    enabled: Boolean(selectedUserId)
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api(`/infos/users/${selectedUserId}`, {
        method: "POST",
        body: JSON.stringify({
          infoTypeId,
          label,
          valueText,
          visibility: "PRIVATE"
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-infos", selectedUserId] });
      setLabel("");
      setValueText("");
      setInfoTypeId("");
    }
  });

  const userOptions = usersQuery.data?.data ?? [];
  const infoTypeOptions = useMemo(() => infoTypesQuery.data?.data ?? [], [infoTypesQuery.data]);

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Informations utilisateurs</h2>
            <p className="text-sm text-soft">Documents, textes libres et visibilité publique ou privée.</p>
          </div>
          <Select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="max-w-sm">
            <option value="">Choisir un utilisateur</option>
            {userOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-4">
          <DataTable
            columns={[
              { key: "type", header: "Type", cell: (item: UserInfo) => item.infoType.label },
              { key: "label", header: "Libellé", cell: (item: UserInfo) => item.label },
              { key: "value", header: "Valeur", cell: (item: UserInfo) => item.valueText ?? "Document lié" },
              { key: "visibility", header: "Visibilité", cell: (item: UserInfo) => item.visibility }
            ]}
            rows={infosQuery.data?.data ?? []}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Ajouter une information</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <Select value={infoTypeId} onChange={(event) => setInfoTypeId(event.target.value)}>
            <option value="">Choisir un type</option>
            {infoTypeOptions.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </Select>
          <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Libellé" />
          <Input value={valueText} onChange={(event) => setValueText(event.target.value)} placeholder="Texte ou référence document" />
          <Button
            type="submit"
            className="w-full"
            disabled={!selectedUserId || !infoTypeId || createMutation.isPending}
          >
            Ajouter
          </Button>
        </form>
      </Card>
    </section>
  );
}
