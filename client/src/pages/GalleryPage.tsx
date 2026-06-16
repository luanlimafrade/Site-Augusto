import { X } from "lucide-react";
import { useState } from "react";
import { PageHero } from "../components/PageHero";
import { photos, photoUrl } from "../data/photos";

export function GalleryPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <main>
      <PageHero
        eyebrow="Galeria"
        title="Memórias do nosso pré-wedding"
        text="Selecionamos alguns registros do nosso ensaio para compartilhar a atmosfera deste tempo especial: natureza, flores, simplicidade e afeto."
        image={photos.hero}
      />

      <section className="page-shell py-16">
        <div className="masonry">
          {photos.gallery.map((image, index) => (
            <button
              type="button"
              key={image}
              onClick={() => setSelected(image)}
              className="focus-ring mb-4 block w-full overflow-hidden rounded-[1.35rem] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
              aria-label={`Abrir foto ${index + 1}`}
            >
              <img
                src={photoUrl(image)}
                alt=""
                className="w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </section>

      {selected ? (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-ink/86 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="focus-ring absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white text-moss"
            aria-label="Fechar foto"
          >
            <X size={22} />
          </button>
          <img
            src={photoUrl(selected)}
            alt=""
            className="max-h-[86vh] rounded-[1.5rem] object-contain shadow-soft"
          />
        </div>
      ) : null}
    </main>
  );
}
