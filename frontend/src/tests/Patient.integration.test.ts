import Person from '@/interfaces/Person';
import SuperUser from '@/interfaces/SuperUser';
import AuthenticationService from '@/services/AuthenticationService';
import UserService from '@/services/UserService';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '@/stores/user';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('Patient Management Integration', () => {
  let adminUser: SuperUser;

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

  it('should create, update, and delete a patient', async () => {
    const config = AuthenticationService.getAxiosConfig(adminUser);
    const uniqueSuffix = Date.now();
    
    // 1. Create
    const newPatient: Person = {
      id: undefined,
      firstName: `Patient_${uniqueSuffix}`,
      lastName: 'IntegrationTest',
      phone: '123456789',
      email: `test_${uniqueSuffix}@example.com`,
      address: 'Test Street',
      city: 'Test City',
      civilState: 'Single',
      birthDate: '1990-01-01'
    };

    console.log('Creating patient...');
    const createResponse = await axios.post('http://localhost:9091/api/people', newPatient, config);
    const created = createResponse.data;
    expect(created.id).toBeGreaterThan(0);
    expect(created.firstName).toBe(newPatient.firstName);

    // 2. Update
    created.phone = '987654321';
    console.log('Updating patient...');
    const updateResponse = await axios.post(`http://localhost:9091/api/people/${created.id}`, created, config);
    expect(updateResponse.data.phone).toBe('987654321');

    // 3. Search
    console.log('Searching for patient...');
    const searchResults = await UserService.findUsers(created.firstName);
    expect(searchResults.some(p => p.id === created.id)).toBe(true);

    // 4. Delete
    console.log('Deleting patient...');
    const deleteResponse = await axios.delete(`http://localhost:9091/api/people/${created.id}`, config);
    expect(deleteResponse.status).toBe(200);
  });
});
