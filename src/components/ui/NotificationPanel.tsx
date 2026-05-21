import React from 'react';
import { CheckCheck, Loader2, AlertCircle } from 'lucide-react';
import { NotificationDTO } from '../../types';
import { NotificationItem } from './NotificationItem';

interface NotificationPanelProps {
  readonly notifications: NotificationDTO[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onMarkAsRead: (id: number) => Promise<void>;
  readonly onMarkAllAsRead: () => Promise<void>;
  readonly onClose: () => void;
}

export function NotificationPanel({
  notifications,
  isLoading,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationPanelProps) {
  const hasUnread = notifications.some(n => !n.lue);

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
      aria-label="Panneau de notifications"
    >
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800">Notifications</h2>
        {hasUnread && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors"
            title="Tout marquer comme lu"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Corps */}
      <div className="max-h-[420px] overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center items-center py-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Chargement…</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex items-center gap-2 px-4 py-6 text-red-500">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!isLoading && !error && notifications.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">
            Aucune notification pour le moment.
          </p>
        )}

        {!isLoading && !error && notifications.map(notif => (
          <React.Fragment key={notif.id}>
            <NotificationItem
              notification={notif}
              onMarkAsRead={onMarkAsRead}
              onClose={onClose}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}



