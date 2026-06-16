import { motion } from "framer-motion";
import { CalendarDays, MapPin, MessageCircleHeart, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import { Countdown } from "../components/Countdown";
import { PrimaryLink } from "../components/PrimaryLink";
import { SectionTitle } from "../components/SectionTitle";
import { photos, photoUrl } from "../data/photos";
import { siteConfig } from "../data/siteConfig";

const highlightCards = [
  {
    label: "Data",
    value: siteConfig.weddingDateLabel,
    detail: siteConfig.weddingTimeLabel,
    icon: CalendarDays
  },
  {
    label: "Local",
    value: siteConfig.venueName,
    detail: siteConfig.venueCity,
    icon: MapPin
  },
  {
    label: "RSVP",
    value: "Confirme com carinho",
    detail: `Até ${siteConfig.rsvpDeadlineLabel}`,
    icon: MessageCircleHeart
  }
];

export function HomePage() {
  return (
    <main>
      <section className="relative isolate min-h-[94vh] overflow-hidden pt-24">
        <picture className="absolute inset-0 -z-20">
          <source media="(max-width: 767px)" srcSet={photoUrl(photos.heroMobile)} />
          <img
            src={photoUrl(photos.hero)}
            alt="Daiane e Augusto em ensaio pré-wedding"
            className="h-full w-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/72 via-ink/34 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-t from-ivory to-transparent" />

        <div className="page-shell flex min-h-[calc(94vh-6rem)] items-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl text-ivory"
          >
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-linen">
              Casamento
            </p>
            <h1 className="mt-4 font-display text-6xl font-semibold leading-none md:text-8xl">
              {siteConfig.couple}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/88 md:text-xl">
              {siteConfig.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryLink to="/confirmar-presenca" icon={MessageCircleHeart}>
                Confirmar presença
              </PrimaryLink>
              <PrimaryLink to="/local" icon={Navigation} variant="soft">
                Ver local
              </PrimaryLink>
            </div>
            <div className="mt-8 max-w-2xl">
              <Countdown />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="page-shell grid gap-4 py-10 md:grid-cols-3">
        {highlightCards.map((item) => {
          const Icon = item.icon;
          return (
            <motion.article
              key={item.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45 }}
              className="rounded-2xl border border-moss/10 bg-white/70 p-5 shadow-sm"
            >
              <Icon className="text-plum" size={22} />
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-ink/45">
                {item.label}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-moss">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-ink/62">{item.detail}</p>
            </motion.article>
          );
        })}
      </section>

      <section className="page-shell grid gap-10 py-14 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <div className="grid grid-cols-2 gap-4">
          <img
            src={photoUrl(photos.storyMain)}
            alt=""
            className="h-[420px] rounded-[1.5rem] object-cover shadow-soft"
            loading="lazy"
          />
          <img
            src={photoUrl(photos.storySecondary)}
            alt=""
            className="mt-12 h-[420px] rounded-[1.5rem] object-cover shadow-soft"
            loading="lazy"
          />
        </div>
        <SectionTitle eyebrow="Nossa história" title="Uma caminhada guiada por Deus">
          <p>{siteConfig.story}</p>
          <p className="mt-5 font-display text-2xl text-plum">
            “{siteConfig.bibleVerse}”
          </p>
          <p className="mt-1 text-sm font-semibold text-moss">
            {siteConfig.bibleReference}
          </p>
          <Link
            to="/nossa-historia"
            className="focus-ring mt-8 inline-flex rounded-full border border-moss/20 px-6 py-3 text-sm font-semibold text-moss transition hover:bg-white"
          >
            Ler nossa história
          </Link>
        </SectionTitle>
      </section>
    </main>
  );
}
