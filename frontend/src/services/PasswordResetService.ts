import api from '@/plugins/axios';

export default {
  /**
   * Request a password reset email
   */
  async requestReset(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/requestReset', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/resetPassword', { token, password });
    return response.data;
  },
};