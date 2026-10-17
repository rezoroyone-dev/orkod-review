import Document from '@/interfaces/Document';
import apiClient from "@/plugins/axios";

export default class DocumentService {

  public static async findDocumentsBypersonID(personID: number): Promise<Document[]> {
    try {
      const response = await apiClient.get("/documentList/" + personID);
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static async deleteDocument(doc: Document) {
    try {
      await apiClient.delete("/deleteDocument/" + doc.id);
    } catch (error) {
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static async getDocuments(personID: number): Promise<Document[]> {
    return personID ? DocumentService.findDocumentsBypersonID(personID) : [];
  }

}
