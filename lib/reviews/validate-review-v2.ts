// lib/reviews/validate-review-v2.ts — Broker-V2 publication contract guard (pure)
// ============================================================
// Enforces docs/reviews/broker-v2-standard.md against a single V2 review.
//
// This is a PURE function: no file IO, no process.exit, no console output.
// Discovery (which files are 'v2'), building `knownReviewPaths` from the
// content tree, printing, and exit codes all belong to the CLI wrapper —
// scripts/validate-review-v2.mts.
//
// Reused, not re-implemented:
//  - Frontmatter's §30.1 word-length rules + the Zod shape of verdict /
//    essentialFacts / alternatives / sectionVerdicts / finalDecision / faq
//    come from `normalizeVerdictFrontmatter()` (lib/reviews/verdict-
//    frontmatter.ts), which wraps VerdictFrontmatterSchema and already
//    returns the exact { path, message } issue shape this module needs.
//    Its own docstring names this file as the intended consumer of
//    `issues`.
//  - The 5 mdx-owned section ids/titles/order come from `REVIEW_V2_ANCHORS`
//    / `MDX_ANCHOR_IDS` (lib/reviews/section-anchors.ts) — the single typed
//    source shared with the Nav and ReviewLayoutV2.
//
// What THIS module adds on top (the standard doc's "pluses" the schema
// leaves optional/absent, plus the Body/Verweise sections the schema
// doesn't cover at all):
//  A — sectionVerdicts required (all 5 keys) · finalDecision required ·
//      faq required (4-8 entries) · dataVerifiedDate required ISO, not
//      older than the newest essentialFacts[].asOf · updateLog required
//      (>=1 entry, {date, change}) · modifiedDate required ISO.
//  B — Body: exactly 5 H2 sections, each a <span id> + H2 + <SectionVerdict
//      id> triple, in REVIEW_V2_ANCHORS order, each id exactly once, no
//      extra H2 anywhere. "Immediately" = next non-empty MDX block (a
//      blank-line-delimited chunk), not the next line.
//  C — alternatives resolve to the FULL path /{market}/{category}/{slug}
//      (not the bare slug, which repeats across markets) and are checked
//      against `knownReviewPaths`; no self-links, no duplicates.
//      sourceHref is checked for URL FORM ONLY (via the imported schema's
//      z.string().url() on essentialFacts) — no network access, ever.
// ============================================================

import { normalizeVerdictFrontmatter } from './verdict-frontmatter';
import { REVIEW_V2_ANCHORS, MDX_ANCHOR_IDS } from './section-anchors';

export interface ValidateReviewV2Issue {
  /** Dot-joined path describing where the issue lives, e.g. "sectionVerdicts.fees", "body.markets", "alternatives.0.slug". */
  path: string;
  message: string;
}

export interface ValidateReviewV2Input {
  /**
   * Path to the MDX file. Only its basename (minus `.mdx`) is used, as the
   * review's own slug for self-link detection in `alternatives`. Accepts
   * relative or absolute paths, '/' or '\\' separators.
   */
  filePath: string;
  /** Raw parsed frontmatter (e.g. gray-matter's `data`) — NOT pre-validated. */
  frontmatter: unknown;
  /** MDX body content, frontmatter block already stripped. */
  body: string;
  /** Every known review's full canonical path, e.g. "/us/trading/fidelity-review". */
  knownReviewPaths: ReadonlySet<string> | readonly string[];
}

export interface ValidateReviewV2Result {
  ok: boolean;
  issues: ValidateReviewV2Issue[];
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The 5 mdx-owned anchors, in the single order-of-truth from section-anchors.ts. */
const MDX_ANCHORS = REVIEW_V2_ANCHORS.filter((a) => a.owner === 'mdx');

// ── generic helpers ─────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function slugFromFilePath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const base = normalized.split('/').pop() ?? normalized;
  return base.replace(/\.mdx$/i, '');
}

/**
 * Splits an MDX body into ordered, non-empty "blocks" — chunks separated by
 * one-or-more blank lines. This is what the standard doc means by
 * "immediately" (next non-empty MDX block, not the next line): a
 * `<span id>`, its H2, and its `<SectionVerdict>` must land in three
 * consecutive blocks with nothing else between them.
 */
function splitBlocks(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

const SPAN_RE = /^<span\s+id=(["'])([A-Za-z0-9_-]+)\1\s*>\s*<\/span>$/;
const H1_RE = /^#(?!#)\s+(.+?)\s*$/;
const H2_RE = /^##(?!#)\s+(.+?)\s*$/;
const SECTION_VERDICT_RE = /^<SectionVerdict\s+id=(["'])([A-Za-z0-9_-]+)\1\s*\/>$/;

// ── A — frontmatter pluses (beyond VerdictFrontmatterSchema) ────────────

function checkFrontmatterPluses(fm: Record<string, unknown>, issues: ValidateReviewV2Issue[]): void {
  // sectionVerdicts — required, and ALL 5 MDX_ANCHOR_IDS keys must be present.
  // (SectionVerdictsSchema makes every key — and the whole block — optional
  // at the schema level; the standard doc makes both mandatory for publication.)
  const sectionVerdicts = fm.sectionVerdicts;
  if (!isRecord(sectionVerdicts)) {
    issues.push({ path: 'sectionVerdicts', message: `required (all 5 keys: ${MDX_ANCHOR_IDS.join(', ')})` });
  } else {
    for (const id of MDX_ANCHOR_IDS) {
      const value = sectionVerdicts[id];
      if (typeof value !== 'string' || value.trim().length === 0) {
        issues.push({ path: `sectionVerdicts.${id}`, message: 'required' });
      }
    }
  }

  // finalDecision — required. (Word-count range, when present, is already
  // enforced by the imported schema's wordCountString refinement.)
  if (typeof fm.finalDecision !== 'string' || fm.finalDecision.trim().length === 0) {
    issues.push({ path: 'finalDecision', message: 'required' });
  }

  // faq — required, 4-8 entries. (Per-answer word count, when present, is
  // already enforced by the imported schema.)
  const faq = fm.faq;
  if (!Array.isArray(faq)) {
    issues.push({ path: 'faq', message: 'required (4-8 entries)' });
  } else if (faq.length < 4 || faq.length > 8) {
    issues.push({ path: 'faq', message: `must have 4-8 entries (got ${faq.length})` });
  }

  // dataVerifiedDate — required ISO, not older than the newest essentialFacts[].asOf.
  const dataVerifiedDate = fm.dataVerifiedDate;
  if (typeof dataVerifiedDate !== 'string' || !ISO_DATE_RE.test(dataVerifiedDate)) {
    issues.push({ path: 'dataVerifiedDate', message: 'required, must be an ISO date (YYYY-MM-DD)' });
  } else {
    const facts = Array.isArray(fm.essentialFacts) ? fm.essentialFacts : [];
    const asOfDates = facts
      .map((fact) => (isRecord(fact) && typeof fact.asOf === 'string' ? fact.asOf : null))
      .filter((v): v is string => v !== null && ISO_DATE_RE.test(v));
    if (asOfDates.length > 0) {
      const newestAsOf = asOfDates.reduce((max, cur) => (cur > max ? cur : max));
      if (dataVerifiedDate < newestAsOf) {
        issues.push({
          path: 'dataVerifiedDate',
          message: `must not be older than the newest essentialFacts[].asOf (${newestAsOf})`,
        });
      }
    }
  }

  // updateLog — required, >=1 entry, each { date: ISO, change: non-empty }.
  const updateLog = fm.updateLog;
  if (!Array.isArray(updateLog) || updateLog.length === 0) {
    issues.push({ path: 'updateLog', message: 'required (at least 1 entry)' });
  } else {
    updateLog.forEach((entry, i) => {
      if (!isRecord(entry)) {
        issues.push({ path: `updateLog.${i}`, message: 'must be an object with date and change' });
        return;
      }
      if (typeof entry.date !== 'string' || !ISO_DATE_RE.test(entry.date)) {
        issues.push({ path: `updateLog.${i}.date`, message: 'required, must be an ISO date (YYYY-MM-DD)' });
      }
      if (typeof entry.change !== 'string' || entry.change.trim().length === 0) {
        issues.push({ path: `updateLog.${i}.change`, message: 'required, must be non-empty' });
      }
    });
  }

  // modifiedDate — required ISO (actual change date; distinct from dataVerifiedDate/asOf).
  if (typeof fm.modifiedDate !== 'string' || !ISO_DATE_RE.test(fm.modifiedDate)) {
    issues.push({ path: 'modifiedDate', message: 'required, must be an ISO date (YYYY-MM-DD)' });
  }
}

// ── B — body: 5 sections, each a span + H2 + SectionVerdict triple ──────

function checkBody(body: string, issues: ValidateReviewV2Issue[]): void {
  const blocks = splitBlocks(body);

  // The H1 comes from the layout — the body must not contain one at all.
  const h1Blocks = blocks.filter((block) => H1_RE.test(block));
  if (h1Blocks.length > 0) {
    issues.push({
      path: 'body',
      message: `body must not contain an H1 (it comes from the layout); found ${h1Blocks.length}`,
    });
  }

  // No additional H2 anywhere in the body — exactly 5, total.
  const h2Blocks = blocks.filter((block) => H2_RE.test(block));
  if (h2Blocks.length !== MDX_ANCHORS.length) {
    issues.push({
      path: 'body',
      message: `expected exactly ${MDX_ANCHORS.length} H2 sections, found ${h2Blocks.length}`,
    });
  }

  // Every <span id="..."> block, in the order it appears in the body.
  const spanBlocks: { id: string; index: number }[] = [];
  blocks.forEach((raw, index) => {
    const match = raw.match(SPAN_RE);
    if (match) spanBlocks.push({ id: match[2], index });
  });

  const seenIds = new Set<string>();
  for (const { id } of spanBlocks) {
    if (seenIds.has(id)) {
      issues.push({ path: `body.${id}`, message: `duplicate section id '${id}'` });
    }
    seenIds.add(id);
  }

  // Each expected anchor, in REVIEW_V2_ANCHORS order, must line up with the
  // span/H2/SectionVerdict triple at the same position.
  MDX_ANCHORS.forEach((anchor, position) => {
    const found = spanBlocks[position];
    if (!found) {
      issues.push({
        path: `body.${anchor.id}`,
        message: `missing <span id="${anchor.id}"></span> anchor at position ${position + 1}`,
      });
      return;
    }
    if (found.id !== anchor.id) {
      issues.push({
        path: `body.${anchor.id}`,
        message: `expected <span id="${anchor.id}"> at position ${position + 1}, found id '${found.id}'`,
      });
    }

    const h2Block = blocks[found.index + 1];
    const h2Match = h2Block ? h2Block.match(H2_RE) : null;
    if (!h2Match) {
      issues.push({
        path: `body.${anchor.id}`,
        message: `expected '## ${anchor.title}' immediately after <span id="${anchor.id}">`,
      });
    } else if (h2Match[1] !== anchor.title) {
      issues.push({
        path: `body.${anchor.id}`,
        message: `expected H2 title '${anchor.title}', found '${h2Match[1]}'`,
      });
    }

    const verdictBlock = blocks[found.index + 2];
    const verdictMatch = verdictBlock ? verdictBlock.match(SECTION_VERDICT_RE) : null;
    if (!verdictMatch) {
      issues.push({
        path: `body.${anchor.id}`,
        message: `expected <SectionVerdict id="${anchor.id}" /> immediately after the H2`,
      });
    } else if (verdictMatch[2] !== found.id) {
      issues.push({
        path: `body.${anchor.id}`,
        message: `<SectionVerdict id="${verdictMatch[2]}"> does not match this section's id '${found.id}'`,
      });
    }
  });
}

// ── C — alternatives: full-path resolution, no self-links, no dupes ─────

function checkAlternatives(
  fm: Record<string, unknown>,
  filePath: string,
  knownReviewPaths: ReadonlySet<string> | readonly string[],
  issues: ValidateReviewV2Issue[]
): void {
  const alternatives = Array.isArray(fm.alternatives) ? fm.alternatives : [];
  const market = typeof fm.market === 'string' ? fm.market : null;
  const category = typeof fm.category === 'string' ? fm.category : null;
  const slug = slugFromFilePath(filePath);

  if (!market || !category) {
    if (alternatives.length > 0) {
      issues.push({ path: 'alternatives', message: 'cannot resolve alternative paths: frontmatter market/category missing' });
    }
    return;
  }

  const currentPath = `/${market}/${category}/${slug}`;
  const known = knownReviewPaths instanceof Set ? knownReviewPaths : new Set(knownReviewPaths);
  const seenPaths = new Set<string>();

  alternatives.forEach((alt, i) => {
    if (!isRecord(alt) || typeof alt.slug !== 'string' || alt.slug.trim().length === 0) {
      issues.push({ path: `alternatives.${i}.slug`, message: 'required' });
      return;
    }
    const resolved = `/${market}/${category}/${alt.slug}`;

    if (resolved === currentPath) {
      issues.push({ path: `alternatives.${i}.slug`, message: `self-link: resolves to the review's own path (${resolved})` });
    }
    if (seenPaths.has(resolved)) {
      issues.push({ path: `alternatives.${i}.slug`, message: `duplicate alternative path '${resolved}'` });
    }
    seenPaths.add(resolved);

    if (!known.has(resolved)) {
      issues.push({ path: `alternatives.${i}.slug`, message: `alternative path does not exist: '${resolved}'` });
    }
  });
}

// ── entry point ───────────────────────────────────────────────────────

/**
 * Validates a single V2 review against docs/reviews/broker-v2-standard.md.
 * Pure: no file IO, no process.exit, no console output. Never throws.
 */
export function validateReviewV2(input: ValidateReviewV2Input): ValidateReviewV2Result {
  const { filePath, frontmatter, body, knownReviewPaths } = input;
  const issues: ValidateReviewV2Issue[] = [];

  const fmResult = normalizeVerdictFrontmatter(frontmatter);
  if (!fmResult.ok) {
    issues.push(...fmResult.issues);
  }

  const fm = isRecord(frontmatter) ? frontmatter : {};
  checkFrontmatterPluses(fm, issues);
  checkBody(body, issues);
  checkAlternatives(fm, filePath, knownReviewPaths, issues);

  return { ok: issues.length === 0, issues };
}
