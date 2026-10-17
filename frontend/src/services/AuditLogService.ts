import apiClient from "@/plugins/axios";

export interface AuditLog {
  id: number;
  userID: number;
  userName: string;
  action: string;
  target: string;
  targetID: number;
  details: string;
  createdAt: string;
}

export default class AuditLogService {
  public static async getAuditLogs(): Promise<AuditLog[]> {
    const response = await apiClient.get("/auditLogs");
    // Backend returns paginated response: { data: AuditLog[], total, page, limit }
    return response.data.data ?? response.data;
  }

  public static async deleteAuditLog(id: number): Promise<void> {
    await apiClient.delete("/auditLogs/" + id);
  }
}
