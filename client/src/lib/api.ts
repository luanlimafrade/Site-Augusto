import type {
  GiftGroupPayload,
  GiftGroupRecord,
  GiftCheckoutRecord,
  GiftOrderRecord,
  GiftPaymentSyncRecord,
  GiftPayload,
  GiftRecord,
  RsvpPayload,
  RsvpRecord,
  RsvpStats
} from "../types";

const configuredUrl = import.meta.env.VITE_API_URL as string | undefined;
const baseUrl = configuredUrl?.replace(/\/$/, "") || "";

export function mediaUrl(path: string) {
  if (path.startsWith("/uploads/")) {
    return `${baseUrl}${path}`;
  }

  return path;
}

type ApiOptions = RequestInit & {
  token?: string | null;
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

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
  listGifts: () => request<{ groups: GiftGroupRecord[] }>("/gifts"),
  createGiftCheckout: (id: number) =>
    request<GiftCheckoutRecord>(`/gifts/${id}/checkout`, {
      method: "POST"
    }),
  syncGiftPayment: (paymentId: string) =>
    request<GiftPaymentSyncRecord>(
      `/mercado-pago/payments/${encodeURIComponent(paymentId)}/sync`,
      {
        method: "POST"
      }
    ),
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
  createGiftGroup: (token: string, payload: GiftGroupPayload) =>
    request<{ group: GiftGroupRecord }>("/gifts/groups", {
      method: "POST",
      token,
      body: JSON.stringify(payload)
    }),
  updateGiftGroup: (id: number, token: string, payload: GiftGroupPayload) =>
    request<{ group: GiftGroupRecord }>(`/gifts/groups/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload)
    }),
  deleteGiftGroup: (id: number, token: string) =>
    request<{ message: string }>(`/gifts/groups/${id}`, {
      method: "DELETE",
      token
    }),
  createGift: (token: string, payload: GiftPayload) =>
    request<{ gift: GiftRecord }>("/gifts", {
      method: "POST",
      token,
      body: JSON.stringify(payload)
    }),
  updateGift: (id: number, token: string, payload: GiftPayload) =>
    request<{ gift: GiftRecord }>(`/gifts/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload)
    }),
  deleteGift: (id: number, token: string) =>
    request<{ message: string }>(`/gifts/${id}`, {
      method: "DELETE",
      token
    }),
  listGiftOrders: (token: string) =>
    request<{ orders: GiftOrderRecord[] }>("/gifts/orders", { token }),
  releaseGiftOrder: (id: number, token: string) =>
    request<{ order: GiftOrderRecord }>(`/gifts/orders/${id}/release`, {
      method: "POST",
      token
    }),
  uploadGiftImage: async (token: string, file: File) =>
    request<{ imageUrl: string }>("/gifts/images", {
      method: "POST",
      token,
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        dataUrl: await fileToDataUrl(file)
      })
    }),
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
