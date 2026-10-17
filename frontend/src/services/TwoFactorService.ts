import api from '@/plugins/axios';

export interface TwoFactorSetup {
  secret: string;
  provisioningURI: string;
  qrCodeUrl: string;
}

export interface TwoFactorVerify {
  message: string;
  backupCodes?: string[];
}

export default {
  /**
   * Initiate 2FA setup for the current user
   */
  async setup(): Promise<TwoFactorSetup> {
    const response = await api.post<TwoFactorSetup>('/auth/2fa/setup');
    return response.data;
  },

  /**
   * Verify and enable 2FA with a TOTP code
   */
  async verify(code: string): Promise<TwoFactorVerify> {
    const response = await api.post<TwoFactorVerify>('/auth/2fa/verify', { code });
    return response.data;
  },

  /**
   * Disable 2FA for the current user
   */
  async disable(code: string, password: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/2fa/disable', { code, password });
    return response.data;
  },
};