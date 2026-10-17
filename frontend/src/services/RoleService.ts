import apiClient from "@/plugins/axios";

export interface Permission {
  id: number;
  name: string;
}

export interface Role {
  id?: number;
  name: string;
  permissions: Permission[];
}

export default class RoleService {
  public static async getRoles(): Promise<Role[]> {
    const response = await apiClient.get("/roles");
    return response.data;
  }

  public static async getPermissions(): Promise<Permission[]> {
    const response = await apiClient.get("/permissions");
    return response.data;
  }

  public static async createRole(role: Role): Promise<Role> {
    const response = await apiClient.post("/roles", role);
    return response.data;
  }

  public static async updateRole(role: Role): Promise<Role> {
    const response = await apiClient.post("/roles/" + role.id, role);
    return response.data;
  }

  public static async deleteRole(roleId: number): Promise<void> {
    await apiClient.delete("/roles/" + roleId);
  }
}
