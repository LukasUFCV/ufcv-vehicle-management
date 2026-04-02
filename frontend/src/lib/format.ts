export function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium"
  }).format(typeof value === "string" ? new Date(value) : value);
}
