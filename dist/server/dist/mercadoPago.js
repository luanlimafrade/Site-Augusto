import crypto from "node:crypto";
import { config } from "./config.js";
const mercadoPagoApiBaseUrl = "https://api.mercadopago.com";
function getAccessToken() {
    if (!config.mercadoPago.accessToken) {
        throw new Error("Configure MERCADO_PAGO_ACCESS_TOKEN para ativar o checkout.");
    }
    return config.mercadoPago.accessToken;
}
export function isMercadoPagoConfigured() {
    return Boolean(config.mercadoPago.accessToken);
}
function siteUrl() {
    return config.siteUrl.replace(/\/$/, "");
}
function isPublicHttpsUrl(value) {
    return value.startsWith("https://") && !value.includes("localhost");
}
async function mercadoPagoRequest(path, options = {}) {
    const response = await fetch(`${mercadoPagoApiBaseUrl}${path}`, {
        method: options.method || "GET",
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            "Content-Type": "application/json"
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const payload = (await response.json().catch(() => ({})));
    if (!response.ok) {
        const detail = payload.cause?.[0]?.description ||
            payload.cause?.[0]?.message ||
            payload.message ||
            payload.error ||
            "NÃ£o foi possÃ­vel comunicar com o Mercado Pago.";
        throw new Error(detail);
    }
    return payload;
}
function toUnitPrice(cents) {
    return Number((cents / 100).toFixed(2));
}
function preferenceExpiration(order) {
    const now = new Date();
    const fallbackExpiration = new Date(now.getTime() + config.checkoutReservationMinutes * 60 * 1000);
    return {
        from: now.toISOString(),
        to: order.reservedUntil || fallbackExpiration.toISOString()
    };
}
export async function createMercadoPagoPreference(order) {
    const baseUrl = siteUrl();
    const isHttps = isPublicHttpsUrl(baseUrl);
    const expiration = preferenceExpiration(order);
    const useSandboxUrl = getAccessToken().startsWith("TEST-");
    const body = {
        items: [
            {
                id: String(order.giftId),
                title: order.giftName,
                description: order.groupName,
                quantity: 1,
                currency_id: "BRL",
                unit_price: toUnitPrice(order.amountCents)
            }
        ],
        external_reference: order.externalReference,
        metadata: {
            gift_order_id: order.id,
            gift_id: order.giftId
        },
        expires: true,
        expiration_date_from: expiration.from,
        expiration_date_to: expiration.to
    };
    if (isHttps) {
        body.back_urls = {
            success: `${baseUrl}/presentes/retorno?resultado=success`,
            failure: `${baseUrl}/presentes/retorno?resultado=failure`,
            pending: `${baseUrl}/presentes/retorno?resultado=pending`
        };
        body.auto_return = "approved";
        body.notification_url = `${baseUrl}/api/mercado-pago/webhook`;
    }
    const preference = await mercadoPagoRequest("/checkout/preferences", {
        method: "POST",
        body
    });
    const checkoutUrl = (useSandboxUrl ? preference.sandbox_init_point : preference.init_point) ||
        preference.init_point ||
        preference.sandbox_init_point ||
        "";
    if (!preference.id || !checkoutUrl) {
        throw new Error("Mercado Pago nÃ£o retornou um link de checkout vÃ¡lido.");
    }
    return {
        preferenceId: preference.id,
        checkoutUrl
    };
}
export async function getMercadoPagoPayment(paymentId) {
    return mercadoPagoRequest(`/v1/payments/${encodeURIComponent(paymentId)}`);
}
export async function searchMercadoPagoPaymentsByExternalReference(externalReference) {
    const params = new URLSearchParams({
        external_reference: externalReference,
        sort: "date_created",
        criteria: "desc"
    });
    const payload = await mercadoPagoRequest(`/v1/payments/search?${params.toString()}`);
    return (payload.results || []).filter((payment) => payment.external_reference === externalReference);
}
function parseSignatureHeader(value) {
    return Object.fromEntries(value.split(",").map((part) => {
        const [key, ...rest] = part.split("=");
        return [key.trim(), rest.join("=").trim()];
    }));
}
function timingSafeEqual(left, right) {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");
    return (leftBuffer.length === rightBuffer.length &&
        crypto.timingSafeEqual(leftBuffer, rightBuffer));
}
export function validateMercadoPagoWebhookSignature(input) {
    if (!config.mercadoPago.webhookSecret) {
        return true;
    }
    const xSignature = Array.isArray(input.xSignature)
        ? input.xSignature[0]
        : input.xSignature;
    const xRequestId = Array.isArray(input.xRequestId)
        ? input.xRequestId[0]
        : input.xRequestId;
    if (!xSignature || !xRequestId || !input.dataId) {
        return false;
    }
    const signatureParts = parseSignatureHeader(xSignature);
    const timestamp = signatureParts.ts;
    const signature = signatureParts.v1;
    if (!timestamp || !signature) {
        return false;
    }
    const manifest = `id:${input.dataId};request-id:${xRequestId};ts:${timestamp};`;
    const expected = crypto
        .createHmac("sha256", config.mercadoPago.webhookSecret)
        .update(manifest)
        .digest("hex");
    return timingSafeEqual(expected, signature);
}
