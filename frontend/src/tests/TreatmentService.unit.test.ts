/**
 * Integration tests for TreatmentService
 * Tests the service methods against the real backend
 */
import { TreatmentStatusEnum } from '@/enumerators/TreatmentStatusEnum';
import SuperUser from '@/interfaces/SuperUser';
import Treatment from '@/interfaces/Treatment';
import AuthenticationService from '@/services/AuthenticationService';
import HealerService from '@/services/HealerService';
import TreatmentService from '@/services/TreatmentService';
import { useUserStore } from '@/stores/user';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

// Use environment variable if available, fallback to localhost
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:9091') + '/api';

describe('TreatmentService Unit Tests', () => {
  let adminUser: SuperUser | null;

  beforeAll(async () => {
    adminUser = await getAdminUser();
    if (!adminUser) {
      console.log('Backend not available - tests will be skipped');
    }
  }, 30_000);

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
    if (!adminUser) {
      throw new Error('Backend not available - skipping');
    }
    const config = AuthenticationService.getAxiosConfig(adminUser);
    const response = await axios.post(`${BASE_URL}/search`, { query: 'Admin' }, config);
    const people = response.data;
    if (!Array.isArray(people) || people.length === 0) throw new Error('No people found in backend');
    return people[0].id;
  }

  // Helper: get a real healer from the backend
  async function getRealHealer() {
    const healers = await HealerService.getAllHealers();
    if (!Array.isArray(healers) || healers.length === 0) throw new Error('No healers found in backend');
    return healers[0];
  }

  describe('createTreatment', () => {
    it('should call POST /createTreatment with treatment data', async () => {
      const personID = await getRealPersonId();
      const healer = await getRealHealer();

      const newTreatment: Treatment = {
        id: undefined,
        personID,
        nature: 1,
        diagnostic: 1,
        mode: 1,
        status: TreatmentStatusEnum.Status.OPEN,
        startDate: new Date().toISOString(),
        startTime: '10:00',
        healers: [healer],
        totalCost: 100,
        payed: 50,
        healingFrequency: 'weekly',
        protocol: 'Standard',
        comment: 'TreatmentService integration test - createTreatment'
      };

      const result = await TreatmentService.createTreatment(newTreatment);
      expect(result.id).toBeGreaterThan(0);
      expect(result.status).toBe('OPEN');
      expect(result.comment).toBe('TreatmentService integration test - createTreatment');

      // Cleanup
      await TreatmentService.deleteTreatment(result.id!);
    });

    it('should throw if axios fails (invalid credentials)', async () => {
      const personID = await getRealPersonId();
      const healer = await getRealHealer();

      const newTreatment: Treatment = {
        id: undefined,
        personID,
        nature: 1,
        diagnostic: 1,
        mode: 1,
        status: TreatmentStatusEnum.Status.OPEN,
        startDate: new Date().toISOString(),
        startTime: '10:00',
        healers: [healer],
        totalCost: 100,
        payed: 50,
        comment: 'Should fail'
      };

      // This test verifies that the axios interceptor properly handles auth errors
      // We need to temporarily set a bad token in the store
      const userStore = useUserStore();
      const originalUser = userStore.superUser;
      userStore.setUser({ userName: 'wrong', token: 'invalid-token-xyz' } as SuperUser);
      
      await expect(TreatmentService.createTreatment(newTreatment)).rejects.toThrow();
      
      // Restore original user
      if (originalUser) {
        userStore.setUser(originalUser);
      }
    });
  });

  describe('updateTreatment', () => {
    it('should call POST /updateTreatment with treatment data', async () => {
      const personID = await getRealPersonId();
      const healer = await getRealHealer();

      // Create a treatment first
      const newTreatment: Treatment = {
        id: undefined,
        personID,
        nature: 1,
        diagnostic: 1,
        mode: 1,
        status: TreatmentStatusEnum.Status.OPEN,
        startDate: new Date().toISOString(),
        startTime: '10:00',
        healers: [healer],
        totalCost: 200,
        payed: 100,
        comment: 'Before update'
      };
      const created = await TreatmentService.createTreatment(newTreatment);
      expect(created.id).toBeGreaterThan(0);

      // Update it
      const updated = await TreatmentService.updateTreatment({ ...created, comment: 'Updated', payed: 150 });
      expect(updated.id).toBe(created.id);
      expect(updated.comment).toBe('Updated');
      expect(updated.payed).toBe(150);

      // Cleanup
      await TreatmentService.deleteTreatment(created.id!);
    });

    it('should throw if treatment has no ID', async () => {
      const noIdTreatment: Treatment = {
        id: undefined,
        personID: 1,
        nature: 1,
        diagnostic: 1,
        mode: 1,
        status: TreatmentStatusEnum.Status.OPEN,
        startDate: new Date().toISOString(),
        startTime: '10:00',
        healers: [],
        totalCost: 100,
        payed: 50,
        comment: 'No ID'
      };
      await expect(TreatmentService.updateTreatment(noIdTreatment)).rejects.toThrow('Treatment ID is required for update');
    });
  });

  describe('deleteTreatment', () => {
    it('should call DELETE /deleteTreatment/:id', async () => {
      const personID = await getRealPersonId();
      const healer = await getRealHealer();

      // Create a treatment to delete
      const newTreatment: Treatment = {
        id: undefined,
        personID,
        nature: 1,
        diagnostic: 1,
        mode: 1,
        status: TreatmentStatusEnum.Status.OPEN,
        startDate: new Date().toISOString(),
        startTime: '11:00',
        healers: [healer],
        totalCost: 50,
        payed: 0,
        comment: 'TreatmentService integration test - deleteTreatment'
      };
      const created = await TreatmentService.createTreatment(newTreatment);
      expect(created.id).toBeGreaterThan(0);

      // Delete it - should not throw
      await TreatmentService.deleteTreatment(created.id!);

      // Verify it's gone
      const treatments = await TreatmentService.getTreatments(personID, 'OPEN');
      const found = treatments.find((t: any) => t.id === created.id);
      expect(found).toBeUndefined();
    });

    it('should throw if treatmentId is 0 or negative', async () => {
      await expect(TreatmentService.deleteTreatment(0)).rejects.toThrow('Valid Treatment ID is required for deletion');
      await expect(TreatmentService.deleteTreatment(-1)).rejects.toThrow('Valid Treatment ID is required for deletion');
    });
  });

  describe('getTreatments', () => {
    it('should call GET /treatmentList/:status/:personId', async () => {
      const personID = await getRealPersonId();
      const result = await TreatmentService.getTreatments(personID, 'OPEN');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should use % as default status (returns all treatments)', async () => {
      const personID = await getRealPersonId();
      const result = await TreatmentService.getTreatments(personID);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw if personId is invalid', async () => {
      await expect(TreatmentService.getTreatments(0)).rejects.toThrow('Valid Person ID is required');
      await expect(TreatmentService.getTreatments(-5)).rejects.toThrow('Valid Person ID is required');
    });
  });

  describe('getTreatment', () => {
    it('should call GET /treatment/:id', async () => {
      const personID = await getRealPersonId();
      const healer = await getRealHealer();

      // Create a treatment to fetch
      const newTreatment: Treatment = {
        id: undefined,
        personID,
        nature: 1,
        diagnostic: 1,
        mode: 1,
        status: TreatmentStatusEnum.Status.OPEN,
        startDate: new Date().toISOString(),
        startTime: '12:00',
        healers: [healer],
        totalCost: 75,
        payed: 25,
        comment: 'TreatmentService integration test - getTreatment'
      };
      const created = await TreatmentService.createTreatment(newTreatment);
      expect(created.id).toBeGreaterThan(0);

      // Fetch it by ID
      const fetched = await TreatmentService.getTreatment(created.id!);
      expect(fetched.id).toBe(created.id);
      expect(fetched.comment).toBe('TreatmentService integration test - getTreatment');

      // Cleanup
      await TreatmentService.deleteTreatment(created.id!);
    });

    it('should throw if treatmentId is invalid', async () => {
      await expect(TreatmentService.getTreatment(0)).rejects.toThrow('Valid Treatment ID is required');
    });
  });
});
