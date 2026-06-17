import {
  applyMercadoPagoPayment,
  listGiftOrders,
  type GiftOrderRecord,
  type MercadoPagoPaymentInput
} from "./database.js";
import {
  isMercadoPagoConfigured,
  searchMercadoPagoPaymentsByExternalReference,
  type MercadoPagoPayment
} from "./mercadoPago.js";

const syncIntervalMs = 15_000;
let lastSyncAt = 0;
let activeSync: Promise<GiftPaymentSyncResult> | null = null;

type GiftPaymentSyncResult = {
  checked: number;
  synced: number;
};

function paymentToInput(payment: MercadoPagoPayment): MercadoPagoPaymentInput | null {
  if (!payment.external_reference) {
    return null;
  }

  const amount = Number(payment.transaction_amount || 0);

  return {
    id: String(payment.id),
    status: payment.status,
    statusDetail: payment.status_detail || "",
    externalReference: payment.external_reference,
    amountCents: Math.round(amount * 100),
    currencyId: payment.currency_id || ""
  };
}

function bestPayment(payments: MercadoPagoPayment[]) {
  return (
    payments.find((payment) => payment.status === "approved") ||
    payments.find((payment) =>
      ["rejected", "cancelled", "refunded", "charged_back"].includes(
        payment.status
      )
    ) ||
    payments[0]
  );
}

function shouldSyncOrder(order: GiftOrderRecord) {
  return (
    (order.status === "reserved" || order.status === "checkout_pending") &&
    Boolean(order.preferenceId || order.externalReference)
  );
}

async function runPendingPaymentSync(limit: number): Promise<GiftPaymentSyncResult> {
  if (!isMercadoPagoConfigured()) {
    return { checked: 0, synced: 0 };
  }

  const orders = (await listGiftOrders()).filter(shouldSyncOrder).slice(0, limit);
  let synced = 0;

  for (const order of orders) {
    try {
      const payments = await searchMercadoPagoPaymentsByExternalReference(
        order.externalReference
      );
      const payment = bestPayment(payments);
      const input = payment ? paymentToInput(payment) : null;

      if (!input) {
        continue;
      }

      await applyMercadoPagoPayment(input);
      synced += 1;
    } catch (error) {
      console.warn(
        `Não foi possível sincronizar a ordem de presente ${order.id}.`,
        error
      );
    }
  }

  return { checked: orders.length, synced };
}

export async function syncPendingMercadoPagoOrders({
  force = false,
  limit = 8
}: {
  force?: boolean;
  limit?: number;
} = {}) {
  const now = Date.now();

  if (!force && now - lastSyncAt < syncIntervalMs) {
    return { checked: 0, synced: 0 };
  }

  if (activeSync) {
    return activeSync;
  }

  activeSync = runPendingPaymentSync(limit).finally(() => {
    lastSyncAt = Date.now();
    activeSync = null;
  });

  return activeSync;
}
