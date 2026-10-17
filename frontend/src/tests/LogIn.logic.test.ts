import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import SuperUserService from '@/services/SuperUserService';
import { useUserStore } from '@/stores/user';
import { useAppStore } from '@/stores/app';
import { getAdminUser } from './testAuth';

// This is a pure logic test for the authentication flow, bypassing the UI WeakMap issues
describe('Authentication Logic Flow', () => {
  const adminCreds = { userName: 'admin', passWord: (process.env.TEST_ADMIN_PASSWORD ?? 'test-admin-password') };

  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  it('should authenticate and populate stores correctly', async () => {
    try {
      const userStore = useUserStore();
      const appStore = useAppStore();

      console.log('Testing authentication logic...');
      const superUser = await getAdminUser();
      
      expect(superUser.userName).toBe(adminCreds.userName);
      
      // Verify store updates (simulating component behavior)
      appStore.setSuperUser(superUser);
      userStore.setUser(superUser);
      
      expect(userStore.superUser.userName).toBe(adminCreds.userName);
      expect(appStore.superUser.id).toBeDefined();
    } catch (error: any) {
      // Skip if backend is not available
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.log('Backend not available - skipping test');
        return;
      }
      throw error;
    }
  }, 120000);

  it('should handle invalid credentials gracefully', async () => {
    await expect(
      SuperUserService.authenticate('wrong', 'password')
    ).rejects.toThrow();
  });
});
