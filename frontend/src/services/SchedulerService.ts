import { langsEnum } from "@/enumerators/enums";
import Schedule from '@/interfaces/Schedule';
import SicknessNature from "@/interfaces/SicknessNature";
import { useAppStore } from '@/stores/app';
import Language from "@/utilities/Language";
import apiClient from "@/plugins/axios";
import NotificationService from "./NotificationService";
import SicknessNatureService from "./SicknessNatureService";

export default class SchedulerService {
  
  public static async createSchedule(schedule: Schedule): Promise<Schedule> {
    const response = await apiClient.post("/createSchedule", schedule);
    return response.data;
  }

  public static async createRecurringSchedule(
    schedule: Schedule
  ): Promise<{ created: number; recurrenceGroup: number; schedules: Schedule[] }> {
    const response = await apiClient.post("/createRecurringSchedule", schedule);
    return response.data;
  }

  public static async updateSchedule(schedule: Schedule): Promise<Schedule> {
    const appStore = useAppStore();
    const response = await apiClient.post("/updateSchedule", schedule);
    if (response.status === 200) {
      NotificationService.updateNotificationsList(appStore);
    }
    return response.data;
  }

  public static async deleteSchedule(scheduleId: number): Promise<void> {
    await apiClient.delete("/deleteSchedule/" + scheduleId);
  }

  public static async getSchedulesByRange(startRange: string, endRange: string, language: string): Promise<Schedule[]> {
    const schedules: Schedule[] = [];
    
    const response = await apiClient.post("/scheduleList", {
      start: startRange,
      end: endRange
    });
    
    const data: Schedule[] = Array.from(response.data);
    for (const schedule of data) {
      const sicknessNatures = schedule.sicknessNatures;
      const tmpSicknessNatures: SicknessNature[] = [];
      if (sicknessNatures != undefined && sicknessNatures.length > 0) {
        for (const item of sicknessNatures) {
          const natureID: number = item.id;
          const activeLanguage: langsEnum = Language.getActiveLang(language);
          if (SicknessNatureService.getNature) {
            const sicknessNature: SicknessNature = SicknessNatureService.getNature(natureID, activeLanguage);
            tmpSicknessNatures.push(sicknessNature);
          }
        }
      }
      if (tmpSicknessNatures != undefined && tmpSicknessNatures.length > 0) {
        schedule.sicknessNatures = Array.from(tmpSicknessNatures);
      }
      schedules.push(schedule);
    }
    return schedules;
  }

  public static async getFutureSchedules(personID: number, startRange: string, endRange: string): Promise<Schedule[]> {
    const response = await apiClient.post("/futureScheduleList", {
      personID: personID,
      start: startRange,
      end: endRange
    });
    return Array.from(response.data);
  }

  public static async getSchedulesBypersonID(personID: number): Promise<Schedule[]> {
    const response = await apiClient.post("/GetSchedulesBypersonID", {
      personID: personID
    });
    return Array.from(response.data);
  }
}
