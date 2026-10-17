import type Document from '@/interfaces/Document';
import api from '@/plugins/axios';

export interface DocumentSearchResult {
  data: Document[];
  total: number;
  page: number;
  limit: number;
}

export interface DocumentSearchParams {
  query?: string;
  personId?: number;
  tags?: string;
  page?: number;
  limit?: number;
}

export default {
  /**
   * Search documents by text, tags, or person
   */
  async search(params: DocumentSearchParams): Promise<DocumentSearchResult> {
    const response = await api.post<DocumentSearchResult>('/documents/search', params);
    return response.data;
  },

  /**
   * Update document tags
   */
  async updateTags(documentId: number, manualTags: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/documents/tags', { documentId, manualTags });
    return response.data;
  },

  /**
   * Trigger OCR processing for a document
   */
  async triggerOCR(documentId: number): Promise<{ message: string; documentId: number }> {
    const response = await api.post<{ message: string; documentId: number }>(`/documents/${documentId}/ocr`);
    return response.data;
  },
};