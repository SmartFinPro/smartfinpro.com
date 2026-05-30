// app/api/dashboard/notifications/route.ts
// Auth handled centrally by proxy.ts for /api/dashboard/* — no inline check needed.
import { NextRequest } from 'next/server';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/actions/notifications';
import { logger } from '@/lib/logging';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [list, unread] = await Promise.all([
    getNotifications(50),
    getUnreadCount(),
  ]);

  return Response.json({
    notifications: list.success ? (list.data ?? []) : [],
    unreadCount: unread.success ? (unread.data ?? 0) : 0,
  });
}

export async function POST(request: NextRequest) {
  let body: { action?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    if (body.action === 'markRead') {
      if (!body.id) {
        return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
      }
      const result = await markNotificationRead(body.id);
      return Response.json(result, { status: result.success ? 200 : 500 });
    }

    if (body.action === 'markAllRead') {
      const result = await markAllNotificationsRead();
      return Response.json(result, { status: result.success ? 200 : 500 });
    }

    return Response.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    logger.error('notifications POST failed', err);
    return Response.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
