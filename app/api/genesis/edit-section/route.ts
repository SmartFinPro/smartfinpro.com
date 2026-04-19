import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { genesisApiLimiter } from '@/lib/security/rate-limit';
import { createClaudeMessage } from '@/lib/claude/client';
import { validateBearer } from '@/lib/security/timing-safe';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/genesis/edit-section
 * Uses AI to rewrite/edit a content section based on a user prompt.
 *
 * Body JSON:
 *   - sectionContent: string  (the current section text)
 *   - userPrompt: string      (what the user wants changed)
 *   - context: string         (keyword/category context)
 *
 * Auth: Same-origin dashboard requests
 */
export async function POST(req: NextRequest) {
  // Rate limit: 10 req/min per IP to protect Anthropic API costs
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (!genesisApiLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Auth — same-origin only (using strict URL parsing to prevent host spoofing)
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
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { sectionContent, userPrompt, context } = await req.json();

    if (!sectionContent || !userPrompt) {
      return NextResponse.json({ error: 'Missing sectionContent or userPrompt' }, { status: 400 });
    }

    const response = await createClaudeMessage({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `You are editing a section of an MDX financial review article. Context: ${context || 'finance website'}.

The user wants to: ${userPrompt}

Here is the current section content:

---
${sectionContent}
---

Please rewrite ONLY this section according to the user's instructions. Keep the same MDX formatting (headings, bold, links, components). Return ONLY the rewritten section content, nothing else — no explanations, no markdown code fences.`,
        },
      ],
    }, { apiKey, operation: 'genesis_edit_section' });

    const textBlock = response.content.find((b) => b.type === 'text');
    const editedContent = textBlock?.text?.trim() || sectionContent;

    return NextResponse.json({ success: true, editedContent });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[edit-section] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
