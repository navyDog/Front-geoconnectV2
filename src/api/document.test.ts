import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openDocument, downloadDocument } from './document';

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('openDocument', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ouvre /api/documents/{id}/download/{nomTelechargement} — aucun token dans l\'URL', () => {
    openDocument(42, 'DUPONT_JEAN-G1-RAPPORT.pdf');

    expect(window.open).toHaveBeenCalledWith(
      '/api/documents/42/download/DUPONT_JEAN-G1-RAPPORT.pdf',
      '_blank',
    );
    const url = (window.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain('token');
  });

  it('encode les caractères spéciaux dans nomTelechargement', () => {
    openDocument(42, 'MARTIN SOPHIE-G2_PRO-DEVIS SIGNÉ.pdf');

    const url = (window.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain(' ');
    expect(url).not.toContain('É');
    expect(url).toContain('/api/documents/42/download/');
  });

  it('utilise "document-{id}.pdf" en fallback si nomTelechargement est absent', () => {
    openDocument(99);

    expect(window.open).toHaveBeenCalledWith(
      '/api/documents/99/download/document-99.pdf',
      '_blank',
    );
  });
});

describe('downloadDocument', () => {
  const mockBlob = new Blob(['content'], { type: 'application/pdf' });
  let clickedLinks: HTMLAnchorElement[] = [];

  beforeEach(() => {
    clickedLinks = [];
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement;
      if (tag === 'a') clickedLinks.push(el);
      return el as any;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('utilise nomTelechargement comme attribut download du lien', async () => {
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockBlob, headers: {} });

    await downloadDocument(12, 'MARTIN_SOPHIE-G2_PRO-DEVIS_SIGNE.pdf');

    expect(clickedLinks[0].download).toBe('MARTIN_SOPHIE-G2_PRO-DEVIS_SIGNE.pdf');
    expect(clickedLinks[0].click).toHaveBeenCalled();
  });

  it('utilise "document-{id}" si nomTelechargement n\'est pas fourni', async () => {
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockBlob, headers: {} });

    await downloadDocument(7);

    expect(clickedLinks[0].download).toBe('document-7');
  });
});
