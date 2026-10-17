import { TreatmentStatusEnum } from '@/enumerators/TreatmentStatusEnum';
import SuperUser from '@/interfaces/SuperUser';
import AuthenticationService from '@/services/AuthenticationService';
import HealerService from '@/services/HealerService';
import TreatmentService from '@/services/TreatmentService';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

// Use environment variable if available, fallback to localhost
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:9091') + '/api';

describe('useTreatment Composable (Integration)', () => {
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
    const appStore = useAppStore();
    appStore.setLocale('en');
  });

  it('should fetch all healers from the real backend', async () => {
    if (!adminUser) {
      console.log('Skipping test - backend not available');
      return;
    }
    const healers = await HealerService.getAllHealers();
    expect(Array.isArray(healers)).toBe(true);
    expect(healers.length).toBeGreaterThan(0);
    // Each healer should have an id
    expect(healers[0].id).toBeDefined();
    expect(healers[0].id).toBeGreaterThan(0);
  });

  it('should create and delete a treatment via the real backend', async () => {
    if (!adminUser) {
      console.log('Skipping test - backend not available');
      return;
    }
    const config = AuthenticationService.getAxiosConfig(adminUser);

    // 1. Get a real person to attach the treatment to
    const searchResponse = await axios.post(`${BASE_URL}/search`, { query: 'Admin' }, config);
    const people = searchResponse.data;
    expect(Array.isArray(people)).toBe(true);
    expect(people.length).toBeGreaterThan(0);
    const person = people[0];

    // 2. Get real healers
    const healers = await HealerService.getAllHealers();
    expect(healers.length).toBeGreaterThan(0);

    // 3. Create a treatment
    const newTreatment = {
      personID: person.id,
      nature: 1,
      diagnostic: 1,
      mode: 1,
      status: TreatmentStatusEnum.Status.OPEN,
      startDate: new Date().toISOString(),
      startTime: '10:00',
      healers: [healers[0]],
      totalCost: 100,
      payed: 50,
      comment: 'useTreatment composable integration test'
    };

    const created = await TreatmentService.createTreatment(newTreatment);
    expect(created.id).toBeGreaterThan(0);
    expect(created.status).toBe('OPEN');

    // 4. Verify it appears in the treatment list
    const treatments = await TreatmentService.getTreatments(person.id, 'OPEN');
    expect(Array.isArray(treatments)).toBe(true);
    const found = treatments.find((t: any) => t.id === created.id);
    expect(found).toBeDefined();

    // 5. Cleanup - delete the treatment
    await TreatmentService.deleteTreatment(created.id!);
  });

  it('should update a treatment via the real backend', async () => {
    if (!adminUser) {
      console.log('Skipping test - backend not available');
      return;
    }
    const config = AuthenticationService.getAxiosConfig(adminUser);

    // 1. Get a real person
    const searchResponse = await axios.post(`${BASE_URL}/search`, { query: 'Admin' }, config);
    const person = searchResponse.data[0];

    // 2. Get real healers
    const healers = await HealerService.getAllHealers();

    // 3. Create a treatment to update
    const newTreatment = {
      personID: person.id,
      nature: 1,
      diagnostic: 1,
      mode: 1,
      status: TreatmentStatusEnum.Status.OPEN,
      startDate: new Date().toISOString(),
      startTime: '09:00',
      healers: [healers[0]],
      totalCost: 200,
      payed: 100,
      comment: 'Before update'
    };

    const created = await TreatmentService.createTreatment(newTreatment);
    expect(created.id).toBeGreaterThan(0);

    // 4. Update the treatment
    const updated = await TreatmentService.updateTreatment({ ...created, comment: 'After update', payed: 150 });
    expect(updated.id).toBe(created.id);
    expect(updated.payed).toBe(150);
    expect(updated.comment).toBe('After update');

    // 5. Cleanup
    await TreatmentService.deleteTreatment(created.id!);
  });
});
