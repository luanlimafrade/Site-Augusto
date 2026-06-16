import { motion } from "framer-motion";
import { PageHero } from "../components/PageHero";
import { SectionTitle } from "../components/SectionTitle";
import { photos, photoUrl } from "../data/photos";
import { siteConfig } from "../data/siteConfig";

export function StoryPage() {
  return (
    <main>
      <PageHero
        eyebrow="Nossa história"
        title="Entre amor, amizade e propósito"
        text={siteConfig.story}
        image={photos.storyMain}
      />

      <section className="page-shell grid gap-12 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="space-y-6 text-lg leading-9 text-ink/72"
        >
          <SectionTitle eyebrow="Com gratidão" title="O começo da nossa família" />
          <p>
            Dois caminhos que se encontraram e escolheram caminhar juntos. Em
            cada fase, reconhecemos o cuidado de Deus nos detalhes, nas decisões
            e nas pessoas que fizeram parte da nossa caminhada.
          </p>
          <p>
            Agora queremos celebrar este novo capítulo ao lado de quem amamos,
            com simplicidade, alegria e o coração cheio de gratidão.
          </p>
          <blockquote className="border-l-4 border-lavender pl-5 font-display text-3xl leading-snug text-plum">
            “{siteConfig.bibleVerse}”
            <span className="mt-2 block font-sans text-sm font-semibold text-moss">
              {siteConfig.bibleReference}
            </span>
          </blockquote>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="grid grid-cols-2 gap-4"
        >
          <img
            src={photoUrl(photos.storySecondary)}
            alt=""
            className="h-[440px] rounded-[1.5rem] object-cover"
            loading="lazy"
          />
          <div className="space-y-4 pt-10">
            <img
              src={photoUrl(photos.storyDetail)}
              alt=""
              className="h-52 rounded-[1.5rem] object-cover"
              loading="lazy"
            />
            <img
              src={photoUrl("0S4A9348.jpg")}
              alt=""
              className="h-52 rounded-[1.5rem] object-cover"
              loading="lazy"
            />
          </div>
        </motion.div>
      </section>
    </main>
  );
}
