import { Check, Copy, Gift, HeartHandshake, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { PageHero } from "../components/PageHero";
import { photos } from "../data/photos";
import { giftOptions, siteConfig } from "../data/siteConfig";

export function GiftsPage() {
  const [copied, setCopied] = useState(false);

  const copyPix = async () => {
    await navigator.clipboard.writeText(siteConfig.pixKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
  };

  return (
    <main>
      <PageHero
        eyebrow="Lista de presentes"
        title="O maior presente é ter você conosco"
        text={siteConfig.giftsText}
        image={photos.gifts}
      />

      <section className="page-shell grid gap-5 py-16 md:grid-cols-3">
        {giftOptions.map((gift) => {
          const Icon = gift.isPix ? HeartHandshake : ShoppingBag;
          return (
            <article
              key={gift.title}
              className="flex min-h-[260px] flex-col rounded-2xl border border-moss/10 bg-white/72 p-6 shadow-sm"
            >
              <Icon className="text-plum" size={26} />
              <h2 className="mt-6 font-display text-3xl font-semibold text-moss">
                {gift.title}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-7 text-ink/68">
                {gift.description}
              </p>
              {gift.isPix ? (
                <button
                  type="button"
                  onClick={copyPix}
                  className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-moss px-5 py-2 text-sm font-semibold text-ivory transition hover:bg-ink"
                >
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                  {copied ? "Chave copiada" : gift.buttonLabel}
                </button>
              ) : gift.url ? (
                <a
                  href={gift.url}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-moss px-5 py-2 text-sm font-semibold text-ivory transition hover:bg-ink"
                >
                  <Gift size={17} />
                  Abrir lista
                </a>
              ) : (
                <span className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-moss/15 px-5 py-2 text-sm font-semibold text-moss/70">
                  {gift.buttonLabel}
                </span>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
