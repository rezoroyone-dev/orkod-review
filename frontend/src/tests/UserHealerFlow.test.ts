import SuperUser from '@/interfaces/SuperUser';
import AvailabilityService from '@/services/AvailabilityService';
import RoleService from '@/services/RoleService';
import SuperUserService from '@/services/SuperUserService';
import UserService from '@/services/UserService';
import { useUserStore } from '@/stores/user';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

// NO MOCKS - Testing against real backend

describe('User Creation and Healer Availability Flow (INTEGRATION)', () => {
  let adminUser: SuperUser | null;

  beforeAll(async () => {
    adminUser = await getAdminUser();
  }, 30_000);

  beforeEach(() => {
    setActivePinia(createPinia());
    if (adminUser) {
      const userStore = useUserStore();
      userStore.setUser(adminUser);
    }
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  it('should complete the full flow: create user -> assign healer role -> set availability', async () => {
    if (!adminUser) {
      console.log('Skipping test - backend not available');
      return;
    }
    
    // Fetch Roles to get the correct Healer ID
    const availableRoles = await RoleService.getRoles();
    const realHealerRole = availableRoles.find(r => r.name.toLowerCase() === 'healer');
    if (!realHealerRole || !realHealerRole.id) throw new Error('Healer role not found');

    // 1. Create a new user
    const uniqueSuffix = Date.now();
    const plainPassword = 'Password123!';
    const newUserPayload: SuperUser = {
      userName: `test_healer_${uniqueSuffix}`,
      passWord: plainPassword,
      firstName: `Integration_${uniqueSuffix}`,
      lastName: 'Tester',
      roleIDs: [realHealerRole.id] // Use dynamic ID array
    };

    console.log(`Step 1: Creating user ${newUserPayload.userName}...`);
    const createdUser = await UserService.createUser(newUserPayload);
    console.log('CREATED USER:', JSON.stringify(createdUser));
    expect(createdUser.id).toBeGreaterThan(0);
    expect(createdUser.userName).toBe(newUserPayload.userName);

    // 2. Verify Healer Role
    console.log('Step 2: Verifying roles...');
    const roles = await RoleService.getRoles();
    console.log('AVAILABLE ROLES:', roles.map(r => r.name));
    const healerRole = roles.find(r => r.name.toLowerCase().includes('healer'));
    expect(healerRole).toBeDefined();

    // 3. Authenticate as the new user to get a JWT token
    // (createUser returns user data without a token — we must authenticate separately)
    console.log('Step 3: Authenticating as new user to get JWT token...');
    const authenticatedUser = await SuperUserService.authenticate(newUserPayload.userName!, plainPassword);
    expect(authenticatedUser.token).toBeDefined();
    expect(authenticatedUser.token!.length).toBeGreaterThan(0);

    // 4. Set Healer Availability using the authenticated user (who has a token)
    // Switch the store to use the authenticated user
    const userStore = useUserStore();
    userStore.setUser(authenticatedUser);
    
    console.log('Step 4: Getting /me to find healerID...');
    const me = await UserService.getMe();
    const healerID = me.healerID;
    
    expect(healerID).toBeGreaterThan(0);
    console.log(`HealerID: ${healerID}`);

    const availabilityPayload = [0, 1, 2, 3, 4, 5, 6].map(day => ({
      healerID: healerID,
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '18:00',
      isActive: true
    }));

    console.log('Step 5: Saving availability...');
    const savedAvailability = await AvailabilityService.saveHealerAvailability(healerID, availabilityPayload);
    
    expect(savedAvailability).toHaveLength(7);
    expect(savedAvailability[0].startTime).toContain('09:00');
    console.log('Flow completed successfully.');
  });
});
