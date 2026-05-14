import { describe, it, expect } from 'vitest';
import { formatDateShort, formatDateLong, buildEtudeDocuments } from './formatters';
import { EtudeDetailDTO } from '../types';

// ...existing code...

describe('buildEtudeDocuments', () => {
  it('retourne un tableau vide si aucun document n\'est présent', () => {
    const etude: EtudeDetailDTO = {};
    expect(buildEtudeDocuments(etude)).toEqual([]);
  });

  it('inclut le devis PDF de la proposition si devisPdfId est renseigné', () => {
    const etude: EtudeDetailDTO = { propositionDevis: { devisPdfId: 10 } };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toEqual({ id: 10, label: 'Devis (proposition)' });
  });

  it('inclut les docs de la demande si docsDevisId est renseigné', () => {
    const etude: EtudeDetailDTO = {
      propositionDevis: { demandeDevis: { docsDevisId: 20 } },
    };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toEqual({ id: 20, label: 'Documents de la demande' });
  });

  it('inclut le devis signé si devisSigneId est renseigné', () => {
    const etude: EtudeDetailDTO = { devisSigneId: 30 };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toEqual({ id: 30, label: 'Devis signé' });
  });

  it('inclut le rapport si rapportId est renseigné', () => {
    const etude: EtudeDetailDTO = { rapportId: 40 };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toEqual({ id: 40, label: 'Rapport final' });
  });

  it('inclut tous les documents disponibles et les retourne dans l\'ordre', () => {
    const etude: EtudeDetailDTO = {
      devisSigneId: 30,
      rapportId: 40,
      propositionDevis: {
        devisPdfId: 10,
        demandeDevis: { docsDevisId: 20 },
      },
    };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(4);
    expect(docs.map(d => d.id)).toEqual([10, 20, 30, 40]);
  });

  it('n\'inclut pas les entrées avec des IDs null ou undefined', () => {
    const etude: EtudeDetailDTO = {
      devisSigneId: undefined,
      rapportId: 40,
      propositionDevis: { devisPdfId: undefined },
    };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe(40);
  });

  it('ne génère aucun nom de fichier côté client (le backend fournit nomTelechargement)', () => {
    const etude: EtudeDetailDTO = { rapportId: 99 };
    const docs = buildEtudeDocuments(etude);
    // DocumentRef ne doit contenir que id et label, sans fileName
    expect(Object.keys(docs[0])).toEqual(['id', 'label']);
  });
});


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

