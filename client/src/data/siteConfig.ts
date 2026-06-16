import type { GiftOption, NavItem } from "../types";

export const siteConfig = {
  couple: "Daiane & Augusto",
  bride: "Daiane",
  groom: "Augusto",
  weddingDateTime: "2026-09-19T09:30:00-03:00",
  weddingDateLabel: "19 de setembro de 2026",
  weddingTimeLabel: "9h30 da manhã",
  rsvpDeadlineLabel: "01 de setembro de 2026",
  venueName: "Sítio Veredas",
  venueCity: "Formiga - MG",
  mapsUrl: "https://share.google/2Pp4L72qPYzFGXFcR",
  domain: "daianeeaugusto.site",
  pixKey: "37999255370",
  bibleVerse: "Acima de tudo, porém, revistam-se do amor, que é o elo perfeito.",
  bibleReference: "Colossenses 3:14",
  intro:
    "Dois caminhos que se encontraram, dois corações que escolheram caminhar juntos. Entre momentos, sonhos e aprendizados, nossa história foi construída com amor, amizade e a certeza de que Deus guiou cada passo. Agora, celebramos com gratidão o início da nossa família.",
  story:
    "Nossa história foi construída dia após dia, com amor, amizade e a certeza de que Deus guiou cada passo. Com gratidão, celebramos o início da nossa família e estamos felizes por compartilhar este momento com pessoas tão especiais.",
  venueText:
    "Escolhemos um lugar especial, cercado pela natureza, para celebrar este momento tão importante diante de Deus, da nossa família e dos nossos amigos. Esperamos você para viver conosco esse dia de alegria, gratidão e amor.",
  giftsText:
    "Sua presença neste dia já é o nosso maior presente. Mas, se desejar nos abençoar de alguma forma, preparamos algumas opções com muito carinho.",
  rsvpText:
    "Para nos ajudar na organização deste dia tão especial, confirme sua presença com carinho preenchendo as informações abaixo.",
  successText:
    "Confirmação recebida com carinho. Ficamos muito felizes em compartilhar este momento com você."
};

export const navItems: NavItem[] = [
  { label: "Início", path: "/" },
  { label: "Nossa História", path: "/nossa-historia" },
  { label: "Local", path: "/local" },
  { label: "Presentes", path: "/presentes" },
  { label: "Trajes", path: "/trajes" },
  { label: "Galeria", path: "/galeria" },
  { label: "Confirmar", path: "/confirmar-presenca", highlight: true }
];

export const giftOptions: GiftOption[] = [
  {
    title: "Lista de presentes 1",
    description: "Espaço reservado para o primeiro link da lista de presentes.",
    url: "",
    buttonLabel: "Adicionar link depois"
  },
  {
    title: "Lista de presentes 2",
    description: "Espaço reservado para uma segunda opção de lista externa.",
    url: "",
    buttonLabel: "Adicionar link depois"
  },
  {
    title: "Presente via Pix",
    description: `Chave Pix: ${siteConfig.pixKey}`,
    url: "",
    buttonLabel: "Copiar chave Pix",
    isPix: true
  }
];
