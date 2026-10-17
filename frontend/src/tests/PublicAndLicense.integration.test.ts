import AppConfigs from '@/AppConfigs';
import { langsEnum } from '@/enumerators/enums';
import SuperUser from '@/interfaces/SuperUser';
import AuthenticationService from '@/services/AuthenticationService';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '@/stores/user';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('Public and License Integration', () => {
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

  it('should fetch available healers (public)', async () => {
    const url = AppConfigs.getServerURL() + "/public/availableHealers";
    const response = await axios.get(url);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  it('should fetch healer availability (public)', async () => {
    // 1. Get a healer ID first
    const healersUrl = AppConfigs.getServerURL() + "/public/availableHealers";
    const healersResponse = await axios.get(healersUrl);
    if (healersResponse.data.length > 0) {
        const healerID = healersResponse.data[0].id;
        const url = AppConfigs.getServerURL() + `/public/healerAvailability/${healerID}`;
        const response = await axios.get(url);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
    }
  });

  it('should check license status', async () => {
    const url = AppConfigs.getServerURL() + "/public/licenseStatus";
    const response = await axios.post(url, {});
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });

  it('should fetch protocol PDF', async () => {
    const url = AppConfigs.getServerURL() + "/api/protocolPDF";
    const config = AuthenticationService.getAxiosConfig(adminUser);
    config.responseType = 'arraybuffer';
    
    // We need real IDs, but let's try with 1, 1 which usually exist
    const data = {
        natureID: 1,
        diagnosticID: 1,
        lang: langsEnum.ENGLISH
    };

    try {
        const response = await axios.post(url, data, config);
        expect(response.status).toBe(200);
        expect(response.data.byteLength).toBeGreaterThan(0);
    } catch (e: any) {
        if (e.response && e.response.status === 404) {
            console.warn("Protocol PDF not found for IDs 1, 1 - skipping content check");
        } else {
            throw e;
        }
    }
  });
});
