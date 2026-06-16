import { Heart, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { siteConfig } from "../data/siteConfig";

export function Footer() {
  return (
    <footer className="border-t border-moss/10 bg-white/50">
      <div className="page-shell grid gap-8 py-10 md:grid-cols-[1.5fr_1fr] md:items-center">
        <div>
          <p className="font-display text-3xl font-semibold text-moss">
            {siteConfig.couple}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink/68">
            {siteConfig.weddingDateLabel}, às {siteConfig.weddingTimeLabel}, no{" "}
            {siteConfig.venueName}, {siteConfig.venueCity}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <Link
            to="/privacidade"
            className="focus-ring rounded-full border border-moss/15 px-4 py-2 text-sm font-medium text-moss transition hover:bg-white"
          >
            Privacidade
          </Link>
          <Link
            to="/admin"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-moss/15 px-4 py-2 text-sm font-medium text-moss transition hover:bg-white"
          >
            <LockKeyhole size={16} />
            Área dos noivos
          </Link>
        </div>
      </div>
      <div className="page-shell flex items-center justify-center gap-2 border-t border-moss/10 py-4 text-xs text-ink/55">
        <Heart size={14} className="fill-blossom/20 text-blossom" />
        <span>Feito com carinho para celebrar este novo começo.</span>
      </div>
    </footer>
  );
}
