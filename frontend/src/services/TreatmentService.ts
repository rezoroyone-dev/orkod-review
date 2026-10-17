import Treatment from "@/interfaces/Treatment";
import apiClient from "@/plugins/axios";

export default class TreatmentService {

  /**
   * Create a new treatment plan
   */
  public static async createTreatment(treatment: Treatment): Promise<Treatment> {
    const response = await apiClient.post("/createTreatment", treatment);
    return response.data;
  }

  /**
   * Update an existing treatment plan
   */
  public static async updateTreatment(treatment: Treatment): Promise<Treatment> {
    if (!treatment.id) {
      throw new Error("Treatment ID is required for update");
    }
    const response = await apiClient.post("/updateTreatment", treatment);
    return response.data;
  }


  /**
   * Delete a treatment by ID
   */
  public static async deleteTreatment(treatmentId: number): Promise<void> {
    if (!treatmentId || treatmentId <= 0) {
      throw new Error("Valid Treatment ID is required for deletion");
    }
    await apiClient.delete("/deleteTreatment/" + treatmentId);
  }

  /**
   * Get all treatments for a specific person filtered by status
   * @param status - e.g. 'OPEN', 'CLOSED', or '%' for all
   */
  public static async getTreatments(personId: number, status: string = '%'): Promise<Treatment[]> {
    if (!personId || personId <= 0) {
      throw new Error("Valid Person ID is required");
    }
    const response = await apiClient.get(`/treatmentList/${status}/${personId}`);
    return response.data;
  }

  /**
   * Get a single treatment by ID
   */
  public static async getTreatment(treatmentId: number): Promise<Treatment> {
    if (!treatmentId || treatmentId <= 0) {
      throw new Error("Valid Treatment ID is required");
    }
    const response = await apiClient.get("/treatment/" + treatmentId);
    return response.data;
  }
}
