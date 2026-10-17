import SuperUser from '@/interfaces/SuperUser';
import AuthenticationService from '@/services/AuthenticationService';
import SuperUserService from '@/services/SuperUserService';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('Infrastructure Management Integration (Centers & Meditations)', () => {
  const adminCreds: SuperUser = { userName: 'admin', passWord: (process.env.TEST_ADMIN_PASSWORD ?? 'test-admin-password') };
  let adminUser: SuperUser;

  beforeAll(async () => {
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
    adminUser = await getAdminUser();
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  it('should manage Centers correctly', async () => {
    const config = AuthenticationService.getAxiosConfig(adminUser);
    const uniqueSuffix = Date.now();

    // 1. Create Center
    const newCenter = {
      name: `Test Center ${uniqueSuffix}`,
      address: '123 Test Ave',
      phone: '555-CENTER',
      managerName: 'Admin'
    };

    console.log('Creating center...');
    const createResponse = await axios.post('http://localhost:9091/api/saveCenter', newCenter, config);
    const created = createResponse.data;
    expect(created.id).toBeDefined();

    // 2. List Centers
    const listResponse = await axios.post('http://localhost:9091/api/getAllCenters', null, config);
    expect(listResponse.data.some((c: any) => c.id === created.id)).toBe(true);

    // 3. Delete Center
    await axios.delete(`http://localhost:9091/api/center/${created.id}`, config);
  });

  it('should manage Meditations correctly', async () => {
    const config = AuthenticationService.getAxiosConfig(adminUser);
    const uniqueSuffix = Date.now();

    // 1. Create Meditation
    const newMed = {
      name: `Meditation ${uniqueSuffix}`,
      path: 'https://youtube.com/test',
      comment: 'Test comment'
    };

    console.log('Creating meditation...');
    const createResponse = await axios.post('http://localhost:9091/api/saveMeditation', newMed, config);
    const created = createResponse.data;
    expect(created.id).toBeDefined();

    // 2. List Meditations
    const listResponse = await axios.post('http://localhost:9091/api/getAllMeditations', null, config);
    expect(listResponse.data.some((m: any) => m.id === created.id)).toBe(true);

    // 3. Delete Meditation
    await axios.delete(`http://localhost:9091/api/meditation/${created.id}`, config);
  });
});
