import SuperUser from '@/interfaces/SuperUser';
import apiClient from '@/plugins/axios';
import Person from "@/interfaces/Person";

export default class UserService {
  public static async getUsers(): Promise<SuperUser[]> {
    const response = await apiClient.get("/users");
    return response.data;
  }

  public static async findUsers(query: string): Promise<Person[]> {
    const response = await apiClient.post("/search", { query });
    return response.data;
  }

  public static async createUser(user: SuperUser): Promise<SuperUser> {
    const response = await apiClient.post("/users", user);
    return response.data;
  }

  public static async updateUser(user: SuperUser): Promise<SuperUser> {
    const response = await apiClient.post("/users/" + user.id, user);
    return response.data;
  }

  public static async deleteUser(userId: number): Promise<void> {
    await apiClient.delete("/users/" + userId);
  }

  public static async getMe(): Promise<{ user: SuperUser, healerID: number }> {
    const response = await apiClient.get("/me");
    return response.data;
  }
}
