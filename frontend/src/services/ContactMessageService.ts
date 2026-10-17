import AppConfigs from "@/AppConfigs";
import apiClient from "@/plugins/axios";
import axios from "axios";

export interface ContactMessage {
  id?: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: string;
  read?: boolean;
}

export default class ContactMessageService {
  public static async saveContactMessage(message: ContactMessage): Promise<ContactMessage> {
    // Public endpoint - no auth required
    const response = await axios.post(AppConfigs.getServerURL() + "/public/contact", message);
    return response.data;
  }

  public static async getContactMessages(): Promise<ContactMessage[]> {
    const response = await apiClient.get("/contactMessages");
    return response.data;
  }

  public static async deleteContactMessage(id: number): Promise<void> {
    await apiClient.delete("/contactMessages/" + id);
  }

  public static async markAsRead(id: number): Promise<void> {
    await apiClient.post("/contactMessages/" + id + "/read");
  }
}
