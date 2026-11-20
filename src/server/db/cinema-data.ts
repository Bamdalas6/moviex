/**
 * Cinema branches, compiled from public sources (Nairametrics 2025–26 cinema
 * rankings, chain "About" pages, Wikipedia). Branches open and close — admins
 * should review this list periodically. `website` is only set where the chain's
 * own site was confirmed; every branch also gets a maps link in the UI.
 */
export const CINEMA_BRANCHES: {
  chain: string;
  branch: string;
  city: string;
  country?: string;
  website?: string;
}[] = [
  { chain: "Filmhouse Cinemas", branch: "Lekki", city: "Lagos", website: "https://filmhouseng.com" },
  { chain: "Filmhouse Cinemas", branch: "Surulere", city: "Lagos", website: "https://filmhouseng.com" },
  { chain: "Filmhouse Cinemas", branch: "Landmark Village, Victoria Island", city: "Lagos", website: "https://filmhouseng.com" },
  { chain: "Filmhouse Cinemas", branch: "Port Harcourt Mall", city: "Port Harcourt", website: "https://filmhouseng.com" },
  { chain: "Filmhouse Cinemas", branch: "Ventura Mall, Samonda", city: "Ibadan", website: "https://filmhouseng.com" },
  { chain: "Filmhouse Cinemas", branch: "Kano", city: "Kano", website: "https://filmhouseng.com" },

  { chain: "Genesis Cinemas", branch: "Maryland Mall", city: "Lagos", website: "https://genesiscinemas.com" },
  { chain: "Genesis Cinemas", branch: "Festival Mall, Festac", city: "Lagos", website: "https://genesiscinemas.com" },
  { chain: "Genesis Cinemas", branch: "Lekki Phase 1", city: "Lagos", website: "https://genesiscinemas.com" },
  { chain: "Genesis Cinemas", branch: "Ceddi Plaza", city: "Abuja", website: "https://genesiscinemas.com" },
  { chain: "Genesis Cinemas", branch: "Port Harcourt", city: "Port Harcourt", website: "https://genesiscinemas.com" },
  { chain: "Genesis Cinemas", branch: "Owerri Mall", city: "Owerri", website: "https://genesiscinemas.com" },
  { chain: "Genesis Cinemas", branch: "Asaba Mall", city: "Asaba", website: "https://genesiscinemas.com" },
  { chain: "Genesis Cinemas", branch: "Delta Mall", city: "Warri", website: "https://genesiscinemas.com" },

  { chain: "Silverbird Cinemas", branch: "Silverbird Galleria, Victoria Island", city: "Lagos" },
  { chain: "Silverbird Cinemas", branch: "Ikeja City Mall", city: "Lagos" },
  { chain: "Silverbird Cinemas", branch: "Jabi Lake Mall", city: "Abuja" },
  { chain: "Silverbird Cinemas", branch: "Silverbird Entertainment Centre", city: "Abuja" },
  { chain: "Silverbird Cinemas", branch: "Port Harcourt", city: "Port Harcourt" },
  { chain: "Silverbird Cinemas", branch: "Uyo", city: "Uyo" },
  { chain: "Silverbird Cinemas", branch: "Accra Mall", city: "Accra", country: "Ghana" },

  { chain: "EbonyLife Cinemas", branch: "EbonyLife Place, Victoria Island", city: "Lagos" },
];
