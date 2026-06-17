import { Router } from "express";
import {
  applyMercadoPagoPayment,
  type MercadoPagoPaymentInput
} from "../database.js";
import {
  getMercadoPagoPayment,
  validateMercadoPagoWebhookSignature
} from "../mercadoPago.js";

export const mercadoPagoRouter = Router();

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] || "");
  }

  return typeof value === "string" ? value : "";
}

function getWebhookType(body: unknown, query: Record<string, unknown>) {
  const payload = body as { type?: unknown; topic?: unknown };
  return (
    (typeof payload.type === "string" && payload.type) ||
    (typeof payload.topic === "string" && payload.topic) ||
    firstQueryValue(query.type) ||
    firstQueryValue(query.topic)
  );
}

function getWebhookDataId(body: unknown, query: Record<string, unknown>) {
  const payload = body as {
    id?: unknown;
    data?: {
      id?: unknown;
    };
  };

  return (
    (typeof payload.data?.id === "string" && payload.data.id) ||
    (typeof payload.data?.id === "number" && String(payload.data.id)) ||
    firstQueryValue(query["data.id"]) ||
    firstQueryValue(query.id) ||
    (typeof payload.id === "string" && payload.id) ||
    (typeof payload.id === "number" && String(payload.id)) ||
    ""
  );
}

function paymentToInput(payment: Awaited<ReturnType<typeof getMercadoPagoPayment>>) {
  const amount = Number(payment.transaction_amount || 0);

  return {
    id: String(payment.id),
    status: payment.status,
    statusDetail: payment.status_detail || "",
    externalReference: payment.external_reference || "",
    amountCents: Math.round(amount * 100),
    currencyId: payment.currency_id || ""
  } satisfies MercadoPagoPaymentInput;
}

async function applyPaymentById(paymentId: string) {
  const payment = await getMercadoPagoPayment(paymentId);

  if (!payment.external_reference) {
    throw new Error("Pagamento sem referência de pedido.");
  }

  return applyMercadoPagoPayment(paymentToInput(payment));
}

mercadoPagoRouter.post("/webhook", async (req, res, next) => {
  const type = getWebhookType(req.body, req.query);
  const dataId = getWebhookDataId(req.body, req.query);

  if (type !== "payment") {
    return res.sendStatus(200);
  }

  const isValidSignature = validateMercadoPagoWebhookSignature({
    xSignature: req.headers["x-signature"],
    xRequestId: req.headers["x-request-id"],
    dataId
  });

  if (!isValidSignature) {
    return res.sendStatus(401);
  }

  if (!dataId) {
    return res.status(400).json({ message: "Pagamento nÃ£o informado." });
  }

  try {
    await applyPaymentById(dataId);
    return res.sendStatus(200);
  } catch (error) {
    return next(error);
  }
});

mercadoPagoRouter.post("/payments/:id/sync", async (req, res, next) => {
  const paymentId = req.params.id;

  if (!/^\d+$/.test(paymentId)) {
    return res.status(400).json({ message: "Pagamento inválido." });
  }

  try {
    const order = await applyPaymentById(paymentId);
    return res.json({ order });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("sem referência")) {
        return res.status(400).json({ message: error.message });
      }

      if (error.message.includes("não encontrada")) {
        return res.status(404).json({ message: error.message });
      }
    }

    return next(error);
  }
});
