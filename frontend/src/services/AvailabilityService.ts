import AppConfigs from "@/AppConfigs";
import apiClient from "@/plugins/axios";
import axios from "axios";

export interface HealerAvailability {
  id?: number;
  healerID: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default class AvailabilityService {
  public static async getHealerAvailability(isAuthenticated: boolean, healerID: number): Promise<HealerAvailability[]> {
    if (isAuthenticated) {
      const response = await apiClient.get("/healerAvailability/" + healerID);
      return response.data;
    } else {
      // Public endpoint - no auth required
      const response = await axios.get(AppConfigs.getServerURL() + "/public/healerAvailability/" + healerID);
      return response.data;
    }
  }

  public static async saveHealerAvailability(healerID: number, availability: HealerAvailability[]): Promise<HealerAvailability[]> {
    const response = await apiClient.post("/healerAvailability/" + healerID, availability);
    return response.data;
  }

  public static async getAvailableHealers(): Promise<any[]> {
    // Public endpoint - no auth required
    const response = await axios.get(AppConfigs.getServerURL() + "/public/availableHealers");
    return response.data;
  }

  public static async bookSession(bookingData: any): Promise<any> {
    // Public endpoint - no auth required
    const response = await axios.post(AppConfigs.getServerURL() + "/public/bookSession", bookingData);
    return response.data;
  }
}
