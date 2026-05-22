import { EnumValueDTO } from '../types';

/**
 * Liste statique de repli utilisée si l'API /referentiel/types-etude est indisponible.
 * Doit rester synchronisée avec l'enum TypeEtude côté backend.
 */
export const TYPES_ETUDE_FALLBACK: EnumValueDTO[] = [
  { code: 'ASSAINISSEMENT', libelle: 'ASSAINISSEMENT — Assainissement' },
  { code: 'G0',             libelle: 'G0 — Étude préalable' },
  { code: 'G1_ES_PGC',      libelle: 'G1 ES PGC — Étude de site (PGC)' },
  { code: 'G1_ELAN',        libelle: 'G1 ÉLAN — Étude de site (ÉLAN)' },
  { code: 'G2_AVP',         libelle: 'G2 AVP — Avant-projet' },
  { code: 'G2_PRO',         libelle: 'G2 PRO — Projet' },
  { code: 'G5',             libelle: 'G5 — Diagnostic' },
];

