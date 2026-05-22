import { useEffect, useState } from 'react';
import { getTypesEtude } from '../api/referentiel';
import { TYPES_ETUDE_FALLBACK } from '../constants/typesEtude';
import { EnumValueDTO } from '../types';

interface UseTypesEtudeResult {
  typesEtude: EnumValueDTO[];
  loading: boolean;
}

/**
 * Récupère la liste des types d'étude depuis l'API référentiel (endpoint public).
 * En cas d'échec, retourne TYPES_ETUDE_FALLBACK.
 */
export function useTypesEtude(): UseTypesEtudeResult {
  const [typesEtude, setTypesEtude] = useState<EnumValueDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTypesEtude()
      .then(setTypesEtude)
      .catch(() => setTypesEtude(TYPES_ETUDE_FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return { typesEtude, loading };
}

