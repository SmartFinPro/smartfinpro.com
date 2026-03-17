/**
 * fix-link-scores.mjs
 * ─────────────────────────────────────────────────────────────────
 * Adds internal + external links to MDX files with L < 98.
 * Appends a "## Further Resources" section at the end of each file.
 *
 * Target: L = 98 (8 internal × 7 + 6 external × 7 = max 98)
 * Formula: linkScore = min(min(internal,8)×7 + min(external,6)×7, 100)
 * ─────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import matter from 'gray-matter';

const contentDir = './content';
const DRY_RUN = process.argv.includes('--dry-run');

// ── 1. External links per category (curated, credible sources) ────
const EXTERNAL_LINKS = {
  'trading': [
    { title: 'SEC — Investor Education', url: 'https://www.investor.gov' },
    { title: 'FINRA BrokerCheck', url: 'https://brokercheck.finra.org' },
    { title: 'CFTC — Commodity Futures', url: 'https://www.cftc.gov' },
    { title: 'Investopedia — Trading Basics', url: 'https://www.investopedia.com/trading-4427765' },
    { title: 'SIPC — Investor Protection', url: 'https://www.sipc.org' },
    { title: 'FCA — Financial Conduct Authority', url: 'https://www.fca.org.uk' },
  ],
  'forex': [
    { title: 'NFA — National Futures Association', url: 'https://www.nfa.futures.org' },
    { title: 'CFTC — Forex Regulation', url: 'https://www.cftc.gov/LearnAndProtect/forex' },
    { title: 'FCA — FX Regulation UK', url: 'https://www.fca.org.uk/markets/forex' },
    { title: 'ASIC — Forex Regulation AU', url: 'https://www.asic.gov.au' },
    { title: 'BIS — Triennial FX Survey', url: 'https://www.bis.org/statistics/rpfx22.htm' },
    { title: 'Investopedia — Forex Guide', url: 'https://www.investopedia.com/forex-4689855' },
  ],
  'personal-finance': [
    { title: 'CFPB — Consumer Financial Protection', url: 'https://www.consumerfinance.gov' },
    { title: 'IRS — Tax Information', url: 'https://www.irs.gov' },
    { title: 'Federal Reserve — Consumer Info', url: 'https://www.federalreserve.gov/consumerinfo.htm' },
    { title: 'AnnualCreditReport.com', url: 'https://www.annualcreditreport.com' },
    { title: 'FDIC — Bank & Account Protection', url: 'https://www.fdic.gov' },
    { title: 'Investopedia — Personal Finance', url: 'https://www.investopedia.com/personal-finance-4427760' },
  ],
  'business-banking': [
    { title: 'FDIC — Federal Deposit Insurance', url: 'https://www.fdic.gov' },
    { title: 'Federal Reserve — Banking Regulation', url: 'https://www.federalreserve.gov' },
    { title: 'OCC — National Bank Oversight', url: 'https://www.occ.gov' },
    { title: 'FINTRAC — Canada AML', url: 'https://www.fintrac-canafe.gc.ca' },
    { title: 'FCA — UK Business Banking', url: 'https://www.fca.org.uk' },
    { title: 'APRA — Australian Banking', url: 'https://www.apra.gov.au' },
  ],
  'ai-tools': [
    { title: 'NIST — AI Risk Management', url: 'https://www.nist.gov/artificial-intelligence' },
    { title: 'Stanford AI Index Report', url: 'https://aiindex.stanford.edu' },
    { title: 'OpenAI Research', url: 'https://openai.com/research' },
    { title: 'MIT Technology Review — AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence' },
    { title: 'OECD AI Policy Observatory', url: 'https://oecd.ai' },
    { title: 'Gartner — AI Predictions', url: 'https://www.gartner.com/en/information-technology/insights/artificial-intelligence' },
  ],
  'cybersecurity': [
    { title: 'NIST Cybersecurity Framework', url: 'https://www.nist.gov/cybersecurity' },
    { title: 'CISA — Cybersecurity Agency', url: 'https://www.cisa.gov' },
    { title: 'NCSC — UK Cyber Security', url: 'https://www.ncsc.gov.uk' },
    { title: 'ASD — Australian Cyber Security', url: 'https://www.cyber.gov.au' },
    { title: 'ENISA — EU Cybersecurity Agency', url: 'https://www.enisa.europa.eu' },
    { title: 'Verizon DBIR Report', url: 'https://www.verizon.com/business/resources/reports/dbir' },
  ],
  'gold-investing': [
    { title: 'World Gold Council', url: 'https://www.gold.org' },
    { title: 'Perth Mint — Gold Bullion', url: 'https://www.perthmint.com' },
    { title: 'ATO — Gold Investment Tax AU', url: 'https://www.ato.gov.au/individuals-and-families/investments-and-assets/crypto-asset-investments/gold-bullion' },
    { title: 'Investopedia — Gold Investing', url: 'https://www.investopedia.com/articles/basics/09/precious-metals-gold-silver-platinum.asp' },
    { title: 'London Bullion Market', url: 'https://www.lbma.org.uk' },
    { title: 'CME Gold Futures', url: 'https://www.cmegroup.com/markets/metals/precious/gold.html' },
  ],
  'superannuation': [
    { title: 'ATO — Superannuation Guide', url: 'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super' },
    { title: 'APRA — Super Fund Statistics', url: 'https://www.apra.gov.au/annual-superannuation-bulletin' },
    { title: 'ASIC — MoneySmart Super', url: 'https://moneysmart.gov.au/grow-your-super' },
    { title: 'Super.com.au Comparison', url: 'https://www.superguide.com.au' },
    { title: 'SMSF Association', url: 'https://www.smsfassociation.com' },
    { title: 'Australian Retirement Trust', url: 'https://www.australianretirementtrust.com.au' },
  ],
  'savings': [
    { title: 'FDIC — Savings Account Protection', url: 'https://www.fdic.gov/resources/deposit-insurance' },
    { title: 'Federal Reserve — Interest Rates', url: 'https://www.federalreserve.gov/releases/h15' },
    { title: 'FSCS — UK Savings Protection', url: 'https://www.fscs.org.uk' },
    { title: 'APRA — ADI Statistics AU', url: 'https://www.apra.gov.au/monthly-authorised-deposit-taking-institution-statistics' },
    { title: 'CDIC — Canada Deposit Insurance', url: 'https://www.cdic.ca' },
    { title: 'Investopedia — HYSA Guide', url: 'https://www.investopedia.com/best-high-yield-savings-accounts-4770633' },
  ],
  'housing': [
    { title: 'CMHC — Canadian Housing', url: 'https://www.cmhc-schl.gc.ca' },
    { title: 'Bank of Canada — Rate Decisions', url: 'https://www.bankofcanada.ca/rates/interest-rates/key-interest-rate' },
    { title: 'OSFI — Mortgage Stress Test', url: 'https://www.osfi-bsif.gc.ca' },
    { title: 'CREA — Canadian Real Estate', url: 'https://www.crea.ca/housing-market-stats' },
    { title: 'FHSA — First Home Savings Account', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html' },
    { title: 'Ratehub — Mortgage Rates', url: 'https://www.ratehub.ca/mortgage-rates' },
  ],
  'tax-efficient-investing': [
    { title: 'CRA — TFSA Guide', url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4466.html' },
    { title: 'CRA — RRSP Guide', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans.html' },
    { title: 'CRA — FHSA Guide', url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html' },
    { title: 'Wealthsimple Tax Guide', url: 'https://www.wealthsimple.com/en-ca/learn/tfsa-vs-rrsp' },
    { title: 'Financial Consumer Agency', url: 'https://www.canada.ca/en/financial-consumer-agency.html' },
    { title: 'CFA Institute — Investing', url: 'https://www.cfainstitute.org' },
  ],
  'remortgaging': [
    { title: 'FCA — Mortgage Regulation UK', url: 'https://www.fca.org.uk/consumers/mortgages' },
    { title: 'Bank of England — Base Rate', url: 'https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate' },
    { title: 'Money Saving Expert — Mortgages', url: 'https://www.moneysavingexpert.com/mortgages' },
    { title: 'Which? — Mortgage Guide', url: 'https://www.which.co.uk/money/mortgages-and-property' },
    { title: 'Rightmove — House Prices', url: 'https://www.rightmove.co.uk/house-prices.html' },
    { title: 'UK Finance — Mortgage Data', url: 'https://www.ukfinance.org.uk/data-and-research/data/mortgages' },
  ],
  'cost-of-living': [
    { title: 'ONS — UK Cost of Living', url: 'https://www.ons.gov.uk/economy/inflationandpriceindices' },
    { title: 'Ofgem — Energy Price Cap', url: 'https://www.ofgem.gov.uk/consumers/your-energy/your-energy-bills/energy-price-cap' },
    { title: 'Money Saving Expert — Bills', url: 'https://www.moneysavingexpert.com/utilities' },
    { title: 'Citizens Advice — Energy Help', url: 'https://www.citizensadvice.org.uk/consumer/energy' },
    { title: 'FCA — Cost of Living Resources', url: 'https://www.fca.org.uk/consumers/cost-of-living' },
    { title: 'UK Government — Household Support', url: 'https://www.gov.uk/cost-of-living' },
  ],
  'debt-relief': [
    { title: 'CFPB — Debt Relief Guide', url: 'https://www.consumerfinance.gov/consumer-tools/debt-collection' },
    { title: 'FTC — Debt Relief Scams', url: 'https://consumer.ftc.gov/articles/dealing-debt' },
    { title: 'NFCC — National Foundation for Credit Counseling', url: 'https://www.nfcc.org' },
    { title: 'IRS — Debt Forgiveness Tax', url: 'https://www.irs.gov/taxtopics/tc431' },
    { title: 'US Courts — Bankruptcy', url: 'https://www.uscourts.gov/services-forms/bankruptcy' },
    { title: 'Investopedia — Debt Relief', url: 'https://www.investopedia.com/terms/d/debtrelief.asp' },
  ],
  'credit-score': [
    { title: 'CFPB — Credit Reports', url: 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores' },
    { title: 'AnnualCreditReport.com', url: 'https://www.annualcreditreport.com' },
    { title: 'Experian — Credit Score Info', url: 'https://www.experian.com/blogs/ask-experian/credit-education/score-basics' },
    { title: 'FTC — Credit Repair Guide', url: 'https://consumer.ftc.gov/articles/credit-repair-how-help-yourself' },
    { title: 'MyFICO — Score Factors', url: 'https://www.myfico.com/credit-education/whats-in-your-credit-score' },
    { title: 'Investopedia — Credit Score', url: 'https://www.investopedia.com/terms/c/credit_score.asp' },
  ],
  'credit-repair': [
    { title: 'CFPB — Credit Repair Guide', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-credit-repair-company-en-1343' },
    { title: 'FTC — Credit Repair Scams', url: 'https://consumer.ftc.gov/articles/credit-repair-how-help-yourself' },
    { title: 'AnnualCreditReport.com', url: 'https://www.annualcreditreport.com' },
    { title: 'FICO — Credit Score Education', url: 'https://www.myfico.com/credit-education' },
    { title: 'Experian Boost', url: 'https://www.experian.com/consumer-products/score-boost.html' },
    { title: 'Investopedia — Credit Repair', url: 'https://www.investopedia.com/best-credit-repair-companies-4843898' },
  ],
  'default': [
    { title: 'Investopedia — Financial Education', url: 'https://www.investopedia.com' },
    { title: 'CFPB — Financial Tools', url: 'https://www.consumerfinance.gov' },
    { title: 'Federal Reserve — Consumer Guide', url: 'https://www.federalreserve.gov/consumerinfo.htm' },
    { title: 'FDIC — Financial Literacy', url: 'https://www.fdic.gov/consumers' },
    { title: 'CFA Institute — Standards', url: 'https://www.cfainstitute.org' },
    { title: 'World Bank — Finance Data', url: 'https://data.worldbank.org/topic/financial-sector' },
  ],
};

// ── 2. Inventory all MDX files ─────────────────────────────────────
function walk(dir, pages = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('_') && !entry.name.startsWith('.')) {
        walk(join(dir, entry.name), pages);
      }
    } else if (entry.name.endsWith('.mdx')) {
      const filePath = join(dir, entry.name);
      const raw = readFileSync(filePath, 'utf8');
      const { data } = matter(raw);
      const rel = relative(contentDir, filePath);
      const parts = rel.replace('.mdx', '').split('/');

      let url;
      if (parts[0] === 'us') url = '/' + parts.slice(1).join('/') + '/';
      else if (parts[0] === 'cross-market') url = '/' + parts.slice(1).join('/') + '/';
      else url = '/' + parts.join('/') + '/';

      const market = parts[0];
      const category = parts[1] || '';
      const slug = parts[parts.length - 1];
      const title = (data.seoTitle || data.title || slug).replace(/"/g, '').trim();
      const body = raw.replace(/^---[\s\S]*?---/m, '');
      const internal = (body.match(/\]\(\//g) || []).length;
      const external = (body.match(/\]\(https?:\/\//g) || []).length;
      const linkScore = Math.min(Math.min(internal, 8) * 7 + Math.min(external, 6) * 7, 100);

      pages.push({ filePath, rel, url, market, category, slug, title, internal, external, linkScore, raw });
    }
  }
  return pages;
}

const allPages = walk(contentDir);
console.log(`📂 Total MDX files: ${allPages.length}`);

// ── 3. Build category → pages map for internal links ──────────────
const categoryMap = {}; // key: "market/category" → [{url, title}]
for (const page of allPages) {
  // Skip index pages as link targets (not very specific)
  if (page.slug === 'index' || page.slug === 'index-new') continue;
  const key = `${page.market}/${page.category}`;
  if (!categoryMap[key]) categoryMap[key] = [];
  categoryMap[key].push({ url: page.url, title: page.title.slice(0, 60) });
}

// Cross-market keys for related markets
const MARKET_EQUIV = { us: ['uk', 'ca', 'au'], uk: ['us', 'ca', 'au'], ca: ['us', 'uk', 'au'], au: ['us', 'uk', 'ca'] };

function getInternalLinkCandidates(page, needed) {
  const selfUrl = page.url;
  const key = `${page.market}/${page.category}`;
  const candidates = new Map(); // url → title (deduplicated)

  // 1. Same market + category (most relevant)
  for (const p of (categoryMap[key] || [])) {
    if (p.url !== selfUrl) candidates.set(p.url, p.title);
  }

  // 2. Other markets, same category
  for (const otherMarket of (MARKET_EQUIV[page.market] || [])) {
    const otherKey = `${otherMarket}/${page.category}`;
    for (const p of (categoryMap[otherKey] || [])) {
      candidates.set(p.url, p.title);
    }
  }

  // 3. Other categories in same market (cross-category)
  for (const [k, pages] of Object.entries(categoryMap)) {
    if (k.startsWith(page.market + '/') && !k.endsWith('/' + page.category)) {
      for (const p of pages.slice(0, 2)) {
        if (candidates.size >= needed + 5) break;
        candidates.set(p.url, p.title);
      }
    }
  }

  // Return array, excluding self, limited to needed
  return [...candidates.entries()]
    .filter(([url]) => url !== selfUrl)
    .slice(0, needed)
    .map(([url, title]) => ({ url, title }));
}

function getExternalLinks(category, market, needed) {
  // Try exact category match first
  let links = EXTERNAL_LINKS[category] || [];

  // Market-specific adjustments
  if (market === 'uk' && category === 'business-banking') {
    links = [
      { title: 'FCA — UK Business Banking', url: 'https://www.fca.org.uk/firms/banking-payments' },
      { title: 'Bank of England — Prudential', url: 'https://www.bankofengland.co.uk/prudential-regulation' },
      { title: 'FRC — Financial Reporting', url: 'https://www.frc.org.uk' },
      { title: 'UK Finance — Data', url: 'https://www.ukfinance.org.uk' },
      { title: 'FSCS — Business Protection', url: 'https://www.fscs.org.uk' },
      { title: 'Companies House', url: 'https://www.gov.uk/government/organisations/companies-house' },
    ];
  }
  if (market === 'ca' && category === 'trading') {
    links = [
      { title: 'CIRO — Canadian Investment Regulation', url: 'https://www.ciro.ca' },
      { title: 'OSC — Ontario Securities', url: 'https://www.osc.ca' },
      { title: 'CSA — Canadian Securities', url: 'https://www.securities-administrators.ca' },
      { title: 'CDIC — Deposit Insurance', url: 'https://www.cdic.ca' },
      { title: 'Bank of Canada — Markets', url: 'https://www.bankofcanada.ca/markets' },
      { title: 'Investopedia — Canadian Investing', url: 'https://www.investopedia.com/canada-4781744' },
    ];
  }
  if (market === 'au' && category === 'trading') {
    links = [
      { title: 'ASIC — Investment Products', url: 'https://www.asic.gov.au/for-consumers/investing' },
      { title: 'ASX — Australian Securities', url: 'https://www.asx.com.au' },
      { title: 'RBA — Economic Data', url: 'https://www.rba.gov.au' },
      { title: 'ATO — Investment Tax', url: 'https://www.ato.gov.au/individuals-and-families/investments-and-assets' },
      { title: 'MoneySmart AU — Investing', url: 'https://moneysmart.gov.au/investing' },
      { title: 'Investopedia — Trading', url: 'https://www.investopedia.com/trading-4427765' },
    ];
  }

  if (links.length === 0) links = EXTERNAL_LINKS['default'];
  return links.slice(0, needed);
}

// ── 4. Generate "Further Resources" section ───────────────────────
function buildResourceSection(internalLinks, externalLinks) {
  const lines = [
    '',
    '## Further Resources',
    '',
  ];

  if (internalLinks.length > 0) {
    lines.push('### Related Reviews on SmartFinPro', '');
    for (const link of internalLinks) {
      lines.push(`- [${link.title}](${link.url})`);
    }
    lines.push('');
  }

  if (externalLinks.length > 0) {
    lines.push('### Official Sources & Regulators', '');
    for (const link of externalLinks) {
      lines.push(`- [${link.title}](${link.url})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── 5. Process all files that need more links ─────────────────────
let fixed = 0;
let skipped = 0;
const results = [];

for (const page of allPages) {
  // Skip if already has enough links
  if (page.linkScore >= 98) {
    skipped++;
    continue;
  }

  // Skip core/tool pages (no real content)
  if (page.category === '' || !page.category) {
    skipped++;
    continue;
  }

  // How many more do we need?
  const neededInternal = Math.max(0, 8 - page.internal);
  const neededExternal = Math.max(0, 6 - page.external);

  if (neededInternal === 0 && neededExternal === 0) {
    skipped++;
    continue;
  }

  // Get candidates
  const internalLinks = neededInternal > 0
    ? getInternalLinkCandidates(page, neededInternal)
    : [];
  const externalLinks = neededExternal > 0
    ? getExternalLinks(page.category, page.market, neededExternal)
    : [];

  if (internalLinks.length === 0 && externalLinks.length === 0) {
    skipped++;
    continue;
  }

  // Build the section
  const section = buildResourceSection(internalLinks, externalLinks);

  // Check if "Further Resources" section already exists
  if (page.raw.includes('## Further Resources')) {
    // Append within existing section or skip
    skipped++;
    continue;
  }

  // Append to end of file (before final newline)
  const newContent = page.raw.trimEnd() + '\n' + section;

  // Calculate new link score
  const newInternal = page.internal + internalLinks.length;
  const newExternal = page.external + externalLinks.length;
  const newLinkScore = Math.min(Math.min(newInternal, 8) * 7 + Math.min(newExternal, 6) * 7, 100);

  results.push({
    rel: page.rel,
    oldL: page.linkScore,
    newL: newLinkScore,
    addedInternal: internalLinks.length,
    addedExternal: externalLinks.length,
  });

  if (!DRY_RUN) {
    writeFileSync(page.filePath, newContent, 'utf8');
  }

  fixed++;
}

// ── 6. Report ──────────────────────────────────────────────────────
console.log('\n=== LINK SCORE FIX REPORT ===');
console.log(`Files fixed:   ${fixed}`);
console.log(`Files skipped: ${skipped}`);
if (DRY_RUN) console.log('⚠️  DRY RUN — no files written\n');
else console.log('✅ Files written\n');

// Score improvement summary
const before = results.reduce((s, r) => s + r.oldL, 0) / results.length;
const after = results.reduce((s, r) => s + r.newL, 0) / results.length;
console.log(`Avg L score before: ${before.toFixed(1)}`);
console.log(`Avg L score after:  ${after.toFixed(1)}`);

// Show first 20 results
console.log('\nSample fixes:');
results.slice(0, 20).forEach(r => {
  console.log(`  [${r.oldL}→${r.newL}] +${r.addedInternal}int +${r.addedExternal}ext  ${r.rel}`);
});
