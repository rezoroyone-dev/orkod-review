/**
 * Test for many-to-many duplication issues in Role Permissions CRUD operations
 * Issue: CRUD operations in role creation and update may create extra permission associations
 * 
 * This test verifies that when creating/updating a role with N permissions,
 * the backend returns exactly N permissions (not more)
 */
import SuperUser from '@/interfaces/SuperUser';
import RoleService, { Permission, Role } from '@/services/RoleService';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('Role Permissions Duplication Issue', () => {
  let adminUser: SuperUser;

  beforeAll(async () => {
    adminUser = await getAdminUser();
  }, 30_000);

  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  // Helper: get all available permissions
  async function getAllPermissions(): Promise<Permission[]> {
    return await RoleService.getPermissions();
  }


  // Helper: clean up a test role
  async function cleanupRole(roleId: number): Promise<void> {
    try {
      await RoleService.deleteRole(roleId);
    } catch (e) {
      console.warn('Failed to cleanup role:', e);
    }
  }

  describe('CreateRole - Permission Duplication', () => {
    it('should return exactly the same number of permissions as sent when creating a role with 1 permission', async () => {
      const permissions = await getAllPermissions();
      if (permissions.length < 1) {
        console.warn('Skipping test - no permissions available');
        return;
      }

      const roleName = `Test_Role_1_Perm_${Date.now()}`;
      const newRole: Role = {
        name: roleName,
        permissions: [permissions[0]]
      };

      const result = await RoleService.createRole(newRole);
      
      const permissionsCount = result.permissions?.length ?? 0;
      console.log(`Create with 1 permission: Expected 1, got ${permissionsCount}`, result.permissions);
      expect(permissionsCount).toBe(1);

      // Cleanup
      await cleanupRole(result.id!);
    });

    it('should return exactly the same number of permissions as sent when creating a role with 2 permissions', async () => {
      const permissions = await getAllPermissions();
      if (permissions.length < 2) {
        console.warn('Skipping test - not enough permissions available');
        return;
      }

      const roleName = `Test_Role_2_Perm_${Date.now()}`;
      const newRole: Role = {
        name: roleName,
        permissions: [permissions[0], permissions[1]]
      };

      const result = await RoleService.createRole(newRole);
      
      const permissionsCount = result.permissions?.length ?? 0;
      console.log(`Create with 2 permissions: Expected 2, got ${permissionsCount}`, result.permissions);
      expect(permissionsCount).toBe(2);

      // Cleanup
      await cleanupRole(result.id!);
    });

    it('should return exactly the same number of permissions as sent when creating a role with 3 permissions', async () => {
      const permissions = await getAllPermissions();
      if (permissions.length < 3) {
        console.warn('Skipping test - not enough permissions available');
        return;
      }

      const roleName = `Test_Role_3_Perm_${Date.now()}`;
      const newRole: Role = {
        name: roleName,
        permissions: [permissions[0], permissions[1], permissions[2]]
      };

      const result = await RoleService.createRole(newRole);
      
      const permissionsCount = result.permissions?.length ?? 0;
      console.log(`Create with 3 permissions: Expected 3, got ${permissionsCount}`, result.permissions);
      expect(permissionsCount).toBe(3);

      // Cleanup
      await cleanupRole(result.id!);
    });
  });

  describe('UpdateRole - Permission Duplication', () => {
    it('should return exactly the same number of permissions after updating a role from 2 to 1 permission', async () => {
      const permissions = await getAllPermissions();
      if (permissions.length < 2) {
        console.warn('Skipping test - not enough permissions available');
        return;
      }

      // First create a role with 2 permissions
      const roleName = `Test_Role_Update_${Date.now()}`;
      const created = await RoleService.createRole({
        name: roleName,
        permissions: [permissions[0], permissions[1]]
      });
      
      // Verify initial creation has 2 permissions
      const initialPermissionsCount = created.permissions?.length ?? 0;
      console.log(`Initial permissions count: ${initialPermissionsCount}`);
      expect(initialPermissionsCount).toBe(2);

      // Now update to have only 1 permission
      const updated = await RoleService.updateRole({
        ...created,
        permissions: [permissions[0]] // Only 1 permission
      });

      const updatedPermissionsCount = updated.permissions?.length ?? 0;
      console.log(`Update 2->1 permissions: Expected 1, got ${updatedPermissionsCount}`, updated.permissions);
      expect(updatedPermissionsCount).toBe(1);

      // Cleanup
      await cleanupRole(created.id!);
    });

    it('should return exactly the same number of permissions after updating a role from 1 to 3 permissions', async () => {
      const permissions = await getAllPermissions();
      if (permissions.length < 3) {
        console.warn('Skipping test - not enough permissions available');
        return;
      }

      // First create a role with 1 permission
      const roleName = `Test_Role_Expand_${Date.now()}`;
      const created = await RoleService.createRole({
        name: roleName,
        permissions: [permissions[0]]
      });
      
      // Now update to have 3 permissions
      const updated = await RoleService.updateRole({
        ...created,
        permissions: [permissions[0], permissions[1], permissions[2]] // 3 permissions
      });

      const updatedPermissionsCount = updated.permissions?.length ?? 0;
      console.log(`Update 1->3 permissions: Expected 3, got ${updatedPermissionsCount}`, updated.permissions);
      expect(updatedPermissionsCount).toBe(3);

      // Cleanup
      await cleanupRole(created.id!);
    });

    it('should not accumulate permissions after multiple update cycles', async () => {
      const permissions = await getAllPermissions();
      if (permissions.length < 3) {
        console.warn('Skipping test - not enough permissions available');
        return;
      }

      // Create role with 1 permission
      const roleName = `Test_Role_Accumulate_${Date.now()}`;
      const created = await RoleService.createRole({
        name: roleName,
        permissions: [permissions[0]]
      });
      
      // First update: add 2nd permission
      let updated = await RoleService.updateRole({
        ...created,
        permissions: [permissions[0], permissions[1]]
      });
      let permissionsCount = updated.permissions?.length ?? 0;
      console.log(`After 1st update: Expected 2, got ${permissionsCount}`);
      expect(permissionsCount).toBe(2);

      // Second update: add 3rd permission
      updated = await RoleService.updateRole({
        ...updated,
        permissions: [permissions[0], permissions[1], permissions[2]]
      });
      permissionsCount = updated.permissions?.length ?? 0;
      console.log(`After 2nd update: Expected 3, got ${permissionsCount}`);
      expect(permissionsCount).toBe(3);

      // Third update: keep same 3 permissions (no change to permissions, just name)
      updated = await RoleService.updateRole({
        ...updated,
        name: 'Updated role name'
      });
      permissionsCount = updated.permissions?.length ?? 0;
      console.log(`After 3rd update (no change): Expected 3, got ${permissionsCount}`, updated.permissions);
      expect(permissionsCount).toBe(3);

      // Cleanup
      await cleanupRole(created.id!);
    });
  });
});
