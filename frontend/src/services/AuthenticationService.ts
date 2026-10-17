import SuperUser from '@/interfaces/SuperUser';
import { AxiosRequestConfig } from "axios";

export default class AuthenticationService {

  /**
   * Returns an Axios config with a Bearer JWT token Authorization header.
   * The token is stored in superUser.token after login.
   * Basic Auth credentials are NEVER sent on API calls after login.
   */
  public static getAxiosConfig(userOrStore: SuperUser | any): AxiosRequestConfig {
    const config: AxiosRequestConfig = {};
    let user: SuperUser | undefined;

    if (userOrStore && typeof userOrStore === 'object' && 'userName' in userOrStore) {
      user = userOrStore as SuperUser;
    } else if (userOrStore && typeof userOrStore === 'object' && 'superUser' in userOrStore) {
      user = userOrStore.superUser;
    }

    if (!user || !user.userName) {
      throw new Error("Authenticated user is required.");
    }

    if (!user.token) {
      throw new Error("JWT token is missing. Please log in again.");
    }

    config.headers = {
      Authorization: `Bearer ${user.token}`
    };

    return config;
  }

}
