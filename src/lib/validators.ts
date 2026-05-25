/**
 * Règles de validation react-hook-form partagées entre les formulaires.
 * Centraliser ici permet d'assurer la cohérence entre les DTOs swagger et le front.
 */

// ─── Patterns ──────────────────────────────────────────────────────────────────

/**
 * Code postal français : exactement 5 chiffres.
 */
export const CODE_POSTAL_PATTERN = /^\d{5}$/;

/**
 * Numéro de téléphone français (format national ou international).
 * Accepte :
 *   - 0612345678 / 06 12 34 56 78 / 06.12.34.56.78 / 06-12-34-56-78
 *   - +33612345678 / +33 6 12 34 56 78
 *   - 0033612345678
 */
export const PHONE_FR_PATTERN = /^(?:(?:\+|00)33|0)[1-9](?:[\s.-]?\d{2}){4}$/;

// ─── Règles react-hook-form ────────────────────────────────────────────────────

/**
 * Validator pour un champ code postal (5 chiffres).
 */
export const codePostalRules = {
  required: 'Requis',
  pattern: {
    value: CODE_POSTAL_PATTERN,
    message: '5 chiffres requis',
  },
} as const;

/**
 * Validator pour un champ téléphone français.
 */
export const phoneRules = {
  required: 'Requis',
  pattern: {
    value: PHONE_FR_PATTERN,
    message: 'Numéro invalide (ex : 06 12 34 56 78)',
  },
} as const;


