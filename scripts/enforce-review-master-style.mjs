#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import matter from 'gray-matter';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');

function isReviewCandidate(file, data) {
  const base = path.basename(file).toLowerCase();
  if (!data?.reviewedBy || !data?.category || !data?.market) return false;
  if (base === 'index.mdx') return false;

  if (
    data.rating !== undefined ||
    data.affiliateUrl !== undefined ||
    data.pros !== undefined ||
    data.cons !== undefined ||
    data.bestFor !== undefined ||
    data.pricing !== undefined
  ) {
    return true;
  }

  return /review|comparison|\bvs\b|best-/.test(base);
}

function buildExecutiveSummary(data) {
  const pros = Array.isArray(data.pros) ? data.pros.filter(Boolean).slice(0, 4) : [];
  const bullets = pros.length > 0
    ? pros.map((p) => `- **${String(p)}**`).join('\n')
    : '- **Data-driven comparison with clear decision criteria**\n- **Cost, timeline, and risk trade-offs explained**\n- **Practical fit guidance for different profiles**';

  return [
    '<ExecutiveSummary title="Key Findings">',
    '',
    bullets,
    '',
    `**Bottom line:** ${data.bestFor ? String(data.bestFor) : 'Use the option that best matches your score, budget, and timeline.'}`,
    '',
    '</ExecutiveSummary>',
  ].join('\n');
}

function buildAnswerBlock(data) {
  const pricing = data.pricing ? String(data.pricing) : 'Compare total cost, timeline, and approval requirements before deciding.';
  return [
    '<AnswerBlock question="Which option should you evaluate first?">',
    `Start with eligibility and total cost. ${pricing}`,
    '</AnswerBlock>',
  ].join('\n');
}

function buildComparisonSection(data) {
  const guarantee = data.guarantee
    ? String(data.guarantee).replace(/\|/g, '/')
    : 'See provider terms';
  const pricing = data.pricing
    ? String(data.pricing).replace(/\|/g, '/')
    : 'Varies by provider';

  return [
    '## Head-to-Head Comparison',
    '',
    'This quick matrix summarizes the core trade-offs before diving deeper into each option.',
    '',
    '| Category | Option A | Option B | Option C |',
    '|---|---|---|---|',
    '| **Eligibility** | Score/income based | Mid-range eligibility | Broadest eligibility |',
    '| **Timeline** | 12-36 months | 24-60 months | 24-48 months |',
    '| **Total Cost** | Lower fees, tighter criteria | Balanced cost profile | Higher variance |',
    `| **Pricing Signal** | ${pricing} | ${pricing} | ${pricing} |`,
    `| **Guarantee / Policy** | ${guarantee} | ${guarantee} | ${guarantee} |`,
    '',
    '<Tip>',
    'Prioritize the option with the best fit on eligibility first, then optimize for total cost and risk.',
    '</Tip>',
  ].join('\n');
}

function ensureSectionSeparators(body) {
  const lines = body.split('\n');
  const out = [];
  let seenFirstH2 = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isH2 = /^##\s+/.test(line);

    if (isH2) {
      if (!seenFirstH2) {
        seenFirstH2 = true;
      } else {
        let j = out.length - 1;
        while (j >= 0 && out[j].trim() === '') j--;
        const hasSeparator = j >= 0 && out[j].trim() === '---';
        if (!hasSeparator) {
          if (out.length > 0 && out[out.length - 1].trim() !== '') out.push('');
          out.push('---');
          out.push('');
        } else {
          if (out.length > 0 && out[out.length - 1].trim() !== '') out.push('');
        }
      }
    }

    out.push(line);
  }

  return out.join('\n').replace(/\n{4,}/g, '\n\n\n');
}

function injectAfterFirstH2(body, block) {
  const lines = body.split('\n');
  const idx = lines.findIndex((l) => /^##\s+/.test(l));
  if (idx === -1) return `${block}\n\n${body}`;

  const before = lines.slice(0, idx + 1).join('\n');
  const after = lines.slice(idx + 1).join('\n').replace(/^\n*/, '');
  return `${before}\n\n${block}\n\n${after}`;
}

function normalizeBody(body, data) {
  let next = body.trimStart();

  if (!next.includes('<!-- STYLE BLUEPRINT: master-v2 -->')) {
    next = `<!-- STYLE BLUEPRINT: master-v2 -->\n\n${next}`;
  }

  const hasSummary = /<ExecutiveSummary\b/.test(next);
  if (!hasSummary) {
    next = injectAfterFirstH2(next, buildExecutiveSummary(data));
  }

  const hasAnswerBlock = /<AnswerBlock\b/.test(next);
  if (!hasAnswerBlock) {
    next = injectAfterFirstH2(next, buildAnswerBlock(data));
  }

  const hasComparisonSection = /^##\s+(Head-to-Head Comparison|Quick Comparison)/mi.test(next);
  if (!hasComparisonSection) {
    next = `${next.trimEnd()}\n\n---\n\n${buildComparisonSection(data)}\n`;
  }

  next = ensureSectionSeparators(next);
  return next.endsWith('\n') ? next : `${next}\n`;
}

const files = fg.sync(['content/{us,uk,ca,au}/**/*.mdx', '!content/**/index.mdx']);
const changed = [];

for (const rel of files) {
  const abs = path.join(ROOT, rel);
  const src = fs.readFileSync(abs, 'utf8');
  const parsed = matter(src);
  const data = parsed.data || {};

  if (!isReviewCandidate(rel, data)) continue;

  const updatedBody = normalizeBody(parsed.content, data);
  if (updatedBody === parsed.content) continue;

  const out = matter.stringify(updatedBody, data, { lineWidth: 0 });
  changed.push(rel);

  if (WRITE) {
    fs.writeFileSync(abs, out.endsWith('\n') ? out : `${out}\n`, 'utf8');
  }
}

console.log(`${WRITE ? 'Updated' : 'Would update'} ${changed.length} review files.`);
changed.forEach((f) => console.log(f));
