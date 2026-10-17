import Schedule from '@/interfaces/Schedule';
import apiClient from "@/plugins/axios";
import { addDays, format } from 'date-fns';

export default class NotificationService {

  public static async getNotificationsList(): Promise<Schedule[]> {
    const todayDate = new Date();
    const todayRange = format(todayDate, "yyyy-MM-dd'T'HH:mm:ssxxx");

    const tomorrowRange = new Date();
    tomorrowRange.setHours(0);
    tomorrowRange.setMinutes(0);
    tomorrowRange.setSeconds(0);

    const range = format(addDays(tomorrowRange, 1), "yyyy-MM-dd'T'HH:mm:ssxxx");
    
    const response = await apiClient.post("/scheduleList", {
      start: todayRange,
      end: range,
    });
    
    // Return the data array (empty array if no schedules)
    return Array.isArray(response.data) ? response.data : [];
  }

  public static async updateNotificationsList(appStore: any) {
    let notifList: Schedule[] = [];
    try {
      notifList = await NotificationService.getNotificationsList();
      if (notifList !== undefined) {
        appStore.setNotificationList(notifList);
      } else {
        appStore.setNotificationList([]);
      }
    } catch (error: any) {
      throw Error(error.message);
    }
  }
}
