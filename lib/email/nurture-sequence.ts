/**
 * Email Nurture Sequence
 *
 * Manages the 3-step welcome sequence for new subscribers:
 * - Step 0 (Day 0): Welcome email with lead magnet (sent immediately on signup)
 * - Step 1 (Day 2): "Top 3 Tools for Your Region" (personalized by country)
 * - Step 2 (Day 5): "Case Study: AI Automation" (Jasper soft-sell)
 *
 * Sequence is triggered by cron job at /api/cron/send-emails
 */

import { render } from '@react-email/components';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from './resend';
import { RegionalToolsEmail } from './templates/regional-tools-email';
import { CaseStudyEmail } from './templates/case-study-email';
import { BrokerPicksEmail } from './templates/broker-picks-email';
import { ReEngagementEmail } from './templates/reengagement-email';

// Sequence configuration — 5-step welcome funnel
export const SEQUENCE_CONFIG = {
  name: 'welcome',
  steps: [
    { step: 0, name: 'welcome',       daysAfterSignup: 0,  subject: 'Your Download: The 5-Minute AI Finance Workflow' },
    { step: 1, name: 'regional-tools', daysAfterSignup: 2,  subject: 'The Top 3 Tools for Your Region' },
    { step: 2, name: 'case-study',     daysAfterSignup: 5,  subject: 'Case Study: How AI Saves 10h/Week in Finance' },
    { step: 3, name: 'broker-picks',   daysAfterSignup: 10, subject: 'Our Top 3 Regulated Brokers for You' },
    { step: 4, name: 'reengagement',   daysAfterSignup: 21, subject: 'What your peers are reading this month' },
  ],
} as const;

interface SequenceResult {
  success: boolean;
  emailsSent: number;
  errors: string[];
  details: Array<{
    email: string;
    step: number;
    status: 'sent' | 'skipped' | 'failed';
    reason?: string;
  }>;
}

/**
 * Process all pending sequence emails
 * Should be called by cron job daily
 */
export async function processNurtureSequence(): Promise<SequenceResult> {
  const supabase = createServiceClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://smartfinpro.com';
  const now = new Date();

  const result: SequenceResult = {
    success: false,
    emailsSent: 0,
    errors: [],
    details: [],
  };

  try {
    // Get all active subscribers who need emails
    // Step 0 is sent immediately on signup, so we start from step 1
    const { data: subscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('id, email, country_code, sequence_step, subscribed_at, last_email_sent_at')
      .eq('status', 'active')
      .gte('sequence_step', 0)
      .lt('sequence_step', SEQUENCE_CONFIG.steps.length)
      .order('subscribed_at', { ascending: true })
      .limit(100); // Process in batches

    if (fetchError) {
      result.errors.push(`Failed to fetch subscribers: ${fetchError.message}`);
      return result;
    }

    if (!subscribers || subscribers.length === 0) {
      result.success = true;
      return result;
    }

    console.log(`[nurture-sequence] Processing ${subscribers.length} subscribers`);

    for (const subscriber of subscribers) {
      const currentStep = subscriber.sequence_step || 0;
      const nextStep = currentStep + 1;

      // Check if next step exists
      if (nextStep >= SEQUENCE_CONFIG.steps.length) {
        result.details.push({
          email: subscriber.email,
          step: nextStep,
          status: 'skipped',
          reason: 'Sequence completed',
        });
        continue;
      }

      const stepConfig = SEQUENCE_CONFIG.steps[nextStep];

      // Calculate when this email should be sent
      const signupDate = new Date(subscriber.subscribed_at);
      const sendDate = new Date(signupDate);
      sendDate.setDate(sendDate.getDate() + stepConfig.daysAfterSignup);

      // Check if it's time to send
      if (now < sendDate) {
        result.details.push({
          email: subscriber.email,
          step: nextStep,
          status: 'skipped',
          reason: `Not yet time (scheduled for ${sendDate.toISOString().split('T')[0]})`,
        });
        continue;
      }

      // Check if already sent (by checking email_sequence_logs)
      const { data: existingLog } = await supabase
        .from('email_sequence_logs')
        .select('id')
        .eq('email', subscriber.email)
        .eq('sequence_name', SEQUENCE_CONFIG.name)
        .eq('step_number', nextStep)
        .single();

      if (existingLog) {
        result.details.push({
          email: subscriber.email,
          step: nextStep,
          status: 'skipped',
          reason: 'Already sent',
        });
        continue;
      }

      // Send the email
      try {
        const sendResult = await sendSequenceEmail(
          subscriber.email,
          nextStep,
          subscriber.country_code || 'us',
          baseUrl
        );

        if (sendResult.success) {
          // Log the send
          await supabase.from('email_sequence_logs').insert({
            subscriber_id: subscriber.id,
            email: subscriber.email,
            sequence_name: SEQUENCE_CONFIG.name,
            step_number: nextStep,
            step_name: stepConfig.name,
            status: 'sent',
            metadata: { messageId: sendResult.messageId },
          });

          // Update subscriber
          await supabase
            .from('subscribers')
            .update({
              sequence_step: nextStep,
              last_email_sent_at: now.toISOString(),
            })
            .eq('id', subscriber.id);

          result.emailsSent++;
          result.details.push({
            email: subscriber.email,
            step: nextStep,
            status: 'sent',
          });

          console.log(`[nurture-sequence] Sent step ${nextStep} to ${subscriber.email}`);
        } else {
          result.errors.push(`Failed to send to ${subscriber.email}: ${sendResult.error}`);
          result.details.push({
            email: subscriber.email,
            step: nextStep,
            status: 'failed',
            reason: sendResult.error,
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Error sending to ${subscriber.email}: ${errorMsg}`);
        result.details.push({
          email: subscriber.email,
          step: nextStep,
          status: 'failed',
          reason: errorMsg,
        });
      }

      // Rate limiting: small delay between sends
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

/**
 * Send a specific sequence email
 */
async function sendSequenceEmail(
  email: string,
  step: number,
  countryCode: string,
  baseUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const unsubscribeToken = Buffer.from(email).toString('base64').slice(0, 16);
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;

  // Normalize country code
  const country = normalizeCountry(countryCode);

  switch (step) {
    case 1: {
      // Day 2: Regional Tools Email
      const html = await render(
        RegionalToolsEmail({
          unsubscribeUrl,
          baseUrl,
          country,
        })
      );

      const subject = getLocalizedSubject(country, 'regional-tools');

      return sendEmail({
        to: email,
        subject,
        html,
      });
    }

    case 2: {
      // Day 5: Case Study Email — market-specific subject, generic body
      const html = await render(
        CaseStudyEmail({
          unsubscribeUrl,
          baseUrl,
        })
      );

      const subject = getLocalizedSubject(country, 'case-study');

      return sendEmail({
        to: email,
        subject,
        html,
      });
    }

    case 3: {
      // Day 10: Top Broker Picks — market-specific subject + regulator name
      const html = await render(
        BrokerPicksEmail({
          unsubscribeUrl,
          baseUrl,
          country,
        })
      );

      const subject = getLocalizedSubject(country, 'broker-picks');

      return sendEmail({
        to: email,
        subject,
        html,
      });
    }

    case 4: {
      // Day 21: Re-engagement — market-specific curated content digest
      const html = await render(
        ReEngagementEmail({
          unsubscribeUrl,
          baseUrl,
          country,
        })
      );

      const subject = getLocalizedSubject(country, 'reengagement');

      return sendEmail({
        to: email,
        subject,
        html,
      });
    }

    default:
      return { success: false, error: `Unknown step: ${step}` };
  }
}

/**
 * Normalize country code to supported regions
 */
function normalizeCountry(countryCode: string): 'us' | 'uk' | 'ca' | 'au' | 'de' {
  const code = countryCode?.toLowerCase() || 'us';

  const mapping: Record<string, 'us' | 'uk' | 'ca' | 'au' | 'de'> = {
    us: 'us',
    uk: 'uk',
    gb: 'uk',
    ca: 'ca',
    au: 'au',
    de: 'de',
    at: 'de', // Austria -> German content
    ch: 'de', // Switzerland -> German content
  };

  return mapping[code] || 'us';
}

/**
 * Get localized subject line for all sequence steps
 */
function getLocalizedSubject(country: string, emailType: string): string {
  const subjects: Record<string, Record<string, string>> = {
    'regional-tools': {
      us: 'The Top 3 Tools for US Finance Professionals',
      uk: 'The Top 3 Tools for UK Finance Professionals',
      ca: 'The Top 3 Tools for Canadian Finance Professionals',
      au: 'The Top 3 Tools for Australian Finance Professionals',
      de: 'Die Top 3 Tools für deutsche Finanzprofis',
    },
    'case-study': {
      us: 'Case Study: How AI Automates 10h of Finance Work Weekly',
      uk: 'Case Study: How UK Traders Save 10h Weekly with AI',
      ca: 'Case Study: How Canadian Advisors Cut Admin Time by 10h/Week',
      au: 'Case Study: How Australian Finance Pros Automate 10h Weekly',
      de: 'Fallstudie: 10 Stunden Finanzarbeit pro Woche automatisieren',
    },
    'broker-picks': {
      us: 'Our Top 3 SEC-Regulated Brokers Right Now',
      uk: 'Our Top 3 FCA-Regulated Brokers for UK Traders',
      ca: 'Our Top 3 CIRO-Regulated Brokers for Canadians',
      au: 'Our Top 3 ASIC-Regulated Brokers for Australians',
      de: 'Unsere Top 3 regulierten Broker für deutsche Anleger',
    },
    'reengagement': {
      us: 'What US finance pros are reading this month',
      uk: 'What UK traders are reading right now',
      ca: 'What Canadian investors are reading this month',
      au: 'What Australian traders are reading right now',
      de: 'Was deutsche Finanzprofis gerade lesen',
    },
  };

  return (
    subjects[emailType]?.[country] ||
    subjects[emailType]?.['us'] ||
    'Your Personalized Finance Update'
  );
}

/**
 * Get sequence stats for dashboard
 */
export async function getSequenceStats(): Promise<{
  totalSubscribers: number;
  byStep: Record<number, number>;
  sentLast24h: number;
  sentLast7d: number;
}> {
  const supabase = createServiceClient();

  // Get subscriber counts by step
  const { data: subscribers } = await supabase
    .from('subscribers')
    .select('sequence_step')
    .eq('status', 'active');

  const byStep: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  (subscribers || []).forEach((s) => {
    const step = s.sequence_step || 0;
    byStep[step] = (byStep[step] || 0) + 1;
  });

  // Get recent sends
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { count: last24h } = await supabase
    .from('email_sequence_logs')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', oneDayAgo);

  const { count: last7d } = await supabase
    .from('email_sequence_logs')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', sevenDaysAgo);

  return {
    totalSubscribers: subscribers?.length || 0,
    byStep,
    sentLast24h: last24h || 0,
    sentLast7d: last7d || 0,
  };
}
