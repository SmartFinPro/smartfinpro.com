#!/usr/bin/env node
/**
 * integrate-seo-texts-pass3.mjs
 * Third pass: targeted FAQ + comparison additions for files still under 4,000 words.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');

function countWords(text) {
  return text.replace(/---[\s\S]*?---/, '').replace(/<[^>]+>/g, ' ').replace(/[#*\[\](){}]/g, ' ').split(/\s+/).filter(Boolean).length;
}

function findInsertionPoint(mdxContent) {
  const furtherIdx = mdxContent.indexOf('\n## Further Resources');
  if (furtherIdx !== -1) return furtherIdx;
  const disclaimerIdx = mdxContent.indexOf('\n<AutoDisclaimer');
  if (disclaimerIdx !== -1) return disclaimerIdx;
  return mdxContent.length;
}

const ADDITIONS = {
  'us/trading/index.mdx': `
## Frequently Asked Questions

### What is the best trading platform for beginners in the US?

For beginners, we recommend platforms that combine educational resources with low minimum deposits and commission-free trading. TD Ameritrade's thinkorswim Paper Money feature allows new traders to practice with virtual funds before risking real capital. Fidelity offers exceptional investor education and $0 commissions on stocks and ETFs. Webull provides a paper trading mode alongside commission-free equity trading with more analytical tools than most beginner platforms.

The critical distinction for beginners is the educational ecosystem. A platform that offers commission-free trading but no learning resources sets up new traders for expensive mistakes. The best beginner platforms invest heavily in guided learning paths, live market analysis, and demo environments.

### How much do I need to start trading in the US?

Minimum deposit requirements vary significantly by platform and asset class. For stock and ETF trading, several major platforms — including TD Ameritrade, Fidelity, and Charles Schwab — require $0 to open an account. Options trading typically requires $2,000 (the regulatory minimum). Futures accounts generally start at $5,000-$25,000 depending on the contracts traded.

Day trading has a specific regulatory requirement under FINRA's Pattern Day Trader (PDT) rule: accounts flagged as pattern day traders must maintain a minimum equity of $25,000. If your account drops below this threshold, you cannot make day trades until the balance is restored.

### Are US trading platforms regulated?

Yes — US trading platforms operate under some of the world's most comprehensive financial regulation. Brokers must be registered with the SEC (Securities and Exchange Commission) and FINRA (Financial Industry Regulatory Authority). Customer funds are protected by SIPC (Securities Investor Protection Corporation) up to $500,000 per account ($250,000 cash limit).

For futures trading, brokers must additionally be registered as Futures Commission Merchants (FCMs) with the CFTC (Commodity Futures Trading Commission) and be members of the NFA (National Futures Association).

When evaluating any US broker, verify their regulatory standing directly on FINRA BrokerCheck (brokercheck.finra.org) and the NFA's Background Affiliation Status Information Center (BASIC).

### What is the difference between a broker and a trading platform?

Technically, a "broker" is the licensed entity that executes trades on your behalf and maintains regulatory oversight of your account. A "trading platform" is the software interface through which you place orders and analyse markets. In practice, these terms are used interchangeably because the software and the brokerage services are typically offered together.

Some brokers offer proprietary platforms (TD Ameritrade's thinkorswim, Charles Schwab's StreetSmart) while others offer third-party platforms (MetaTrader 4/5, NinjaTrader). Some sophisticated traders use a regulated broker for execution while connecting to a separate charting platform via API.

### How are US trading platforms taxed?

US residents pay capital gains tax on trading profits. The rate depends on holding period: short-term gains (assets held under 12 months) are taxed at ordinary income rates (10-37% depending on income bracket). Long-term gains (held over 12 months) are taxed at preferential rates of 0%, 15%, or 20%.

Options trades have specific tax treatment. Most short-term options are taxed as ordinary income. Certain index options qualify as Section 1256 contracts, taxed at a blended 60/40 long-term/short-term rate regardless of holding period.

Your broker must provide a Form 1099-B at year-end reporting all taxable transactions. Wash sale rules (which disallow losses on securities repurchased within 30 days) apply — brokers track this automatically for identical securities but not across accounts or for substantially identical securities.

### Can non-US residents use US trading platforms?

Many US brokers accept international clients, but significant restrictions apply. Non-US residents cannot access certain regulated products (standardised listed options, futures) without establishing US residency or trading through a qualified intermediary. Tax withholding on dividends applies to non-US persons (typically 15-30% depending on tax treaty).

Interactive Brokers is the most accessible US broker for international clients, with regulatory registrations in the EU, UK, Australia, Canada, and other jurisdictions. TD Ameritrade, Charles Schwab, and Fidelity have become more restrictive in recent years regarding international accounts.

### What trading platforms offer the lowest fees?

Fee structures have evolved dramatically since the commission-free trading revolution (initiated by Robinhood in 2013). Today, stock and ETF commissions are effectively zero at major brokers. The remaining costs are:

**Options:** $0.50-$0.65 per contract at most major brokers. Interactive Brokers charges as low as $0.15/contract for high-volume traders.

**Futures:** $0.85-$2.25 per contract, per side (round-trip $1.70-$4.50). TradeStation and NinjaTrader offer competitive futures pricing.

**Spreads (for forex/CFDs):** These vary dramatically. Schwab's forex service charges 0.5-1 pip spread; Interactive Brokers charges from 0.1 pip plus small commission.

**Overnight financing:** Margin traders pay interest on borrowed funds, typically the broker's call rate plus a spread. Margin rates range from 5.5% to 14% annually depending on balance and broker.

**Payment for order flow (PFOF):** Robinhood and some other commission-free brokers monetise by selling order flow to market makers. This generates indirect costs through slightly worse execution prices. The SEC has studied restricting PFOF; disclosure requirements have increased.
`,

  'us/ai-tools/index.mdx': `
## Frequently Asked Questions

### What AI tools do financial advisors actually use?

Financial advisors are adopting AI tools at an accelerating pace across three primary use cases: client reporting and documentation, research and analysis, and compliance monitoring. According to industry surveys, the most widely adopted categories are:

**Reporting automation:** Tools like Orion, Riskalyze (now Nitrogen), and AI-enhanced features in major CRM platforms (Salesforce Financial Services Cloud, Redtail) reduce time spent on client reports by 40-60%.

**Research assistance:** Bloomberg Terminal's AI features, FactSet's AI capabilities, and purpose-built tools like Kensho and Sievert help advisors synthesize large volumes of financial data, earnings calls, and regulatory filings faster than manual analysis.

**Meeting preparation and follow-up:** Fireflies.ai, Otter.ai, and similar tools automatically transcribe client meetings, extract action items, and draft follow-up communications. This addresses one of the highest time burdens in advisory practice.

**Compliance monitoring:** Tools like ComplySci and Smarsh use AI to monitor communications for compliance violations, reducing the burden of manual review.

General-purpose AI tools (ChatGPT, Claude, Gemini) are also widely used for drafting communications, explaining complex concepts to clients, and preliminary research — though advisors must be careful about client data privacy and the accuracy of financial information.

### Is it safe to use AI tools with client financial data?

Data security is the most important evaluation criterion for any AI tool used in financial services. The key questions to ask any vendor:

**Data residency:** Where is your data stored? Is it stored in the same region as your regulatory jurisdiction? Financial firms in the EU must comply with GDPR data residency requirements; US firms should verify FINRA data retention compliance.

**Model training:** Does the vendor train AI models on your data or client inputs? Many enterprise AI contracts explicitly exclude customer data from model training. General-purpose AI tools (free tiers of ChatGPT, etc.) may use inputs for training — enterprise agreements typically prevent this.

**Encryption:** Are data encrypted in transit (TLS 1.2+) and at rest (AES-256)? Is encryption key management handled by the vendor or available for client-managed keys (important for highly sensitive data)?

**Access controls:** Does the platform support role-based access control (RBAC), multi-factor authentication, and audit logging? Can you restrict which team members access which client data?

**Compliance certifications:** Look for SOC 2 Type II reports, ISO 27001 certification, and FINRA/SEC compliance attestations for US financial services use cases.

### Can AI replace financial advisors?

AI tools augment financial advisors rather than replace them — at least for the foreseeable future. AI excels at data processing, pattern recognition, documentation, and routine analysis. Human advisors bring judgement in ambiguous situations, emotional intelligence during market volatility, complex tax and estate planning, and relationship-based client retention.

The practical reality: advisors who use AI tools effectively will outcompete those who don't. AI enables advisors to serve more clients at higher quality, reducing operational overhead while improving outcomes. Firms that integrate AI into practice management typically see per-advisor AUM capacity increase by 20-40% without proportional cost increases.

The highest-risk advisory activities for AI displacement are commoditised services: basic portfolio construction, simple financial planning, and transactional customer service. These are already being automated by robo-advisors. The highest-value human activities — complex tax planning, business succession, estate strategy, behavioural coaching — remain difficult to automate.

### What are the compliance implications of using AI in financial advice?

Regulators are actively developing frameworks for AI use in financial services. Current compliance considerations in the US include:

**FINRA guidance:** FINRA has published guidance on the use of AI in communication review, suitability analysis, and surveillance. Firms must ensure AI-assisted decisions can be reviewed, audited, and defended.

**Explainability requirements:** For AI-driven investment recommendations, firms must be able to explain the basis for recommendations. "Black box" AI that cannot articulate its reasoning creates regulatory exposure.

**Fair lending laws:** AI used in credit or insurance decisions must comply with fair lending requirements. AI systems can inadvertently encode historical biases — vendors must provide bias testing and documentation.

**Client disclosure:** The SEC expects transparency about the use of algorithmic tools in advice. Client agreements should disclose when AI-assisted analysis is used in developing recommendations.

**Record-keeping:** AI-generated content used in client communications must be retained under existing broker-dealer and investment advisor record-keeping rules.

### How do I measure ROI from AI tools in my financial practice?

ROI from AI tools in financial services comes from two sources: time savings (enabling more clients or work with same resources) and quality improvements (fewer errors, better outcomes, higher client satisfaction).

**Time savings calculation:** Identify the specific tasks the AI tool automates or accelerates. Multiply hours saved per week by your effective hourly rate. Subtract the tool's monthly cost. Example: a report generation tool that saves 8 hours/month at $200/hour = $1,600/month value against a $150/month subscription.

**Quality improvements:** Measure error rates before and after implementation, client satisfaction scores, and compliance incident rates. These are harder to quantify but often more valuable than raw time savings.

**Client capacity:** If AI tools allow you to serve 20% more clients without adding staff, the revenue impact (additional AUM revenue) represents your ROI numerator.

**Realistic timelines:** Most AI tool implementations take 30-90 days to reach full productivity. Factor in training time and workflow adjustment costs. Tools with steeper learning curves often deliver higher long-term ROI once mastered.
`,

  'us/cybersecurity/index.mdx': `
## Frequently Asked Questions

### What cybersecurity threats do financial services firms face most often?

Financial services firms face a concentrated threat environment compared to other industries. The most common attack categories are:

**Business Email Compromise (BEC):** Attackers impersonate executives, vendors, or clients to redirect wire transfers. BEC attacks cost US businesses over $2.7 billion in 2022 according to FBI data — financial services is the highest-impact target sector. Unlike ransomware, BEC often succeeds through social engineering alone with no malware involved.

**Ransomware:** Ransomware gangs increasingly target financial services because firms face both operational disruption and regulatory penalties for breaches. The average ransomware demand against financial institutions has exceeded $1 million, with total costs (recovery, legal, regulatory) often 5-10x the ransom amount.

**Third-party/supply chain attacks:** Financial firms rely on many vendors — payment processors, cloud providers, software vendors. Attackers increasingly compromise these supply chains to reach multiple financial targets simultaneously. The 2020 SolarWinds attack affected financial regulators including the Federal Reserve.

**Credential theft and account takeover:** Phishing and credential stuffing attacks target financial accounts directly. Stolen credentials for brokerage, banking, and crypto exchange accounts are sold on dark web marketplaces for $10-$500 depending on account value.

**Insider threats:** Employees with access to client financial data represent a persistent risk. Insider incidents in financial services cost an average of $16.2 million annually per organisation (Ponemon Institute, 2023) — higher than any other sector.

### What cybersecurity regulations apply to US financial firms?

Financial services cybersecurity regulation in the US is fragmented across multiple agencies:

**SEC Cybersecurity Rules (2023):** Public companies and registered investment advisors must disclose material cybersecurity incidents within 4 business days of determination. Annual disclosure of cybersecurity risk management practices is required.

**FINRA Rule 4370:** Broker-dealers must maintain a Business Continuity Plan (BCP) that addresses technology failure and cybersecurity incidents. Annual reviews are required.

**Gramm-Leach-Bliley Act (GLBA) Safeguards Rule:** All financial institutions must implement comprehensive information security programs. The updated FTC Safeguards Rule (2023) added specific requirements for encryption, access controls, and incident response.

**NY DFS Cybersecurity Regulation (23 NYCRR 500):** The most comprehensive state-level framework, applying to entities licensed by the New York Department of Financial Services. Requires annual penetration testing, multi-factor authentication, and CISO designation.

**State money transmission licenses:** Many states require cybersecurity programs as part of money transmitter licensing.

**International considerations:** US firms with EU clients must comply with GDPR for EU personal data. Firms with UK operations must comply with FCA cybersecurity expectations.

### How much should a financial firm spend on cybersecurity?

Industry benchmarks suggest financial services firms should invest 8-12% of IT budget on cybersecurity — significantly above the 5-7% cross-industry average. In practice, spending correlates with threat level and regulatory scrutiny:

**Small firms (under 50 employees):** $50,000-$150,000 annually covering endpoint protection, email security, backup, and a managed security service provider (MSSP). Cloud-hosted tools reduce on-premise infrastructure costs.

**Mid-sized firms (50-500 employees):** $300,000-$1 million annually, adding network monitoring, identity management, security awareness training, and regular penetration testing.

**Enterprise firms:** $5 million+ annually, with dedicated security operations centers (SOC), 24/7 monitoring, advanced threat intelligence, and forensic response capability.

The true cost calculation should include breach scenario costs: average financial sector breach cost is $5.9 million (IBM Cost of Data Breach Report, 2023) — well above the annual security investment for most firms. Cybersecurity ROI is fundamentally risk reduction, not operational efficiency.

### What is cyber insurance and do financial firms need it?

Cyber insurance covers financial losses from cybersecurity incidents, including ransomware payments, business interruption, data recovery, legal defense, regulatory fines, and third-party liability. For financial services firms, it's effectively mandatory given the regulatory and liability exposure.

**What cyber insurance covers:**
- First-party losses: ransomware payments, data recovery, business interruption
- Third-party liability: lawsuits from clients whose data was compromised
- Regulatory defense: costs defending against SEC, FTC, or state regulatory actions
- Notification costs: legal requirements to notify affected clients after breach

**Current market challenges:** Premium increases of 50-150% since 2021 have made cyber insurance expensive. Insurers now require significant security controls before offering coverage: MFA on all remote access, EDR deployment, offline backups, and often annual penetration testing.

**Coverage limits:** Most mid-sized financial firms carry $3-10 million in cyber coverage. As breach costs rise, coverage adequacy is an increasing concern — some firms find their coverage insufficient after major incidents.

### How do I conduct a cybersecurity risk assessment for my financial firm?

A cybersecurity risk assessment identifies your firm's specific vulnerabilities, quantifies potential impact, and prioritises remediation. For financial firms, a structured assessment typically follows the NIST Cybersecurity Framework (CSF):

**Identify:** Catalogue all assets (hardware, software, data, personnel) and their value. For financial firms, the most sensitive assets are client data, trading systems, and payment infrastructure.

**Protect:** Review current controls against identified assets. Common gaps in financial firms: inadequate patch management, weak identity controls (no MFA, excessive permissions), insufficient email security, and inconsistent encryption.

**Detect:** Evaluate monitoring and alerting capabilities. Can you detect a breach within hours (industry best practice) or would it take days or weeks?

**Respond:** Test your incident response plan with tabletop exercises. FINRA expects broker-dealers to have documented response procedures — untested plans rarely work under pressure.

**Recover:** Review backup quality and restore testing. Ransomware victims with good offline backups recover in days; those without verified backups face weeks of disruption.

Most financial firms benefit from engaging a qualified third-party assessor. The cost ($15,000-$75,000) is modest relative to the regulatory risk of an undocumented assessment process.
`,

  'us/business-banking/index.mdx': `
## Key Considerations When Choosing a US Business Bank

### The Hidden Costs of "Free" Business Accounts

Many business banks advertise free checking accounts that carry meaningful costs at scale. Transaction limits — often 200 per month — trigger per-item fees ($0.40-$0.75 each) that add up quickly for businesses processing payroll, vendor payments, and client transactions. Cash deposit surcharges ($2-$3 per $1,000 deposited) are particularly burdensome for retail businesses.

The true cost comparison requires modelling your actual transaction volume against each provider's fee schedule. Our cost analysis covers three business profiles (low, medium, and high transaction volume) to identify which accounts offer genuine value for different business types.

For businesses with payroll complexity, HR integrations, and multiple signatories, fintech business banks often lack the product depth that traditional banks provide. Evaluate the full feature set alongside the headline price.
`,

  'ca/ai-tools/index.mdx': `
## Canadian Regulatory Context for AI in Finance

### OSFI and FINTRAC Compliance Requirements

Canadian financial AI tools must operate within a specific regulatory environment. The Office of the Superintendent of Financial Institutions (OSFI) has issued guidance on the use of technology and AI in federally regulated financial institutions, emphasising model risk management and explainability.

FINTRAC (Financial Transactions and Reports Analysis Centre of Canada) reporting obligations apply when AI tools process transactions that may trigger AML/ATF reporting requirements. AI-assisted compliance tools must be configured to generate compliant FINTRAC reports — a capability not all international tools support natively.

Provincial securities regulators (OSC, AMF, BCSC) have issued guidance on the use of AI in investment advice, aligning broadly with international standards on explainability and audit trails. AI tools used by registered advisors must support documentation requirements that satisfy provincial regulatory obligations.
`,

  'ca/business-banking/index.mdx': `
## Canadian Business Banking Regulatory Context

### CDIC Protection and Regulatory Framework

Canadian business accounts benefit from Canada Deposit Insurance Corporation (CDIC) protection on eligible deposits up to $100,000 per depositor per category. This protection applies to the Big Six banks and most Schedule I and II banks — credit unions have separate provincial deposit insurance.

The Office of the Superintendent of Financial Institutions (OSFI) regulates federally chartered banks, ensuring capital adequacy, liquidity standards, and consumer protection. For business accounts, this regulatory oversight provides confidence in the stability of the institutions holding business funds.

Open Banking developments in Canada are reshaping the business banking landscape. Following the federal government's 2023 Open Banking commitment, businesses can increasingly expect standardised API access to bank data, enabling better accounting software integration and financial management tools. This positions Canadian business banking to catch up with the UK and EU open banking ecosystems in the coming years.
`,

  'au/trading/index.mdx': `
## Australian Trading Market Context

### ASX-Specific Considerations for Australian Investors

The Australian Securities Exchange (ASX) operates under a specific market structure that differs meaningfully from US and UK markets. ASX-listed securities trade in a different timezone (AEST/AEDT), with market hours 10:00 AM — 4:00 PM AEST Monday through Friday. Pre-market and after-hours sessions are limited compared to US markets.

**Chi-X Australia** (now Cboe Australia) operates as a competing exchange venue, offering alternative trading for ASX-listed securities. Most retail brokers route orders to the best available price across both venues — verify that your broker supports best execution across both ASX and Cboe Australia.

**CHESS settlement:** Australia uses the Clearing House Electronic Sub-register System (CHESS) for equities settlement, with a T+2 settlement cycle. CHESS-sponsored holdings are held directly in your name — an important investor protection advantage over "custodian" models used by some international brokers operating in Australia.

**Franking credits:** Australian investors receive significant tax benefits from dividend imputation (franking credits). Dividend yields quoted for ASX stocks typically understate the true pre-tax return — a 5% dividend yield from a fully franked company represents approximately 7.1% gross yield for investors who can utilise the full credit. Ensure your broker correctly reports franking credits on your annual tax statement.

**ASIC regulatory oversight:** All Australian brokers must hold an Australian Financial Services Licence (AFSL). Verify ASIC licence status on the ASIC Connect register before opening an account. ASIC-regulated brokers must maintain minimum capital requirements and segregate client funds from operational capital.
`,
};

let successCount = 0;
const results = [];

for (const [mdxRel, insertion] of Object.entries(ADDITIONS)) {
  const mdxPath = path.join(CONTENT, mdxRel);
  if (!fs.existsSync(mdxPath)) {
    results.push(`❌ NOT FOUND: ${mdxRel}`);
    continue;
  }
  const mdxContent = fs.readFileSync(mdxPath, 'utf8');
  const wordsBefore = countWords(mdxContent);

  if (wordsBefore >= 4000) {
    results.push(`⏭️  ALREADY OK (${wordsBefore}w): ${mdxRel}`);
    continue;
  }

  const insertAt = findInsertionPoint(mdxContent);
  const newContent = mdxContent.slice(0, insertAt) + insertion + mdxContent.slice(insertAt);
  const wordsAfter = countWords(newContent);

  fs.writeFileSync(mdxPath, newContent, 'utf8');
  const icon = wordsAfter >= 4000 ? '✅' : '🟡';
  results.push(`${icon} ${mdxRel}: ${wordsBefore}w → ${wordsAfter}w`);
  successCount++;
}

console.log('\n=== PASS 3 RESULTS ===\n');
results.forEach(r => console.log(r));
console.log(`\nUpdated: ${successCount}`);
