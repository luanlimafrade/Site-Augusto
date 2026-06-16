import { Shirt, Sparkles, UserRoundCheck } from "lucide-react";
import { PageHero } from "../components/PageHero";
import { photos } from "../data/photos";

const cards = [
  {
    title: "Mulheres",
    icon: Sparkles,
    items: [
      "Vestidos, conjuntos ou peças leves e elegantes.",
      "Tons suaves, florais discretos e tecidos confortáveis.",
      "Sapatos que funcionem bem em ambiente de gramado."
    ]
  },
  {
    title: "Homens",
    icon: Shirt,
    items: [
      "Camisa social, calça de alfaiataria ou chino.",
      "Tons claros, naturais e combinação confortável para a manhã.",
      "Sapatos ou mocassins adequados para sítio."
    ]
  },
  {
    title: "Observações",
    icon: UserRoundCheck,
    items: [
      "Evite branco, ivory e tons muito próximos da noiva.",
      "Evite brilho exagerado e roupas muito informais.",
      "Priorize leveza, conforto e delicadeza."
    ]
  }
];

export function DressCodePage() {
  return (
    <main>
      <PageHero
        eyebrow="Sugestão de trajes"
        title="Leveza para uma manhã especial"
        text="Nosso casamento acontecerá pela manhã, em um ambiente cercado pela natureza. Sugerimos trajes leves, elegantes e confortáveis, em tons suaves e delicados, que combinem com a atmosfera romântica e natural da celebração."
        image={photos.dressCode}
      />

      <section className="page-shell grid gap-5 py-16 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="rounded-2xl border border-moss/10 bg-white/72 p-6 shadow-sm"
            >
              <Icon className="text-plum" size={26} />
              <h2 className="mt-6 font-display text-3xl font-semibold text-moss">
                {card.title}
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-ink/70">
                {card.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-lavender" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>
    </main>
  );
}
