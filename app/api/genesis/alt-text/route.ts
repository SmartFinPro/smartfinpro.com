import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import sharp from 'sharp';
import { createClaudeMessage } from '@/lib/claude/client';
import { validateBearer } from '@/lib/security/timing-safe';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** Max dimension (width or height) for Anthropic Vision API */
const MAX_VISION_DIMENSION = 2000;

/**
 * POST /api/genesis/alt-text
 * Generates SEO-optimized alt text for an image using Anthropic Vision API.
 *
 * Body: FormData with:
 *   - file: File (single image)
 *   - context: string (optional — keyword/category context)
 *
 * Auth: Bearer CRON_SECRET or same-origin dashboard request
 */
export async function POST(req: NextRequest) {
  // Auth check — timing-safe Bearer token OR same-origin requests (dashboard uploads)
  // Uses strict URL parsing to prevent host spoofing via referer.includes()
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

  const hasValidBearer = validateBearer(req.headers.get('authorization'), process.env.CRON_SECRET);
  if (!hasValidBearer && !isSameOrigin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      success: true,
      altText: 'Financial product comparison and analysis',
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const context = (formData.get('context') as string) || 'finance/fintech review website';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // SECURITY (M-01): Reject oversized uploads / pixel bombs.
    const MAX_INPUT_BYTES = 20 * 1024 * 1024;
    const MAX_INPUT_PIXELS = 80_000_000;
    if (file.size > MAX_INPUT_BYTES) {
      return NextResponse.json(
        { error: `Image too large (>${MAX_INPUT_BYTES} bytes)` },
        { status: 413 },
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Hard-cap Sharp pixel budget to prevent decompression-bomb OOM.
    const sharpInput = (buf: Buffer) => sharp(buf, {
      limitInputPixels: MAX_INPUT_PIXELS,
      sequentialRead: true,
    });

    // Downscale if any dimension exceeds Anthropic Vision's 2000px limit
    let processedBuffer: Buffer = rawBuffer;
    let metadata;
    try {
      metadata = await sharpInput(rawBuffer).metadata();
    } catch (err) {
      logger.warn('[alt-text] Sharp rejected input', {
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json(
        { error: 'Invalid or oversized image' },
        { status: 400 },
      );
    }
    const w = metadata.width || 0;
    const h = metadata.height || 0;

    if (w > MAX_VISION_DIMENSION || h > MAX_VISION_DIMENSION) {
      const resizeOpts = w >= h
        ? { width: MAX_VISION_DIMENSION }
        : { height: MAX_VISION_DIMENSION };
      processedBuffer = Buffer.from(await sharpInput(rawBuffer)
        .resize({ ...resizeOpts, withoutEnlargement: true })
        .toBuffer());
    }

    const base64 = processedBuffer.toString('base64');

    // Determine media type
    let mediaType: 'image/webp' | 'image/png' | 'image/jpeg' | 'image/gif' = 'image/webp';
    if (file.type === 'image/png') mediaType = 'image/png';
    else if (file.type === 'image/jpeg' || file.type === 'image/jpg') mediaType = 'image/jpeg';
    else if (file.type === 'image/gif') mediaType = 'image/gif';

    const response = await createClaudeMessage({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Generate a concise, SEO-optimized alt text for this image. Context: ${context}. The alt text should be descriptive and include relevant keywords. Max 125 characters. Return ONLY the alt text, nothing else.`,
            },
          ],
        },
      ],
    }, { apiKey, operation: 'genesis_alt_text' });

    const textBlock = response.content.find((b) => b.type === 'text');
    const altText = textBlock?.text?.trim() || 'Financial product comparison';

    return NextResponse.json({ success: true, altText });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[alt-text] Error:', msg);
    // Fallback alt text
    return NextResponse.json({
      success: true,
      altText: 'Financial product analysis and comparison',
    });
  }
}
