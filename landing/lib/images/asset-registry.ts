/**
 * Image Asset Registry — Central mapping of all visual assets per market/category/slug.
 *
 * WORKFLOW:
 * 1. Download image from Freepik (Premium, 2000+ px width)
 * 2. Drop into public/images/content/[market]/[category]/
 * 3. Run: node scripts/optimize-images.mjs --all
 * 4. Add the filename to this registry
 * 5. RegionalHeroImage & SmartImage auto-resolve from here
 *
 * NAMING CONVENTION:
 *   public/images/content/{market}/{category}/{slug}.webp
 *   Example: public/images/content/us/trading/etoro-hero.webp
 */

// ─────────────────────────────────────────────
// Visual Style Definitions per Market/Category
// ─────────────────────────────────────────────

export interface VisualStyle {
  name: string;
  description: string;
  colorPalette: string;
  freepikTags: string[];
}

export const visualStyles: Record<string, Record<string, VisualStyle>> = {
  us: {
    trading: {
      name: 'Wall Street Power',
      description: 'Dark, premium trading aesthetics — NYC skyline, stock charts, dark glass terminals',
      colorPalette: 'Navy/Cyan/Gold accents on dark backgrounds',
      freepikTags: ['stock market dark', 'trading terminal 3d', 'wall street night', 'finance technology dark'],
    },
    'personal-finance': {
      name: 'Luxury Lifestyle',
      description: 'Premium credit cards, gold/platinum surfaces, minimalist luxury',
      colorPalette: 'Gold/Black/White with subtle gradients',
      freepikTags: ['credit card 3d render', 'gold credit card dark', 'premium card floating', 'luxury finance minimal'],
    },
    'ai-tools': {
      name: 'Neural Future',
      description: 'AI neural networks, glowing circuits, futuristic interfaces',
      colorPalette: 'Violet/Purple/Cyan on dark',
      freepikTags: ['ai technology dark', 'neural network abstract', 'artificial intelligence 3d', 'futuristic interface dark'],
    },
    cybersecurity: {
      name: 'Digital Fortress',
      description: 'Shields, locks, encrypted data streams, dark matrix aesthetic',
      colorPalette: 'Green/Teal/Red on deep black',
      freepikTags: ['cybersecurity dark', 'digital security 3d', 'cyber protection shield', 'encryption abstract dark'],
    },
    'business-banking': {
      name: 'Corporate Precision',
      description: 'Clean banking interfaces, corporate towers, sleek dashboards',
      colorPalette: 'Steel blue/Slate/White',
      freepikTags: ['business banking dark', 'corporate finance 3d', 'banking dashboard', 'fintech app dark'],
    },
  },
  uk: {
    trading: {
      name: 'London Markets',
      description: 'City of London, LSE-inspired, sophisticated British trading',
      colorPalette: 'Deep blue/Gold/Burgundy',
      freepikTags: ['london financial district', 'uk stock market', 'trading platform dark', 'city london night'],
    },
    'personal-finance': {
      name: 'British Heritage Finance',
      description: 'ISA growth charts, pounds sterling, understated British elegance',
      colorPalette: 'Racing green/Navy/Cream',
      freepikTags: ['investment growth dark', 'savings account 3d', 'british pound finance', 'isa investment uk'],
    },
    'ai-tools': {
      name: 'Neural Future',
      description: 'Same as US — AI is global',
      colorPalette: 'Violet/Purple/Cyan on dark',
      freepikTags: ['ai technology dark', 'neural network abstract', 'machine learning 3d'],
    },
    cybersecurity: {
      name: 'Digital Fortress',
      description: 'Same as US — cybersecurity is global',
      colorPalette: 'Green/Teal/Red on deep black',
      freepikTags: ['cybersecurity shield 3d', 'data protection dark', 'cyber lock abstract'],
    },
    'business-banking': {
      name: 'Neobank Revolution',
      description: 'Starling/Revolut/Tide aesthetic — mobile-first, clean fintech',
      colorPalette: 'Cyan/White/Dark gradients',
      freepikTags: ['neobank app dark', 'mobile banking 3d', 'fintech business card', 'digital bank dark'],
    },
  },
  ca: {
    forex: {
      name: '3D-Iso Minimalism',
      description: 'Clean isometric currency symbols, maple leaf accents, CAD/USD pairs',
      colorPalette: 'Red/White/Slate with Canadian accent',
      freepikTags: ['forex trading 3d', 'currency exchange dark', 'isometric finance', 'trading chart 3d render'],
    },
    'personal-finance': {
      name: 'Canadian Modern',
      description: 'Wealthsimple-inspired minimalism — clean, spacious, tech-forward',
      colorPalette: 'Clean white/Black/Emerald accents',
      freepikTags: ['investment app 3d', 'robo advisor dark', 'portfolio growth chart', 'wealth management minimal'],
    },
    'ai-tools': {
      name: 'Neural Future',
      description: 'Same as US',
      colorPalette: 'Violet/Purple/Cyan on dark',
      freepikTags: ['ai technology dark', 'artificial intelligence minimal'],
    },
    cybersecurity: {
      name: 'Digital Fortress',
      description: 'Same as US',
      colorPalette: 'Green/Teal/Red on deep black',
      freepikTags: ['cybersecurity dark abstract', 'digital security 3d'],
    },
    'business-banking': {
      name: 'Corporate Precision',
      description: 'Same as US',
      colorPalette: 'Steel blue/Slate/White',
      freepikTags: ['business banking 3d', 'corporate finance dark'],
    },
  },
  au: {
    trading: {
      name: 'Pacific Markets',
      description: 'ASX-inspired, harbour bridge accents, southern hemisphere trading',
      colorPalette: 'Blue/Gold/Deep teal',
      freepikTags: ['stock market chart 3d', 'trading platform dark', 'finance app 3d render'],
    },
    forex: {
      name: 'FX Global Hub',
      description: 'Currency flows, world map with AUD highlighted, live spreads',
      colorPalette: 'Cyan/Green/Dark',
      freepikTags: ['forex chart dark', 'currency map 3d', 'foreign exchange dark', 'trading spread dark'],
    },
    'personal-finance': {
      name: 'Aussie Home Dream',
      description: 'Property/mortgage focus — house blueprints, keys, property value charts',
      colorPalette: 'Emerald/Warm tones/Dark',
      freepikTags: ['home loan 3d', 'mortgage house dark', 'property investment 3d', 'house key 3d render'],
    },
    'ai-tools': {
      name: 'Neural Future',
      description: 'Same as US',
      colorPalette: 'Violet/Purple/Cyan on dark',
      freepikTags: ['ai technology dark', 'artificial intelligence 3d'],
    },
    cybersecurity: {
      name: 'Digital Fortress',
      description: 'Same as US',
      colorPalette: 'Green/Teal/Red on deep black',
      freepikTags: ['cybersecurity dark', 'digital security 3d'],
    },
    'business-banking': {
      name: 'Corporate Precision',
      description: 'Same as US',
      colorPalette: 'Steel blue/Slate/White',
      freepikTags: ['business banking dark', 'corporate finance 3d'],
    },
  },
};

// ─────────────────────────────────────────────
// Image Asset Registry
// ─────────────────────────────────────────────

export interface ImageAsset {
  /** Path relative to /public/ — will serve at this URL */
  src: string;
  alt: string;
  /** Freepik search query used to find this image */
  freepikQuery?: string;
  /** Whether this image has been downloaded and optimized */
  status: 'placeholder' | 'downloaded' | 'optimized';
}

/**
 * PILLAR PAGE HERO IMAGES
 * One hero image per market/category combination (21 total).
 * Path pattern: /images/content/{market}/{category}/hero.webp
 */
export const pillarHeroImages: Record<string, Record<string, ImageAsset>> = {
  us: {
    trading: {
      src: '/images/content/us/trading/hero.webp',
      alt: 'US Trading platforms and market analysis overview',
      freepikQuery: '3D render of stock market trading terminal with holographic charts on dark background',
      status: 'placeholder',
    },
    'personal-finance': {
      src: '/images/content/us/personal-finance/hero.webp',
      alt: 'US Personal finance credit cards and savings overview',
      freepikQuery: '3D render of gold credit card floating over dark marble surface with light reflections',
      status: 'placeholder',
    },
    'ai-tools': {
      src: '/images/content/us/ai-tools/hero.webp',
      alt: 'AI-powered financial tools and automation',
      freepikQuery: '3D render of AI brain with neural connections glowing purple and cyan on dark background',
      status: 'placeholder',
    },
    cybersecurity: {
      src: '/images/content/us/cybersecurity/hero.webp',
      alt: 'Enterprise cybersecurity and digital protection',
      freepikQuery: '3D render of digital shield with lock symbol surrounded by encrypted data streams dark background',
      status: 'placeholder',
    },
    'business-banking': {
      src: '/images/content/us/business-banking/hero.webp',
      alt: 'Business banking platforms and corporate accounts',
      freepikQuery: '3D render of sleek banking dashboard interface floating in dark space with blue glow',
      status: 'placeholder',
    },
  },
  uk: {
    trading: {
      src: '/images/content/uk/trading/hero.webp',
      alt: 'UK trading platforms and London markets overview',
      freepikQuery: '3D render of candlestick chart with London skyline silhouette dark blue background',
      status: 'placeholder',
    },
    'personal-finance': {
      src: '/images/content/uk/personal-finance/hero.webp',
      alt: 'UK ISA and personal finance investment accounts',
      freepikQuery: '3D render of investment growth chart with British pound symbol ascending dark green background',
      status: 'placeholder',
    },
    'ai-tools': {
      src: '/images/content/uk/ai-tools/hero.webp',
      alt: 'AI-powered tools for UK financial services',
      freepikQuery: '3D render of AI robot assistant with purple glow dark minimal background',
      status: 'placeholder',
    },
    cybersecurity: {
      src: '/images/content/uk/cybersecurity/hero.webp',
      alt: 'UK business cybersecurity solutions',
      freepikQuery: '3D render of firewall barrier with green scan lines dark abstract background',
      status: 'placeholder',
    },
    'business-banking': {
      src: '/images/content/uk/business-banking/hero.webp',
      alt: 'UK neobank and business banking platforms',
      freepikQuery: '3D render of mobile banking app interface with card payment floating dark background',
      status: 'placeholder',
    },
  },
  ca: {
    forex: {
      src: '/images/content/ca/forex/hero.webp',
      alt: 'Canadian forex trading and currency exchange platforms',
      freepikQuery: '3D isometric render of CAD USD currency symbols with exchange arrows dark minimal background',
      status: 'placeholder',
    },
    'personal-finance': {
      src: '/images/content/ca/personal-finance/hero.webp',
      alt: 'Canadian personal finance and Wealthsimple investing',
      freepikQuery: '3D render of investment portfolio screen with growth chart maple leaf accent dark background',
      status: 'placeholder',
    },
    'ai-tools': {
      src: '/images/content/ca/ai-tools/hero.webp',
      alt: 'AI tools for Canadian financial professionals',
      freepikQuery: '3D render of AI chip with neural pathways violet glow dark background',
      status: 'placeholder',
    },
    cybersecurity: {
      src: '/images/content/ca/cybersecurity/hero.webp',
      alt: 'Canadian business cybersecurity solutions',
      freepikQuery: '3D render of padlock with digital key dark cybersecurity background',
      status: 'placeholder',
    },
    'business-banking': {
      src: '/images/content/ca/business-banking/hero.webp',
      alt: 'Canadian business banking and fintech platforms',
      freepikQuery: '3D render of business banking interface with multi-currency dark background',
      status: 'placeholder',
    },
  },
  au: {
    trading: {
      src: '/images/content/au/trading/hero.webp',
      alt: 'Australian trading platforms and ASX market overview',
      freepikQuery: '3D render of trading chart with upward trend gold and blue dark background',
      status: 'placeholder',
    },
    forex: {
      src: '/images/content/au/forex/hero.webp',
      alt: 'Australian forex trading and FX broker platforms',
      freepikQuery: '3D render of world map with currency connections highlighted Australia dark background',
      status: 'placeholder',
    },
    'personal-finance': {
      src: '/images/content/au/personal-finance/hero.webp',
      alt: 'Australian home loans and personal finance',
      freepikQuery: '3D render of modern house with golden key and mortgage documents dark elegant background',
      status: 'optimized',
    },
    'ai-tools': {
      src: '/images/content/au/ai-tools/hero.webp',
      alt: 'AI tools for Australian financial services',
      freepikQuery: '3D render of AI assistant hologram with data streams violet dark background',
      status: 'placeholder',
    },
    cybersecurity: {
      src: '/images/content/au/cybersecurity/hero.webp',
      alt: 'Australian business cybersecurity platforms',
      freepikQuery: '3D render of cyber shield with binary code flowing dark background',
      status: 'placeholder',
    },
    'business-banking': {
      src: '/images/content/au/business-banking/hero.webp',
      alt: 'Australian business banking and neobank platforms',
      freepikQuery: '3D render of business account dashboard with AUD currency dark interface',
      status: 'placeholder',
    },
  },
};

/**
 * REVIEW PAGE IMAGES
 * Product/app screenshots or lifestyle images for individual reviews.
 * Path pattern: /images/content/{market}/{category}/{slug}.webp
 */
export const reviewImages: Record<string, ImageAsset> = {
  // ── US Trading ──
  'us/trading/etoro-review': {
    src: '/images/content/us/trading/etoro-review.webp',
    alt: 'eToro social trading platform interface',
    freepikQuery: 'social trading app interface dark mode with copy trading feature mockup',
    status: 'placeholder',
  },
  'us/trading/td-ameritrade-review': {
    src: '/images/content/us/trading/td-ameritrade-review.webp',
    alt: 'TD Ameritrade thinkorswim trading platform',
    freepikQuery: 'professional trading platform with multiple charts dark theme',
    status: 'placeholder',
  },
  'us/trading/interactive-brokers-review': {
    src: '/images/content/us/trading/interactive-brokers-review.webp',
    alt: 'Interactive Brokers Trader Workstation',
    freepikQuery: 'advanced trading workstation with real-time data dark professional',
    status: 'placeholder',
  },

  // ── US Personal Finance ──
  'us/personal-finance/amex-gold-card-review': {
    src: '/images/content/us/personal-finance/amex-gold-card-review.webp',
    alt: 'American Express Gold Card premium rewards',
    freepikQuery: '3D render of gold premium credit card with sparkle effect floating dark luxury background',
    status: 'placeholder',
  },
  'us/personal-finance/chase-sapphire-preferred-review': {
    src: '/images/content/us/personal-finance/chase-sapphire-preferred-review.webp',
    alt: 'Chase Sapphire Preferred travel rewards card',
    freepikQuery: '3D render of sapphire blue premium credit card floating with travel icons dark background',
    status: 'placeholder',
  },
  'us/personal-finance/chase-sapphire-reserve-review': {
    src: '/images/content/us/personal-finance/chase-sapphire-reserve-review.webp',
    alt: 'Chase Sapphire Reserve luxury travel card',
    freepikQuery: '3D render of dark metallic premium credit card with airport lounge ambiance',
    status: 'placeholder',
  },
  'us/personal-finance/sofi-personal-loans-review': {
    src: '/images/content/us/personal-finance/sofi-personal-loans-review.webp',
    alt: 'SoFi personal loan application interface',
    freepikQuery: 'loan application form on modern device with approval checkmark dark minimal',
    status: 'placeholder',
  },
  'us/personal-finance/credit-cards-comparison': {
    src: '/images/content/us/personal-finance/credit-cards-comparison.webp',
    alt: 'Credit card comparison overview',
    freepikQuery: '3D render of three credit cards fanned out with comparison arrows dark background',
    status: 'placeholder',
  },
  'us/personal-finance/best-robo-advisors': {
    src: '/images/content/us/personal-finance/best-robo-advisors.webp',
    alt: 'Best robo-advisors 2026 comparison — automated investing platforms',
    freepikQuery: '3D render of automated portfolio dashboard with AI robot managing investments dark fintech background',
    status: 'optimized',
  },

  // ── UK Trading ──
  'uk/trading/etoro-review': {
    src: '/images/content/uk/trading/etoro-review.webp',
    alt: 'eToro UK trading platform',
    freepikQuery: 'social trading app with copy trading feature dark mode uk stocks',
    status: 'placeholder',
  },
  'uk/trading/hargreaves-lansdown-review': {
    src: '/images/content/uk/trading/hargreaves-lansdown-review.webp',
    alt: 'Hargreaves Lansdown investment platform',
    freepikQuery: 'investment platform dashboard with portfolio pie chart dark british',
    status: 'placeholder',
  },
  'uk/trading/ig-markets-review': {
    src: '/images/content/uk/trading/ig-markets-review.webp',
    alt: 'IG Markets CFD trading platform',
    freepikQuery: 'professional cfd trading interface with spread indicators dark',
    status: 'placeholder',
  },
  'uk/trading/plus500-review': {
    src: '/images/content/uk/trading/plus500-review.webp',
    alt: 'Plus500 trading app interface',
    freepikQuery: 'clean trading app interface with buy sell buttons dark modern',
    status: 'placeholder',
  },

  // ── UK Personal Finance (ISAs) ──
  'uk/personal-finance/vanguard-isa-review': {
    src: '/images/content/uk/personal-finance/vanguard-isa-review.webp',
    alt: 'Vanguard ISA low-cost investment platform',
    freepikQuery: 'investment growth chart climbing steadily with green uptrend dark minimal',
    status: 'placeholder',
  },
  'uk/personal-finance/hargreaves-lansdown-isa-review': {
    src: '/images/content/uk/personal-finance/hargreaves-lansdown-isa-review.webp',
    alt: 'Hargreaves Lansdown Stocks & Shares ISA',
    freepikQuery: 'stock and shares isa account with british pound shield dark',
    status: 'placeholder',
  },
  'uk/personal-finance/trading-212-isa-review': {
    src: '/images/content/uk/personal-finance/trading-212-isa-review.webp',
    alt: 'Trading 212 free ISA platform',
    freepikQuery: 'commission free trading app with pie chart portfolio dark',
    status: 'placeholder',
  },

  // ── CA Forex ──
  'ca/forex/questrade-review': {
    src: '/images/content/ca/forex/questrade-review.webp',
    alt: 'Questrade Canadian forex and investment platform',
    freepikQuery: 'forex trading platform with cad usd pair chart dark professional',
    status: 'placeholder',
  },
  'ca/forex/oanda-review': {
    src: '/images/content/ca/forex/oanda-review.webp',
    alt: 'OANDA forex trading platform',
    freepikQuery: 'currency exchange rate display with world map dark',
    status: 'placeholder',
  },

  // ── CA Personal Finance (Wealthsimple) ──
  'ca/personal-finance/wealthsimple-review': {
    src: '/images/content/ca/personal-finance/wealthsimple-review.webp',
    alt: 'Wealthsimple investing platform overview',
    freepikQuery: '3D render of modern investment app with portfolio growth chart minimal dark clean',
    status: 'placeholder',
  },
  'ca/personal-finance/wealthsimple-vs-questrade': {
    src: '/images/content/ca/personal-finance/wealthsimple-vs-questrade.webp',
    alt: 'Wealthsimple vs Questrade comparison',
    freepikQuery: 'two investment apps side by side comparison with versus symbol dark',
    status: 'placeholder',
  },

  // ── AU Forex ──
  'au/forex/pepperstone-review': {
    src: '/images/content/au/forex/pepperstone-review.webp',
    alt: 'Pepperstone forex trading platform',
    freepikQuery: 'forex metatrader platform with spread data dark professional',
    status: 'placeholder',
  },
  'au/forex/ic-markets-review': {
    src: '/images/content/au/forex/ic-markets-review.webp',
    alt: 'IC Markets raw spread trading environment',
    freepikQuery: 'raw spread ecn trading interface with depth of market dark',
    status: 'placeholder',
  },

  // ── AU Personal Finance (Home Loans) ──
  'au/personal-finance/commbank-home-loan-review': {
    src: '/images/content/au/personal-finance/commbank-home-loan-review.webp',
    alt: 'CommBank home loan calculator and property finance',
    freepikQuery: '3D render of modern australian house with calculator and keys dark warm background',
    status: 'placeholder',
  },
  'au/personal-finance/athena-home-loans-review': {
    src: '/images/content/au/personal-finance/athena-home-loans-review.webp',
    alt: 'Athena Home Loans digital mortgage platform',
    freepikQuery: '3D render of house with descending rate arrow showing lowest rate dark',
    status: 'placeholder',
  },
  'au/personal-finance/ubank-home-loan-review': {
    src: '/images/content/au/personal-finance/ubank-home-loan-review.webp',
    alt: 'ubank home loan digital banking experience',
    freepikQuery: 'mobile banking home loan approval on phone screen dark modern',
    status: 'placeholder',
  },
};

// ─────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────

/**
 * Get the hero image for a pillar page.
 * Returns the asset if it exists and has been optimized, null otherwise.
 */
export function getPillarHeroImage(market: string, category: string): ImageAsset | null {
  return pillarHeroImages[market]?.[category] ?? null;
}

/**
 * Get the image for a specific review page.
 * Key format: "{market}/{category}/{slug}"
 */
export function getReviewImage(market: string, category: string, slug: string): ImageAsset | null {
  const key = `${market}/${category}/${slug}`;
  return reviewImages[key] ?? null;
}

/**
 * Check if an image file actually exists on disk (for build-time checks).
 * Called by RegionalHeroImage to decide: show real image or gradient fallback.
 */
export function isImageReady(asset: ImageAsset): boolean {
  return asset.status === 'optimized';
}

/**
 * Get all assets that still need to be downloaded.
 */
export function getPendingAssets(): { type: string; key: string; asset: ImageAsset }[] {
  const pending: { type: string; key: string; asset: ImageAsset }[] = [];

  for (const [market, categories] of Object.entries(pillarHeroImages)) {
    for (const [category, asset] of Object.entries(categories)) {
      if (asset.status !== 'optimized') {
        pending.push({ type: 'pillar', key: `${market}/${category}`, asset });
      }
    }
  }

  for (const [key, asset] of Object.entries(reviewImages)) {
    if (asset.status !== 'optimized') {
      pending.push({ type: 'review', key, asset });
    }
  }

  return pending;
}
