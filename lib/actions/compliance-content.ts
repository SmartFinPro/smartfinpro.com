'use server';

import 'server-only';

// lib/actions/compliance-content.ts
// Automated FCA/ASIC/CIRO/SEC Content Compliance Checker
//
// Scans MDX files for required regulatory disclosure text.
// Returns per-page compliance status so the dashboard can show
// which articles are missing mandatory labels.
//
// Usage in dashboard:
//   const report = await runContentComplianceCheck('uk');

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

// ── Required disclaimer patterns per market ────────────────────────────────
// Each rule: one of the keywords must be present in the MDX body.

type Regulator = 'FCA' | 'ASIC' | 'CIRO' | 'SEC' | 'FINRA';

interface ComplianceRule {
  regulator: Regulator;
  keywords: string[];          // at least ONE must appear in the content
  requiredOnCategories: string[]; // only apply to these categories
  description: string;
}

const COMPLIANCE_RULES: Record<string, ComplianceRule[]> = {
  uk: [
    {
      regulator: 'FCA',
      keywords: [
        'FCA', 'Financial Conduct Authority',
        'Authorised and regulated', 'authorised by the FCA',
        'FCA regulated', 'FCA-regulated',
      ],
      requiredOnCategories: ['trading', 'forex', 'personal-finance', 'business-banking'],
      description: 'UK trading/finance pages must reference FCA regulation',
    },
  ],
  au: [
    {
      regulator: 'ASIC',
      keywords: [
        'ASIC', 'Australian Securities and Investments Commission',
        'ASIC-regulated', 'ASIC regulated',
        'Australian Financial Services Licence', 'AFSL',
      ],
      requiredOnCategories: ['trading', 'forex', 'personal-finance'],
      description: 'AU financial pages must reference ASIC regulation',
    },
  ],
  ca: [
    {
      regulator: 'CIRO',
      keywords: [
        'CIRO', 'Canadian Investment Regulatory Organization',
        'IIROC', 'Investment Industry Regulatory Organization',
        'CIRO-regulated', 'CIRO regulated',
      ],
      requiredOnCategories: ['trading', 'forex', 'personal-finance'],
      description: 'CA investment pages must reference CIRO/IIROC regulation',
    },
  ],
  us: [
    {
      regulator: 'SEC',
      keywords: [
        'SEC', 'Securities and Exchange Commission',
        'FINRA', 'Financial Industry Regulatory Authority',
        'SEC-registered', 'FINRA-registered',
      ],
      requiredOnCategories: ['trading', 'forex'],
      description: 'US trading pages must reference SEC/FINRA regulation',
    },
  ],
};

// ── Types ──────────────────────────────────────────────────────────────────

export interface ContentComplianceIssue {
  regulator: Regulator;
  description: string;
  missingKeywords: string[];
}

export interface ContentComplianceResult {
  filePath: string;
  slug: string;
  market: string;
  category: string;
  title: string;
  compliant: boolean;
  issues: ContentComplianceIssue[];
}

export interface ContentComplianceReport {
  scanned: number;
  compliant: number;
  violations: number;
  results: ContentComplianceResult[];
  generatedAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function slugFromPath(absolutePath: string, market: string): string {
  const rel = path.relative(CONTENT_DIR, absolutePath);
  const withoutExt = rel.replace(/\.mdx$/, '');
  const parts = withoutExt.split(path.sep);
  const [, ...rest] = parts; // remove market prefix
  return market === 'us' ? '/' + rest.join('/') : '/' + parts.join('/');
}

function collectMdxFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectMdxFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.mdx')) files.push(full);
  }
  return files;
}

// ── Main function ──────────────────────────────────────────────────────────

/**
 * Run content compliance check for one or all markets.
 * @param filterMarket — optional, limits scan to one market
 */
export async function runContentComplianceCheck(
  filterMarket?: 'us' | 'uk' | 'ca' | 'au',
): Promise<ContentComplianceReport> {
  const markets = filterMarket
    ? [filterMarket]
    : (['us', 'uk', 'ca', 'au'] as const);

  const results: ContentComplianceResult[] = [];

  for (const market of markets) {
    const rules = COMPLIANCE_RULES[market] ?? [];
    const marketDir = path.join(CONTENT_DIR, market);
    const files = collectMdxFiles(marketDir);

    for (const filePath of files) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const { data: frontmatter, content } = matter(raw);
        const category: string = frontmatter.category ?? '';
        const title: string = frontmatter.title ?? path.basename(filePath, '.mdx');
        const slug = slugFromPath(filePath, market);

        // Only check files in regulated categories
        const applicableRules = rules.filter((r) =>
          r.requiredOnCategories.includes(category),
        );

        if (applicableRules.length === 0) continue; // non-regulated category

        const issues: ContentComplianceIssue[] = [];

        for (const rule of applicableRules) {
          const hasKeyword = rule.keywords.some((kw) =>
            content.includes(kw) || JSON.stringify(frontmatter).includes(kw),
          );

          if (!hasKeyword) {
            issues.push({
              regulator: rule.regulator,
              description: rule.description,
              missingKeywords: rule.keywords.slice(0, 3), // show first 3 options
            });
          }
        }

        results.push({
          filePath: path.relative(process.cwd(), filePath),
          slug,
          market,
          category,
          title,
          compliant: issues.length === 0,
          issues,
        });
      } catch {
        // Skip unreadable files
      }
    }
  }

  const violations = results.filter((r) => !r.compliant).length;

  return {
    scanned: results.length,
    compliant: results.length - violations,
    violations,
    results: results.sort((a, b) => (a.compliant ? 1 : -1) - (b.compliant ? 1 : -1)),
    generatedAt: new Date().toISOString(),
  };
}
