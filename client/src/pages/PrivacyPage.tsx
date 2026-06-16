import { ShieldCheck } from "lucide-react";
import { SectionTitle } from "../components/SectionTitle";
import { siteConfig } from "../data/siteConfig";

export function PrivacyPage() {
  return (
    <main className="pt-28">
      <section className="page-shell py-16">
        <SectionTitle eyebrow="Privacidade" title="Uso das informações do RSVP">
          <p>
            As informações enviadas no formulário de confirmação serão usadas
            somente para a organização do casamento de {siteConfig.couple}.
          </p>
        </SectionTitle>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            "Coletamos nome, telefone, resposta de presença, quantidade de pessoas do convite e observações opcionais.",
            "Os dados ficam disponíveis apenas na área privada dos noivos, protegida por senha.",
            "As informações não serão vendidas, compartilhadas comercialmente ou usadas para outros fins."
          ].map((text) => (
            <article
              key={text}
              className="rounded-2xl border border-moss/10 bg-white/72 p-6 shadow-sm"
            >
              <ShieldCheck className="text-plum" size={25} />
              <p className="mt-5 text-sm leading-7 text-ink/70">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
