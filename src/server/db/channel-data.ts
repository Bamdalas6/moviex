/**
 * Well-known YouTube channels that publish Nollywood films for free.
 * Every handle was checked against youtube.com (November 2026). The TMDB import
 * upserts these by URL, and adds the channels behind our films' trailers.
 */
export type ChannelSeed = {
  slug: string;
  name: string;
  url: string;
  description: string;
  language: string;
  kind: "network" | "creator" | "studio";
  featured?: boolean;
};

const yt = (handle: string) => `https://www.youtube.com/@${handle.toLowerCase()}`;

export const CHANNELS: ChannelSeed[] = [
  {
    slug: "ruth-kadiri-247",
    name: "RuthKadiri247",
    url: yt("RuthKadiri247"),
    description: "Actress and producer Ruth Kadiri's channel, one of the first big Nollywood YouTube channels. New full-length English-language films.",
    language: "English",
    kind: "creator",
    featured: true,
  },
  {
    slug: "maurice-sam-tv",
    name: "Maurice Sam TV",
    url: yt("MauriceSamTV"),
    description: "Actor Maurice Sam's channel of full-length romance and drama films, released regularly.",
    language: "English",
    kind: "creator",
    featured: true,
  },
  {
    slug: "uche-montana-tv",
    name: "Uche Montana TV",
    url: yt("UcheMontanaTV"),
    description: "Actress Uche Montana's channel of full-length Nollywood romance and family dramas.",
    language: "English",
    kind: "creator",
    featured: true,
  },
  {
    slug: "bimbo-ademoye-tv",
    name: "Bimbo Ademoye TV",
    url: yt("BimboAdemoyeTV"),
    description: "Actress Bimbo Ademoye's channel of full-length comedies and dramas.",
    language: "English",
    kind: "creator",
    featured: true,
  },
  {
    slug: "sonia-uche-tv",
    name: "Sonia Uche TV",
    url: yt("SoniaUcheTV"),
    description: "Actress Sonia Uche's channel of full-length Nollywood dramas.",
    language: "English",
    kind: "creator",
  },
  {
    slug: "omoni-oboli-tv",
    name: "Omoni Oboli TV",
    url: yt("OmoniOboliTV"),
    description: "Actress, writer and director Omoni Oboli's channel, with new films most weeks.",
    language: "English",
    kind: "creator",
  },
  {
    slug: "realnollytv",
    name: "Nollywood RealnollyTV",
    url: yt("realnollytv"),
    description: "A large library of full-length Nigerian films, old and new.",
    language: "English",
    kind: "network",
    featured: true,
  },
  {
    slug: "nollywood-pictures-tv",
    name: "Nollywood Pictures TV",
    url: yt("NollywoodPicturesTv"),
    description: "Full-length Nollywood films and series from a long-running distributor channel.",
    language: "English",
    kind: "network",
  },
  {
    slug: "royal-arts-tv",
    name: "Royal Arts TV",
    url: yt("RoyalArtsTV"),
    description: "Full-length Nollywood films with a focus on epics and family dramas.",
    language: "English",
    kind: "network",
  },
  {
    slug: "apatatv-plus",
    name: "APATATV+",
    url: yt("ApataTVPlus"),
    description: "One of the biggest Yoruba film channels, with new full-length Yoruba movies.",
    language: "Yoruba",
    kind: "network",
    featured: true,
  },
  {
    slug: "yorubaplus",
    name: "Yorubaplus",
    url: yt("YorubaPlus"),
    description: "Full-length Yoruba movies, released regularly.",
    language: "Yoruba",
    kind: "network",
    featured: true,
  },
  {
    slug: "yorubahood",
    name: "Yorubahood",
    url: yt("YorubaHoodTV"),
    description: "Full-length Yoruba movies, released regularly.",
    language: "Yoruba",
    kind: "network",
  },
  {
    slug: "libratv",
    name: "LibraTV",
    url: yt("LibraTV"),
    description: "Yoruba movies and dramas, released regularly.",
    language: "Yoruba",
    kind: "network",
  },
  {
    slug: "faaji-tv",
    name: "Faaji TV",
    url: yt("FaajiTV"),
    description: "A large catalogue of Yoruba films.",
    language: "Yoruba",
    kind: "network",
  },
  {
    slug: "yorubawood",
    name: "Yorubawood",
    url: yt("Yorubawood"),
    description: "Yoruba movies, old and new.",
    language: "Yoruba",
    kind: "network",
  },
  {
    slug: "nigbatitv",
    name: "NigbatiTV",
    url: yt("NigbatiTV"),
    description: "Yoruba movies and drama series.",
    language: "Yoruba",
    kind: "network",
  },
  {
    slug: "ebonylife-studios",
    name: "EbonyLife Studios",
    url: yt("EbonyLifeStudios"),
    description: "Mo Abudu's studio behind cinema and streaming hits: trailers, clips and behind-the-scenes.",
    language: "English",
    kind: "studio",
  },
  {
    slug: "anthill-studios",
    name: "Anthill Studios",
    url: yt("AnthillStudios"),
    description: "Niyi Akinmolayan's studio: trailers and extras for its cinema releases.",
    language: "English",
    kind: "studio",
  },
];
