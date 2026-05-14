import api from './index';
import { DocumentDTO } from '../types';

/**
 * Upload un fichier standalone → retourne un DocumentDTO avec son id et nomTelechargement.
 * NE PAS définir Content-Type manuellement, axios le fait automatiquement avec le bon boundary.
 */
export const uploadDocument = async (file: File): Promise<DocumentDTO> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': undefined as any },
  });
  return data;
};

export const getAllDocuments = async (): Promise<DocumentDTO[]> => {
  const { data } = await api.get('/documents');
  return data;
};

/**
 * Déclenche le téléchargement du fichier dans le navigateur.
 * Passer nomTelechargement (issu du DocumentDTO) comme nom — aucune logique de nommage côté front.
 */
export const downloadDocument = async (documentId: number, nomTelechargement?: string): Promise<void> => {
  const res = await api.get(`/documents/${documentId}/download`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomTelechargement ?? `document-${documentId}`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Ouvre le document dans un nouvel onglet.
 *
 * Pour éviter d'exposer le JWT dans l'URL tout en passant l'auth à window.open :
 *  1. Le token est posé dans un cookie temporaire (30 s, SameSite=Strict, path=/api).
 *  2. Le navigateur envoie ce cookie automatiquement avec la navigation.
 *  3. Le proxy Vite/nginx lit le cookie et injecte le header Authorization: Bearer.
 *  4. Le backend reçoit sa requête habituelle — aucun changement de son côté.
 */
export const openDocument = (documentId: number, nomTelechargement?: string): void => {
  const fileName = encodeURIComponent(nomTelechargement ?? `document-${documentId}.pdf`);
  const token = localStorage.getItem('token') ?? '';
  document.cookie = `pdf_token=${token}; path=/api; max-age=30; SameSite=Strict`;
  window.open(`/api/documents/${documentId}/download/${fileName}`, '_blank');
};

export const deleteDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/documents/${documentId}`);
};
