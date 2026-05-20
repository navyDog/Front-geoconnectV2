import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationDTO } from '../types';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../api/notification';

const POLLING_INTERVAL_MS = 30_000;

export interface UseNotificationsReturn {
  /** Nombre de notifications non lues (badge). */
  unreadCount: number;
  /** Liste des notifications, chargée à la demande. */
  notifications: NotificationDTO[];
  /** Indique si la liste est en cours de chargement. */
  isLoadingList: boolean;
  /** Erreur éventuelle lors du chargement de la liste. */
  listError: string | null;
  /** Charge la liste des notifications depuis le serveur. */
  loadNotifications: () => Promise<void>;
  /** Marque une notification comme lue (mise à jour optimiste). */
  markAsRead: (id: number) => Promise<void>;
  /** Marque toutes les notifications comme lues (mise à jour optimiste). */
  markAllAsRead: () => Promise<void>;
}

/**
 * Hook central pour le système de notifications.
 *
 * - Badge : polling toutes les 30 s via `getUnreadCount`.
 * - Liste : chargée à la demande via `loadNotifications`.
 * - Arrête le polling si `isAuthenticated` est false.
 */
export function useNotifications(isAuthenticated: boolean): UseNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Ref pour éviter les appels API si le composant est démonté
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Badge polling ────────────────────────────────────────────────────────────

  const refreshBadgeCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await getUnreadCount();
      if (isMounted.current) setUnreadCount(count);
    } catch {
      // Silencieux — on ne veut pas planter l'app pour un badge
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    refreshBadgeCount(); // appel immédiat au montage / à la connexion
    const interval = setInterval(refreshBadgeCount, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshBadgeCount]);

  // ── Chargement de la liste (à la demande) ───────────────────────────────────

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingList(true);
    setListError(null);
    try {
      const data = await getNotifications();
      if (isMounted.current) setNotifications(data);
    } catch {
      if (isMounted.current) setListError('Impossible de charger les notifications.');
    } finally {
      if (isMounted.current) setIsLoadingList(false);
    }
  }, [isAuthenticated]);

  // ── Marquage comme lu ────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (id: number) => {
    // Mise à jour optimiste
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, lue: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(id);
    } catch {
      // En cas d'erreur, on resynchronise le badge
      refreshBadgeCount();
    }
  }, [refreshBadgeCount]);

  const markAllAsRead = useCallback(async () => {
    // Mise à jour optimiste
    setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch {
      refreshBadgeCount();
    }
  }, [refreshBadgeCount]);

  return {
    unreadCount,
    notifications,
    isLoadingList,
    listError,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}

