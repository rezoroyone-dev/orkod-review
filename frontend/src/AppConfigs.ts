export default class AppConfigs {
  /**
   * getServerURL returns the API base URL.
   *
   * Defaults to the SAME ORIGIN (`/api`) so the app mirrors production
   * semantics (Caddy proxies `/api/*` to the backend) and the dev server
   * proxies `/api/*` to the backend container. An absolute URL is only used
   * when `VITE_API_URL` is explicitly set.
   */
  public static getServerURL(): string {
    const API_URL = import.meta.env.VITE_API_URL;
    const SERVER_URL: string = (API_URL ? API_URL : '') + "/api";
    if (import.meta.env.DEV) {
      console.log("API_URL=" + API_URL);
      console.log("SERVER_URL=" + SERVER_URL);
    }
    return SERVER_URL;
  }
}
