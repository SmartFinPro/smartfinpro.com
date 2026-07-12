import { describe, expect, it } from 'vitest';
import {
  defaultMarketHomeHeroImage,
  getMarketHomeHeroImage,
} from '@/lib/images/market-home-hero';

describe('getMarketHomeHeroImage', () => {
  it('maps each localized market home to its dedicated hero image', () => {
    expect(getMarketHomeHeroImage('au')).toBe(
      '/images/content/au/market-home/australia-coastal-overlook-hero.webp'
    );
    expect(getMarketHomeHeroImage('ca')).toBe(
      '/images/content/ca/market-home/canada-rockies-overlook-hero.webp'
    );
    expect(getMarketHomeHeroImage('uk')).toBe(
      '/images/content/uk/market-home/uk-south-coast-paragliding-hero.webp'
    );
  });

  it('keeps the default hero for markets without a localized image', () => {
    expect(getMarketHomeHeroImage('us')).toBeUndefined();
  });

  it('uses a versioned US hero asset that is compatible with Next image local patterns', () => {
    expect(defaultMarketHomeHeroImage).toBe('/images/header002-us-yosemite-climbing-woman.webp');
  });
});
