import api from './index';
import { NotificationPreferencesDTO } from '../types';

/**
 * Récupère les préférences de notification de l'utilisateur connecté.
 * GET /parametres/me/notifications  (rôle requis : BUREAU_ETUDE)
 */
export async function getNotificationPreferences(): Promise<NotificationPreferencesDTO> {
  const { data } = await api.get<NotificationPreferencesDTO>('/parametres/me/notifications');
  return data;
}

/**
 * Met à jour les préférences de notification de l'utilisateur connecté.
 * PUT /parametres/me/notifications  (rôle requis : BUREAU_ETUDE)
 *
 * @param prefs - Nouvelles préférences. `notifierTousDepartements` est obligatoire (@NotNull côté back).
 * @returns Les préférences telles que persistées par le serveur.
 */
export async function updateNotificationPreferences(
  prefs: NotificationPreferencesDTO,
): Promise<NotificationPreferencesDTO> {
  const { data } = await api.put<NotificationPreferencesDTO>('/parametres/me/notifications', prefs);
  return data;
}

