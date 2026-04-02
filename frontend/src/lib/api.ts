export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(json.message ?? "Une erreur est survenue.", response.status, json);
  }

  return json as T;
}

export async function uploadFile<T>(path: string, body: FormData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(json.message ?? "Téléversement impossible.", response.status, json);
  }

  return json as T;
}
