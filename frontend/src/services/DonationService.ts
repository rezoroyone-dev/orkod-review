import AppConfigs from "@/AppConfigs";
import apiClient from "@/plugins/axios";
import axios from "axios";

export interface Donation {
  id?: number;
  name: string;
  amount: number;
  message: string;
  isApproved?: boolean;
  isPublic?: boolean;
  createdAt?: string;
}

export interface DonationFeed {
  enabled: boolean;
  donations: Donation[];
}

export default class DonationService {
  public static async getPublicDonations(): Promise<DonationFeed> {
    const response = await axios.get(
      AppConfigs.getServerURL() + "/public/donations"
    );
    return response.data;
  }

  public static async createDonation(
    name: string,
    amount: number,
    message: string,
    isPublic = false
  ): Promise<Donation> {
    const response = await axios.post(
      AppConfigs.getServerURL() + "/public/donations",
      { name, amount, message, isPublic }
    );
    return response.data;
  }

  public static async adminListDonations(): Promise<DonationFeed> {
    const response = await apiClient.get(
      AppConfigs.getServerURL() + "/donations"
    );
    return response.data;
  }

  public static async adminApproveDonation(id: number): Promise<void> {
    await apiClient.post(
      AppConfigs.getServerURL() + `/donations/${id}/approve`
    );
  }

  public static async adminDeleteDonation(id: number): Promise<void> {
    await apiClient.delete(
      AppConfigs.getServerURL() + `/donations/${id}`
    );
  }

  public static async setDonationsVisible(visible: boolean): Promise<void> {
    await apiClient.post(
      AppConfigs.getServerURL() + "/settings/donationsVisible",
      { visible }
    );
  }
}