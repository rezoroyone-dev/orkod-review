import SuperUser from '@/interfaces/SuperUser';
import AuditLogService, { AuditLog } from '@/services/AuditLogService';
import SuperUserService from '@/services/SuperUserService';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('Audit Logs Integration', () => {
  let adminUser: SuperUser;

  beforeAll(async () => {
    adminUser = await getAdminUser();
    if (!adminUser) {
      console.log('Backend not available - tests will be skipped');
    }
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  it('should fetch audit logs and verify structure', async () => {
    if (!adminUser) {
      console.log('Skipping test - backend not available');
      return;
    }
    console.log('Fetching audit logs...');
    const logs: AuditLog[] = await AuditLogService.getAuditLogs();

    expect(Array.isArray(logs)).toBe(true);

    if (logs.length > 0) {
      const log = logs[0];
      console.log('First log entry:', JSON.stringify(log));

      // Verify the structure of a log entry
      expect(log.id).toBeDefined();
      expect(typeof log.id).toBe('number');
      expect(log.userID).toBeDefined();
      expect(typeof log.userID).toBe('number');
      expect(log.userName).toBeDefined();
      expect(typeof log.userName).toBe('string');
      expect(log.userName.length).toBeGreaterThan(0);
      expect(log.action).toBeDefined();
      expect(typeof log.action).toBe('string');
      expect(log.target).toBeDefined();
      expect(log.createdAt).toBeDefined();
    } else {
      console.warn('No audit logs found - skipping structure check. Perform some actions first.');
    }
  });

  it('should return an array (even if empty)', async () => {
    if (!adminUser) {
      console.log('Skipping test - backend not available');
      return;
    }
    const logs = await AuditLogService.getAuditLogs();
    expect(Array.isArray(logs)).toBe(true);
  });

  it('should delete an audit log entry and verify removal', async () => {
    if (!adminUser) {
      console.log('Skipping test - backend not available');
      return;
    }
    // 1. Get existing logs
    console.log('Fetching audit logs for deletion test...');
    const logsBefore: AuditLog[] = await AuditLogService.getAuditLogs();

    if (logsBefore.length === 0) {
      console.warn('No audit logs to delete - skipping deletion test.');
      return;
    }

    // 2. Pick the last log (least important to keep)
    const logToDelete = logsBefore[logsBefore.length - 1];
    console.log(`Deleting audit log ID: ${logToDelete.id}...`);

    // 3. Delete it
    await AuditLogService.deleteAuditLog(logToDelete.id);

    // 4. Verify it's gone
    const logsAfter: AuditLog[] = await AuditLogService.getAuditLogs();
    const stillExists = logsAfter.find(l => l.id === logToDelete.id);
    expect(stillExists).toBeUndefined();

    console.log(`Successfully deleted audit log ID: ${logToDelete.id}`);
  });

  it('should fail to fetch audit logs with wrong credentials', async () => {
    // Attempt to authenticate with wrong password — should throw
    await expect(SuperUserService.authenticate('admin', 'wrong_password')).rejects.toThrow();
  });
});
