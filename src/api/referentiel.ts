import api from './index';
import { EnumValueDTO } from '../types';

export { TYPES_ETUDE_FALLBACK } from '../constants/typesEtude';

/**
 * Récupère la liste des types d'étude disponibles depuis le référentiel.
 * GET /referentiel/types-etude  (endpoint public — pas de token requis)
 */
export async function getTypesEtude(): Promise<EnumValueDTO[]> {
  const response = await api.get<EnumValueDTO[]>('/referentiel/types-etude');
  return response.data;
}

