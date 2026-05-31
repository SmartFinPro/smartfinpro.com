import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { ResearchFaq, ResearchItem, ResearchMeta, ResearchSection } from './types';

const researchDirectory = path.join(process.cwd(), 'content', 'research-notes');

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function toFaqArray(value: unknown): ResearchFaq[] | undefined {
  if (!Array.isArray(value)) return undefined;

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      return {
        question: String(record.question || ''),
        answer: String(record.answer || ''),
      };
    })
    .filter((item): item is ResearchFaq => Boolean(item?.question && item.answer));
}

function toSectionArray(value: unknown): ResearchSection[] | undefined {
  if (!Array.isArray(value)) return undefined;

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      return {
        id: String(record.id || ''),
        title: String(record.title || ''),
      };
    })
    .filter((item): item is ResearchSection => Boolean(item?.id && item.title));
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return undefined;
}

function normalizeResearchFrontmatter(raw: Record<string, unknown>): ResearchMeta {
  const today = new Date().toISOString().split('T')[0];

  return {
    type: 'research',
    title: String(raw.title || ''),
    seoTitle: raw.seoTitle ? String(raw.seoTitle) : undefined,
    description: String(raw.description || ''),
    author: String(raw.author || 'SmartFinPro Research Desk'),
    reviewedBy: raw.reviewedBy ? String(raw.reviewedBy) : undefined,
    publishDate: String(raw.publishDate || raw.date || today),
    modifiedDate: String(raw.modifiedDate || raw.date || today),
    sector: String(raw.sector || ''),
    slug: String(raw.slug || ''),
    ticker: String(raw.ticker || ''),
    exchanges: toStringArray(raw.exchanges),
    markets: toStringArray(raw.markets),
    ratingSource: String(raw.ratingSource || raw.rating_source || 'consensus'),
    ratingLabel: String(raw.ratingLabel || raw.rating_label || ''),
    consensusAnalysts: toNumber(raw.consensusAnalysts || raw.consensus_analysts),
    currentPriceUsd: toNumber(raw.currentPriceUsd || raw.current_price_usd),
    currentPriceCad: toNumber(raw.currentPriceCad || raw.current_price_cad),
    currentPriceEur: toNumber(raw.currentPriceEur || raw.current_price_eur),
    priceTargetUsd: toNumber(raw.priceTargetUsd || raw.price_target_usd),
    priceTargetCad: toNumber(raw.priceTargetCad || raw.price_target_cad),
    priceTargetEur: toNumber(raw.priceTargetEur || raw.price_target_eur),
    upsidePotential: toNumber(raw.upsidePotential || raw.upside_potential),
    marketCapUsd: toNumber(raw.marketCapUsd || raw.market_cap_usd),
    forwardPe: toNumber(raw.forwardPe || raw.forward_pe),
    dividendYield: toNumber(raw.dividendYield || raw.dividend_yield),
    asOf: String(raw.asOf || raw.as_of || today),
    nextReview: String(raw.nextReview || raw.next_review || today),
    dataSources: toStringArray(raw.dataSources || raw.data_sources),
    brokers: toStringArray(raw.brokers),
    faqs: toFaqArray(raw.faqs),
    sections: toSectionArray(raw.sections),
    hasInvestmentContent:
      raw.hasInvestmentContent === true || raw.has_investment_content === true || undefined,
    summary: raw.summary ? String(raw.summary) : undefined,
  };
}

function readResearchFile(filePath: string): ResearchItem {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const meta = normalizeResearchFrontmatter(data as Record<string, unknown>);

  return {
    slug: meta.slug || path.basename(filePath, '.mdx'),
    meta,
    content,
    readingTime: readingTime(content),
  };
}

function listResearchFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => path.join(dirPath, file));
}

export async function getResearchBySlug(
  sector: string,
  slug: string,
): Promise<ResearchItem | null> {
  const filePath = path.join(researchDirectory, sector, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return readResearchFile(filePath);
}

export async function getResearchBySector(sector: string): Promise<ResearchItem[]> {
  const sectorDir = path.join(researchDirectory, sector);
  const files = listResearchFiles(sectorDir);

  return files
    .map((file) => readResearchFile(file))
    .sort((a, b) => {
      const aDate = new Date(a.meta.modifiedDate || a.meta.publishDate).getTime();
      const bDate = new Date(b.meta.modifiedDate || b.meta.publishDate).getTime();
      return bDate - aDate;
    });
}

export async function getAllResearchSlugs(): Promise<Array<{ sector: string; slug: string }>> {
  if (!fs.existsSync(researchDirectory)) return [];

  const sectors = fs.readdirSync(researchDirectory)
    .filter((entry) => fs.statSync(path.join(researchDirectory, entry)).isDirectory());

  const slugs: Array<{ sector: string; slug: string }> = [];

  for (const sector of sectors) {
    for (const file of listResearchFiles(path.join(researchDirectory, sector))) {
      slugs.push({
        sector,
        slug: path.basename(file, '.mdx'),
      });
    }
  }

  return slugs;
}

export async function getAllResearchSectors(): Promise<string[]> {
  const slugs = await getAllResearchSlugs();
  return [...new Set(slugs.map((item) => item.sector))].sort();
}

export async function getAllResearch(): Promise<ResearchItem[]> {
  const slugs = await getAllResearchSlugs();
  const items = await Promise.all(
    slugs.map(({ sector, slug }) => getResearchBySlug(sector, slug)),
  );

  return items
    .filter((item): item is ResearchItem => Boolean(item))
    .sort((a, b) => {
      const aDate = new Date(a.meta.modifiedDate || a.meta.publishDate).getTime();
      const bDate = new Date(b.meta.modifiedDate || b.meta.publishDate).getTime();
      return bDate - aDate;
    });
}

export type { ResearchItem, ResearchMeta } from './types';
