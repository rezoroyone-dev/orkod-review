import apiClient from "@/plugins/axios";

export default class InvoiceService {

  public static async saveTemplate(contents: string): Promise<void> {
    await apiClient.post("/invoice/saveTemplate", { contents });
  }

  public static async fetchTemplate(): Promise<string> {
    try {
      const response = await apiClient.post("/invoice/fetchTemplate");
      // Handle both cases: response.data is already an object or a JSON string
      let data;
      if (typeof response.data === 'string') {
        data = JSON.parse(response.data);
      } else {
        data = response.data;
      }
      if (typeof data?.contents !== 'string') {
        throw new Error('Invalid template data structure');
      }
      return data.contents;
    } catch (error) {
      throw new Error(`Failed to fetch template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
