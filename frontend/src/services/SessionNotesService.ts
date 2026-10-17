import api from '@/plugins/axios';
import Schedule from '@/interfaces/Schedule';

export default {
  /**
   * Update session notes for a schedule
   */
  async updateNotes(scheduleId: number, sessionNotes: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/schedule/notes', { scheduleId, sessionNotes });
    return response.data;
  },

  /**
   * Get schedule with session notes
   */
  async getScheduleWithNotes(scheduleId: number): Promise<Schedule> {
    const response = await api.get<Schedule>(`/schedule/${scheduleId}/notes`);
    return response.data;
  },
};