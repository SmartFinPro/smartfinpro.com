'use server';
import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

// ── Types ──────────────────────────────────────────────────────────────────
export interface SavedView {
  id: string;
  route: string;
  name: string;
  params: Record<string, string>;
  is_default: boolean;
  created_at: string;
}

export interface SavedViewInput {
  route: string;
  name: string;
  params: Record<string, string>;
}

type Result<T> = { success: boolean; data?: T; error?: string };

// ── List views for a route (newest first) ───────────────────────────────────
export async function listSavedViews(route: string): Promise<Result<SavedView[]>> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('dashboard_saved_views')
      .select('id, route, name, params, is_default, created_at')
      .eq('route', route)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('listSavedViews query failed', { error: error.message });
      return { success: false, error: error.message };
    }
    return { success: true, data: (data ?? []) as SavedView[] };
  } catch (err) {
    logger.error('listSavedViews failed', err);
    return { success: false, error: 'Internal error' };
  }
}

// ── Create / overwrite a view (upsert on route+name) ─────────────────────────
export async function createSavedView(input: SavedViewInput): Promise<Result<SavedView>> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('dashboard_saved_views')
      .upsert(
        { route: input.route, name: input.name, params: input.params },
        { onConflict: 'route,name' },
      )
      .select('id, route, name, params, is_default, created_at')
      .single();

    if (error) {
      logger.error('createSavedView query failed', { error: error.message });
      return { success: false, error: error.message };
    }
    return { success: true, data: data as SavedView };
  } catch (err) {
    logger.error('createSavedView failed', err);
    return { success: false, error: 'Internal error' };
  }
}

// ── Delete a view by id ──────────────────────────────────────────────────────
export async function deleteSavedView(id: string): Promise<Result<null>> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('dashboard_saved_views')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('deleteSavedView query failed', { error: error.message });
      return { success: false, error: error.message };
    }
    return { success: true, data: null };
  } catch (err) {
    logger.error('deleteSavedView failed', err);
    return { success: false, error: 'Internal error' };
  }
}

// ── Set the default view for a route (one default per route) ─────────────────
export async function setDefaultSavedView(route: string, id: string): Promise<Result<null>> {
  try {
    const supabase = createServiceClient();

    // 1) Unset any existing default(s) for this route.
    const { error: unsetError } = await supabase
      .from('dashboard_saved_views')
      .update({ is_default: false })
      .eq('route', route)
      .eq('is_default', true);

    if (unsetError) {
      logger.error('setDefaultSavedView unset failed', { error: unsetError.message });
      return { success: false, error: unsetError.message };
    }

    // 2) Set the chosen view as default (scoped to route as a defensive check).
    const { error: setError } = await supabase
      .from('dashboard_saved_views')
      .update({ is_default: true })
      .eq('id', id)
      .eq('route', route);

    if (setError) {
      logger.error('setDefaultSavedView set failed', { error: setError.message });
      return { success: false, error: setError.message };
    }
    return { success: true, data: null };
  } catch (err) {
    logger.error('setDefaultSavedView failed', err);
    return { success: false, error: 'Internal error' };
  }
}
