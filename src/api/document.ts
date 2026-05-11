import api from './index';
import { DocumentDTO } from '../types';

/**
 * Upload un fichier standalone → retourne un DocumentDTO avec son id.
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
 */
export const downloadDocument = async (documentId: number, fileName?: string): Promise<void> => {
  const res = await api.get(`/documents/${documentId}/download`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || `document-${documentId}`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Ouvre le document PDF dans un nouvel onglet.
 */
export const openDocument = async (documentId: number): Promise<void> => {
  const res = await api.get(`/documents/${documentId}/download`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  window.open(url, '_blank');
};

export const deleteDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/documents/${documentId}`);
};

