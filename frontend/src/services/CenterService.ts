import Center from "@/models/Center";
import apiClient from "@/plugins/axios";

export default class CenterService {

  public static async getAllCenters(): Promise<Center[]> {
    const response = await apiClient.post("/getAllCenters");
    const data: Center[] = response.data;
    return data.map((item: Center) => new Center(item));
  }

  public static async findCenterByID(centerID: number): Promise<Center> {
    const response = await apiClient.get("/center/" + centerID);
    return response.data;
  }

  public static async deleteCenter(centerID: number) {
    await apiClient.delete("/center/" + centerID);
  }

  public static async save(formData: FormData, center: Center): Promise<Center> {
    try {
      if (center.id !== undefined && center.id > 0) {
        formData.append("id", center.id.toString());
      }
      formData.append("name", center.name);
      formData.append("city", center.city);
      formData.append("managerName", center.managerName);
      formData.append("phone", center.phone);
      formData.append("email", center.email);
      formData.append("address", center.address);

      if (center.photo !== undefined) {
        formData.append("photo", center.photo);
      }

      const response = await apiClient.post("/saveCenter", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (!response.data) {
        throw new Error('No data received from server');
      }
      return response.data;
    } catch (error) {
      throw new Error(`Failed to save center: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
