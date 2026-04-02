import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { api } from "../../lib/api";

type Profile = {
  data: {
    firstName: string;
    lastName: string;
    professionalEmail?: string | null;
    jobTitle?: string | null;
    phone?: string | null;
    regionLabel?: string | null;
    cityLabel?: string | null;
  };
};

export function PersonalProfilePage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["personal-profile"],
    queryFn: () => api<Profile>("/users/me/profile")
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    professionalEmail: "",
    jobTitle: "",
    phone: "",
    regionLabel: "",
    cityLabel: ""
  });

  useEffect(() => {
    if (profileQuery.data?.data) {
      setForm({
        firstName: profileQuery.data.data.firstName,
        lastName: profileQuery.data.data.lastName,
        professionalEmail: profileQuery.data.data.professionalEmail ?? "",
        jobTitle: profileQuery.data.data.jobTitle ?? "",
        phone: profileQuery.data.data.phone ?? "",
        regionLabel: profileQuery.data.data.regionLabel ?? "",
        cityLabel: profileQuery.data.data.cityLabel ?? ""
      });
    }
  }, [profileQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      api("/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify(form)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
    }
  });

  return (
    <Card className="max-w-3xl">
      <h2 className="text-lg font-semibold">Mes informations personnelles</h2>
      <p className="text-sm text-soft">Mise à jour des données locales de profil.</p>
      <form
        className="mt-4 grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <Input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} placeholder="Prénom" />
        <Input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} placeholder="Nom" />
        <Input value={form.professionalEmail} onChange={(event) => setForm((current) => ({ ...current, professionalEmail: event.target.value }))} placeholder="E-mail professionnel" />
        <Input value={form.jobTitle} onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))} placeholder="Poste" />
        <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Téléphone" />
        <Input value={form.regionLabel} onChange={(event) => setForm((current) => ({ ...current, regionLabel: event.target.value }))} placeholder="Région UFCV" />
        <Input value={form.cityLabel} onChange={(event) => setForm((current) => ({ ...current, cityLabel: event.target.value }))} placeholder="Ville UFCV" />
        <div className="md:col-span-2">
          <Button type="submit" disabled={mutation.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  );
}
