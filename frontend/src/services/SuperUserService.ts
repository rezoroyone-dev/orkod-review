import AppConfigs from "@/AppConfigs";
import SuperUser from '@/interfaces/SuperUser';
import apiClient from '@/plugins/axios';
import axios, { AxiosBasicCredentials } from "axios";

export default class SuperUserService {

  public static async findSuperUsers(query: string): Promise<SuperUser[]> {
    const response = await apiClient.post("/search", { query });
    return response.data;
  }

  public static async updateSuperUser(superUser: SuperUser): Promise<SuperUser> {
    if (superUser?.id === -1) {
      throw Error('Passed in SuperUser is undefined');
    }
    const response = await apiClient.post("/users/" + superUser.id, superUser);
    const returnedSuperUserID = response.data.id;
    return { id: returnedSuperUserID, userName: superUser.userName };
  }

  /**
   * Authenticate with username/password (JSON body).
   * Returns the SuperUser with a JWT token and refresh token. The password is NOT stored in the returned object.
   */
  public static async authenticate(username: string, password: string): Promise<SuperUser> {
    const url = AppConfigs.getServerURL() + "/authenticate";
    try {
      const response = await axios.post(url, {
        userName: username,
        passWord: password
      }, {
        headers: { "Content-Type": "application/json" }
      });
      const userData: SuperUser = response.data.user;
      const token: string = response.data.token;
      const refreshToken: string = response.data.user.refreshToken;
      // Return user with JWT token and refresh token — password is intentionally NOT included
      return { ...userData, token, refreshToken, passWord: undefined };
    } catch (error: any) {
      if (error.response?.status) {
        throw new Error(error.response.status + ' ' + error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Authenticate with username/password (JSON body) - returns raw response for handling different structures.
   * Used for login flow that needs to handle both 2FA required and full authentication responses.
   */
  public static async authenticateRaw(username: string, password: string): Promise<any> {
    const url = AppConfigs.getServerURL() + "/authenticate";
    try {
      const response = await axios.post(url, {
        userName: username,
        passWord: password
      }, {
        headers: { "Content-Type": "application/json" }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status) {
        throw new Error(error.response.status + ' ' + error);
      } else {
        throw error;
      }
    }
  }

  public static async findSuperUserByID(personID: number): Promise<SuperUser> {
    const response = await apiClient.get("/people/" + personID);
    return response.data;
  }

  public static async getUsers(): Promise<SuperUser[]> {
    const response = await apiClient.get("/users");
    return response.data;
  }

  public static async getUser(userId: number): Promise<SuperUser> {
    const response = await apiClient.get("/users/" + userId);
    return response.data;
  }

  public static async createUser(user: SuperUser): Promise<SuperUser> {
    const response = await apiClient.post("/users", user);
    return response.data;
  }

  public static async deleteUser(userId: number): Promise<void> {
    await apiClient.delete("/users/" + userId);
  }

  /**
   * Verify TOTP code for login and return full authentication response.
   * Returns the SuperUser with a JWT token and refresh token. The password is NOT stored in the returned object.
   */
  public static async verifyTOTPForLogin(userId: number, totpCode: string): Promise<{ token: string; user: SuperUser }> {
    const url = AppConfigs.getServerURL() + "/auth/2fa/verify-login";
    try {
      const response = await axios.post(url, {
        userId,
        code: totpCode
      }, {
        headers: { "Content-Type": "application/json" }
      });
      const userData: SuperUser = response.data.user;
      const token: string = response.data.token;
      const refreshToken: string = response.data.user.refreshToken;
      // Return user with JWT token and refresh token — password is intentionally NOT included
      return {
        token,
        user: { ...userData, token, refreshToken, passWord: undefined }
      };
    } catch (error: any) {
      // Extract user-friendly error message from backend response
      let errorMessage = 'An error occurred during 2FA verification';
      
      if (error.response?.data) {
        // Try to extract error message from response data
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid verification code. Please try again.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid request. Please check your input.';
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found. Please try logging in again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }
  }
}
