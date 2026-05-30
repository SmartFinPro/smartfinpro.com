// app/(dashboard)/dashboard/notifications/page.tsx
import { getNotifications } from '@/lib/actions/notifications';
import NotificationsClient, { type NotificationRow } from './notifications-client';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const result = await getNotifications(200);
  const items: NotificationRow[] = result.success ? (result.data ?? []) : [];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Notification Center</h1>
        <p className="mt-1 text-sm text-slate-500">
          {items.length === 0
            ? 'Alle System-Alerts, Spikes und Reports an einem Ort'
            : `${items.length} Benachrichtigungen · ${unread} ungelesen`}
        </p>
      </div>

      <NotificationsClient initial={items} />
    </div>
  );
}
