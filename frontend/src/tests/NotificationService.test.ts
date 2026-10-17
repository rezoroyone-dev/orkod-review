/**
 * Tests for NotificationService
 * Covers notification functionality
 */
import SuperUser from '@/interfaces/SuperUser';
import NotificationService from '@/services/NotificationService';
import { useAppStore } from '@/stores/app';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('NotificationService', () => {
  let adminUser: SuperUser;

  beforeAll(async () => {
    adminUser = await getAdminUser();
  }, 30_000);

  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  describe('getNotificationsList', () => {
    it('should return list of schedules for today', async () => {
      const notifications = await NotificationService.getNotificationsList();
      
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should return schedules with expected structure', async () => {
      const notifications = await NotificationService.getNotificationsList();
      
      if (notifications.length > 0) {
        const schedule = notifications[0];
        expect(schedule).toHaveProperty('id');
        expect(schedule).toHaveProperty('title');
        expect(schedule).toHaveProperty('start');
        expect(schedule).toHaveProperty('end');
      }
    });
  });

  describe('updateNotificationsList', () => {
    it('should update app store with notifications', async () => {
      const appStore = useAppStore();
      
      await NotificationService.updateNotificationsList(appStore);
      
      // The store should have a notification list set
      expect(Array.isArray(appStore.notificationList)).toBe(true);
    });
  });
});