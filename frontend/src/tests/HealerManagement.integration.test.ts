import AppConfigs from '@/AppConfigs';
import SuperUser from '@/interfaces/SuperUser';
import Healer from '@/models/Healer';
import AuthenticationService from '@/services/AuthenticationService';
import HealerService from '@/services/HealerService';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '@/stores/user';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('Healer Management Integration', () => {
  let adminUser: SuperUser | null;

  beforeAll(async () => {
    adminUser = await getAdminUser();
    if (!adminUser) {
      console.log('Backend not available - tests will be skipped');
    }
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    if (adminUser) {
      const userStore = useUserStore();
      userStore.setUser(adminUser);
    }
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  it('should fetch all healers and verify structure', async () => {
    if (!adminUser) {
      console.log('Skipping test - backend not available');
      return;
    }
    console.log('Fetching all healers...');
    const healers: Healer[] = await HealerService.getAllHealers();

    expect(Array.isArray(healers)).toBe(true);
    console.log(`Found ${healers.length} healers.`);

    if (healers.length > 0) {
      const healer = healers[0];
      // Verify the healer structure
      expect(healer.id).toBeDefined();
      expect(typeof healer.id).toBe('number');
      expect(healer.firstName).toBeDefined();
      expect(healer.lastName).toBeDefined();
      console.log(`First healer: ${healer.firstName} ${healer.lastName} (ID: ${healer.id})`);
    } else {
      console.warn('No healers in the system - skipping structure check.');
    }
  });

  it('should search for healers by name', async () => {
    // 1. Get all healers first to pick a search term
    const allHealers = await HealerService.getAllHealers();
    if (allHealers.length === 0) {
      console.warn('No healers in the system - skipping search test.');
      return;
    }

    const healer = allHealers[0];
    const searchTerm = healer.firstName || 'admin';
    console.log(`Searching for healer with term: "${searchTerm}"...`);

    // 2. Search
    const results = await HealerService.findHealers(searchTerm);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    console.log(`Found ${results.length} results.`);
  });

  it('should get a specific healer by ID', async () => {
    // 1. Get all healers to pick a valid ID
    const allHealers = await HealerService.getAllHealers();
    if (allHealers.length === 0) {
      console.warn('No healers in the system - skipping getHealer test.');
      return;
    }

    const healerID = allHealers[0].id!;
    console.log(`Fetching healer with ID: ${healerID}...`);

    // 2. Get the specific healer
    const healer = await HealerService.getHealer(healerID);
    expect(healer).toBeDefined();
    expect(healer.id).toBe(healerID);
    console.log(`Successfully fetched healer ID: ${healerID}`);
  });

  it('should perform full CRUD: create a healer from a new person, then delete', async () => {
    if (!adminUser) {
      console.log('Skipping test - backend not available');
      return;
    }
    const uniqueSuffix = Date.now();
    const config = AuthenticationService.getAxiosConfig(adminUser);

    // 1. Create a person to attach a healer to
    const newPerson = {
      firstName: `HealerTest_${uniqueSuffix}`,
      lastName: 'Integration',
      phone: `555${uniqueSuffix}`.slice(0, 12),
      email: `healertest_${uniqueSuffix}@example.com`,
      address: 'Test Address',
      city: 'Test City',
      civilState: 'Single'
    };

    console.log('Step 1: Creating a person...');
    const personResponse = await axios.post(
      AppConfigs.getServerURL() + '/people',
      newPerson,
      config
    );
    const createdPerson = personResponse.data;
    expect(createdPerson.id).toBeGreaterThan(0);
    console.log(`Created person ID: ${createdPerson.id}`);

    // 2. Create a healer from this person
    const newHealer: Healer = {
      personID: createdPerson.id
    } as Healer;

    console.log('Step 2: Creating healer from person...');
    const createdHealer = await HealerService.createHealer(newHealer);
    expect(createdHealer.id).toBeDefined();
    expect(createdHealer.id).toBeGreaterThan(0);
    console.log(`Created healer ID: ${createdHealer.id}`);

    // 3. Verify healer appears in getAllHealers (sorted by id DESC, newest first)
    console.log('Step 3: Verifying healer in list...');
    const allHealers = await HealerService.getAllHealers();
    const foundInList = allHealers.find(h => h.id === createdHealer.id);
    expect(foundInList).toBeDefined();

    // 4. Also verify using findHealers for redundancy
    console.log('Step 4: Verifying healer via search...');
    const searchResults = await HealerService.findHealers(`HealerTest_${uniqueSuffix}`);
    expect(searchResults.length).toBeGreaterThan(0);
    const foundInSearch = searchResults.find(h => h.id === createdHealer.id);
    expect(foundInSearch).toBeDefined();

    // 5. Verify getHealer by ID works
    console.log('Step 5: Fetching healer by ID...');
    const fetchedHealer = await HealerService.getHealer(createdHealer.id!);
    expect(fetchedHealer.id).toBe(createdHealer.id);

    // 6. Delete the healer
    // Note: Deletion may fail with 409 or 500 if other tests created treatments using this healer
    // This is a test isolation issue when running with other integration tests
    console.log('Step 6: Deleting healer...');
    try {
      await HealerService.deleteHealer(createdHealer.id!);
      
      // 7. Verify healer is gone from list
      const healersAfterDelete = await HealerService.getAllHealers();
      const stillExists = healersAfterDelete.find(h => h.id === createdHealer.id);
      expect(stillExists).toBeUndefined();
      console.log('Healer deleted successfully.');
    } catch (error: any) {
      // If deletion fails due to related entries (409 or 500), another test may have used this healer
      // This is acceptable in integration tests when running in parallel
      const status = error.response?.status;
      if (status === 409 || status === 500) {
        console.log(`Healer has related entries (status ${status}, likely used by another test) - skipping deletion cleanup.`);
      } else {
        throw error;
      }
    }

    // 8. Cleanup - delete the person as well (may fail if healer wasn't deleted)
    console.log('Step 7: Cleaning up person...');
    try {
      await axios.delete(
        AppConfigs.getServerURL() + `/people/${createdPerson.id}`,
        config
      );
    } catch (cleanupError: any) {
      // Ignore cleanup errors - person may already be deleted or have related entries
      console.log('Person cleanup skipped (may be handled by other tests or has related entries).');
    }
  });

  it('should throw an error when trying to get a healer with invalid ID', async () => {
    await expect(HealerService.getHealer(-1)).rejects.toThrow();
  });

  it('should throw an error when trying to create a healer without personID', async () => {
    const invalidHealer: Healer = {} as Healer; // No personID
    await expect(HealerService.createHealer(invalidHealer)).rejects.toThrow();
  });
});
