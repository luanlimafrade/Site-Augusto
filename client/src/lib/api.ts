import type { RsvpPayload, RsvpRecord, RsvpStats } from "../types";

const configuredUrl = import.meta.env.VITE_API_URL as string | undefined;
const baseUrl = configuredUrl?.replace(/\/$/, "") || "";

type ApiOptions = RequestInit & {
  token?: string | null;
};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${baseUrl}/api${path}`, {
    ...options,
    headers
  });

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message || "Não foi possível concluir a ação.");
  }

  return payload as T;
}

export const api = {
  sendRsvp: (payload: RsvpPayload) =>
    request<{ message: string; rsvp: RsvpRecord }>("/rsvp", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (password: string) =>
    request<{ token: string }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ password })
    }),
  listRsvps: (token: string) =>
    request<{ rsvps: RsvpRecord[]; stats: RsvpStats }>("/rsvp", { token }),
  updateRsvp: (id: number, token: string, payload: RsvpPayload) =>
    request<{ rsvp: RsvpRecord }>(`/rsvp/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload)
    }),
  deleteRsvp: (id: number, token: string) =>
    request<{ message: string }>(`/rsvp/${id}`, {
      method: "DELETE",
      token
    })
};
