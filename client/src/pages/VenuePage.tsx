import { CalendarDays, Clock, MapPin, Navigation, ParkingCircle } from "lucide-react";
import { PageHero } from "../components/PageHero";
import { SectionTitle } from "../components/SectionTitle";
import { photos } from "../data/photos";
import { siteConfig } from "../data/siteConfig";

const details = [
  { icon: MapPin, label: "Local", value: siteConfig.venueName },
  { icon: CalendarDays, label: "Data", value: siteConfig.weddingDateLabel },
  { icon: Clock, label: "Horário", value: siteConfig.weddingTimeLabel },
  { icon: ParkingCircle, label: "Chegada", value: "Planeje chegar com tranquilidade" }
];

export function VenuePage() {
  return (
    <main>
      <PageHero
        eyebrow="Local do casamento"
        title={`${siteConfig.venueName}, ${siteConfig.venueCity}`}
        text={siteConfig.venueText}
        image={photos.venue}
      />

      <section className="page-shell grid gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionTitle eyebrow="Celebração" title="Um lugar cercado pela natureza">
            <p>
              O casamento acontecerá pela manhã. Sugerimos que os convidados se
              organizem para chegar alguns minutos antes, aproveitar o ambiente
              com calma e participar de cada momento da cerimônia.
            </p>
          </SectionTitle>
          <a
            href={siteConfig.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-semibold text-ivory shadow-soft transition hover:bg-ink"
          >
            <Navigation size={18} />
            Abrir no Google Maps
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {details.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="rounded-2xl border border-moss/10 bg-white/72 p-6 shadow-sm"
              >
                <Icon size={24} className="text-plum" />
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-ink/45">
                  {item.label}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-moss">
                  {item.value}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
