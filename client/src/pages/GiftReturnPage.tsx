import { Check, Clock, Gift, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { GiftOrderStatus } from "../types";

const returnCopy = {
  success: {
    icon: Check,
    title: "Obrigado pelo carinho",
    text:
      "Recebemos o retorno do Mercado Pago. A confirmação final acontece automaticamente assim que o pagamento for validado.",
    tone: "text-moss"
  },
  pending: {
    icon: Clock,
    title: "Pagamento em análise",
    text:
      "O Mercado Pago ainda está processando a confirmação. Assim que houver uma atualização, o presente será ajustado automaticamente.",
    tone: "text-plum"
  },
  failure: {
    icon: XCircle,
    title: "Pagamento não concluído",
    text:
      "Não foi possível concluir o pagamento. Você pode voltar para a lista e tentar novamente em instantes.",
    tone: "text-red-700"
  }
} as const;

type ReturnStatus = keyof typeof returnCopy;

function normalizeReturnStatus(params: URLSearchParams): ReturnStatus {
  const result = params.get("resultado");
  const mercadoPagoStatus =
    params.get("collection_status") || params.get("status");

  if (result === "success" || mercadoPagoStatus === "approved") {
    return "success";
  }

  if (
    result === "failure" ||
    mercadoPagoStatus === "rejected" ||
    mercadoPagoStatus === "cancelled"
  ) {
    return "failure";
  }

  return "pending";
}

function copyStatusFromOrder(status: GiftOrderStatus): ReturnStatus {
  if (status === "approved") {
    return "success";
  }

  if (status === "rejected" || status === "cancelled" || status === "expired") {
    return "failure";
  }

  return "pending";
}

export function GiftReturnPage() {
  const [params] = useSearchParams();
  const paymentId = params.get("payment_id") || params.get("collection_id");
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "synced" | "failed"
  >(paymentId ? "syncing" : "idle");
  const [returnStatus, setReturnStatus] = useState(() =>
    normalizeReturnStatus(params)
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const copy = returnCopy[returnStatus];
  const Icon = copy.icon;

  useEffect(() => {
    if (!paymentId) return;

    let isMounted = true;

    api
      .syncGiftPayment(paymentId)
      .then((result) => {
        if (!isMounted) return;

        setReturnStatus(copyStatusFromOrder(result.order.status));
        setSyncStatus("synced");
        setSyncMessage("Pagamento confirmado com segurança.");
      })
      .catch((error) => {
        if (!isMounted) return;

        setSyncStatus("failed");
        setSyncMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível confirmar o pagamento agora."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [paymentId]);

  return (
    <main className="page-shell py-24 md:py-32">
      <section className="mx-auto max-w-2xl rounded-2xl border border-moss/10 bg-white/76 p-6 text-center shadow-sm md:p-9">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-linen">
          <Icon className={copy.tone} size={28} />
        </span>
        <h1 className="mt-6 font-display text-5xl font-semibold text-moss">
          {copy.title}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-ink/64">
          {copy.text}
        </p>
        {syncStatus === "syncing" ? (
          <p className="mx-auto mt-4 max-w-lg rounded-2xl bg-linen px-4 py-3 text-sm font-semibold text-moss">
            Confirmando pagamento...
          </p>
        ) : null}
        {syncMessage ? (
          <p
            className={`mx-auto mt-4 max-w-lg rounded-2xl px-4 py-3 text-sm font-semibold ${
              syncStatus === "failed"
                ? "bg-red-50 text-red-800"
                : "bg-sage/15 text-moss"
            }`}
          >
            {syncMessage}
          </p>
        ) : null}
        <Link
          to="/presentes"
          className="focus-ring mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-moss px-5 py-2 text-sm font-semibold text-ivory"
        >
          <Gift size={17} />
          Voltar para presentes
        </Link>
      </section>
    </main>
  );
}
