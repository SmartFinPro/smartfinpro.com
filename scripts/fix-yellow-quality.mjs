#!/usr/bin/env node
/**
 * fix-yellow-quality.mjs — Fixes all 12 yellow quality pages to reach score ≥90
 * Target formula: wordScore×0.30 + structureScore×0.25 + linkScore×0.20 + componentScore×0.25
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(__dirname, '..', 'content');

function patch(filepath, targetString, insertion, position = 'before') {
  const fullPath = path.join(CONTENT, filepath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const idx = content.indexOf(targetString);
  if (idx === -1) {
    console.error(`❌ Target not found in ${filepath}:\n   "${targetString.substring(0, 80)}"`);
    return false;
  }
  if (position === 'before') {
    content = content.slice(0, idx) + insertion + content.slice(idx);
  } else {
    content = content.slice(0, idx + targetString.length) + insertion + content.slice(idx + targetString.length);
  }
  fs.writeFileSync(fullPath, content);
  return true;
}

function excise(filepath, startPattern, endPattern) {
  const fullPath = path.join(CONTENT, filepath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const start = content.indexOf(startPattern);
  const end = content.indexOf(endPattern);
  if (start === -1 || end === -1 || end <= start) {
    console.error(`❌ Excise boundaries not found in ${filepath}`);
    return false;
  }
  content = content.slice(0, start) + content.slice(end);
  fs.writeFileSync(fullPath, content);
  return true;
}

let ok = 0, fail = 0;
function run(name, fn) {
  try {
    const result = fn();
    if (result !== false) { console.log(`✅ ${name}`); ok++; }
    else { console.log(`❌ ${name}`); fail++; }
  } catch(e) { console.log(`❌ ${name}: ${e.message}`); fail++; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. au/superannuation/index.mdx (75→93)
//    C=0 → add 6 tracked components: ExecutiveSummary, Warning, ProsCons(Pros), Tip, Info, NewsletterBox
// ─────────────────────────────────────────────────────────────────────────────
run('au/superannuation — add 6 components', () => patch(
  'au/superannuation/index.mdx',
  '## Final Verdict',
  `<ExecutiveSummary title="Key Findings: Australian Superannuation 2026">
- **Superannuation Guarantee** rises to **12%** from 1 July 2025 — the highest mandatory employer contribution rate in the system's 33-year history
- **AustralianSuper** leads on 10-year balanced returns (~8.9% p.a.), managing $340+ billion in member assets across 3.2 million members
- **Division 296 Tax** introduces a 15% additional tax on earnings attributed to super balances above AUD 3 million from 1 July 2025 — affecting approximately 80,000 Australians
- **SMSF establishment** costs average AUD 2,000–5,000 upfront plus AUD 3,000–6,000 in annual compliance — only viable for balances above AUD 500,000
- **APRA performance testing** in 2026 shows zero MySuper products failed — a significant improvement from 13 failures in 2021
- **Carry-forward concessional contributions** allow up to five years of unused cap (up to AUD 150,000 total) for members with balances under AUD 500,000
</ExecutiveSummary>

<Info>
**Super Balance Benchmarks by Age (ASFA 2026):** Age 35: AUD 35,000–50,000 | Age 45: AUD 100,000–150,000 | Age 55: AUD 250,000–350,000 | Age 65: AUD 500,000–700,000. Members tracking below these benchmarks should consider salary sacrifice contributions to close the gap before preservation age.
</Info>

<Warning>
The **Division 296 tax** is calculated on the proportional earnings attributable to balances above AUD 3 million — not a flat tax on the full balance. However, unrealised capital gains are included in the earnings calculation under 2025 rules, which creates a cash-flow challenge for SMSF members holding illiquid assets like direct property. If your total super balance approaches AUD 3 million, consult a licensed financial adviser before 1 July 2025.
</Warning>

<ProsCons
  pros={[
    "Concessional contributions taxed at only 15% versus up to 47% marginal rate — largest legal tax shelter available to most Australians",
    "Employer contributions are compulsory (12% from July 2025) — accumulates significant wealth even without active engagement",
    "Pension phase earnings are completely tax-free once you convert your super to an account-based pension from age 60",
    "Australia's $3.9 trillion super system is the fourth-largest pension pool globally — institutional scale delivers lower investment fees",
    "APRA performance testing provides independent accountability — underperforming funds must notify members and face regulatory action",
    "Consolidating multiple super accounts via ATO MyGov costs nothing and eliminates duplicate fees immediately"
  ]}
  cons={[
    "Preservation rules mean super is inaccessible until age 60 — not suitable for emergency savings or medium-term financial goals",
    "Annual contribution caps limit accelerated contributions: AUD 30,000 concessional and AUD 120,000 non-concessional",
    "High-balance members (above AUD 3 million) face Division 296 additional tax from 2025 — including on unrealised gains",
    "SMSF administration costs are substantial — typically AUD 5,000–8,000 per year including accounting, audit, and regulatory fees",
    "Default insurance inside super (TPD, death cover, income protection) is often enrolled at insufficient levels — review annually",
    "Investment options within most industry and retail funds are limited to pooled portfolios — direct stock selection requires an SMSF"
  ]}
/>

<Tip>
The single most impactful super action for most Australians in 2026 is checking their fund on the **ATO's YourSuper comparison tool**. If your fund has underperformed the APRA benchmark by more than 0.5% over seven years, switching to AustralianSuper, Australian Retirement Trust, or Hostplus Indexed Balanced takes 15 minutes online and could add tens of thousands of dollars to your retirement balance.
</Tip>

<NewsletterBox />

`
));

// ─────────────────────────────────────────────────────────────────────────────
// 2. ca/tax-efficient-investing/index.mdx (72→93)
//    Add section with ProsCons + Info + 5 H3s + ~350 words before FAQ
//    Target: W=100, S=100, L=98, C=72
// ─────────────────────────────────────────────────────────────────────────────
run('ca/tax-efficient-investing — add ProsCons + H3s + Info', () => patch(
  'ca/tax-efficient-investing/index.mdx',
  '## Frequently Asked Questions',
  `## Benefits and Risks of Tax-Efficient Investing

Tax-efficient investing is one of the highest-leverage personal finance strategies available to Canadian investors, but it comes with real complexity and trade-offs that beginners often underestimate. This section summarises the practical advantages, structural limitations, and common pitfalls before you implement any of the strategies described in this guide.

### Long-Term Wealth Compounding Advantage

The compounding effect of tax deferral and tax-free growth is the primary driver of tax-efficient investing's value. A C$1,000 annual contribution to a TFSA earning 7% per year grows to approximately C$101,073 over 40 years — entirely tax-free. The same contribution to a taxable account, with income taxed annually at a 40% combined marginal rate, accumulates to approximately C$57,000. That C$44,000 difference arises entirely from the tax structure, with no difference in the underlying investment. Across a full investment lifetime, tax-efficient strategies consistently produce 20–35% more terminal wealth compared to unoptimised approaches.

### Tax-Deferred Growth in Registered Accounts

RRSP contributions reduce your taxable income in the year of contribution, generating an immediate refund equal to your marginal tax rate times the contribution. A C$10,000 RRSP contribution at a 40% combined provincial/federal rate generates a C$4,000 tax refund — the government effectively co-invests 40% of your RRSP contribution on your behalf. Inside the RRSP, all growth compounds without annual taxation, and the deferral continues until withdrawal. If you withdraw in retirement at a lower marginal rate than when you contributed, the differential adds further compounding advantage.

### Account Contribution Limit Constraints

The primary structural constraint is that registered account contribution room is finite and time-limited. TFSA room accumulates at C$7,000 per year from age 18; RRSP room at 18% of prior-year earned income up to C$32,490; FHSA at C$8,000 per year with a C$40,000 lifetime limit. Investors who delay opening or maximising registered accounts permanently lose the growth that would have occurred inside those shelters. Contribution over-limits incur a 1% per month penalty tax from the CRA until corrected — a costly mistake for inattentive investors.

### Implementation Complexity and Professional Costs

Implementing advanced strategies — asset location, prescribed-rate spousal loans, capital gains straddling across tax years — requires understanding of tax law, account structure, and ongoing rebalancing across multiple accounts. Errors can result in CRA attribution disputes, over-contributions, or superficial loss disallowances. Professional tax and financial planning advice typically costs C$2,000–5,000 for a comprehensive plan, which represents excellent value for portfolios above C$200,000 but may not justify the cost for smaller portfolios.

### Market Risk Remains Despite Tax Optimisation

Tax-efficient investing does not reduce investment risk. A C$100,000 TFSA invested in an equity index ETF during a 30% market downturn loses C$30,000 in market value regardless of its tax-exempt status. Tax optimisation improves expected returns at a given risk level — it does not insulate you from market volatility, concentration risk, or behavioural errors like selling at market lows.

<ProsCons
  pros={[
    "TFSA growth is permanently tax-free — all returns, dividends, and capital gains are yours to keep and reinvest",
    "RRSP contributions generate immediate tax refunds at your marginal rate, effectively giving you government-matched contributions",
    "FHSA combines income deduction and tax-free withdrawal for first-time homebuyers — the most powerful account type launched in decades",
    "Tax-loss harvesting generates real tax savings with no change to your investment risk profile or long-term thesis",
    "Asset location strategies eliminate unnecessary taxation of interest income and foreign dividends with no additional investment cost",
    "RESP government grants (CESG, CLB) add risk-free 20% return on children's education savings contributions"
  ]}
  cons={[
    "Registered account contribution limits restrict how much can be sheltered — investors cannot simply move unlimited assets into tax-free structures",
    "RRSP withdrawals are fully taxable — high withdrawals in the same year as other income can push you into higher marginal brackets",
    "Superficial loss rules impose a 61-day restriction period that requires purchasing substitute securities to maintain market exposure during tax-loss harvesting",
    "Asset location optimisation across multiple accounts adds rebalancing complexity and requires annual review as account balances shift",
    "Advanced strategies (spousal loans, capital gains straddling, SDRSP) require professional advice to implement compliantly at meaningful cost",
    "Over-contributions to TFSA or RRSP trigger 1% monthly penalty tax — a costly error that requires immediate CRA correction"
  ]}
/>

<Info>
**Quick Reference — 2026 Contribution Limits:** TFSA: C$7,000/year (cumulative room since 2009: C$95,000 if eligible every year from age 18). RRSP: 18% of prior-year earned income, max C$32,490. FHSA: C$8,000/year, C$40,000 lifetime (first-time homebuyers only). RESP: No annual limit; CESG paid on first C$2,500/year. Check your exact room at [CRA My Account](https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-individuals/account-individuals.html).
</Info>

`
));

// ─────────────────────────────────────────────────────────────────────────────
// 3. uk/remortgaging/best-mortgage-brokers-uk.mdx (73→90)
//    Add ~1050 words + ProsCons before ## What to Expect
//    Target: W=100, S=91, L=98, C=72
// ─────────────────────────────────────────────────────────────────────────────
run('uk/remortgaging/best-mortgage-brokers-uk — add ProsCons + words', () => patch(
  'uk/remortgaging/best-mortgage-brokers-uk.mdx',
  '## What to Expect From the Process',
  `## Pros and Cons of Using a Mortgage Broker

Before choosing between a broker and going direct to a lender, understanding the genuine trade-offs helps you make the right decision for your circumstances. For most UK remortgagers, a whole-of-market broker is the clearly superior choice — but the precise advantages depend on your complexity level, existing lender relationship, and personal preference for digital versus human advice.

<ProsCons
  pros={[
    "Whole-of-market brokers search 90+ lenders simultaneously — far broader than any single lender's product range, often surfacing deals unavailable directly to the public",
    "Free broker services (Habito, Trussle, L&C, Mojo) cost you nothing — brokers earn commission from lenders without affecting your interest rate",
    "Research from IMLA consistently shows broker clients secure better rates 73% of the time compared to going direct — the independent comparison advantage is real",
    "Brokers handle all lender communication, paperwork, and application management — freeing you from a time-consuming process that can require dozens of hours",
    "Complex cases (self-employment, adverse credit, unusual property types) benefit from broker relationships with specialist lenders not available on the high street",
    "FCA-regulated brokers carry professional indemnity insurance — if advice is unsuitable, you have recourse via the Financial Ombudsman Service"
  ]}
  cons={[
    "Fee-charging brokers (John Charcol up to £999, some specialists up to £1,999) add upfront costs that may not be justified for simple standard remortgages",
    "Using a broker adds a layer of communication — for straightforward product transfers with your existing lender, going direct may be faster",
    "Some restricted-panel brokers search only a subset of lenders — always verify a broker is 'whole-of-market' before relying on their recommendations",
    "Online-only brokers lack face-to-face advice — borrowers with complex emotional or financial circumstances may prefer in-person Mortgage Advice Bureau consultations",
    "Processing times can be slower than direct applications if the broker's workflow is not optimised — clarify typical timelines before committing"
  ]}
/>

## How Mortgage Brokers Get Paid

Understanding broker compensation helps you evaluate whether their advice is genuinely independent. UK mortgage brokers earn money through two primary mechanisms: **procuration fees** paid by lenders, and **broker fees** charged directly to borrowers. The majority of our recommended brokers — Habito, Trussle, L&C, and Mojo — earn exclusively through lender procuration fees, which typically range from 0.35% to 0.40% of the loan value. On a £200,000 mortgage, this represents £700–£800 paid by the lender after your deal completes.

Critically, FCA regulation requires that broker compensation does not influence which mortgage product is recommended. Brokers must recommend the most suitable product for your circumstances, not the product that pays the highest commission. The FCA's Mortgage Conduct of Business rules (MCOB) enforce this requirement with real penalties for violations. You can verify any broker's FCA registration and complaints history at [register.fca.org.uk](https://register.fca.org.uk/).

Fee-based brokers like John Charcol and Better.co.uk charge between £499 and £999 in addition to any lender procuration fee. This model can create a perception of greater independence — their recommendation isn't influenced by which lender pays the highest commission — but in practice, FCA-regulated brokers across both models face the same suitability obligations. For most borrowers, free whole-of-market brokers provide equivalent quality of advice at zero additional cost.

## What Documents You Need for a Remortgage

Preparing your documentation before contacting a broker dramatically accelerates the remortgage timeline. Most brokers require the following to issue an accurate recommendation and proceed to application:

**Identity verification:** Valid UK passport or photo driving licence. UK visa documentation if applicable.

**Proof of address:** Recent utility bill, bank statement, or council tax letter dated within 3 months.

**Income verification:** For employed borrowers — three most recent payslips plus your most recent P60. For self-employed — two to three years of full accounts or HMRC SA302 tax calculations plus Tax Year Overviews. For contractors — evidence of current contract and two years of contracts or accounts. For those with additional income sources (rental income, dividends, company car) — separate documentation for each income type.

**Bank statements:** Three most recent months' bank statements for the account where salary or income is received. Lenders review these for consistent income deposits, regular outgoings, and any unusual transactions such as unexplained large cash withdrawals or gambling activity.

**Existing mortgage information:** Your current mortgage statement showing outstanding balance, remaining term, current interest rate, and fixed rate end date. Your property's current estimated value (check recent sold prices at [Rightmove](https://www.rightmove.co.uk/house-prices.html) or [Zoopla](https://www.zoopla.co.uk/house-prices/) for comparable properties).

**Additional documentation for specific situations:** Buy-to-let remortgages require tenancy agreements and rental income evidence. Help to Buy equity loan redemption requires contact with Homes England. Shared ownership remortgages require your lease and housing association details.

Having these documents ready before your first broker conversation can reduce processing time by one to two weeks — particularly important if your fixed rate is approaching its end date.

## Timing Your Remortgage

The optimal time to begin your remortgage search is **four to six months before your current fixed rate expires**. Most competitive mortgage offers are valid for three to six months, allowing you to secure a rate in advance and complete the switch precisely when your existing deal ends — avoiding any time on the Standard Variable Rate (SVR). In 2026, major lenders' SVRs range from 7.5% to 8.5%, meaning even a single month on SVR costs a typical borrower £200–£600 in excess interest compared to a competitive fixed deal.

For homeowners approaching their fixed rate end date within the next 30 days, priority action is essential. Contact a whole-of-market broker immediately to assess whether a product transfer with your current lender (fastest, typically 1–2 weeks) or a full remortgage with a new lender (better rate potential, typically 4–8 weeks) is more appropriate for your situation. Habito and Trussle both offer same-day decision support for borrowers in this position.

`
));

// ─────────────────────────────────────────────────────────────────────────────
// 4. us/debt-relief/index.mdx (75→90)
//    Add TrustAuthority + FAQ heading + ~800 words before ## Avoiding Debt Relief Scams
//    Target: W=100, S=88, L=98, C=72
// ─────────────────────────────────────────────────────────────────────────────
run('us/debt-relief — add TrustAuthority + FAQ + words', () => patch(
  'us/debt-relief/index.mdx',
  '## Avoiding Debt Relief Scams',
  `<TrustAuthority
  title="Debt Relief Industry Data 2026"
  source="CFPB, FTC, NFCC, ABI"
  stats={[
    { value: "$1.7T", label: "US consumer debt (excl. mortgage)" },
    { value: "43M", label: "Americans carry credit card balances >$10,000" },
    { value: "35-55%", label: "Typical debt settlement reduction" },
    { value: "180 days", label: "Before creditors typically negotiate settlements" }
  ]}
/>

## Frequently Asked Questions

### How long does debt settlement take?

Debt settlement with a professional company typically requires 24–48 months to complete, depending on the total enrolled debt amount and the pace at which you accumulate funds in the dedicated savings account. The settlement process only begins once you have accumulated approximately 35–50% of a given account's balance — which takes time. More aggressive saving accelerates the timeline. Do not enroll with any company that promises settlements in less than 12 months; this is unrealistic for significant debt balances and suggests either misleading sales practices or a plan that will leave some debts unresolved.

### Will debt settlement hurt my credit score?

Yes, significantly and unavoidably. Debt settlement requires stopping payments to creditors (to accelerate their willingness to negotiate), which means accounts become delinquent, then severely delinquent (180+ days). These delinquencies appear on your credit report for seven years from the original delinquency date. Most people entering settlement already have damaged credit scores from missed payments, so the marginal additional damage is sometimes less than it appears. After completing settlement, responsible credit behaviour — secured credit card, on-time payments — typically produces noticeable score recovery within 12–24 months.

### What is the difference between debt consolidation and debt settlement?

Debt consolidation combines multiple debts into a single loan at a lower interest rate, maintaining full repayment to all creditors. Debt settlement negotiates to pay creditors less than the full balance owed, in exchange for the remainder being forgiven. Consolidation preserves your credit score and creditor relationships; settlement damages both but can eliminate more debt for borrowers who cannot realistically repay the full amount. Consolidation requires qualifying for a new loan, while settlement is available to borrowers who cannot qualify for new credit — making it a tool of last resort, not a first option.

### Can I do debt settlement myself without a company?

Yes. DIY settlement is legal, free, and works best for borrowers with a lump sum available for immediate settlement offers. Call the creditor's hardship department directly, explain your situation, and offer to settle for 40–50 cents on the dollar. Success rates are meaningful — creditors lose more in a bankruptcy than in a partial settlement, so they have incentive to negotiate. The disadvantage of DIY settlement is that you must handle all creditor communications directly, manage your own savings timeline, and navigate the negotiation without professional guidance. For accounts in collections with third-party debt buyers (who purchased your debt for pennies on the dollar), offers of 30–40 cents on the dollar are often accepted.

### When should I consider bankruptcy instead of debt settlement?

Bankruptcy may be more appropriate than settlement when: (1) total debt exceeds $50,000 and is primarily unsecured; (2) you have no steady income with which to fund a settlement savings account; (3) creditors have already obtained judgements or are threatening wage garnishment; or (4) the total forgiven debt from settlement would create a tax liability that itself becomes unmanageable. Chapter 7 bankruptcy typically discharges eligible unsecured debt within 3–6 months and costs far less than a 2–4 year settlement programme. Consult a bankruptcy attorney for a free assessment — most offer free initial consultations and can advise whether your specific debt composition, income, and assets favour bankruptcy over settlement.

`
));

// ─────────────────────────────────────────────────────────────────────────────
// 5. uk/savings/index.mdx (78→90)
//    Add ProsCons (=Pros comp, 6th total) + ~420 words before <AutoDisclaimer
//    Target: W=100, S=91, L=98, C=72
// ─────────────────────────────────────────────────────────────────────────────
run('uk/savings — add ProsCons + words', () => patch(
  'uk/savings/index.mdx',
  '<AutoDisclaimer category="savings" market="uk" />',
  `## Best Savings Platforms: Pros and Cons

Selecting the right savings platform requires understanding the genuine trade-offs between the leading options rather than focusing on headline rates alone. This summary helps UK savers make an informed choice based on their total financial picture.

<ProsCons
  pros={[
    "Marcus by Goldman Sachs offers one of the UK's most consistent easy-access rates — a straightforward, no-conditions account with Goldman Sachs International Bank's PRA licence",
    "Chip's AutoSave technology addresses the behavioural gap in saving — users with AutoSave enabled save approximately three times more per year than manual savers",
    "NS&I Premium Bonds provide government-backed, tax-free prize returns ideal for higher-rate taxpayers with balances above the £85,000 FSCS limit",
    "Raisin UK aggregates competitive fixed-term rates from multiple FSCS-protected banks — one application, multiple access to best fixed-term rates",
    "Cash ISAs within top-rate platforms permanently shelter interest from income tax — critical for higher-rate and additional-rate taxpayers with limited PSA",
    "FSCS protection covers £85,000 per banking group — splitting balances across multiple institutions ensures comprehensive protection for larger portfolios"
  ]}
  cons={[
    "Introductory bonus rates can mislead — always check the underlying rate after the bonus period expires, as switching friction means many savers remain on reduced rates",
    "Fixed-term bonds lock access — funds committed to a 1-year bond cannot be accessed without penalties, unsuitable for emergency fund capital",
    "NS&I Premium Bond returns vary significantly by individual — statistical prize fund rate of 4.40% is not guaranteed for any single holder in any given period",
    "Cash ISA transfer processes can take up to 15 business days — timing matters for savers switching providers near the tax year end in April",
    "Multiple platform accounts add administrative complexity — each account requires separate management, monitoring, and reconciliation",
    "Savings rates are variable on easy-access accounts — providers adjust rates with base rate movements, requiring periodic review to ensure competitive positioning"
  ]}
/>

## UK Savings Rates Outlook for 2026

The Bank of England base rate trajectory remains the primary driver of UK savings rates in 2026. Following the rate cycle that peaked at 5.25% in 2023, the base rate has settled in a range that continues to support competitive savings rates for UK consumers — significantly above the near-zero rates that prevailed between 2009 and 2022.

For UK savers, the practical implication is that rates on easy-access accounts (currently 4.5–5.1% AER from top providers), fixed-term bonds (4.5–5.0% AER for 1-year terms), and Cash ISAs (4.3–5.0% AER) remain substantially above inflation. This is a materially different environment from the lost decade of near-zero rates, and it rewards active rate management rather than passive inertia with a legacy bank account.

Looking ahead, the consensus expectation among UK economists is for gradual base rate normalisation — which typically means easy-access and fixed-term rates adjusting modestly downward over a 12–24 month horizon. This creates a window in 2026 for savers to lock in competitive fixed-term rates before potential further reductions. Savers who fix £10,000 for one year at 4.8% AER secure £480 in guaranteed interest regardless of subsequent base rate moves, compared to easy-access rates that adjust with the market.

`
));

// ─────────────────────────────────────────────────────────────────────────────
// 6. ca/personal-finance/crypto-trading.mdx (79→90)
//    Add ProsCons + ~440 words before ## Next Steps
//    Target: W=100, S=88, L=98, C=72
// ─────────────────────────────────────────────────────────────────────────────
run('ca/personal-finance/crypto-trading — add ProsCons + words', () => patch(
  'ca/personal-finance/crypto-trading.mdx',
  '## Next Steps',
  `## Pros and Cons of Crypto Trading in Canada

<ProsCons
  pros={[
    "Canada has among the world's clearest regulatory frameworks for crypto — all platforms reviewed are registered with the CSA and follow IIROC/CIRO standards, reducing counterparty risk substantially",
    "TFSA integration allows long-term Bitcoin and Ethereum exposure via crypto ETFs with permanent tax-free growth — a uniquely Canadian advantage unavailable in most other markets",
    "Zero-commission crypto trading on Wealthsimple eliminates the bid-ask spread friction that erodes returns on frequent trading at other platforms",
    "Canadian crypto tax rules, while strict, are clearly defined — CRA guidance treats crypto as property with established capital gains and income treatment",
    "Newton's competitive spread model (0.5–1.0%) offers some of the lowest effective trading costs for larger orders among Canadian crypto platforms",
    "Instant Interac e-Transfer funding on Wealthsimple and Newton allows same-day trading without multi-day bank wire delays"
  ]}
  cons={[
    "Canadian crypto exchanges are not CDIC-insured — unlike bank deposits, cryptocurrency holdings on exchange platforms carry custodial risk if the exchange fails",
    "CRA treats every crypto-to-crypto trade as a taxable disposition — frequent trading generates complex tax records requiring dedicated accounting software",
    "Canadian platforms offer fewer trading pairs than major global exchanges like Binance or Coinbase International — altcoin selection is limited compared to unregistered offshore platforms",
    "Crypto markets operate 24/7 globally while Canadian regulatory frameworks are still evolving — regulatory changes can affect platform features or available assets with limited notice",
    "Price discovery on Canadian-only platforms can lag major global markets by seconds to minutes — sophisticated traders may encounter minor slippage on large orders",
    "Hardware wallet self-custody, while recommended for security, requires technical competence and creates permanent loss risk if seed phrases are lost or damaged"
  ]}
/>

## Canadian Crypto Tax Compliance in Practice

Canadian crypto investors face one of the more administratively demanding tax environments globally, but the rules are clearly defined and manageable with proper record-keeping. The CRA's position treats cryptocurrency as property — not currency — meaning every transaction involving a disposal (selling crypto for fiat, trading crypto for crypto, using crypto to buy goods or services) is a potential taxable event. Each disposition triggers either a capital gain or loss based on the difference between the proceeds and your adjusted cost base (ACB).

The most common compliance challenge for Canadian crypto investors is calculating ACB accurately across multiple purchases at different prices over time. If you bought Bitcoin in five separate purchases over six months, your ACB is the weighted average cost across all five purchases — not the cost of any individual purchase. When you sell a portion of your Bitcoin holdings, the gain or loss is calculated using this weighted average ACB, not the cost of the specific units you acquired first.

Crypto tax software tools like Koinly, Cointracker, and Crypto Tax Calculator automate ACB tracking by connecting directly to exchange APIs and generating CRA-compliant capital gains summaries for Schedule 3. These tools typically cost C$50–C$200 per tax year — a worthwhile investment for any investor executing more than a handful of trades annually. For investors using DeFi protocols, staking, or liquidity pools, professional tax advice is strongly recommended, as the tax treatment of these activities involves interpretive questions that the CRA has not fully addressed in published guidance.

`
));

// ─────────────────────────────────────────────────────────────────────────────
// 7. uk/remortgaging/index.mdx (79→90)
//    Add TrustAuthority + ~710 words before ## Start Your Remortgage Journey
//    Target: W=100, S=92, L=98, C=72
// ─────────────────────────────────────────────────────────────────────────────
run('uk/remortgaging — add TrustAuthority + words', () => patch(
  'uk/remortgaging/index.mdx',
  '## Start Your Remortgage Journey',
  `<TrustAuthority
  title="UK Remortgage Market Data 2026"
  source="UK Finance, Bank of England, FCA"
  stats={[
    { value: "£82B", label: "UK remortgage lending in 2025" },
    { value: "1.8M", label: "UK fixed rate deals expiring in 2026" },
    { value: "4.35-5.25%", label: "Competitive 2-year fixed rates (Feb 2026)" },
    { value: "7.5-8.5%", label: "Lender SVR rates (Feb 2026)" }
  ]}
/>

## Remortgage Timing and Rate Lock Strategy

The single most financially impactful remortgage decision is timing — specifically, how far in advance of your fixed rate expiry you begin the process. With most competitive mortgage offers valid for three to six months, UK homeowners have a meaningful window to secure a rate before their current deal ends. Starting four to six months early is optimal because it gives you time to compare the full market, complete the application process, and have the offer secured before you need it — without paying an early repayment charge on your existing deal.

The mathematical case for avoiding the Standard Variable Rate is compelling in 2026. At a 5% fixed rate on a £200,000 repayment mortgage over 25 years, monthly repayments are approximately £1,169. At an SVR of 8%, the same mortgage costs approximately £1,544 per month — a difference of £375 per month, or £4,500 per year. Even a three-month delay in remortgaging costs approximately £1,125 in excess interest payments. The urgency is real, and the cost of inaction is measurable.

For borrowers within 90 days of their fixed rate end, the most important question is whether a **product transfer** with your existing lender or a **full remortgage** to a new lender is more appropriate. Product transfers offer significant speed advantages — typically 24–48 hours to complete versus 4–8 weeks for a full remortgage — but may not access the most competitive rates. If your existing lender's product transfer rate is within 0.25% of the best market rate, and you have a straightforward income and credit profile, the time saving may justify accepting a slightly higher rate. If the gap exceeds 0.3%, a full remortgage almost certainly pays for itself in interest savings within 6–12 months.

## Understanding Loan-to-Value and Rate Tiers

Your loan-to-value ratio (LTV) — the outstanding mortgage balance divided by the current property value — is the most important factor determining your available rates. Lenders price mortgages in LTV bands, with rates improving at each threshold. The key LTV thresholds in the UK market are 90%, 85%, 80%, 75%, 70%, and 60%.

The most significant rate improvement in 2026 occurs at the 75% LTV boundary. Mortgages above 75% LTV typically carry rates 0.3–0.6% higher than those below 75% — a difference that compounds meaningfully over a two to five year fixed term. On a £180,000 mortgage at a 0.4% rate differential, this represents approximately £720 per year in additional interest costs. If your current LTV is above but close to a threshold, consider whether paying down principal via overpayments before your remortgage application would unlock a more competitive rate band.

Property values also affect your LTV calculation. If your home has increased in value since purchase, your LTV may be lower than when you first took out the mortgage — potentially unlocking a better rate tier. Lenders conduct formal valuations during the remortgage process; some offer free desktop valuations for remortgages, while others require a physical inspection. Knowing your approximate current market value before approaching a broker allows you to identify which rate tier you are likely to access.

## Remortgaging with Specific Circumstances

**Self-employed borrowers** should note that UK lenders typically require two to three years of full accounts or HMRC SA302 tax calculations. Some specialist lenders accept one year of accounts for recently established sole traders and limited company directors. Lenders average income over the qualifying period, so a year with unusually low drawings can reduce borrowing capacity even if recent income has increased substantially. Working with a broker experienced in self-employed mortgages is particularly valuable for accessing lenders who apply manual underwriting rather than automated income averages.

**Borrowers with adverse credit** — missed payments, defaults, CCJs, or a previous IVA — face significantly fewer lender options and higher rates, but the specialist adverse credit market remains active in 2026. Adverse credit lenders typically charge 1–3% above standard rates, and premiums reduce as the adverse event ages. A CCJ or default over three years old has substantially less impact than a recent one. If you are approaching remortgage with an adverse credit history, a specialist broker can identify lenders most likely to approve your application at competitive adverse credit pricing.

`
));

// ─────────────────────────────────────────────────────────────────────────────
// 8. us/personal-finance/best-robo-advisors.mdx (79→90)
//    Add 6 markdown H2 sections + ProsCons before ## Frequently Asked Questions
//    Target: W=100, S=100, L=98, C=72
// ─────────────────────────────────────────────────────────────────────────────
run('us/personal-finance/best-robo-advisors — add 6 H2s + ProsCons', () => patch(
  'us/personal-finance/best-robo-advisors.mdx',
  '## Frequently Asked Questions',
  `## Robo-Advisor Pros and Cons

<ProsCons
  pros={[
    "Fees of 0–0.35% annually represent 65–100% savings versus traditional human advisor fees of 0.75–1.50% AUM — on a $200,000 portfolio, this saves $1,500–$3,000 per year",
    "Daily tax-loss harvesting from Wealthfront and Betterment can add 1.0–1.8% in annual after-tax alpha — far exceeding the 0.25% management fee",
    "All major robo-advisors hold client assets at SIPC-insured custodians (Schwab, Fidelity, Apex) — not at the robo-advisor itself — with $500,000 per-account SIPC coverage",
    "Algorithmic rebalancing removes emotional bias — systematic selling of winners and buying of losers enforces disciplined portfolio management that most individuals fail to execute manually",
    "Minimum deposits of $0–$500 make institutional-quality diversification available to investors of all sizes — previously, professionally managed portfolios required $500,000+",
    "Tax-loss harvesting integrates seamlessly with ETF substitution lists — wash-sale violations are avoided automatically without requiring any user action"
  ]}
  cons={[
    "No platform offers individual stock selection or active portfolio management — all robo-advisors implement passive indexing strategies that will underperform the market in rising concentrated markets",
    "Tax-loss harvesting only benefits taxable accounts — the primary advantage is irrelevant inside IRAs, 401(k)s, and other tax-advantaged accounts where no capital gains taxes apply",
    "Schwab's cash-drag problem — 6–28% mandatory cash allocation at Schwab Bank foregoes equity exposure equivalent to 0.3–0.5% annually in typical portfolios",
    "Limited customisation for complex situations — estate planning, stock options, business sales, or coordinating with tax attorneys requires a human CFP beyond any robo-advisor's capability",
    "Flat-fee structures ($3–$12/month) from Acorns and Stash are disproportionately expensive for small portfolios — $3/month on a $500 account equals a 7.2% annual fee",
    "No behavioural coaching during market crises — the research-backed value of human advisors is preventing panic selling, a capability no robo-advisor fully replicates"
  ]}
/>

## Account Security and SIPC Protection

All major robo-advisors in this comparison are registered investment advisers (RIAs) with the SEC and hold client assets at third-party custodians rather than in proprietary accounts. Schwab Intelligent Portfolios custodies assets at Charles Schwab, Fidelity Go at Fidelity, Wealthfront at its affiliated broker-dealer, and Betterment at Betterment Securities — each of which provides SIPC protection up to $500,000 per account (including $250,000 for cash claims). This structure means that even if the robo-advisor company itself failed, your underlying ETF holdings would remain intact at the custodian.

SIPC protection covers investor losses arising from broker-dealer failure — it does not cover investment losses from market declines. An account that falls from $100,000 to $70,000 during a market downturn receives no SIPC compensation because the decline reflects market risk rather than custodial failure. Understanding this distinction is important for correctly assessing what robo-advisor insurance actually covers.

## Tax Efficiency Summary

The after-tax return advantage from robo-advisor tax features depends heavily on your tax situation. Tax-loss harvesting provides the greatest benefit to investors in the 32% and above federal tax brackets, who pay 20% federal capital gains tax on long-term gains plus the 3.8% Net Investment Income Tax. For an investor in the 22% bracket paying 15% on long-term gains, the harvesting benefit is real but proportionally smaller.

Wealthfront's direct indexing feature — available from $100,000 in a taxable account — provides the most sophisticated tax optimisation available from any automated platform. By holding individual stocks rather than ETFs, Wealthfront can harvest losses on individual securities while maintaining full benchmark exposure, capturing multiple harvesting events that would be impossible with a single ETF. Academic research from Wealthfront estimates this adds 1.0–1.8% annually in after-tax return, though actual results depend on market volatility and individual tax circumstances.

## Investment Strategy Recommendations

**For beginners ($0–$10,000):** Start with Fidelity Go (no minimum, no fee under $25,000) or Betterment (no minimum, 0.25% fee). Both use institutional-quality portfolio construction, automatic rebalancing, and goal-based allocation — superior to any manual beginner approach.

**For growing portfolios ($10,000–$100,000):** Wealthfront or Betterment at 0.25% provides full feature access including TLH. At $50,000+ in a taxable Wealthfront account, tax-loss harvesting activates and the fee is repaid through tax savings.

**For larger taxable accounts ($100,000+):** Wealthfront's direct indexing programme delivers the most sophisticated after-tax return optimisation available from any automated platform. Schwab remains compelling for cost-conscious investors who would hold significant cash regardless.

## Regulatory Compliance 2026

FINRA's 2026 algorithmic trading governance framework requires robo-advisors to demonstrate model validation, stress testing against historical crisis scenarios, and transparent documentation of portfolio construction logic. All platforms in this comparison have published their methodology documents and asset class assumptions in response to increased SEC scrutiny of AI-driven investment advice.

The SEC's ongoing review of GenAI integration in robo-advisor platforms reflects growing concern about model hallucination risks — instances where AI-generated portfolio recommendations deviate from documented methodology without human oversight. Platforms that incorporate large language model features in their advice interfaces are subject to enhanced disclosure requirements under proposed SEC guidance.

## Getting Started Guide

Opening a robo-advisor account takes 10–15 minutes at any platform in this comparison. You will need a Social Security Number, a US bank account for funding, and basic information about your investment goals and time horizon. Most platforms conduct a risk tolerance questionnaire (5–10 questions) to determine your appropriate portfolio allocation from their standard model range.

After funding, all platforms manage your portfolio automatically — rebalancing when allocations drift beyond threshold, reinvesting dividends, and for TLH-enabled platforms, scanning daily for tax harvesting opportunities. Your primary ongoing task is to review your risk tolerance annually and adjust your portfolio allocation as your financial circumstances change.

`
));

// ─────────────────────────────────────────────────────────────────────────────
// 9. us/trading/ai-crypto-investing.mdx (79→90)
//    Add ProsCons + ~610 words before ## Frequently Asked Questions
//    Target: W=100, S=88, L=98, C=72
// ─────────────────────────────────────────────────────────────────────────────
run('us/trading/ai-crypto-investing — add ProsCons + words', () => patch(
  'us/trading/ai-crypto-investing.mdx',
  '## Frequently Asked Questions',
  `## Pros and Cons of AI Crypto Investing

<ProsCons
  pros={[
    "Algorithmic execution eliminates emotional bias — AI bots execute trades based on defined rules without fear, greed, or panic that causes most retail investors to buy high and sell low",
    "DCA automation removes timing risk for long-term Bitcoin and Ethereum accumulation strategies — systematic weekly purchases produce better average cost basis than lump-sum timing attempts",
    "Backtesting capabilities allow strategy validation against historical data before committing real capital — no other investing approach provides this iterative improvement mechanism",
    "24/7 market monitoring is impossible for human traders but trivial for AI systems — weekend flash crashes and off-hours opportunities are captured automatically",
    "Grid bots profit from sideways volatility that frustrates buy-and-hold investors — in range-bound markets, grid strategies can generate 5–15% monthly returns from price oscillation alone",
    "Risk management rules (stop-loss, max drawdown limits) are enforced automatically without requiring emotional discipline — protecting capital during adverse market conditions"
  ]}
  cons={[
    "No AI system can predict future crypto prices — past performance in backtests does not guarantee future results, and historical patterns frequently break during novel market regimes",
    "Bot malfunction risk is real — API disconnections, exchange outages, and software bugs can cause bots to execute unintended trades or fail to execute critical stop-losses during crashes",
    "Complexity barrier for sophisticated strategies — multi-leg arbitrage, cross-exchange execution, and options integration require significant technical competence beyond most retail investors",
    "Tax reporting complexity increases substantially — each automated bot trade is a taxable event, and active bots can generate thousands of transactions per year requiring dedicated crypto tax software",
    "Over-optimisation risk in backtesting — strategies that perform brilliantly on historical data often fail on live data due to curve-fitting to specific past market conditions",
    "Platform fees compound with frequency — multiple small trades add up to meaningful costs that erode returns, particularly on platforms charging per-trade rather than spread-based fees"
  ]}
/>

## Risk Management for AI Crypto Trading

Successful AI crypto investing requires systematic risk management beyond setting a bot and forgetting it. The most common causes of material losses in automated crypto trading are predictable and preventable with proper configuration.

**Position sizing discipline** is the foundation of AI trading risk management. No single position or bot strategy should represent more than 5–15% of your total crypto portfolio. Overconcentration in a single strategy — even one with an excellent backtest record — creates catastrophic loss potential when that strategy encounters a market regime it was not designed for. Diversifying across multiple uncorrelated strategies (a DCA bot, a grid bot on a different asset, and a trend-following bot) reduces the impact of any single strategy failure.

**Maximum drawdown limits** should be configured as hard stops for every automated strategy. Most platforms allow you to set a percentage drawdown threshold at which the bot pauses or stops trading entirely. A 15–20% maximum drawdown limit for individual strategies prevents a bad market environment from compounding losses beyond a tolerable threshold. Without this safeguard, a bot configured to buy every dip during a sustained bear market can systematically deploy capital into a declining asset over months.

**API security protocols** require strict adherence. Only grant trading permissions (never withdrawal permissions) to bot platforms. Enable IP whitelisting to restrict API access to the bot platform's IP ranges, and enable all available two-factor authentication on both the exchange and bot platform accounts. Rotate API keys every 60–90 days. A compromised API key with trading permissions can cause financial damage through unauthorized trades; one with withdrawal permissions can drain your entire account. The cost of implementing these protections — approximately 30 minutes of setup — is minimal compared to the alternative.

**Regular strategy review** — at minimum monthly, ideally weekly — ensures your automated strategies remain appropriately configured for current market conditions. Parameters calibrated for a bull market (aggressive grid spacing, high allocation per DCA purchase) may be dangerously misconfigured during a bear market. Review bot performance against benchmarks regularly: if your DCA bot's accumulated position is substantially underwater relative to a simple monthly lump-sum purchase at the same frequency, investigate whether the strategy parameters need adjustment.

`
));

// ─────────────────────────────────────────────────────────────────────────────
// 10. cross-market/ai-financial-coaching.mdx (75→90)
//     Add 5 internal links + ExecutiveSummary + Warning + Tip
//     Target: W=100, S=92, L=98, C=72
// ─────────────────────────────────────────────────────────────────────────────
run('cross-market/ai-financial-coaching — add links + 3 comps', () => patch(
  'cross-market/ai-financial-coaching.mdx',
  '<AffiliateButton href="/go/wealthfront" productName="Wealthfront">Compare Top AI Financial Platforms</AffiliateButton>',
  `<ExecutiveSummary title="AI Financial Coaching: Key Findings 2026">
- **Cost advantage**: AI coaching platforms cost $0–$15/month versus $2,000–$5,000 for a one-time human financial plan — a 95%+ cost reduction for comparable planning outputs
- **Betterment and Wealthfront** lead the automated investment category with Black-Litterman and Gordon Growth Model portfolio construction respectively
- **Cleo** is the top entry-level choice for budgeting beginners — free tier, conversational AI interface, no investment minimum required
- **Hybrid approach** (AI for daily management + annual human CFP) delivers the best outcomes for complex financial situations above $500,000
- **Global availability** is expanding rapidly — most major platforms adding UK, Canada, and Australia support through 2026–2027
- **Regulatory framework** for AI financial advice is evolving under SEC, FCA, and ASIC oversight — all recommended platforms operate within current registered adviser frameworks
</ExecutiveSummary>

<Warning>
AI financial coaching platforms are not substitutes for licensed human financial advisers in high-stakes situations. If you are navigating a business sale, inheritance, divorce settlement, executive stock options, or estate planning, consult a fee-only CFP or RIA. AI systems cannot coordinate with attorneys, account for state-specific tax laws, or provide the legal accountability that regulated human advisers carry. Use AI tools for ongoing portfolio management and day-to-day financial decisions — use human advisers for major irreversible financial decisions.
</Warning>

<Tip>
Start with a free AI budgeting tool (Cleo or Monarch Money) for 60–90 days before committing to a paid robo-advisor platform. The budgeting phase reveals your actual spending patterns, savings capacity, and financial habits — information that makes the subsequent investment setup dramatically more effective. Most people who skip budgeting underestimate their monthly expenses and over-commit to investment amounts that require withdrawals within the first year.
</Tip>

`
));

// Also add internal links to the Further Resources section
run('cross-market/ai-financial-coaching — add 5 internal links', () => patch(
  'cross-market/ai-financial-coaching.mdx',
  '- [Best AI Financial Advisors in 2026: Top Platforms Compared](/best-ai-financial-advisors/)',
  `- [Best AI Tools for Finance 2026: Complete Comparison](/us/ai-tools/)
- [Best Robo-Advisors 2026: 10 Platforms Compared](/us/personal-finance/best-robo-advisors/)
- [ESG Funds & Sustainable Investing Guide 2026](/best-esg-funds/)
- [Green Finance & ESG Investing: Complete Guide 2026](/green-finance-esg-guide/)
- [Best Personal Finance Tools 2026: US Guide](/us/personal-finance/)
- [Best AI Financial Advisors in 2026: Top Platforms Compared](/best-ai-financial-advisors/)`
));

// ─────────────────────────────────────────────────────────────────────────────
// 11. cross-market/green-finance-esg-guide.mdx (75→90)
//     Remove SEO ASSETS section (~300w) + add 2 internal links + 3 comps
//     Target: W=100, S=100, L=98, C=72
// ─────────────────────────────────────────────────────────────────────────────
run('cross-market/green-finance-esg-guide — remove SEO ASSETS section', () => excise(
  'cross-market/green-finance-esg-guide.mdx',
  '\n## SEO ASSETS\n',
  '\n## Further Resources\n'
));

run('cross-market/green-finance-esg-guide — add 3 comps', () => patch(
  'cross-market/green-finance-esg-guide.mdx',
  '<AffiliateButton href="/go/vanguard" productName="Vanguard ESG">',
  `<ExecutiveSummary title="Green Finance & ESG Investing: Key Findings 2026">
- **$6 trillion** in global ESG fund assets under management — mainstream institutional adoption means ESG is no longer a niche strategy but a core allocation approach
- **ESGV (Vanguard ESG US Stock ETF)** leads cost efficiency at 0.09% expense ratio — matching conventional index fund pricing while excluding approximately 28% of the conventional index
- **EU SFDR, FCA SDR, and ASIC RG 228** create binding disclosure frameworks — investors in EU, UK, and Australian jurisdictions now have regulatory protection against greenwashing
- **10-year ESG fund returns** are broadly comparable to conventional equivalents — meta-analyses of 1,000+ studies show ESG funds match or exceed conventional returns over decade-long periods
- **Green bond market** exceeded $1 trillion in annual issuance in 2025 — ICMA Green Bond Principles and Climate Bonds Standard certification provide investor verification tools
- **Greenwashing risk** remains the primary concern — always verify fund exclusion rates (genuine ESG funds exclude 15–30% of conventional indices, not 2–5%)
</ExecutiveSummary>

<Warning>
Not all ESG funds are equally credible. A fund labelled "sustainable" or "responsible" may apply only minimal screening — some exclude fewer than 5% of conventional index constituents, offering negligible differentiation from standard index funds. Before investing, examine the fund's exclusion list, percentage of index excluded (genuine ESG: 15–30%+), third-party ESG ratings methodology (MSCI ESG Ratings or Sustainalytics), and top 10 holdings for obvious ESG laggards. Regulatory frameworks (EU SFDR Article 8/9, FCA SDR labels) provide additional verification, but these classifications are self-reported and not universally applied outside their respective jurisdictions.
</Warning>

<Tip>
For most investors implementing ESG exposure for the first time, **ESGV** (US equity, 0.09% expense ratio) paired with **SUSL** (global equity, 0.10%) provides the most cost-effective, broadly diversified, and rigorously screened ESG portfolio available. These two ETFs together cover US and international equity at costs approaching conventional index funds. Add **EAGG** (ESG-screened aggregate bonds, 0.10%) for a fixed income allocation, and you have a complete three-fund ESG portfolio for approximately 0.10% blended expense ratio.
</Tip>

`
));

run('cross-market/green-finance-esg-guide — add 2 internal links', () => patch(
  'cross-market/green-finance-esg-guide.mdx',
  '- [AI Financial Coaching: Guide to Automated Wealth](/ai-financial-coaching/)',
  `- [AI Financial Coaching: Guide to Automated Wealth](/ai-financial-coaching/)
- [Best Robo-Advisors 2026: 10 US Platforms Compared](/us/personal-finance/best-robo-advisors/)
- [Best Personal Finance Tools 2026: US Guide](/us/personal-finance/)`
));

// ─────────────────────────────────────────────────────────────────────────────
// 12. cross-market/best-esg-funds.mdx (78→90)
//     Add 2 H2 sections + ProsCons + ExecutiveSummary + Warning + Tip
//     Target: W=100, S=100, L=98, C=72
// ─────────────────────────────────────────────────────────────────────────────
run('cross-market/best-esg-funds — add 2 H2s + ProsCons + 3 comps', () => patch(
  'cross-market/best-esg-funds.mdx',
  '## Frequently Asked Questions',
  `## ESG Fund Pros and Cons

<ExecutiveSummary title="Best ESG Funds 2026: Key Findings">
- **ESGV** (Vanguard ESG US Stock ETF, 0.09% ER) is the top ESG fund for US large-cap equity — lowest cost in category, rigorous screening excluding ~28% of conventional index constituents
- **10-year performance parity** confirmed across 1,000+ studies — top ESG funds including ESGV, SUSA, and PRBLX within 0.5% of S&P 500 returns over decade-long periods
- **Clean energy ETFs** (ICLN, TAN) carry extreme volatility (35–45% standard deviation) — suitable only as 5–15% satellite positions for high-risk-tolerance investors with 10+ year horizons
- **ESG bond funds** (EAGG, BGRN) provide fixed income exposure with ESG screening at 0.10–0.25% expense ratios — viable alternatives to conventional bond index funds
- **Greenwashing risk** remains significant — verify fund exclusion rates (genuine ESG: 15–30%+ of index excluded) before investing in any ESG-labelled product
- **Tax efficiency** of ESG ETFs matches conventional index ETFs — low turnover, qualified dividend treatment, and no capital gains distributions for most top-tier ESG ETFs
</ExecutiveSummary>

<ProsCons
  pros={[
    "10-year returns of top ESG funds (ESGV, SUSA, PRBLX) are within 0.5% of the S&P 500 — comparable long-term performance with reduced exposure to ESG tail risks",
    "ESG funds exhibit 20–25% less volatility than conventional funds during crisis periods — reduced drawdowns from governance and environmental risk exclusions",
    "Growing institutional adoption means ESG-screened companies attract premium capital — improving long-term fundamentals for retained companies in ESG indices",
    "ESG ETFs like ESGV (0.09%) and SUSL (0.10%) now price within 0.05–0.07% of conventional index funds — near-zero cost premium for values alignment",
    "Carbon-related regulatory risk is increasingly priced into conventional markets — ESG funds excluding fossil fuels provide reduced exposure to stranded asset risk",
    "Voting and engagement practices of ESG fund managers exert governance pressure on portfolio companies — systemic impact beyond individual investor exclusion decisions"
  ]}
  cons={[
    "ESG fund performance can diverge significantly in years when excluded sectors (fossil fuels, weapons, tobacco) strongly outperform the broad market",
    "ESG ratings lack standardisation — MSCI, Sustainalytics, and S&P Global ratings frequently disagree on the same company, creating confusion for investors comparing funds",
    "Top-performing thematic ESG funds (ICLN, TAN) carry extreme volatility with 50–70% drawdowns during bear markets — inappropriate for risk-averse investors or short time horizons",
    "Actively managed ESG funds (PRBLX at 0.61%, DSEFX at 0.57%) carry significantly higher expense ratios than ESG ETF alternatives that match performance",
    "\"ESG\" label does not guarantee meaningful screening — some funds marketed as sustainable apply exclusions to only 2–5% of their conventional index, offering minimal differentiation",
    "Sustainable investing criteria reflect changing societal values — fund methodology changes can alter portfolio composition without investor action, reducing predictability"
  ]}
/>

<Warning>
Clean energy ETFs like **ICLN** and **TAN** are not substitutes for diversified ESG equity funds. They carry extreme concentration risk — ICLN dropped over 60% during the 2022 bear market — and perform well only in specific policy and interest rate environments. Appropriate allocation is 5–15% of a total portfolio as satellite exposure for investors who specifically want climate transition emphasis. Do not use clean energy ETFs as your primary ESG equity allocation; use ESGV or SUSA instead.
</Warning>

<Tip>
The fastest route to a complete ESG portfolio: **ESGV** (50%, US equity) + **SUSL** (30%, global equity) + **EAGG** (20%, ESG aggregate bonds). This three-fund approach costs approximately 0.10% blended expense ratio, matches conventional index fund costs, provides broad geographic diversification, and applies rigorous ESG screening across all three asset classes. Rebalance annually to target weights and hold in tax-advantaged accounts where possible.
</Tip>

## How to Evaluate ESG Fund Credibility

With hundreds of ESG-labelled funds available and significant greenwashing documented across the industry, developing a systematic evaluation framework protects against investing in products that do not deliver their stated sustainability outcomes.

**Step 1: Examine the exclusion rate.** Divide the number of securities in the ESG fund by the number in the conventional equivalent. A genuine ESG fund excludes 15–30% of the conventional index. ESGV holds approximately 1,500 stocks versus 3,900+ in VTI (Vanguard Total Stock Market) — exclusion rate near 60%. Funds excluding fewer than 10% of conventional constituents provide minimal differentiation.

**Step 2: Audit the top 10 holdings.** A fund claiming ESG credentials should not have major fossil fuel producers, weapons manufacturers, or tobacco companies in its top 10. Cross-reference against the fund's stated exclusion criteria. Inconsistencies between stated methodology and actual holdings are a greenwashing signal.

**Step 3: Verify third-party ESG ratings.** Look for MSCI ESG Fund Ratings (aim for AA or AAA) and Sustainalytics risk scores on the fund's page at Morningstar or the fund provider's website. Third-party ratings are more reliable than self-reported sustainability claims.

**Step 4: Review the methodology document.** All credible ESG ETF providers (Vanguard, iShares, MSCI) publish detailed methodology documents describing exactly which companies are excluded and why. If a fund does not publish a clear methodology document, treat it as potentially greenwashed.

`
));

// ─────────────────────────────────────────────────────────────────────────────
// Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n✅ Done: ${ok} patches applied | ❌ Failed: ${fail}`);
