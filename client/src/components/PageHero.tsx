import { motion } from "framer-motion";
import { photoUrl } from "../data/photos";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  text: string;
  image: string;
};

export function PageHero({ eyebrow, title, text, image }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden pt-28">
      <div className="absolute inset-0 -z-10 bg-ivory" />
      <div className="page-shell grid gap-8 py-12 md:grid-cols-[0.95fr_1.05fr] md:items-center md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-plum">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-moss md:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink/72">{text}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="overflow-hidden rounded-[2rem] shadow-soft"
        >
          <img
            src={photoUrl(image)}
            alt=""
            className="h-[360px] w-full object-cover md:h-[520px]"
            loading="eager"
          />
        </motion.div>
      </div>
    </section>
  );
}
