import { NextRequest, NextResponse } from 'next/server';
import { processNurtureSequence } from '@/lib/email/nurture-sequence';

/**
 * Email Sequence Cron Job
 *
 * Processes the nurture sequence for all subscribers:
 * - Day 2: Regional Tools email
 * - Day 5: Case Study email
 *
 * Schedule: Daily at 10 AM UTC (good time for US/EU engagement)
 *
 * Self-hosted crontab entry:
 *   0 10 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/send-emails >> /home/master/applications/smartfinpro/logs/cron.log 2>&1
 */
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET — only Bearer token auth (self-hosted)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.startsWith('your-')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[send-emails] Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[send-emails] Starting email sequence processing...');
  const startTime = Date.now();

  try {
    const result = await processNurtureSequence();

    const duration = Date.now() - startTime;

    console.log('[send-emails] Processing completed:', {
      success: result.success,
      emailsSent: result.emailsSent,
      errors: result.errors.length,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: result.success,
      message: 'Email sequence processing completed',
      emailsSent: result.emailsSent,
      errorsCount: result.errors.length,
      duration: `${duration}ms`,
      details: result.details,
      errors: result.errors.slice(0, 10), // Limit errors in response
    });
  } catch (error) {
    console.error('[send-emails] Processing failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST for manual trigger from dashboard
export async function POST(request: NextRequest) {
  return GET(request);
}
