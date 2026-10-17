import apiClient from "@/plugins/axios";
import TreatmentsTableEntry from '@/interfaces/report/TreatmentsTableEntry';
import { TreatmentStatusEnum } from '@/enumerators/TreatmentStatusEnum';
import PatientsTableEntry from "@/interfaces/report/PatientsTableEntry";

export default class ReportingService {

  public static async getTreatmentsReportData(status: TreatmentStatusEnum.Status, startDate: string, endDate: string, healerID: number): Promise<TreatmentsTableEntry[]> {
    try {
      const response = await apiClient.post("/getTreatmentsReportData", {
        status: status,
        startDate: startDate,
        endDate: endDate,
        healerID
      });
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch treatments report data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static async getPatientsReportData(): Promise<PatientsTableEntry[]> {
    try {
      const response = await apiClient.post("/getPatientsReportData");
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to fetch patients report data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static async export(tableData: string[][]): Promise<void> {
    try {
      await apiClient.post("/exportToExcel", { cels: tableData });
    } catch (error) {
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

}
