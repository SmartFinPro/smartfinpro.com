import type { Market, Category } from '@/lib/i18n/config';

/**
 * GENDER RULE (NICHT ÄNDERN):
 * Jedes Experten-Bild hat ein festes Geschlecht. Der `reviewedBy`-Name im MDX
 * MUSS zum Geschlecht des Porträts passen:
 *   - Weibliches Bild → weiblicher Name (z.B. "Sarah Chen", "Emma Whitfield")
 *   - Männliches Bild → männlicher Name (z.B. "James Miller", "Robert Hayes")
 * Aliase und Fallbacks müssen diese Regel ebenfalls einhalten.
 */
type Gender = 'male' | 'female';

/** Gender des PORTRÄT-BILDES (nicht des Namens!) */
const EXPERT_IMAGE_GENDER: Record<string, Gender> = {
  '/images/experts/james-miller.jpg': 'female',     // Bild zeigt eine Frau! (visuell verifiziert)
  '/images/experts/michael-torres.jpg': 'female',   // Bild zeigt eine Frau! (visuell verifiziert)
  '/images/experts/robert-hayes.jpg': 'male',
  '/images/experts/james-mitchell.jpg': 'male',
  '/images/experts/michael-chen.jpg': 'female',     // Bild zeigt eine Frau! (visuell verifiziert)
  '/images/experts/sarah-chen.jpg': 'female',
  '/images/experts/sarah-thompson.jpg': 'female',
  '/images/experts/james-blackwood.jpg': 'male',
  '/images/experts/marc-fontaine.jpg': 'female',    // Bild zeigt eine Frau! (visuell verifiziert)
  '/images/experts/philippe-leblanc.jpg': 'female', // Bild zeigt eine Frau! (visuell verifiziert)
  '/images/experts/daniel-whitfield.jpg': 'female',
  '/images/experts/james-liu.jpg': 'male',
  '/images/experts/expert-extra-13.jpg': 'male',
  '/images/experts/expert-extra-14.jpg': 'male',
  '/images/experts/daniel-brooks.jpg': 'male',
  '/images/experts/expert-extra-16.jpg': 'male',
};

/** Lookup: image gender by path */
export function getExpertImageGender(imagePath: string): Gender | undefined {
  return EXPERT_IMAGE_GENDER[imagePath];
}

const EXPERT_IMAGE_BY_NAME: Record<string, string> = {
  // ── Female names → female portraits (visuell verifiziert) ─────────────────
  'jessica miller': '/images/experts/james-miller.jpg',         // US (james-miller.jpg = female)
  'michelle torres': '/images/experts/michael-torres.jpg',      // US (michael-torres.jpg = female)
  'michelle chen': '/images/experts/michael-chen.jpg',          // US (michael-chen.jpg = female)
  'marie fontaine': '/images/experts/marc-fontaine.jpg',        // CA (marc-fontaine.jpg = female)
  'claire leblanc': '/images/experts/philippe-leblanc.jpg',     // CA (philippe-leblanc.jpg = female)
  'sarah chen': '/images/experts/sarah-chen.jpg',
  'sarah thompson': '/images/experts/sarah-thompson.jpg',
  'emma whitfield': '/images/experts/daniel-whitfield.jpg',     // AU-Hauptexpertin
  'jessica liu': '/images/experts/daniel-whitfield.jpg',        // AU-Fallback weiblich
  // ── Male names → male portraits ───────────────────────────────────────────
  'robert hayes': '/images/experts/robert-hayes.jpg',
  'james mitchell': '/images/experts/james-mitchell.jpg',
  'james blackwood': '/images/experts/james-blackwood.jpg',
  'james liu': '/images/experts/james-liu.jpg',
  'david martinez': '/images/experts/expert-extra-13.jpg',
  // ── Legacy male names → redirected to correct MALE portraits ─────────────
  // (old MDX reviews may still use these names; gender-consistent fallback)
  'james miller': '/images/experts/robert-hayes.jpg',
  'michael torres': '/images/experts/robert-hayes.jpg',
  'michael chen': '/images/experts/james-mitchell.jpg',
  'marc fontaine': '/images/experts/james-blackwood.jpg',
  'philippe leblanc': '/images/experts/james-liu.jpg',
};

const EXPERT_IMAGE_ALIASES: Record<string, string> = {
  'dr sarah chen': 'sarah chen',
  'robert harrison': 'james mitchell',        // male → male ✓
  'patricia chen': 'sarah chen',              // female → female ✓
  'sarah williams': 'sarah thompson',         // female → female ✓
  'amanda rodriguez': 'sarah chen',           // female → female ✓
  'charlotte davies': 'sarah thompson',       // female → female ✓
  'sophie tremblay': 'emma whitfield',        // female → female ✓
  'emma richardson': 'emma whitfield',        // female → female ✓
  'jessica park': 'emma whitfield',           // female → female ✓
  // Legacy male aliases → redirected to male portraits
  'marc andre fontaine': 'marc fontaine',     // → james-blackwood.jpg (male) via legacy redirect
  'michael thornton': 'michael torres',       // → robert-hayes.jpg (male) via legacy redirect
  'daniel chen': 'michael chen',              // → james-mitchell.jpg (male) via legacy redirect
  'david thompson': 'marc fontaine',          // → james-blackwood.jpg (male) via legacy redirect
};

const ALLOWED_EXPERT_IMAGES = new Set<string>([
  '/images/experts/james-miller.jpg',
  '/images/experts/michael-torres.jpg',
  '/images/experts/robert-hayes.jpg',
  '/images/experts/james-mitchell.jpg',
  '/images/experts/michael-chen.jpg',
  '/images/experts/sarah-chen.jpg',
  '/images/experts/sarah-thompson.jpg',
  '/images/experts/james-blackwood.jpg',
  '/images/experts/marc-fontaine.jpg',
  '/images/experts/philippe-leblanc.jpg',
  '/images/experts/daniel-whitfield.jpg',
  '/images/experts/james-liu.jpg',
  '/images/experts/expert-extra-13.jpg',
  '/images/experts/expert-extra-14.jpg',
  '/images/experts/daniel-brooks.jpg',
  '/images/experts/expert-extra-16.jpg',
]);

const MARKET_FALLBACK_IMAGE: Record<Market, string> = {
  us: '/images/experts/robert-hayes.jpg',       // male ✓ (james-miller.jpg = female)
  uk: '/images/experts/sarah-thompson.jpg',     // female ✓
  ca: '/images/experts/james-blackwood.jpg',    // male ✓ (marc-fontaine.jpg = female)
  au: '/images/experts/daniel-whitfield.jpg',   // female ✓
};

const CATEGORY_FALLBACK_IMAGE: Partial<Record<Market, Partial<Record<Category, string>>>> = {
  us: {
    'debt-relief': '/images/experts/james-mitchell.jpg',
    'credit-repair': '/images/experts/james-mitchell.jpg',
    'credit-score': '/images/experts/james-mitchell.jpg',
    trading: '/images/experts/robert-hayes.jpg',
    forex: '/images/experts/robert-hayes.jpg',
    'personal-finance': '/images/experts/robert-hayes.jpg',    // male ✓ (michael-torres.jpg = female)
    'business-banking': '/images/experts/james-mitchell.jpg',  // male ✓ (michael-chen.jpg = female)
    'ai-tools': '/images/experts/sarah-chen.jpg',
  },
  uk: {
    trading: '/images/experts/james-blackwood.jpg',
  },
  ca: {
    forex: '/images/experts/james-liu.jpg',                    // male ✓ (philippe-leblanc.jpg = female)
  },
  au: {
    forex: '/images/experts/james-liu.jpg',
  },
};

export function normalizeExpertName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^dr\.\s+/, '')
    .replace(/^dr\s+/, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAllowedExpertImagePath(path?: string | null): path is string {
  if (!path) return false;
  return ALLOWED_EXPERT_IMAGES.has(path);
}

function resolveFromName(name?: string): string | null {
  const normalized = normalizeExpertName(name);
  if (!normalized) return null;

  const direct = EXPERT_IMAGE_BY_NAME[normalized];
  if (direct) return direct;

  const aliased = EXPERT_IMAGE_ALIASES[normalized];
  if (aliased && EXPERT_IMAGE_BY_NAME[aliased]) {
    return EXPERT_IMAGE_BY_NAME[aliased];
  }

  return null;
}

export function resolveExpertImage(params: {
  reviewedBy?: string;
  expertName?: string;
  expertImageUrl?: string | null;
  market: Market;
  category: Category;
}): string {
  const reviewedByName = (params.reviewedBy || '').split(',')[0]?.trim();
  const byName = resolveFromName(reviewedByName);
  if (byName) return byName;

  const normalizedReviewedBy = normalizeExpertName(reviewedByName);
  const normalizedExpertName = normalizeExpertName(params.expertName);
  const samePerson =
    !normalizedReviewedBy ||
    !normalizedExpertName ||
    normalizedReviewedBy === normalizedExpertName;

  // Only trust DB image when reviewer and expert identity match.
  if (samePerson && isAllowedExpertImagePath(params.expertImageUrl)) {
    return params.expertImageUrl;
  }

  const categoryFallback = CATEGORY_FALLBACK_IMAGE[params.market]?.[params.category];
  if (categoryFallback && isAllowedExpertImagePath(categoryFallback)) {
    return categoryFallback;
  }

  return MARKET_FALLBACK_IMAGE[params.market] || '/images/experts/james-miller.jpg';
}
