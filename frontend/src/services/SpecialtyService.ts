import AppConfigs from "@/AppConfigs";
import apiClient from "@/plugins/axios";
import axios from "axios";

export interface PublicSpecialty {
  specialty: string;
  healerCount: number;
}

export interface PublicSlotHealer {
  id: number;
  name: string;
}

export interface PublicSlot {
  start: string;
  end: string;
  healers: PublicSlotHealer[];
}

export interface SlotsResponse {
  specialty: string;
  date: string;
  slots: PublicSlot[];
}

export interface SpecialtyBookingResult {
  booking: {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  healer: { id: number; name: string } | null;
  specialty: string;
}

export interface SpecialtyBookingPayload {
  specialty: string;
  title: string;
  start: string;
  end: string;
  attendees: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }[];
  consent: boolean;
}

export interface PublicConfig {
  sessionPrice: number;
}

export default class SpecialtyService {
  public static async getPublicSpecialties(): Promise<PublicSpecialty[]> {
    const response = await axios.get(
      AppConfigs.getServerURL() + "/public/specialties"
    );
    return response.data;
  }

  public static async getPublicSlots(
    specialty: string,
    date: string,
    tzOffsetMinutes: number
  ): Promise<SlotsResponse> {
    const response = await axios.get(
      AppConfigs.getServerURL() + "/public/slots",
      {
        params: { specialty, date, tzOffset: tzOffsetMinutes },
      }
    );
    return response.data;
  }

  public static async getPublicConfig(): Promise<PublicConfig> {
    const response = await axios.get(
      AppConfigs.getServerURL() + "/public/config"
    );
    return response.data;
  }

  public static async setSessionPrice(price: number): Promise<PublicConfig> {
    const response = await apiClient.post(
      AppConfigs.getServerURL() + "/settings/sessionPrice",
      { price }
    );
    return response.data;
  }

  public static async bookSpecialty(
    payload: SpecialtyBookingPayload
  ): Promise<SpecialtyBookingResult> {
    const response = await axios.post(
      AppConfigs.getServerURL() + "/public/bookSpecialty",
      payload
    );
    return response.data;
  }
}