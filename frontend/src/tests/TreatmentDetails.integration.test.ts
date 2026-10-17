import AppConfigs from '@/AppConfigs';
import { langsEnum } from '@/enumerators/enums';
import SuperUser from '@/interfaces/SuperUser';
import AuthenticationService from '@/services/AuthenticationService';
import SicknessNatureService from '@/services/SicknessNatureService';
import UserService from '@/services/UserService';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '@/stores/user';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('Treatment Data Integrity & Resolution Integration', () => {
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

  it('should resolve healer names from nested person objects and sickness descriptions', async () => {
    // 1. Ensure Sickness Natures are loaded in store
    console.log('Populating sickness natures...');
    await SicknessNatureService.populateSickNatures(langsEnum.ENGLISH);

    // 2. Fetch a real person to get their treatments
    console.log('Fetching admin person...');
    const people = await UserService.findUsers('Admin');
    const person = people[0];
    expect(person.id).toBeDefined();

    // 3. Fetch Open Treatments
    console.log(`Fetching treatments for person ID: ${person.id}...`);
    const config = AuthenticationService.getAxiosConfig(adminUser);
    const url = `${AppConfigs.getServerURL()}/treatmentList/OPEN/${person.id}`;
    const response = await axios.get(url, config);
    const treatments = response.data;

    expect(Array.isArray(treatments)).toBe(true);
    
    if (treatments.length > 0) {
      const treatment = treatments[0];
      console.log('Testing treatment ID:', treatment.id);

      // 4. Verify Healer Nesting (The Backend Preload Fix)
      if (treatment.healers && treatment.healers.length > 0) {
        const healer = treatment.healers[0];
        // Healer should either have flattened names OR a nested person object
        const firstName = healer.firstName || healer.person?.firstName;
        const lastName = healer.lastName || healer.person?.lastName;
        
        console.log(`Resolved Healer: ${firstName} ${lastName}`);
        expect(firstName).toBeDefined();
        expect(firstName.length).toBeGreaterThan(0);
      }

      // 5. Verify Sickness Nature Resolution (The empty fields fix)
      const natureDesc = SicknessNatureService.getNatureDescription(treatment.nature, langsEnum.ENGLISH);
      const diagDesc = SicknessNatureService.getDiagnosticDescription(treatment.nature, treatment.diagnostic, langsEnum.ENGLISH);
      
      console.log(`Nature ID ${treatment.nature} -> ${natureDesc}`);
      console.log(`Diag ID ${treatment.diagnostic} -> ${diagDesc}`);

      expect(natureDesc).toBeDefined();
      expect(natureDesc.length).toBeGreaterThan(0);
      expect(diagDesc).toBeDefined();
      expect(diagDesc.length).toBeGreaterThan(0);
    } else {
      console.warn('No treatments found for Admin to test data resolution.');
    }
  });
});
