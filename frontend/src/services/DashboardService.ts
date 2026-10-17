import apiClient from "@/plugins/axios";

export interface DashboardStats {
  // Patients
  totalPatients: number;
  newPatientsThisMonth: number;
  // Appointments
  appointmentsToday: number;
  appointmentsThisWeek: number;
  // Treatments
  openTreatments: number;
  closedTreatments: number;
  treatmentCompletionRate: number; // percentage 0–100
  // Revenue
  revenueThisMonth: number;
  totalRevenue: number;
  totalUnpaid: number;
  // Healers
  totalHealers: number;
  // Upcoming
  upcomingAppointments: number;
}

export default class DashboardService {
  public static async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboardStats');
    return response.data;
  }
}
