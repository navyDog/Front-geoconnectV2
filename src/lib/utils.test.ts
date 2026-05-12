import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('retourne une chaîne vide si aucun argument', () => {
    expect(cn()).toBe('');
  });

  it('concatène des classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignore les valeurs falsy (undefined, null, false)', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
  });

  it('fusionne les classes Tailwind contradictoires (tailwind-merge)', () => {
    // p-2 et p-4 sont contradictoires : tailwind-merge garde le dernier
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('fusionne correctement les variantes de couleur', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('gère les objets de classe conditionnels (clsx)', () => {
    expect(cn({ 'font-bold': true, 'italic': false })).toBe('font-bold');
  });

  it('gère les tableaux de classes (clsx)', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });
});

