export const defaultMarketHomeHeroImage = '/images/header002-us-yosemite-climbing-woman.webp';

const marketHomeHeroImages = {
  au: '/images/content/au/market-home/australia-coastal-overlook-hero.webp',
  ca: '/images/content/ca/market-home/canada-rockies-overlook-hero.webp',
  uk: '/images/content/uk/market-home/uk-south-coast-paragliding-hero.webp',
} as const;

export function getMarketHomeHeroImage(market: string): string | undefined {
  return marketHomeHeroImages[market as keyof typeof marketHomeHeroImages];
}
