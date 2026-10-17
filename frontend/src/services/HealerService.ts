import Healer from '@/models/Healer';
import apiClient from "@/plugins/axios";

export default class HealerService {

  public static async createHealer(newHealer: Healer): Promise<Healer> {
    if (newHealer.personID === undefined) {
      throw new Error("Invalid arguments provided to method createHealer");
    }
    const response = await apiClient.post("/createHealer", newHealer);
    return response.data;
  }

  public static async findHealers(query: string): Promise<Healer[]> {
    const response = await apiClient.post("/findHealers", { query });
    return response.data;
  }

  public static async getHealer(healerID: number): Promise<Healer> {
    if (healerID <= 0) {
      throw new Error("ERROR: HealerID can not be -1 or undefined=> " + healerID);
    }
    const response = await apiClient.post("/getHealer", { id: healerID });
    return response.data;
  }

  public static async getAllHealers(): Promise<Healer[]> {
    const response = await apiClient.post("/getAllHealers");
    // Backend returns paginated response: { data: Healer[], total, page, limit }
    return response.data.data ?? response.data;
  }

  public static async deleteHealer(healerID: number) {
    try {
      await apiClient.delete("/deleteHealer/" + healerID);
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error("409 SQL error,Failed to delete healer as it has other related entries in other tables");
      } else {
        throw error;
      }
    }
  }

  public static async getHealerSpecialties(healerID: number): Promise<string[]> {
    if (healerID <= 0) {
      throw new Error("ERROR: HealerID can not be -1 or undefined=> " + healerID);
    }
    const response = await apiClient.get("/getHealerSpecialties/" + healerID);
    return response.data ?? [];
  }

  public static async saveHealerSpecialties(healerID: number, specialties: string[]): Promise<string[]> {
    if (healerID <= 0) {
      throw new Error("ERROR: HealerID can not be -1 or undefined=> " + healerID);
    }
    const response = await apiClient.post("/saveHealerSpecialties/" + healerID, { specialties });
    return response.data ?? [];
  }
}
