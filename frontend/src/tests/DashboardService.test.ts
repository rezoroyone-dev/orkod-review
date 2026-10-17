/**
 * Tests for DashboardService
 * Covers dashboard statistics endpoint
 */
import SuperUser from '@/interfaces/SuperUser';
import DashboardService from '@/services/DashboardService';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('DashboardService', () => {
  let adminUser: SuperUser;

  beforeAll(async () => {
    adminUser = await getAdminUser();
  }, 120000);

  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  describe('getStats', () => {
    it('should return dashboard statistics', async () => {
      const stats = await DashboardService.getStats();
      
      // Verify the response has the expected structure
      expect(stats).toBeDefined();
      expect(typeof stats.totalPatients).toBe('number');
      expect(typeof stats.newPatientsThisMonth).toBe('number');
      expect(typeof stats.appointmentsToday).toBe('number');
      expect(typeof stats.appointmentsThisWeek).toBe('number');
      expect(typeof stats.openTreatments).toBe('number');
      expect(typeof stats.closedTreatments).toBe('number');
      expect(typeof stats.treatmentCompletionRate).toBe('number');
      expect(typeof stats.revenueThisMonth).toBe('number');
      expect(typeof stats.totalRevenue).toBe('number');
      expect(typeof stats.totalUnpaid).toBe('number');
      expect(typeof stats.totalHealers).toBe('number');
      expect(typeof stats.upcomingAppointments).toBe('number');
    });

    it('should return non-negative numbers for all stats', async () => {
      const stats = await DashboardService.getStats();
      
      expect(stats.totalPatients).toBeGreaterThanOrEqual(0);
      expect(stats.newPatientsThisMonth).toBeGreaterThanOrEqual(0);
      expect(stats.appointmentsToday).toBeGreaterThanOrEqual(0);
      expect(stats.appointmentsThisWeek).toBeGreaterThanOrEqual(0);
      expect(stats.openTreatments).toBeGreaterThanOrEqual(0);
      expect(stats.closedTreatments).toBeGreaterThanOrEqual(0);
      expect(stats.treatmentCompletionRate).toBeGreaterThanOrEqual(0);
      expect(stats.treatmentCompletionRate).toBeLessThanOrEqual(100);
      expect(stats.revenueThisMonth).toBeGreaterThanOrEqual(0);
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(stats.totalUnpaid).toBeGreaterThanOrEqual(0);
      expect(stats.totalHealers).toBeGreaterThanOrEqual(0);
      expect(stats.upcomingAppointments).toBeGreaterThanOrEqual(0);
    });
  });
});
