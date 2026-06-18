import {
  Bath,
  BedDouble,
  Check,
  ChevronRight,
  CookingPot,
  CupSoda,
  Gift,
  HeartHandshake,
  Loader2,
  LucideIcon,
  Microwave,
  Sofa
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHero } from "../components/PageHero";
import { photos } from "../data/photos";
import { siteConfig } from "../data/siteConfig";
import { api, mediaUrl } from "../lib/api";
import type { GiftGroupRecord, GiftRecord } from "../types";

const formatCurrency = (cents: number) =>
  cents > 0
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(cents / 100)
    : "Valor a definir";

const giftStatusCopy = {
  available: "Disponível",
  reserved: "Em processo de escolha",
  sold: "Presenteado"
} as const;

function categoryIcon(name: string): LucideIcon {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("eletro")) return Microwave;
  if (normalized.includes("cozinha")) return CookingPot;
  if (normalized.includes("mesa")) return CupSoda;
  if (normalized.includes("quarto")) return BedDouble;
  if (normalized.includes("banheiro")) return Bath;
  if (normalized.includes("decor")) return Sofa;

  return Gift;
}

function GiftImage({
  src,
  fit = "contain",
  position = "center center",
  className,
  imageClassName = "h-full w-full object-cover"
}: {
  src: string;
  fit?: GiftRecord["imageFit"];
  position?: string;
  className: string;
  imageClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={`block overflow-hidden bg-linen ${className}`}>
      {!failed ? (
        <img
          src={mediaUrl(src)}
          alt=""
          className={imageClassName}
          style={{ objectFit: fit, objectPosition: position }}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="grid h-full w-full place-items-center text-moss/50">
          <Gift size={26} />
        </span>
      )}
    </span>
  );
}

export function GiftsPage() {
  const [groups, setGroups] = useState<GiftGroupRecord[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const allGifts = useMemo(
    () => groups.flatMap((group) => group.gifts.map((gift) => ({ ...gift }))),
    [groups]
  );

  const selectedGift = allGifts.find((gift) => gift.id === selectedGiftId);

  const loadGifts = async (preferredGiftId?: number | null) => {
    const result = await api.listGifts();
    const visibleGroups = result.groups.filter((group) => group.gifts.length > 0);
    const nextGifts = visibleGroups.flatMap((group) => group.gifts);
    const stillExists = nextGifts.some((gift) => gift.id === preferredGiftId);

    setGroups(visibleGroups);
    setSelectedGiftId(
      stillExists ? preferredGiftId ?? null : nextGifts[0]?.id ?? null
    );
    setError(null);
  };

  useEffect(() => {
    let active = true;

    loadGifts(selectedGiftId)
      .then(() => {
        if (!active) return;
      })
      .catch((loadError) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar a lista de presentes."
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const startCheckout = async () => {
    if (!selectedGift || selectedGift.purchaseStatus === "reserved") return;

    setIsStartingCheckout(true);
    setCheckoutError(null);
    setCheckoutMessage(null);

    try {
      const result = await api.createGiftCheckout(selectedGift.id);
      setCheckoutMessage("Reserva criada. Redirecionando para o Mercado Pago.");
      await loadGifts(selectedGift.id);
      window.location.assign(result.checkoutUrl);
    } catch (checkoutIssue) {
      setCheckoutError(
        checkoutIssue instanceof Error
          ? checkoutIssue.message
          : "NÃ£o foi possÃ­vel iniciar a reserva."
      );
      await loadGifts(selectedGift.id);
    } finally {
      setIsStartingCheckout(false);
    }
  };

  return (
    <main>
      <PageHero
        eyebrow="Lista de presentes"
        title="Um carinho para o nosso novo lar"
        text={siteConfig.giftsText}
        image={photos.gifts}
      />

      <section className="page-shell py-14 md:py-20">
        {error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-moss/10 bg-white/74 p-8 text-center text-sm font-semibold text-moss shadow-sm">
            Carregando presentes...
          </div>
        ) : allGifts.length === 0 ? (
          <div className="rounded-2xl border border-moss/10 bg-white/74 p-8 text-center shadow-sm">
            <Gift className="mx-auto text-plum" size={30} />
            <h2 className="mt-4 font-display text-4xl font-semibold text-moss">
              Lista em atualização
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-ink/64">
              No momento não há presentes disponíveis para escolha.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="space-y-8">
              {groups.map((group) => {
                const Icon = categoryIcon(group.name);

                return (
                  <section
                    key={group.id}
                    aria-labelledby={`gift-group-${group.id}`}
                    className="rounded-2xl border border-moss/10 bg-white/74 p-4 shadow-sm backdrop-blur sm:p-5"
                  >
                    <div>
                      <div className="flex flex-wrap items-start gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linen text-plum">
                          <Icon size={21} />
                        </span>
                        <div>
                          <h2
                            id={`gift-group-${group.id}`}
                            className="font-display text-3xl font-semibold leading-tight text-moss sm:text-4xl"
                          >
                            {group.name}
                          </h2>
                          {group.description ? (
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/64">
                              {group.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {group.gifts.map((gift) => {
                          const isSelected = selectedGiftId === gift.id;

                          return (
                            <button
                              key={gift.id}
                              type="button"
                              onClick={() => setSelectedGiftId(gift.id)}
                              className={`focus-ring group relative flex w-full flex-col overflow-hidden rounded-xl border text-left transition ${
                                isSelected
                                  ? "border-plum/38 bg-plum/8 shadow-sm"
                                  : "border-moss/10 bg-white hover:border-moss/24 hover:bg-ivory"
                              }`}
                            >
                              <GiftImage
                                src={gift.imageUrl}
                                fit={gift.imageFit}
                                position={gift.imagePosition}
                                className="aspect-[4/3] w-full border-b border-moss/8"
                                imageClassName="h-full w-full transition duration-500 group-hover:scale-105"
                              />
                              <span
                                className={`absolute right-3 top-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition ${
                                  isSelected
                                    ? "bg-plum text-white"
                                    : "bg-white/92 text-moss group-hover:bg-moss group-hover:text-white"
                                }`}
                              >
                                {isSelected ? (
                                  <Check size={18} />
                                ) : (
                                  <ChevronRight size={18} />
                                )}
                              </span>
                              <span className="flex min-h-[148px] w-full flex-1 flex-col p-4">
                                <span className="block text-base font-semibold leading-snug text-ink">
                                  {gift.name}
                                </span>
                                <span className="mt-auto pt-4">
                                  <span className="block text-lg font-semibold text-moss">
                                    {formatCurrency(gift.priceCents)}
                                  </span>
                                  <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.18em] text-moss/50">
                                    {giftStatusCopy[gift.purchaseStatus]}
                                  </span>
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>

            <aside className="lg:sticky lg:top-28">
              <div className="rounded-2xl border border-moss/10 bg-moss p-6 text-white shadow-soft">
                <HeartHandshake className="text-lavender" size={28} />
                <h2 className="mt-5 font-display text-3xl font-semibold leading-tight">
                  {selectedGift?.name ?? "Escolha um presente"}
                </h2>
                <p className="mt-2 text-sm font-medium text-white/68">
                  {selectedGift?.groupName ?? "Lista de presentes"}
                </p>
                <div className="mt-6 rounded-xl border border-white/12 bg-white/8 p-4">
                  {selectedGift ? (
                    <GiftImage
                      src={selectedGift.imageUrl}
                      fit={selectedGift.imageFit}
                      position={selectedGift.imagePosition}
                      className="mb-4 aspect-[4/3] w-full rounded-lg"
                    />
                  ) : null}
                  <p className="text-sm leading-6 text-white/78">
                    Nesta etapa, o presente fica reservado temporariamente para
                    preparar a integração com o checkout.
                  </p>
                  {selectedGift ? (
                    <>
                      <p className="mt-3 text-lg font-semibold text-white">
                        {formatCurrency(selectedGift.priceCents)}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                        {giftStatusCopy[selectedGift.purchaseStatus]}
                      </p>
                    </>
                  ) : null}
                </div>
                {checkoutError ? (
                  <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">
                    {checkoutError}
                  </p>
                ) : null}
                {checkoutMessage ? (
                  <p className="mt-4 rounded-2xl bg-white/12 p-3 text-sm font-semibold text-white">
                    {checkoutMessage}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={
                    !selectedGift ||
                    selectedGift.purchaseStatus === "reserved" ||
                    isStartingCheckout
                  }
                  onClick={startCheckout}
                  className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-moss transition hover:bg-ivory disabled:bg-white/18 disabled:text-white/62"
                >
                  {isStartingCheckout ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <Gift size={17} />
                  )}
                  {selectedGift?.purchaseStatus === "reserved"
                    ? "Em processo de escolha"
                    : isStartingCheckout
                      ? "Reservando..."
                      : selectedGift?.purchaseStatus === "sold"
                        ? "Presentear também"
                        : "Reservar presente"}
                </button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
