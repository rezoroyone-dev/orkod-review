import { TreatmentStatusEnum } from '@/enumerators/TreatmentStatusEnum';
import SuperUser from '@/interfaces/SuperUser';
import Treatment from '@/interfaces/Treatment';
import AuthenticationService from '@/services/AuthenticationService';
import HealerService from '@/services/HealerService';
import UserService from '@/services/UserService';
import axios from 'axios';
import { format } from 'date-fns';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('Treatment Integration Flow', () => {
  let adminUser: SuperUser;

  beforeAll(async () => {
    adminUser = await getAdminUser();
  }, 30_000);

  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  it('should create a treatment plan with multiple healers', async () => {
    // 1. Get real data
    const healers = await HealerService.getAllHealers();
    const people = await UserService.findUsers('Admin');
    const person = people[0];

    // 2. Create Treatment
    const newTreatment: Treatment = {
      id: undefined,
      personID: person.id!,
      nature: 1,
      diagnostic: 1,
      mode: 1,
      status: TreatmentStatusEnum.Status.OPEN,
      startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx"),
      startTime: '10:00',
      healers: healers.slice(0, 2), // Assign 2 healers
      totalCost: 100,
      payed: 50,
      healingFrequency: 'daily',
      protocol: 'Standard',
      comment: 'Integration test treatment'
    };

    console.log('Creating treatment...');
    const config = AuthenticationService.getAxiosConfig(adminUser);
    const response = await axios.post('http://localhost:9091/api/createTreatment', newTreatment, config);
    const created = response.data;

    expect(created.id).toBeGreaterThan(0);
    expect(created.healers.length).toBeGreaterThanOrEqual(1);

    // 3. Verify in list
    const listResponse = await axios.get(`http://localhost:9091/api/treatmentList/OPEN/${person.id}`, config);
    const found = listResponse.data.find((t: any) => t.id === created.id);
    expect(found).toBeDefined();
    
    // 4. Cleanup
    await axios.delete(`http://localhost:9091/api/deleteTreatment/${created.id}`, config);
  });
});
