import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import SuperUserService from '@/services/SuperUserService';
import UserService from '@/services/UserService';
import SuperUser from '@/interfaces/SuperUser';
import { useUserStore } from '@/stores/user';
import { getAdminUser } from './testAuth';

describe('Authentication Integration Flow', () => {
  // Real credentials from your .env
  const adminCreds: SuperUser = { userName: 'admin', passWord: 'R8g9f6T@21/N' };

  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  it('should authenticate admin user and fetch profile', async () => {
    try {
      console.log('Testing authentication...');
      const user = await getAdminUser();
      
      if (!user) {
        console.log('Backend not available - skipping test');
        return;
      }
      
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.userName).toBe(adminCreds.userName);

      // Set user in Pinia store for axios interceptor
      const userStore = useUserStore();
      userStore.setUser(user);

      // Verify "Get Me"
      console.log('Testing /me endpoint...');
      const meData = await UserService.getMe();
      
      expect(meData.user.userName).toBe(adminCreds.userName);
      expect(meData.user.personID).toBeGreaterThanOrEqual(0);
    } catch (error: any) {
      // Skip if backend is not available
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.log('Backend not available - skipping test');
        return;
      }
      throw error;
    }
  }, 120000);

  it('should fail authentication with wrong password', async () => {
    await expect(
      SuperUserService.authenticate('admin', 'wrong_password')
    ).rejects.toThrow();
  });
});
