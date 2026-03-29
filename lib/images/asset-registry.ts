/**
 * Image Asset Registry — Central mapping of all visual assets per market/category/slug.
 *
 * DESIGN SYSTEM: Light Trust Design (Navy #1B4F8C / Gold #F5A623 / White/Sky backgrounds)
 * STYLE:         Professional editorial photography — agency feel, real people, clean devices.
 *                NO dark backgrounds. NO glassmorphism. NO 3D renders on black.
 *                YES: bright offices, clean flat lays, professional analysts, device mockups on white.
 *
 * WORKFLOW:
 * 1. Download image from Freepik Premium (2000+ px width, landscape preferred)
 * 2. Drop into public/images/content/[market]/[category]/
 * 3. Run: node scripts/optimize-images.mjs --all
 * 4. Set status: 'optimized' in this registry
 * 5. RegionalHeroImage & SmartImage auto-resolve from here
 *
 * NAMING CONVENTION:
 *   public/images/content/{market}/{category}/{slug}.webp
 *   Example: public/images/content/us/trading/etoro-review.webp
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
      name: 'Wall Street Professional',
      description: 'Professional traders, clean trading terminals, light editorial — real analyst feel',
      colorPalette: 'White/Light grey backgrounds, Navy blue accents, Gold highlights',
      freepikTags: [
        'financial analyst trading screen office bright',
        'stock market dashboard light professional',
        'trader working multiple monitors bright office',
        'investment portfolio analysis clean white background',
      ],
    },
    'personal-finance': {
      name: 'Modern Wealth Management',
      description: 'Clean credit cards on white, professional financial planning, lifestyle editorial',
      colorPalette: 'White/Cream backgrounds, Gold/Navy card details',
      freepikTags: [
        'credit card white background professional flat lay',
        'personal finance planning desk clean minimal',
        'financial advisor consultation bright office',
        'premium credit cards on marble white editorial',
      ],
    },
    'ai-tools': {
      name: 'Smart Professional Tech',
      description: 'Clean AI interface on bright devices, professional workspace with tech tools',
      colorPalette: 'White/Light blue backgrounds, Navy/Gold UI elements',
      freepikTags: [
        'ai software interface on laptop white background professional',
        'business professional using ai tool bright office',
        'clean fintech dashboard on screen light minimal',
        'artificial intelligence business tool white editorial',
      ],
    },
    cybersecurity: {
      name: 'Enterprise Security',
      description: 'Professional IT security, clean shield graphics on light, business protection editorial',
      colorPalette: 'White/Light grey, Navy shield icons, Green trust indicators',
      freepikTags: [
        'cybersecurity professional office bright white background',
        'digital security shield icon clean white minimal',
        'IT security business team bright editorial',
        'enterprise data protection clean professional',
      ],
    },
    'business-banking': {
      name: 'Corporate Banking Editorial',
      description: 'Professional business banking, clean fintech app on device, corporate editorial',
      colorPalette: 'White/Light grey backgrounds, Navy/Gold UI',
      freepikTags: [
        'business banking app on phone white background',
        'corporate finance professional bright office editorial',
        'fintech dashboard on tablet clean white',
        'business account management professional light',
      ],
    },
  },
  uk: {
    trading: {
      name: 'City of London Professional',
      description: 'British financial district editorial, professional traders, light London office',
      colorPalette: 'White/Light backgrounds, Deep Navy, Gold accents',
      freepikTags: [
        'london financial professional office bright editorial',
        'uk trading platform on screen light professional',
        'british business analyst clean office white',
        'london city finance professional daylight',
      ],
    },
    'personal-finance': {
      name: 'British Wealth Planning',
      description: 'ISA and investment editorial, British professional financial advisor, clean and bright',
      colorPalette: 'White/Cream, Navy, subtle green growth indicators',
      freepikTags: [
        'investment savings isa account white background professional',
        'financial planning uk advisor clean office bright',
        'british pound investment growth chart light minimal',
        'wealth management professional meeting bright editorial',
      ],
    },
    'ai-tools': {
      name: 'Smart Professional Tech',
      description: 'Clean AI business tools editorial — same feel as US, professional light workspace',
      colorPalette: 'White/Light blue backgrounds, Navy/Gold UI elements',
      freepikTags: [
        'ai productivity tool laptop bright white office',
        'professional using ai assistant clean minimal',
        'machine learning business software light editorial',
      ],
    },
    cybersecurity: {
      name: 'Enterprise Security',
      description: 'Professional IT security editorial — clean, light, trustworthy',
      colorPalette: 'White/Light grey, Navy, Green trust indicators',
      freepikTags: [
        'cybersecurity business protection bright professional',
        'digital security team office editorial light',
        'enterprise firewall clean white background',
      ],
    },
    'business-banking': {
      name: 'Neobank Professional',
      description: 'Starling/Revolut/Tide app editorial — mobile-first, clean, professional light',
      colorPalette: 'White/Light backgrounds, Navy, Gold',
      freepikTags: [
        'neobank app phone white background flat lay professional',
        'mobile business banking clean editorial light',
        'fintech business card app bright minimal white',
        'digital business bank professional editorial',
      ],
    },
  },
  ca: {
    forex: {
      name: 'Canadian FX Professional',
      description: 'Clean currency trading editorial, professional Canadian finance, light workspace',
      colorPalette: 'White/Light grey, Navy/Red Canadian accents',
      freepikTags: [
        'forex trading platform laptop white background professional',
        'currency exchange cad usd clean editorial light',
        'canadian finance professional bright office',
        'foreign exchange trading clean minimal light',
      ],
    },
    'personal-finance': {
      name: 'Canadian Modern Finance',
      description: 'Wealthsimple-inspired clean editorial, modern Canadian wealth management, light',
      colorPalette: 'White/Light backgrounds, Navy/Emerald accents',
      freepikTags: [
        'investment app portfolio clean white background minimal',
        'robo advisor wealth management light editorial professional',
        'canadian financial planning clean bright workspace',
        'portfolio growth chart clean minimal white background',
      ],
    },
    'ai-tools': {
      name: 'Smart Professional Tech',
      description: 'Clean AI tools editorial, professional light workspace',
      colorPalette: 'White/Light blue backgrounds, Navy/Gold',
      freepikTags: [
        'ai business tool on laptop white editorial clean',
        'artificial intelligence professional workspace light minimal',
      ],
    },
    cybersecurity: {
      name: 'Enterprise Security',
      description: 'Professional IT security editorial, light and trustworthy',
      colorPalette: 'White/Light grey, Navy, Green',
      freepikTags: [
        'cybersecurity professional team bright white editorial',
        'digital security clean business light background',
      ],
    },
    'business-banking': {
      name: 'Corporate Banking Editorial',
      description: 'Professional business banking Canada, clean fintech, light editorial',
      colorPalette: 'White/Light grey, Navy/Gold',
      freepikTags: [
        'business banking app tablet white background professional',
        'corporate fintech clean editorial bright light canada',
      ],
    },
  },
  au: {
    trading: {
      name: 'ASX Professional',
      description: 'Australian trading editorial, professional analyst, clean bright office',
      colorPalette: 'White/Light backgrounds, Navy/Gold, Teal accents',
      freepikTags: [
        'stock market trading professional office bright australia',
        'asx trading platform screen clean light editorial',
        'financial analyst trading charts bright workspace',
        'investment portfolio australia professional light',
      ],
    },
    forex: {
      name: 'FX Global Professional',
      description: 'Australian forex editorial, clean currency trading, professional light workspace',
      colorPalette: 'White/Light backgrounds, Navy/Teal',
      freepikTags: [
        'forex trading platform clean white background professional',
        'currency trading aud professional office bright',
        'foreign exchange australia clean editorial light',
        'fx broker trading screen minimal white',
      ],
    },
    'personal-finance': {
      name: 'Aussie Home & Wealth',
      description: 'Australian property and mortgage editorial, clean professional, bright home finance',
      colorPalette: 'White/Warm light backgrounds, Navy/Gold/Emerald',
      freepikTags: [
        'australian home loan mortgage professional clean bright',
        'property investment house key white background editorial',
        'home finance planning australia clean minimal light',
        'mortgage calculator professional desk bright editorial',
      ],
    },
    'ai-tools': {
      name: 'Smart Professional Tech',
      description: 'Clean AI tools editorial, professional light workspace Australia',
      colorPalette: 'White/Light backgrounds, Navy/Gold',
      freepikTags: [
        'ai software tool laptop clean white professional editorial',
        'artificial intelligence business australia bright light',
      ],
    },
    cybersecurity: {
      name: 'Enterprise Security',
      description: 'Professional IT security editorial, clean light, trustworthy Australia',
      colorPalette: 'White/Light grey, Navy, Green',
      freepikTags: [
        'cybersecurity business protection bright editorial australia',
        'digital security professional team clean light',
      ],
    },
    'business-banking': {
      name: 'Corporate Banking Editorial',
      description: 'Australian business banking, clean fintech editorial, professional light',
      colorPalette: 'White/Light grey, Navy/Gold',
      freepikTags: [
        'business banking app australia white background professional',
        'corporate fintech editorial clean light aud',
      ],
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
  /** Exact Freepik search query — updated for Light Trust Design */
  freepikQuery?: string;
  /** Whether this image has been downloaded and optimized */
  status: 'optimized' | 'downloaded' | 'optimized';
}

/**
 * PILLAR PAGE HERO IMAGES
 * One hero image per market/category combination (21 total).
 * Path pattern: /images/content/{market}/{category}/hero.webp
 * Style: Light editorial photography — professional, bright, agency feel.
 */
export const pillarHeroImages: Record<string, Record<string, ImageAsset>> = {
  us: {
    trading: {
      src: '/images/content/us/trading/hero.webp',
      alt: 'Professional financial analyst reviewing US trading platforms',
      freepikQuery: 'financial analyst trading multiple screens bright professional office white background',
      status: 'optimized',
    },
    'personal-finance': {
      src: '/images/content/us/personal-finance/hero.webp',
      alt: 'Premium credit cards and personal finance planning',
      freepikQuery: 'premium credit cards flat lay white marble background professional editorial clean',
      status: 'optimized',
    },
    'ai-tools': {
      src: '/images/content/us/ai-tools/hero.webp',
      alt: 'AI-powered financial tools on professional workstation',
      freepikQuery: 'professional using ai software laptop bright clean office white background editorial',
      status: 'optimized',
    },
    cybersecurity: {
      src: '/images/content/us/cybersecurity/hero.webp',
      alt: 'Enterprise cybersecurity professional protecting business data',
      freepikQuery: 'cybersecurity professional bright office clean white background enterprise protection editorial',
      status: 'optimized',
    },
    'business-banking': {
      src: '/images/content/us/business-banking/hero.webp',
      alt: 'Business banking dashboard and corporate account management',
      freepikQuery: 'business banking app on tablet white background professional editorial clean fintech',
      status: 'optimized',
    },
    'gold-investing': {
      src: '/images/content/us/gold-investing/hero.webp',
      alt: 'Physical gold bars, gold IRAs and precious metals investing in the United States',
      freepikQuery: 'gold bars precious metals investment white background professional editorial clean',
      status: 'optimized',
    },
    'debt-relief': {
      src: '/images/content/us/debt-relief/hero.webp',
      alt: 'Financial calculator and debt analysis documents for US debt relief programs',
      freepikQuery: 'financial calculator debt documents white background professional editorial clean',
      status: 'optimized',
    },
  },
  uk: {
    trading: {
      src: '/images/content/uk/trading/hero.webp',
      alt: 'London financial professional reviewing UK trading platforms',
      freepikQuery: 'london financial professional office bright editorial trading screen white clean',
      status: 'optimized',
    },
    'personal-finance': {
      src: '/images/content/uk/personal-finance/hero.webp',
      alt: 'UK ISA and investment account management',
      freepikQuery: 'investment savings professional british advisor bright clean white office editorial',
      status: 'optimized',
    },
    'ai-tools': {
      src: '/images/content/uk/ai-tools/hero.webp',
      alt: 'AI productivity tools for UK financial professionals',
      freepikQuery: 'professional ai productivity tool laptop bright white office uk editorial clean',
      status: 'optimized',
    },
    cybersecurity: {
      src: '/images/content/uk/cybersecurity/hero.webp',
      alt: 'UK enterprise cybersecurity and business data protection',
      freepikQuery: 'cybersecurity enterprise uk professional bright office editorial clean light',
      status: 'optimized',
    },
    'business-banking': {
      src: '/images/content/uk/business-banking/hero.webp',
      alt: 'UK neobank and business banking platforms',
      freepikQuery: 'neobank mobile app white background flat lay professional editorial clean british',
      status: 'optimized',
    },
  },
  ca: {
    housing: {
      src: '/images/content/ca/housing/hero.webp',
      alt: 'Canadian residential home with stone facade, garage and garden — housing market',
      freepikQuery: 'yellow scandinavian house vibrant autumn leaves orange maple trees blue sky residential',
      status: 'optimized',
    },
    forex: {
      src: '/images/content/ca/forex/hero.webp',
      alt: 'Canadian forex trading platform and currency exchange',
      freepikQuery: 'forex trading platform laptop white background professional clean editorial canada',
      status: 'optimized',
    },
    'personal-finance': {
      src: '/images/content/ca/personal-finance/hero.webp',
      alt: 'Canadian personal finance and Wealthsimple investing',
      freepikQuery: 'investment portfolio app clean white background minimal professional editorial canada',
      status: 'optimized',
    },
    'ai-tools': {
      src: '/images/content/ca/ai-tools/hero.webp',
      alt: 'AI tools for Canadian financial professionals',
      freepikQuery: 'ai business software laptop bright white professional workspace editorial clean',
      status: 'optimized',
    },
    cybersecurity: {
      src: '/images/content/ca/cybersecurity/hero.webp',
      alt: 'Canadian business cybersecurity and data protection',
      freepikQuery: 'cybersecurity professional bright clean white office business editorial',
      status: 'optimized',
    },
    'business-banking': {
      src: '/images/content/ca/business-banking/hero.webp',
      alt: 'Canadian business banking and fintech platforms',
      freepikQuery: 'business banking app tablet white background professional clean editorial',
      status: 'optimized',
    },
    'tax-efficient-investing': {
      src: '/images/content/ca/tax-efficient-investing/hero.webp',
      alt: 'Tax-efficient investing in Canada — TFSA, RRSP and portfolio strategy',
      freepikQuery: 'canada tax investing portfolio rrsp tfsa professional clean editorial',
      status: 'optimized',
    },
    'gold-investing': {
      src: '/images/content/ca/gold-investing/hero.webp',
      alt: 'Gold bullion bars and coins — precious metals investing in Canada 2026',
      freepikQuery: 'gold bullion bars coins precious metals investing canada professional clean editorial',
      status: 'optimized',
    },
  },
  au: {
    trading: {
      src: '/images/content/au/trading/hero.webp',
      alt: 'Australian trading platforms and ASX market analysis',
      freepikQuery: 'financial trading professional bright office australia editorial clean white background',
      status: 'optimized',
    },
    forex: {
      src: '/images/content/au/forex/hero.webp',
      alt: 'Australian forex trading and FX broker platforms',
      freepikQuery: 'forex trading platform clean white background professional editorial australia light',
      status: 'optimized',
    },
    'personal-finance': {
      src: '/images/content/au/personal-finance/hero.webp',
      alt: 'Australian home loans and personal finance planning',
      freepikQuery: '3D render of modern house with golden key and mortgage documents dark elegant background',
      status: 'optimized',
    },
    'ai-tools': {
      src: '/images/content/au/ai-tools/hero.webp',
      alt: 'AI tools for Australian financial services professionals',
      freepikQuery: 'ai software professional laptop bright white editorial clean australia workspace',
      status: 'optimized',
    },
    cybersecurity: {
      src: '/images/content/au/cybersecurity/hero.webp',
      alt: 'Australian business cybersecurity solutions',
      freepikQuery: 'cybersecurity enterprise professional bright editorial clean white australia',
      status: 'optimized',
    },
    'business-banking': {
      src: '/images/content/au/business-banking/hero.webp',
      alt: 'Australian business banking and neobank platforms',
      freepikQuery: 'business banking app white background professional editorial clean australia',
      status: 'optimized',
    },
  },
};

/**
 * REVIEW PAGE IMAGES
 * Product screenshots, device mockups, or professional editorial for individual reviews.
 * Path pattern: /images/content/{market}/{category}/{slug}.webp
 * Style: Clean device mockups on white/light backgrounds, or professional editorial photography.
 */
export const reviewImages: Record<string, ImageAsset> = {
  // ── US Trading ──
  'us/trading/etoro-review': {
    src: '/images/content/us/trading/etoro-review.webp',
    alt: 'eToro social trading platform interface on laptop',
    freepikQuery: 'trading app on laptop screen white background professional clean mockup editorial',
    status: 'optimized',
  },
  'us/trading/td-ameritrade-review': {
    src: '/images/content/us/trading/td-ameritrade-review.webp',
    alt: 'TD Ameritrade thinkorswim professional trading platform',
    freepikQuery: 'professional trading platform on monitor clean bright office editorial',
    status: 'optimized',
  },
  'us/trading/interactive-brokers-review': {
    src: '/images/content/us/trading/interactive-brokers-review.webp',
    alt: 'Interactive Brokers professional trading workstation',
    freepikQuery: 'trader multiple monitors professional bright office clean editorial workstation',
    status: 'optimized',
  },

  // ── US Personal Finance ──
  'us/personal-finance/amex-gold-card-review': {
    src: '/images/content/us/personal-finance/amex-gold-card-review.webp',
    alt: 'American Express Gold Card premium rewards',
    freepikQuery: 'gold premium credit card flat lay white background professional editorial clean',
    status: 'optimized',
  },
  'us/personal-finance/chase-sapphire-preferred-review': {
    src: '/images/content/us/personal-finance/chase-sapphire-preferred-review.webp',
    alt: 'Chase Sapphire Preferred travel rewards card',
    freepikQuery: 'blue premium travel credit card white background flat lay clean editorial',
    status: 'optimized',
  },
  'us/personal-finance/chase-sapphire-reserve-review': {
    src: '/images/content/us/personal-finance/chase-sapphire-reserve-review.webp',
    alt: 'Chase Sapphire Reserve luxury travel card',
    freepikQuery: 'premium metal credit card white marble flat lay editorial professional clean',
    status: 'optimized',
  },
  'us/personal-finance/sofi-personal-loans-review': {
    src: '/images/content/us/personal-finance/sofi-personal-loans-review.webp',
    alt: 'SoFi personal loan application interface',
    freepikQuery: 'loan application approval on phone screen white background clean editorial minimal',
    status: 'optimized',
  },
  'us/personal-finance/credit-cards-comparison': {
    src: '/images/content/us/personal-finance/credit-cards-comparison.webp',
    alt: 'Credit card comparison overview',
    freepikQuery: 'multiple credit cards comparison flat lay white background professional editorial clean',
    status: 'optimized',
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
    alt: 'eToro UK trading platform on laptop',
    freepikQuery: 'trading platform laptop clean white office background professional editorial uk',
    status: 'optimized',
  },
  'uk/trading/hargreaves-lansdown-review': {
    src: '/images/content/uk/trading/hargreaves-lansdown-review.webp',
    alt: 'Hargreaves Lansdown investment platform',
    freepikQuery: 'investment platform dashboard laptop white background professional editorial british clean',
    status: 'optimized',
  },
  'uk/trading/ig-markets-review': {
    src: '/images/content/uk/trading/ig-markets-review.webp',
    alt: 'IG Markets CFD and spread betting platform',
    freepikQuery: 'professional trading platform cfd on screen clean bright office editorial',
    status: 'optimized',
  },
  'uk/trading/plus500-review': {
    src: '/images/content/uk/trading/plus500-review.webp',
    alt: 'Plus500 trading app on mobile and desktop',
    freepikQuery: 'trading app phone and laptop white background clean professional editorial minimal',
    status: 'optimized',
  },

  // ── UK Personal Finance (ISAs) ──
  'uk/personal-finance/vanguard-isa-review': {
    src: '/images/content/uk/personal-finance/vanguard-isa-review.webp',
    alt: 'Vanguard ISA low-cost investment platform',
    freepikQuery: 'investment growth chart on screen white background clean professional editorial minimal',
    status: 'optimized',
  },
  'uk/personal-finance/hargreaves-lansdown-isa-review': {
    src: '/images/content/uk/personal-finance/hargreaves-lansdown-isa-review.webp',
    alt: 'Hargreaves Lansdown Stocks & Shares ISA',
    freepikQuery: 'stocks shares investment account on laptop clean white background british editorial',
    status: 'optimized',
  },
  'uk/personal-finance/trading-212-isa-review': {
    src: '/images/content/uk/personal-finance/trading-212-isa-review.webp',
    alt: 'Trading 212 commission-free ISA platform',
    freepikQuery: 'commission free investment app phone white background clean minimal editorial professional',
    status: 'optimized',
  },

  // ── CA Forex ──
  'ca/forex/questrade-review': {
    src: '/images/content/ca/forex/questrade-review.webp',
    alt: 'Questrade Canadian forex and investment platform',
    freepikQuery: 'forex trading platform laptop white background professional clean editorial canada',
    status: 'optimized',
  },
  'ca/forex/oanda-review': {
    src: '/images/content/ca/forex/oanda-review.webp',
    alt: 'OANDA forex trading platform',
    freepikQuery: 'currency trading platform professional clean white background editorial minimal',
    status: 'optimized',
  },

  // ── CA Personal Finance ──
  'ca/personal-finance/wealthsimple-review': {
    src: '/images/content/ca/personal-finance/wealthsimple-review.webp',
    alt: 'Wealthsimple investing platform overview',
    freepikQuery: 'investment app portfolio screen white background clean minimal professional editorial canada',
    status: 'optimized',
  },
  'ca/personal-finance/wealthsimple-vs-questrade': {
    src: '/images/content/ca/personal-finance/wealthsimple-vs-questrade.webp',
    alt: 'Wealthsimple vs Questrade comparison',
    freepikQuery: 'two investment platform apps comparison white background clean professional editorial',
    status: 'optimized',
  },

  // ── AU Forex ──
  'au/forex/pepperstone-review': {
    src: '/images/content/au/forex/pepperstone-review.webp',
    alt: 'Pepperstone forex trading platform',
    freepikQuery: 'forex trading metatrader platform laptop clean white background professional editorial',
    status: 'optimized',
  },
  'au/forex/ic-markets-review': {
    src: '/images/content/au/forex/ic-markets-review.webp',
    alt: 'IC Markets raw spread ECN trading environment',
    freepikQuery: 'professional ecn trading platform laptop white background clean editorial australia',
    status: 'optimized',
  },

  // ── AU Personal Finance ──
  'au/personal-finance/commbank-home-loan-review': {
    src: '/images/content/au/personal-finance/commbank-home-loan-review.webp',
    alt: 'CommBank home loan calculator and property finance',
    freepikQuery: 'home loan mortgage professional advisor clean bright office australia editorial white',
    status: 'optimized',
  },
  'au/personal-finance/athena-home-loans-review': {
    src: '/images/content/au/personal-finance/athena-home-loans-review.webp',
    alt: 'Athena Home Loans digital mortgage platform',
    freepikQuery: 'digital mortgage app phone white background clean minimal professional editorial australia',
    status: 'optimized',
  },
  'au/personal-finance/ubank-home-loan-review': {
    src: '/images/content/au/personal-finance/ubank-home-loan-review.webp',
    alt: 'ubank home loan digital banking experience',
    freepikQuery: 'mobile home loan banking app screen clean white background professional editorial minimal',
    status: 'optimized',
  },
};

// ─────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────

/**
 * Get the hero image for a pillar page.
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
 * Check if an image file is ready to serve.
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
