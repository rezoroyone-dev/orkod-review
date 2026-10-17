/**
 * Tests for AvailabilityService
 * Covers healer availability management and public booking
 */
import SuperUser from '@/interfaces/SuperUser';
import AvailabilityService, { HealerAvailability } from '@/services/AvailabilityService';
import HealerService from '@/services/HealerService';
import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '@/stores/user';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('AvailabilityService', () => {
  let adminUser: SuperUser;

  beforeAll(async () => {
    adminUser = await getAdminUser();
  }, 120000);

  beforeEach(() => {
    setActivePinia(createPinia());
    if (adminUser) {
      const userStore = useUserStore();
      userStore.setUser(adminUser);
    }
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  describe('getAvailableHealers (Public)', () => {
    it('should return list of available healers without authentication', async () => {
      const healers = await AvailabilityService.getAvailableHealers();
      expect(Array.isArray(healers)).toBe(true);
    });
  });

  describe('Healer Availability Management', () => {
    it('should get healer availability', async () => {
      // Get a healer first
      const healers = await HealerService.getAllHealers();
      if (healers.length === 0) {
        console.warn('No healers found, skipping test');
        return;
      }

      const healerID = healers[0].id!;
      const availability = await AvailabilityService.getHealerAvailability(true, healerID);
      
      expect(Array.isArray(availability)).toBe(true);
    });

    it('should save healer availability', async () => {
      // Get a healer first
      const healers = await HealerService.getAllHealers();
      if (healers.length === 0) {
        console.warn('No healers found, skipping test');
        return;
      }

      const healerID = healers[0].id!;
      
      // Create test availability slots
      const testAvailability: HealerAvailability[] = [
        {
          healerID: healerID,
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '12:00',
          isActive: true
        },
        {
          healerID: healerID,
          dayOfWeek: 3, // Wednesday
          startTime: '14:00',
          endTime: '17:00',
          isActive: true
        }
      ];

      const saved = await AvailabilityService.saveHealerAvailability(healerID, testAvailability);
      
      expect(Array.isArray(saved)).toBe(true);
      expect(saved.length).toBeGreaterThanOrEqual(2);

      // Verify we can retrieve the saved availability
      const retrieved = await AvailabilityService.getHealerAvailability(true, healerID);
      expect(retrieved.length).toBeGreaterThanOrEqual(2);
    });

    it('should get availability without auth (public endpoint)', async () => {
      // Get a healer first
      const healers = await HealerService.getAllHealers();
      if (healers.length === 0) {
        console.warn('No healers found, skipping test');
        return;
      }

      const healerID = healers[0].id!;
      
      // Get availability without auth (public endpoint)
      const availability = await AvailabilityService.getHealerAvailability(null, healerID);
      
      expect(Array.isArray(availability)).toBe(true);
    });
  });
});
