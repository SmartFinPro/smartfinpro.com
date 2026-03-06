'use server';

import 'server-only';
import { logger } from '@/lib/logging';

import { createServiceClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import type { Market, LeadStatus } from '@/lib/supabase/types';

// ============================================================
// Lead Capture
// ============================================================

interface CreateLeadParams {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  source: string;
  sourceUrl?: string;
  campaign?: string;
  market?: Market;
  interestCategory?: string;
  budgetRange?: string;
  timeline?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface LeadResult {
  success: boolean;
  message: string;
  leadId?: string;
  isNew?: boolean;
}

export async function createLead(params: CreateLeadParams): Promise<LeadResult> {
  try {
    if (!params.email || !isValidEmail(params.email)) {
      return { success: false, message: 'Please enter a valid email address' };
    }

    const supabase = createServiceClient();
    const headersList = await headers();

    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || null;

    // Check if lead already exists
    const { data: existing } = await supabase
      .from('leads')
      .select('id, status, score')
      .eq('email', params.email.toLowerCase())
      .single();

    if (existing) {
      // Update existing lead with new information
      const { error } = await supabase
        .from('leads')
        .update({
          first_name: params.firstName || undefined,
          last_name: params.lastName || undefined,
          company: params.company || undefined,
          phone: params.phone || undefined,
          interest_category: params.interestCategory || undefined,
          budget_range: params.budgetRange || undefined,
          timeline: params.timeline || undefined,
          notes: params.notes
            ? `${params.notes}\n---\nUpdated from: ${params.source}`
            : undefined,
          score: existing.score + 5, // Increase score for engagement
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        logger.error('Error updating lead:', error);
        return { success: false, message: 'Failed to update lead information' };
      }

      return {
        success: true,
        message: 'Thank you! We have your information.',
        leadId: existing.id,
        isNew: false,
      };
    }

    // Create new lead
    const { data, error } = await supabase
      .from('leads')
      .insert({
        email: params.email.toLowerCase(),
        first_name: params.firstName,
        last_name: params.lastName,
        company: params.company,
        phone: params.phone,
        source: params.source,
        source_url: params.sourceUrl,
        campaign: params.campaign,
        market: params.market || 'us',
        interest_category: params.interestCategory,
        budget_range: params.budgetRange,
        timeline: params.timeline,
        status: 'new',
        score: 10, // Base score for new lead
        notes: params.notes,
        custom_fields: params.customFields || {},
        utm_source: params.utmSource,
        utm_medium: params.utmMedium,
        utm_campaign: params.utmCampaign,
        ip_address: ip,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating lead:', error);
      if (error.code === '23505') {
        return { success: false, message: 'This email is already registered' };
      }
      return { success: false, message: 'Failed to submit. Please try again.' };
    }

    return {
      success: true,
      message: 'Thank you! We will be in touch soon.',
      leadId: data.id,
      isNew: true,
    };
  } catch (error) {
    logger.error('Error in createLead:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

// ============================================================
// Lead Status Updates
// ============================================================

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('leads')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      logger.error('Error updating lead status:', error);
      return { success: false, message: 'Failed to update status' };
    }

    return { success: true, message: 'Lead status updated' };
  } catch (error) {
    logger.error('Error in updateLeadStatus:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

// ============================================================
// Lead Scoring
// ============================================================

export async function updateLeadScore(leadId: string, scoreChange: number, reason?: string) {
  try {
    const supabase = createServiceClient();

    // Get current score
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('score, notes')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) {
      return { success: false, message: 'Lead not found' };
    }

    const newScore = Math.max(0, lead.score + scoreChange);
    const scoreNote = reason
      ? `\n[Score ${scoreChange > 0 ? '+' : ''}${scoreChange}] ${reason} (${new Date().toISOString()})`
      : '';

    const { error } = await supabase
      .from('leads')
      .update({
        score: newScore,
        notes: lead.notes ? lead.notes + scoreNote : scoreNote.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      logger.error('Error updating lead score:', error);
      return { success: false, message: 'Failed to update score' };
    }

    return { success: true, newScore };
  } catch (error) {
    logger.error('Error in updateLeadScore:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

// ============================================================
// Lead Queries
// ============================================================

interface GetLeadsParams {
  status?: LeadStatus;
  market?: Market;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'score' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export async function getLeads(params: GetLeadsParams = {}) {
  try {
    const supabase = createServiceClient();

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.market) {
      query = query.eq('market', params.market);
    }

    query = query.order(params.sortBy || 'created_at', {
      ascending: params.sortOrder === 'asc',
    });

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching leads:', error);
      return { error: error.message };
    }

    return { data, count };
  } catch (error) {
    logger.error('Error in getLeads:', error);
    return { error: 'Failed to fetch leads' };
  }
}

export async function getLead(id: string) {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Error fetching lead:', error);
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    logger.error('Error in getLead:', error);
    return { error: 'Failed to fetch lead' };
  }
}

// ============================================================
// Lead Statistics
// ============================================================

export async function getLeadStats() {
  try {
    const supabase = createServiceClient();

    const { data: leads, error } = await supabase
      .from('leads')
      .select('status, market, created_at, score');

    if (error) {
      logger.error('Error fetching lead stats:', error);
      return { error: error.message };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: leads.length,
      byStatus: {} as Record<string, number>,
      byMarket: {} as Record<string, number>,
      newLast30Days: 0,
      newLast7Days: 0,
      avgScore: 0,
      hotLeads: 0, // Score > 50
    };

    let totalScore = 0;

    leads.forEach((lead) => {
      // By status
      stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1;

      // By market
      stats.byMarket[lead.market] = (stats.byMarket[lead.market] || 0) + 1;

      // Time-based
      const createdAt = new Date(lead.created_at);
      if (createdAt >= thirtyDaysAgo) stats.newLast30Days++;
      if (createdAt >= sevenDaysAgo) stats.newLast7Days++;

      // Score
      totalScore += lead.score;
      if (lead.score > 50) stats.hotLeads++;
    });

    stats.avgScore = leads.length > 0 ? Math.round(totalScore / leads.length) : 0;

    return { data: stats };
  } catch (error) {
    logger.error('Error in getLeadStats:', error);
    return { error: 'Failed to fetch lead stats' };
  }
}

// ============================================================
// Helper Functions
// ============================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
