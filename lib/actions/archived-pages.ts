// lib/actions/archived-pages.ts — Two-stage page delete (Archive → Hard-Delete)
'use server';
import 'server-only';
import { logger } from '@/lib/logging';

import fs from 'fs';
import path from 'path';
import { createServiceClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { unstable_cache } from 'next/cache';
import { sendTelegramAlert } from '@/lib/alerts/telegram';

// ── Types ───────────────────────────────────────────────────────

export interface ArchivedPage {
  id: string;
  page_url: string;
  file_path: string;
  archived_file_path: string;
  market: string;
  category: string;
  slug: string;
  redirect_target: string;
  status: 'archived' | 'hard_deleted' | 'restored';
  archived_at: string;
  archived_reason: string;
  cooldown_expires_at: string;
  hard_deleted_at: string | null;
  restored_at: string | null;
}

export interface ArchivePageInput {
  pageUrl: string;
  filePath: string;
  market: string;
  category: string;
  slug: string;
  redirectTarget: string;
  reason?: string;
}

// ── Constants ───────────────────────────────────────────────────

const CONTENT_DIR = path.join(process.cwd(), 'content');
const ARCHIVE_DIR = path.join(process.cwd(), 'content', '_archived');

// ── Core page guardrail (never archivable) ──────────────────────
const CORE_PAGE_URLS = new Set([
  '/',
  '/us',
  '/uk',
  '/ca',
  '/au',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/methodology',
  '/affiliate-disclosure',
  '/imprint',
  '/tools',
]);

function isCorePageUrl(url: string): boolean {
  // Exact match or pillar pages (e.g. /us/trading, /uk/ai-tools)
  if (CORE_PAGE_URLS.has(url)) return true;
  // Category pillar pages: /{market}/{category} (no slug after category)
  const segments = url.split('/').filter(Boolean);
  if (segments.length <= 2) return true; // market + category = pillar = core
  return false;
}

// ── archivePage ─────────────────────────────────────────────────

export async function archivePage(
  input: ArchivePageInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  try {
    // 0. Server-side guardrail: never archive core pages
    if (isCorePageUrl(input.pageUrl)) {
      return { success: false, error: `Cannot archive core page: ${input.pageUrl}` };
    }

    // 1. Validate MDX file exists at original path
    const absoluteSrc = path.join(process.cwd(), input.filePath);
    if (!fs.existsSync(absoluteSrc)) {
      return { success: false, error: `File not found: ${input.filePath}` };
    }

    // 2. Compute archive path (mirrors original structure under _archived/)
    //    content/uk/trading/etoro-review.mdx → content/_archived/uk/trading/etoro-review.mdx
    const relativePath = input.filePath.replace(/^content\//, '');
    const archivedFilePath = `content/_archived/${relativePath}`;
    const absoluteDest = path.join(process.cwd(), archivedFilePath);

    // 3. Create target directory
    const destDir = path.dirname(absoluteDest);
    fs.mkdirSync(destDir, { recursive: true });

    // 4. Move the MDX file
    fs.renameSync(absoluteSrc, absoluteDest);

    // 5. Check if page was previously archived+restored (upsert pattern)
    const { data: existing } = await supabase
      .from('archived_pages')
      .select('id')
      .eq('page_url', input.pageUrl)
      .single();

    let archivedPageId: string;

    if (existing) {
      // Re-archive: update existing row
      const { data, error } = await supabase
        .from('archived_pages')
        .update({
          file_path: input.filePath,
          archived_file_path: archivedFilePath,
          redirect_target: input.redirectTarget,
          status: 'archived',
          archived_at: new Date().toISOString(),
          archived_reason: input.reason || '',
          cooldown_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          hard_deleted_at: null,
          restored_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .single();

      if (error) {
        // Rollback: move file back
        fs.renameSync(absoluteDest, absoluteSrc);
        return { success: false, error: `DB update failed: ${error.message}` };
      }
      archivedPageId = data!.id;
    } else {
      // First-time archive: insert new row
      const { data, error } = await supabase
        .from('archived_pages')
        .insert({
          page_url: input.pageUrl,
          file_path: input.filePath,
          archived_file_path: archivedFilePath,
          market: input.market,
          category: input.category,
          slug: input.slug,
          redirect_target: input.redirectTarget,
          archived_reason: input.reason || '',
        })
        .select('id')
        .single();

      if (error) {
        // Rollback: move file back
        fs.renameSync(absoluteDest, absoluteSrc);
        return { success: false, error: `DB insert failed: ${error.message}` };
      }
      archivedPageId = data!.id;
    }

    // 6. Audit log
    await supabase.from('archive_audit_log').insert({
      archived_page_id: archivedPageId,
      action: 'archive',
      page_url: input.pageUrl,
      old_file_path: input.filePath,
      new_file_path: archivedFilePath,
      redirect_target: input.redirectTarget,
      reason: input.reason || '',
    });

    // 7. Telegram alert (fire-and-forget)
    sendTelegramAlert(
      `📦 <b>Page Archived</b>\n` +
      `<code>${input.pageUrl}</code>\n` +
      `Market: ${input.market} · Category: ${input.category}\n` +
      `Redirect → <code>${input.redirectTarget}</code>\n` +
      `${input.reason ? `Reason: ${input.reason}` : ''}`
    ).catch(() => {});

    // 8. Revalidate
    revalidateTag('content-hub', {});

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[archivePage] Failed:', msg);
    return { success: false, error: msg };
  }
}

// ── restorePage ─────────────────────────────────────────────────

export async function restorePage(
  archivedPageId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  try {
    // 1. Fetch the archived page record
    const { data: page, error: fetchError } = await supabase
      .from('archived_pages')
      .select('*')
      .eq('id', archivedPageId)
      .single();

    if (fetchError || !page) {
      return { success: false, error: 'Archived page not found' };
    }

    if (page.status !== 'archived') {
      return { success: false, error: `Cannot restore page with status: ${page.status}` };
    }

    // 2. Move file back
    const absoluteSrc = path.join(process.cwd(), page.archived_file_path);
    const absoluteDest = path.join(process.cwd(), page.file_path);

    if (!fs.existsSync(absoluteSrc)) {
      return { success: false, error: `Archived file not found: ${page.archived_file_path}` };
    }

    // Ensure original directory exists
    const destDir = path.dirname(absoluteDest);
    fs.mkdirSync(destDir, { recursive: true });

    fs.renameSync(absoluteSrc, absoluteDest);

    // 3. Update status
    const { error: updateError } = await supabase
      .from('archived_pages')
      .update({
        status: 'restored',
        restored_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', archivedPageId);

    if (updateError) {
      // Rollback: move file back to archive
      fs.renameSync(absoluteDest, absoluteSrc);
      return { success: false, error: `DB update failed: ${updateError.message}` };
    }

    // 4. Audit log
    await supabase.from('archive_audit_log').insert({
      archived_page_id: archivedPageId,
      action: 'restore',
      page_url: page.page_url,
      old_file_path: page.archived_file_path,
      new_file_path: page.file_path,
      redirect_target: page.redirect_target,
      reason: 'Restored from archive',
    });

    // 5. Telegram alert (fire-and-forget)
    sendTelegramAlert(
      `♻️ <b>Page Restored</b>\n` +
      `<code>${page.page_url}</code>\n` +
      `Market: ${page.market} · Category: ${page.category}\n` +
      `File restored to <code>${page.file_path}</code>`
    ).catch(() => {});

    // 6. Revalidate
    revalidateTag('content-hub', {});

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[restorePage] Failed:', msg);
    return { success: false, error: msg };
  }
}

// ── hardDeletePage ──────────────────────────────────────────────

export async function hardDeletePage(
  archivedPageId: string,
  confirmSlug: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  try {
    // 1. Fetch the archived page record
    const { data: page, error: fetchError } = await supabase
      .from('archived_pages')
      .select('*')
      .eq('id', archivedPageId)
      .single();

    if (fetchError || !page) {
      return { success: false, error: 'Archived page not found' };
    }

    if (page.status !== 'archived') {
      return { success: false, error: `Cannot hard-delete page with status: ${page.status}` };
    }

    // 1b. Server-side guardrail: never hard-delete core pages
    if (isCorePageUrl(page.page_url)) {
      return { success: false, error: `Cannot hard-delete core page: ${page.page_url}` };
    }

    // 2. Check 14-day cooldown
    const cooldownExpires = new Date(page.cooldown_expires_at);
    if (cooldownExpires > new Date()) {
      const daysRemaining = Math.ceil(
        (cooldownExpires.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      return {
        success: false,
        error: `Cooldown not expired. ${daysRemaining} day(s) remaining.`,
      };
    }

    // 3. Verify slug confirmation
    if (confirmSlug !== page.slug) {
      return { success: false, error: 'Slug confirmation does not match' };
    }

    // 4. Permanently delete the MDX file
    const absoluteFile = path.join(process.cwd(), page.archived_file_path);
    if (fs.existsSync(absoluteFile)) {
      fs.unlinkSync(absoluteFile);
    }

    // 5. Clean up empty archive directories
    try {
      const dir = path.dirname(absoluteFile);
      const remaining = fs.readdirSync(dir);
      if (remaining.length === 0) {
        fs.rmdirSync(dir);
      }
    } catch {
      // Non-critical: directory cleanup is best-effort
    }

    // 6. Update status
    const { error: updateError } = await supabase
      .from('archived_pages')
      .update({
        status: 'hard_deleted',
        hard_deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', archivedPageId);

    if (updateError) {
      logger.error('[hardDeletePage] DB update failed:', updateError.message);
      // File is already deleted — log error but return success since the goal was deletion
    }

    // 7. Audit log
    await supabase.from('archive_audit_log').insert({
      archived_page_id: archivedPageId,
      action: 'hard_delete',
      page_url: page.page_url,
      old_file_path: page.archived_file_path,
      reason: `Hard-deleted after cooldown. Slug confirmed: ${confirmSlug}`,
    });

    // 8. Telegram alert (fire-and-forget — critical: permanent deletion)
    sendTelegramAlert(
      `🗑️ <b>Page HARD DELETED</b>\n` +
      `<code>${page.page_url}</code>\n` +
      `Market: ${page.market} · Category: ${page.category}\n` +
      `Slug: <code>${page.slug}</code>\n` +
      `⚠️ File permanently removed: <code>${page.archived_file_path}</code>`
    ).catch(() => {});

    // 9. Revalidate
    revalidateTag('content-hub', {});

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[hardDeletePage] Failed:', msg);
    return { success: false, error: msg };
  }
}

// ── getArchivedPages ────────────────────────────────────────────

export async function getArchivedPages(): Promise<ArchivedPage[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('archived_pages')
    .select('*')
    .eq('status', 'archived')
    .order('archived_at', { ascending: false });

  if (error) {
    logger.error('[getArchivedPages] Failed:', error.message);
    return [];
  }

  return (data || []) as ArchivedPage[];
}

// ── getArchivedRedirect (cached for 301 lookups) ───────────────

export const getArchivedRedirect = unstable_cache(
  async (pageUrl: string): Promise<string | null> => {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('archived_pages')
      .select('redirect_target')
      .eq('page_url', pageUrl)
      .eq('status', 'archived')
      .single();

    if (error || !data) return null;
    return data.redirect_target;
  },
  ['archived-redirect'],
  { revalidate: 60, tags: ['content-hub'] }
);

// ── getArchivedPageMap (for Content Hub merge) ──────────────────

export async function getArchivedPageMap(): Promise<
  Map<string, { id: string; archived_at: string; cooldown_expires_at: string; redirect_target: string; slug: string }>
> {
  const pages = await getArchivedPages();
  const map = new Map<
    string,
    { id: string; archived_at: string; cooldown_expires_at: string; redirect_target: string; slug: string }
  >();

  for (const p of pages) {
    map.set(p.page_url, {
      id: p.id,
      archived_at: p.archived_at,
      cooldown_expires_at: p.cooldown_expires_at,
      redirect_target: p.redirect_target,
      slug: p.slug,
    });
  }

  return map;
}
