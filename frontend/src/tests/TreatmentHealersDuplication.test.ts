/**
 * Test for healer duplication issue in Treatment CRUD operations
 * Issue: CRUD operations in treatments creation and update are creating extra healers
 * 
 * This test verifies that when creating/updating a treatment with N healers,
 * the backend returns exactly N healers (not more)
 */
import { TreatmentStatusEnum } from '@/enumerators/TreatmentStatusEnum';
import SuperUser from '@/interfaces/SuperUser';
import Treatment from '@/interfaces/Treatment';
import HealerService from '@/services/HealerService';
import TreatmentService from '@/services/TreatmentService';
import { useUserStore } from '@/stores/user';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

// Using the Docker backend URL
const BASE_URL = 'http://localhost:9091/api';

describe('Treatment Healers Duplication Issue', () => {
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

  // Helper: get a real person ID from the backend
  async function getRealPersonId(): Promise<number> {
    // Use the token from our authenticated user
    const response = await axios.post(`${BASE_URL}/search`, { query: 'Admin' }, {
      headers: {
        'Authorization': `Bearer ${adminUser.token}`
      }
    });
    const people = response.data;
    if (!Array.isArray(people) || people.length === 0) throw new Error('No people found in backend');
    return people[0].id;
  }

  // Helper: get multiple healers from the backend
  async function getRealHealers(count: number) {
    const healers = await HealerService.getAllHealers();
    if (!Array.isArray(healers) || healers.length === 0) throw new Error('No healers found in backend');
    return healers.slice(0, count);
  }

  // Helper: create a treatment and return it for testing
  async function createTestTreatment(healers: any[], comment: string): Promise<Treatment> {
    const personID = await getRealPersonId();
    
    const newTreatment: Treatment = {
      id: undefined,
      personID,
      nature: 1,
      diagnostic: 1,
      mode: 1,
      status: TreatmentStatusEnum.Status.OPEN,
      startDate: new Date().toISOString(),
      startTime: '14:00',
      healers: healers,
      totalCost: 100,
      payed: 50,
      comment: comment,
      healingFrequency: 'Daily',
      protocol: 'Standard'
    };

    return await TreatmentService.createTreatment(newTreatment);
  }

  describe('CreateTreatment - Healer Duplication', () => {
    it('should return exactly the same number of healers as sent when creating a treatment with 1 healer', async () => {
      const personID = await getRealPersonId();
      const healers = await getRealHealers(1);

      const newTreatment: Treatment = {
        id: undefined,
        personID,
        nature: 1,
        diagnostic: 1,
        mode: 1,
        status: TreatmentStatusEnum.Status.OPEN,
        startDate: new Date().toISOString(),
        startTime: '14:00',
        healers: healers,
        totalCost: 100,
        payed: 50,
        comment: 'Test: 1 healer',
        healingFrequency: 'Daily',
        protocol: 'Standard'
      };

      const result = await TreatmentService.createTreatment(newTreatment);
      
      // The issue: healers count should be exactly 1, but might be more
      const healersCount = result.healers?.length ?? 0;
      console.log(`Expected 1 healer, got ${healersCount}`, result.healers);
      expect(healersCount).toBe(1);
    });

    it('should return exactly the same number of healers as sent when creating a treatment with 2 healers', async () => {
      const personID = await getRealPersonId();
      const healers = await getRealHealers(2);

      const newTreatment: Treatment = {
        id: undefined,
        personID,
        nature: 1,
        diagnostic: 1,
        mode: 1,
        status: TreatmentStatusEnum.Status.OPEN,
        startDate: new Date().toISOString(),
        startTime: '14:30',
        healers: healers,
        totalCost: 150,
        payed: 75,
        comment: 'Test: 2 healers',
        healingFrequency: 'Daily',
        protocol: 'Standard'
      };

      const result = await TreatmentService.createTreatment(newTreatment);
      
      // The issue: healers count should be exactly 2, but might be more
      const healersCount = result.healers?.length ?? 0;
      console.log(`Expected 2 healers, got ${healersCount}`, result.healers);
      expect(healersCount).toBe(2);
    });

    it('should return exactly the same number of healers as sent when creating a treatment with 3 healers', async () => {
      const personID = await getRealPersonId();
      const healers = await getRealHealers(3);

      const newTreatment: Treatment = {
        id: undefined,
        personID,
        nature: 1,
        diagnostic: 1,
        mode: 1,
        status: TreatmentStatusEnum.Status.OPEN,
        startDate: new Date().toISOString(),
        startTime: '15:00',
        healers: healers,
        totalCost: 200,
        payed: 100,
        comment: 'Test: 3 healers',
        healingFrequency: 'Daily',
        protocol: 'Standard'
      };

      const result = await TreatmentService.createTreatment(newTreatment);
      
      // The issue: healers count should be exactly 3, but might be more
      const healersCount = result.healers?.length ?? 0;
      console.log(`Expected 3 healers, got ${healersCount}`, result.healers);
      expect(healersCount).toBe(3);
    });

    it('should return exactly the same number of healers as sent when creating a treatment with duplicate healers in request', async () => {
      const personID = await getRealPersonId();
      const healers = await getRealHealers(2);
      
      // Send the same healer twice to test duplication handling
      const duplicatedHealers = [healers[0], healers[0]];

      const newTreatment: Treatment = {
        id: undefined,
        personID,
        nature: 1,
        diagnostic: 1,
        mode: 1,
        status: TreatmentStatusEnum.Status.OPEN,
        startDate: new Date().toISOString(),
        startTime: '15:30',
        healers: duplicatedHealers,
        totalCost: 100,
        payed: 50,
        comment: 'Test: duplicate healers in request',
        healingFrequency: 'Daily',
        protocol: 'Standard'
      };

      const result = await TreatmentService.createTreatment(newTreatment);
      
      // Even with duplicates in request, should have at most 1 of each unique healer
      // But the issue might be creating more than expected
      const healersCount = result.healers?.length ?? 0;
      console.log(`Expected at most 1 healer (unique), got ${healersCount}`, result.healers);
      
      // This will likely fail showing the bug - more healers than expected
      // Either 2 (if deduplicated) or more (if bug creates duplicates)
      expect(healersCount).toBeLessThanOrEqual(2);
    });
  });

  describe('UpdateTreatment - Healer Duplication', () => {
    it('should return exactly the same number of healers after updating a treatment with 1 healer', async () => {
      const personID = await getRealPersonId();
      const healers = await getRealHealers(2);

      // First create a treatment with 2 healers
      const created = await createTestTreatment(healers, 'Before update - 2 healers');
      
      // Verify initial creation has 2 healers
      const initialHealersCount = created.healers?.length ?? 0;
      console.log(`Initial healers count: ${initialHealersCount}`);
      expect(initialHealersCount).toBe(2);

      // Now update to have only 1 healer
      const updated = await TreatmentService.updateTreatment({
        ...created,
        healers: [healers[0]], // Only 1 healer
        comment: 'After update - 1 healer'
      });

      // The issue: healers count should be exactly 1
      const updatedHealersCount = updated.healers?.length ?? 0;
      console.log(`Expected 1 healer after update, got ${updatedHealersCount}`, updated.healers);
      expect(updatedHealersCount).toBe(1);
    });

    it('should return exactly the same number of healers after updating a treatment with 3 healers', async () => {
      const personID = await getRealPersonId();
      const healers = await getRealHealers(3);

      // First create a treatment with 1 healer
      const created = await createTestTreatment([healers[0]], 'Before update - 1 healer');
      
      // Now update to have 3 healers
      const updated = await TreatmentService.updateTreatment({
        ...created,
        healers: healers, // 3 healers
        comment: 'After update - 3 healers'
      });

      // The issue: healers count should be exactly 3
      const updatedHealersCount = updated.healers?.length ?? 0;
      console.log(`Expected 3 healers after update, got ${updatedHealersCount}`, updated.healers);
      expect(updatedHealersCount).toBe(3);
    });
  });

  describe('Multiple Create/Update Cycles - Healer Accumulation', () => {
    it('should not accumulate healers after multiple update cycles', async () => {
      const personID = await getRealPersonId();
      const healers = await getRealHealers(3);

      // Create treatment with 1 healer
      const created = await createTestTreatment([healers[0]], 'Cycle test - 1 healer');
      
      // First update: add 2nd healer
      let updated = await TreatmentService.updateTreatment({
        ...created,
        healers: [healers[0], healers[1]],
      });
      let healersCount = updated.healers?.length ?? 0;
      console.log(`After 1st update: expected 2, got ${healersCount}`);
      expect(healersCount).toBe(2);

      // Second update: add 3rd healer
      updated = await TreatmentService.updateTreatment({
        ...updated,
        healers: [healers[0], healers[1], healers[2]],
      });
      healersCount = updated.healers?.length ?? 0;
      console.log(`After 2nd update: expected 3, got ${healersCount}`);
      expect(healersCount).toBe(3);

      // Third update: keep same 3 healers (no change)
      updated = await TreatmentService.updateTreatment({
        ...updated,
        comment: 'Final update',
      });
      healersCount = updated.healers?.length ?? 0;
      // This might fail showing accumulated healers
      console.log(`After 3rd update: expected 3, got ${healersCount}`, updated.healers);
      expect(healersCount).toBe(3);
    });
  });
});
