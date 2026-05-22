import api from './index';
import { DepartementDTO, EnumValueDTO } from '../types';

export { TYPES_ETUDE_FALLBACK } from '../constants/typesEtude';

/**
 * Récupère la liste des types d'étude disponibles depuis le référentiel.
 * GET /referentiel/types-etude  (endpoint public — pas de token requis)
 */
export async function getTypesEtude(): Promise<EnumValueDTO[]> {
  const response = await api.get<EnumValueDTO[]>('/referentiel/types-etude');
  return response.data;
}

/**
 * Récupère la liste des 101 départements français.
 * GET /referentiel/departements  (endpoint public — pas de token requis)
 *
 * Données statiques côté back — à mettre en cache (staleTime: Infinity recommandé).
 * Les codes Corse ("2A", "2B") sont des chaînes ; DOM-TOM sur 3 chiffres ("971"…).
 */
export async function getDepartements(): Promise<DepartementDTO[]> {
  const { data } = await api.get<DepartementDTO[]>('/referentiel/departements');
  return data;
}

