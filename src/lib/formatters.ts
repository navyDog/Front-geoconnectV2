import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une date ISO en "dd/MM/yyyy". Retourne '—' si absente ou invalide.
 */
export const formatDateShort = (value?: string): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : format(parsed, 'dd/MM/yyyy');
};

/**
 * Formate une date ISO en "dd MMMM yyyy" (français). Retourne null si absente ou invalide.
 */
export const formatDateLong = (value?: string): string | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : format(parsed, 'dd MMMM yyyy', { locale: fr });
};

