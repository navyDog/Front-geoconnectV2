import { describe, it, expect } from 'vitest';
import { formatDateShort, formatDateLong } from './formatters';

describe('formatDateShort', () => {
  it('retourne "—" si la valeur est undefined', () => {
    expect(formatDateShort(undefined)).toBe('—');
  });

  it('retourne "—" si la valeur est une chaîne vide', () => {
    expect(formatDateShort('')).toBe('—');
  });

  it('retourne "—" si la date est invalide', () => {
    expect(formatDateShort('not-a-date')).toBe('—');
  });

  it('formate une date ISO valide en dd/MM/yyyy', () => {
    expect(formatDateShort('2024-03-15T00:00:00Z')).toBe('15/03/2024');
  });

  it('formate correctement le 1er janvier', () => {
    expect(formatDateShort('2023-01-01T00:00:00Z')).toBe('01/01/2023');
  });
});

describe('formatDateLong', () => {
  it('retourne null si la valeur est undefined', () => {
    expect(formatDateLong(undefined)).toBeNull();
  });

  it('retourne null si la valeur est une chaîne vide', () => {
    expect(formatDateLong('')).toBeNull();
  });

  it('retourne null si la date est invalide', () => {
    expect(formatDateLong('invalid')).toBeNull();
  });

  it('formate une date ISO valide en français (dd MMMM yyyy)', () => {
    const result = formatDateLong('2024-03-15T00:00:00Z');
    expect(result).toMatch(/15 mars 2024/);
  });

  it('formate correctement un mois en minuscules (locale fr)', () => {
    const result = formatDateLong('2024-12-25T00:00:00Z');
    expect(result).toMatch(/25 décembre 2024/);
  });
});

