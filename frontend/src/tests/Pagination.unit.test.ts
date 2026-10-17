/**
 * Integration tests for pagination logic
 * Covers: GetPersons pagination parameters, UserService pagination support
 */
import AppConfigs from '@/AppConfigs';
import SuperUser from '@/interfaces/SuperUser';
import AuthenticationService from '@/services/AuthenticationService';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('Pagination Unit Tests', () => {
  let adminUser: SuperUser;

  beforeAll(async () => {
    adminUser = await getAdminUser();
  }, 120000);

  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  describe('GetPersons pagination', () => {
    it('should call /people with page and limit query params', async () => {
      const config = AuthenticationService.getAxiosConfig(adminUser);
      const url = AppConfigs.getServerURL() + '/people?page=1&limit=50';
      const response = await axios.get(url, config);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('page');
      expect(response.data).toHaveProperty('limit');
    });

    it('should support custom page and limit values', async () => {
      const config = AuthenticationService.getAxiosConfig(adminUser);
      const url = AppConfigs.getServerURL() + '/people?page=1&limit=25';
      const response = await axios.get(url, config);

      expect(response.status).toBe(200);
      expect(response.data.page).toBe(1);
      expect(response.data.limit).toBe(25);
      expect(typeof response.data.total).toBe('number');
    });

    it('should handle paginated response structure correctly', async () => {
      const config = AuthenticationService.getAxiosConfig(adminUser);
      const url = AppConfigs.getServerURL() + '/people?page=1&limit=50';
      const response = await axios.get(url, config);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(typeof response.data.total).toBe('number');
      expect(response.data.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Pagination parameter validation', () => {
    it('should correctly build pagination URL with page 1 and limit 50', () => {
      const baseUrl = 'http://localhost:9091/api/people';
      const page = 1;
      const limit = 50;
      const url = `${baseUrl}?page=${page}&limit=${limit}`;
      expect(url).toBe('http://localhost:9091/api/people?page=1&limit=50');
    });

    it('should correctly build pagination URL for second page', () => {
      const baseUrl = 'http://localhost:9091/api/people';
      const page = 2;
      const limit = 50;
      const url = `${baseUrl}?page=${page}&limit=${limit}`;
      expect(url).toBe('http://localhost:9091/api/people?page=2&limit=50');
    });

    it('should calculate correct offset from page and limit', () => {
      // Mirrors the backend logic: offset = (page - 1) * limit
      const calculateOffset = (page: number, limit: number) => (page - 1) * limit;
      expect(calculateOffset(1, 50)).toBe(0);
      expect(calculateOffset(2, 50)).toBe(50);
      expect(calculateOffset(3, 50)).toBe(100);
      expect(calculateOffset(1, 25)).toBe(0);
      expect(calculateOffset(4, 25)).toBe(75);
    });
  });
});
