import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Max dimension for ANY output image.
 * Anthropic Vision API rejects images > 2000px on either axis.
 * We cap at 1920px to leave margin and target 1200px width for web display.
 */
const MAX_DIMENSION = 1920;
const TARGET_WIDTH = 1200;

/**
 * POST /api/genesis/process-images
 * Processes uploaded images: WebP conversion, compression, and resizing via Sharp.
 * Guarantees all output images ≤ MAX_DIMENSION px on both axes.
 *
 * Body: FormData with:
 *   - files: File[] (up to 4 images)
 *   - market: string
 *   - category: string
 *   - slug: string
 *
 * Auth: Bearer CRON_SECRET or same-origin dashboard request
 */
export async function POST(req: NextRequest) {
  // Auth check — allow Bearer token OR same-origin requests (dashboard uploads)
  // Uses strict URL parsing to prevent host spoofing via referer.includes()
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const referer = req.headers.get('referer') || '';
  const origin = req.headers.get('origin') || '';
  const host = req.headers.get('host') || '';
  let isSameOrigin = false;
  try {
    if (origin && host) {
      isSameOrigin = new URL(origin).host === host;
    } else if (referer && host) {
      isSameOrigin = new URL(referer).host === host;
    }
  } catch { /* malformed URL → not same-origin */ }

  if (!cronSecret || (authHeader !== `Bearer ${cronSecret}` && !isSameOrigin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const market = formData.get('market') as string;
    const category = formData.get('category') as string;
    const slugBase = formData.get('slug') as string;

    if (!market || !category || !slugBase) {
      return NextResponse.json({ error: 'Missing market, category, or slug' }, { status: 400 });
    }

    // Sanitize path segments to prevent path traversal attacks
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeMarket = sanitize(market);
    const safeCategory = sanitize(category);
    const safeSlug = sanitize(slugBase);

    // Build output directory with sanitized segments
    const prefix = safeMarket;
    const imageDir = path.join(process.cwd(), 'public', 'images', 'content', prefix, safeCategory, safeSlug);

    // Verify resolved path is within expected directory
    const resolvedDir = path.resolve(imageDir);
    const expectedBase = path.resolve(process.cwd(), 'public', 'images', 'content');
    if (!resolvedDir.startsWith(expectedBase)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }

    const positions: Array<'hero' | 'mid-scroll' | 'comparison' | 'deep-content'> = [
      'hero', 'comparison', 'mid-scroll', 'deep-content',
    ];

    const results: Array<{
      filename: string;
      width: number;
      height: number;
      sizeKb: number;
      position: string;
    }> = [];

    // Process each file
    const files = formData.getAll('files') as File[];
    for (let i = 0; i < Math.min(files.length, 4); i++) {
      const file = files[i];
      if (!file || typeof file === 'string') continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const position = positions[i] || 'deep-content';
      const filename = `${position}.webp`;

      // Read original dimensions for logging
      const origMeta = await sharp(buffer).metadata();
      const origW = origMeta.width || 0;
      const origH = origMeta.height || 0;

      // Determine target dimensions:
      // 1. Cap longest edge at MAX_DIMENSION (1920px) — Anthropic-safe
      // 2. Target width = 1200px for web display
      // 3. Use whichever is smaller to ensure both constraints are met
      const targetW = Math.min(TARGET_WIDTH, MAX_DIMENSION);
      const targetH = MAX_DIMENSION;

      const processed = await sharp(buffer)
        .resize({
          width: targetW,
          height: targetH,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      const metadata = await sharp(processed).metadata();
      const finalW = metadata.width || 0;
      const finalH = metadata.height || 0;

      if (origW > MAX_DIMENSION || origH > MAX_DIMENSION) {
        console.log(
          `[process-images] Resized ${file.name}: ${origW}×${origH} → ${finalW}×${finalH} (capped at ${MAX_DIMENSION}px)`,
        );
      }

      // Write to disk
      const outputPath = path.join(imageDir, filename);
      fs.writeFileSync(outputPath, processed);

      results.push({
        filename,
        width: finalW,
        height: finalH,
        sizeKb: Math.round(processed.length / 1024),
        position,
      });
    }

    return NextResponse.json({ success: true, images: results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[process-images] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
