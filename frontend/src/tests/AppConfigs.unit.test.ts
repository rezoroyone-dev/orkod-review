/**
 * Unit tests for AppConfigs
 * Covers: getServerURL() console.log fix (only logs in DEV mode)
 * Compatible with vitest
 */
import AppConfigs from '@/AppConfigs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('AppConfigs Unit Tests', () => {
  let consoleSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should return a URL ending with /api', () => {
    const url = AppConfigs.getServerURL();
    expect(url).toMatch(/\/api$/);
  });

  it('should use VITE_API_URL when set', () => {
    process.env.VITE_API_URL = 'http://test-server:8080';
    const url = AppConfigs.getServerURL();
    expect(url).toBe('http://test-server:8080/api');
  });

  it('should not log in production mode (import.meta.env.DEV is false)', async () => {
    // Mock import.meta.env.DEV to be false to simulate production mode
    // The fix ensures console.log is only called when DEV is true
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
    
    // Temporarily override import.meta.env.DEV
    const originalDEV = import.meta.env.DEV;
    (import.meta.env as any).DEV = false;
    
    AppConfigs.getServerURL();
    
    // Restore original DEV value
    (import.meta.env as any).DEV = originalDEV;
    
    // In production mode (DEV is false), console.log should NOT be called
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('getServerURL should return a string', () => {
    // getAuthorizationHeaders was removed — auth now uses JWT Bearer tokens only.
    // This test verifies getServerURL still returns a valid string.
    const url = AppConfigs.getServerURL();
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
  });
});
