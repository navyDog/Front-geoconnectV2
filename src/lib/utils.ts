import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrait un message d'erreur lisible depuis une erreur Axios ou native.
 */
export function extractErrorMessage(err: unknown, fallback = 'Erreur lors du chargement des données.'): string {
  const e = err as any;
  return e?.response?.data?.message ?? e?.message ?? fallback;
}

