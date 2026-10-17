import Meditation from "@/models/Meditation";
import apiClient from "@/plugins/axios";

export default class MeditationService {

  public static async getAllMeditations(): Promise<Meditation[]> {
    try {
      const response = await apiClient.post("/getAllMeditations");
      const data: Meditation[] = response.data || [];
      return data.map((item: Meditation) => {
        if (item.comment == undefined) {
          item.comment = ""
        }
        return new Meditation({ id: item.id, name: item.name, path: item.path, comment: item.comment, medType: item.medType });
      });
    } catch (error) {
      throw new Error(`Failed to fetch meditations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static async findMeditationByID(meditationID: number): Promise<Meditation> {
    try {
      const response = await apiClient.get("/meditation/" + meditationID);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch meditation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static async deleteMeditation(meditationID: number) {
    await apiClient.delete("/meditation/" + meditationID);
  }

  public static async save(formData: FormData, meditation: Meditation): Promise<Meditation> {
    if (meditation.id != undefined && meditation.id > -1) {
      formData.append("id", meditation.id.toString());
    } else {
      formData.append("id", "-1");
    }
    formData.append("name", meditation.name);
    formData.append("path", meditation.path);
    if (meditation.comment != undefined) {
      formData.append("comment", meditation.comment);
    }
    formData.append("medType", meditation.medType.toString());

    const response = await apiClient.post("/saveMeditation", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
}
