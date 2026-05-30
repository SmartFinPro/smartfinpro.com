// lib/actions/notifications.ts
'use server';
import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

export interface NotificationRow {
  id: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string | null;
  source: string | null;
  link_url: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const SELECT_COLS =
  'id, type, severity, title, message, source, link_url, metadata, read_at, created_at';

/** Most recent notifications, newest first. */
export async function getNotifications(
  limit = 50,
): Promise<ActionResult<NotificationRow[]>> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('notifications')
      .select(SELECT_COLS)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('getNotifications query failed', { error: error.message });
      return { success: false, error: error.message };
    }
    return { success: true, data: (data ?? []) as NotificationRow[] };
  } catch (err) {
    logger.error('getNotifications failed', err);
    return { success: false, error: 'Internal error' };
  }
}

/** Count of unread notifications (read_at IS NULL). */
export async function getUnreadCount(): Promise<ActionResult<number>> {
  try {
    const supabase = createServiceClient();
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null);

    if (error) {
      logger.error('getUnreadCount query failed', { error: error.message });
      return { success: false, error: error.message };
    }
    return { success: true, data: count ?? 0 };
  } catch (err) {
    logger.error('getUnreadCount failed', err);
    return { success: false, error: 'Internal error' };
  }
}

/** Mark a single notification read. Idempotent. */
export async function markNotificationRead(
  id: string,
): Promise<ActionResult<null>> {
  if (!id) return { success: false, error: 'Missing id' };
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null);

    if (error) {
      logger.error('markNotificationRead failed', { error: error.message });
      return { success: false, error: error.message };
    }
    return { success: true, data: null };
  } catch (err) {
    logger.error('markNotificationRead failed', err);
    return { success: false, error: 'Internal error' };
  }
}

/** Mark all unread notifications read. */
export async function markAllNotificationsRead(): Promise<ActionResult<null>> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);

    if (error) {
      logger.error('markAllNotificationsRead failed', { error: error.message });
      return { success: false, error: error.message };
    }
    return { success: true, data: null };
  } catch (err) {
    logger.error('markAllNotificationsRead failed', err);
    return { success: false, error: 'Internal error' };
  }
}
