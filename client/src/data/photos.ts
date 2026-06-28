export const photoBasePath = "/fotos/";

export const photoUrl = (fileName: string) => `${photoBasePath}${fileName}`;

// Para trocar fotos futuramente, altere apenas os nomes abaixo e coloque
// os novos arquivos em client/public/fotos mantendo o mesmo padrão.
export const photos = {
  hero: "0S4A9517.jpg",
  heroMobile: "mobile.jpg",
  storyMain: "Storie01.jpg",
  storySecondary: "0S4A9144.jpg",
  storyPageSecondary: "0S4A9348.jpg",
  storyDetail: "storie2.jpg",
  storyPageExtra: "fotolateral.jpg",
  venue: "local.jpg",
  gifts: "presentes.jpg",
  dressCode: "0S4A9533.jpg",
  rsvp: "0S4A9700.jpg",
  admin: "0S4A9858.jpg",
  gallery: [
    "galeria01.jpg",
    "0S4A9128.jpg",
    "galeria04.jpg",
    "0S4A9301.jpg",
    "0S4A9348.jpg",
    "galeria02.jpg",
    "storie2.jpg",
    "galeria09.jpg",
    "0S4A9517.jpg",
    "0S4A9533.jpg",
    "0S4A9546.jpg",
    "galeria05.jpg",
    "galeria06.jpg",
    "0S4A9804.jpg",
    "0S4A9858.jpg",
    "0S4A9647.jpg",
    "0S4A9700.jpg",
    "galeria03.jpg",
    "0S4A9599.jpg",
    "0S4A9623.jpg",
    "galeria10.jpg",
    "galeria008.jpg",
    "0S4A9903.jpg",
    "galeria11.jpg",
    "galeria12.jpg",
  ]
};
