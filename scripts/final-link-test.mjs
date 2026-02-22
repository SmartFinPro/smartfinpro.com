// scripts/final-link-test.mjs — Final Golden State link test
import http from 'http';

const BASE = 'http://localhost:3000';

const PAGES_TO_CRAWL = [
  '/',
  '/uk', '/ca', '/au',
  '/ai-tools', '/trading', '/personal-finance', '/cybersecurity', '/business-banking', '/debt-relief', '/credit-repair',
  '/uk/ai-tools', '/uk/trading', '/uk/personal-finance', '/uk/cybersecurity', '/uk/business-banking', '/uk/remortgaging', '/uk/savings',
  '/ca/ai-tools', '/ca/personal-finance', '/ca/cybersecurity', '/ca/business-banking', '/ca/tax-efficient-investing', '/ca/housing', '/ca/forex',
  '/au/ai-tools', '/au/trading', '/au/personal-finance', '/au/cybersecurity', '/au/business-banking', '/au/superannuation', '/au/gold-investing', '/au/savings', '/au/forex',
  '/tools', '/about', '/contact', '/methodology', '/editorial-policy', '/affiliate-disclosure', '/privacy', '/terms',
  '/uk/tools/isa-tax-savings-calculator', '/uk/tools/remortgage-calculator',
  '/ca/tools/tfsa-rrsp-calculator', '/ca/tools/wealthsimple-calculator', '/ca/tools/ca-mortgage-affordability-calculator',
  '/au/tools/superannuation-calculator', '/au/tools/au-mortgage-calculator',
  '/tools/broker-finder', '/tools/trading-cost-calculator', '/tools/ai-roi-calculator', '/tools/loan-calculator',
  '/tools/credit-score-simulator', '/tools/debt-payoff-calculator', '/tools/broker-comparison',
  '/tools/gold-roi-calculator', '/tools/credit-card-rewards-calculator',
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function extractInternalLinks(html) {
  const links = new Set();
  const re = /href="(\/[^"#?]*)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    let href = m[1].replace(/\/+$/, '');
    if (href === '') href = '/';
    if (href.startsWith('/_next') || href.startsWith('/api') || href.includes('.')) continue;
    links.add(href);
  }
  return links;
}

async function run() {
  console.log('=== Phase 1: Page Status Check ===');
  let pagesFailed = 0;
  for (const page of PAGES_TO_CRAWL) {
    try {
      const { status } = await fetchUrl(BASE + page);
      if (status !== 200) {
        console.log('  FAIL ' + status + ' ' + page);
        pagesFailed++;
      }
    } catch (e) {
      console.log('  ERROR ' + page + ': ' + e.message);
      pagesFailed++;
    }
  }
  console.log('Pages tested: ' + PAGES_TO_CRAWL.length + ', Failed: ' + pagesFailed);

  console.log('\n=== Phase 2: Link Crawl ===');
  const allLinks = new Set();
  for (const page of PAGES_TO_CRAWL) {
    try {
      const { body } = await fetchUrl(BASE + page);
      const links = extractInternalLinks(body);
      links.forEach(l => allLinks.add(l));
    } catch {}
  }

  console.log('Unique internal links discovered: ' + allLinks.size);

  const broken = [];
  let tested = 0;
  for (const link of allLinks) {
    try {
      const { status } = await fetchUrl(BASE + link);
      tested++;
      if (status >= 400) {
        broken.push({ link, status });
      }
    } catch (e) {
      tested++;
      broken.push({ link, status: 'ERR: ' + e.message });
    }
  }

  console.log('Links tested: ' + tested);
  console.log('Broken links: ' + broken.length);

  if (broken.length > 0) {
    console.log('\n--- Broken Links ---');
    broken.forEach(b => console.log('  ' + b.status + ' -> ' + b.link));
  } else {
    console.log('\n✅ ALL LINKS PASS — 0 broken links!');
  }

  console.log('\n=== SUMMARY ===');
  console.log('Pages:  ' + PAGES_TO_CRAWL.length + ' tested, ' + pagesFailed + ' failed');
  console.log('Links:  ' + tested + ' tested, ' + broken.length + ' broken');
  console.log('Result: ' + (pagesFailed === 0 && broken.length === 0 ? '✅ GOLDEN STATE' : '❌ ISSUES FOUND'));
}

run().catch(console.error);
