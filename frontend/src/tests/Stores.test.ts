/**
 * Tests for Pinia Stores
 * Covers store state management
 */
import { useAppStore } from '@/stores/app';
import { useTreatmentStore } from '@/stores/treatment';
import { useUserStore } from '@/stores/user';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Pinia Stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  describe('App Store', () => {
    it('should initialize with default values', () => {
      const appStore = useAppStore();
      
      expect(appStore.debug).toBeDefined();
      expect(appStore.loading).toBe(false);
      expect(appStore.locale).toBe('en');
    });

    it('should update loading state', () => {
      const appStore = useAppStore();
      
      appStore.showLoading();
      expect(appStore.loading).toBe(true);
      
      appStore.hideLoading();
      expect(appStore.loading).toBe(false);
    });

    it('should update locale', () => {
      const appStore = useAppStore();
      
      appStore.setLocale('fr');
      expect(appStore.locale).toBe('fr');
      
      appStore.setLocale('en');
      expect(appStore.locale).toBe('en');
    });

    it('should manage notification list', () => {
      const appStore = useAppStore();
      
      expect(Array.isArray(appStore.notificationList)).toBe(true);
      
      appStore.setNotificationList([{ id: 1, title: 'Test' }]);
      expect(appStore.notificationList.length).toBe(1);
      
      appStore.clearNotificationList();
      expect(appStore.notificationList.length).toBe(0);
    });

    it('should manage active tab', () => {
      const appStore = useAppStore();
      
      appStore.setActiveTab(5);
      expect(appStore.activeTab).toBe(5);
    });
  });

  describe('User Store', () => {
    it('should initialize with undefined user', () => {
      const userStore = useUserStore();
      
      // Clear any existing user to test initial state
      userStore.clearUser();
      
      // Initially the superUser should be undefined
      expect(userStore.superUser).toBeUndefined();
    });

    it('should set user', () => {
      const userStore = useUserStore();
      
      const testUser = { id: 1, userName: 'testuser' };
      userStore.setUser(testUser as unknown as { id: number; userName: string });
      
      // After setting, superUser should be defined
      expect(userStore.superUser).toBeDefined();
      expect(userStore.superUser?.id).toBe(1);
    });
  });

  describe('Treatment Store', () => {
    it('should initialize with default values', () => {
      const treatmentStore = useTreatmentStore();
      
      expect(treatmentStore.activeTreatment).toBeDefined();
    });
  });
});