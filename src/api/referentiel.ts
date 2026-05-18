import api from './index';
import { EnumValueDTO } from '../types';

/**
 * Récupère la liste des types d'étude disponibles depuis le référentiel.
 * GET /referentiel/types-etude
 */
export async function getTypesEtude(): Promise<EnumValueDTO[]> {
  const response = await api.get<EnumValueDTO[]>('/referentiel/types-etude');
  return response.data;
}

