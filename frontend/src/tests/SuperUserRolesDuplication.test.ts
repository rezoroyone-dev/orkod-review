/**
 * Test for many-to-many duplication issues in SuperUser Roles CRUD operations
 * Issue: CRUD operations in user creation and update may create extra role associations
 * 
 * This test verifies that when creating/updating a user with N roles,
 * the backend returns exactly N roles (not more)
 */
import SuperUser from '@/interfaces/SuperUser';
import RoleService, { Role } from '@/services/RoleService';
import SuperUserService from '@/services/SuperUserService';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

describe('SuperUser Roles Duplication Issue', () => {
  let adminUser: SuperUser;

  beforeAll(async () => {
    adminUser = await getAdminUser();
  }, 30_000);

  beforeEach(() => {
    setActivePinia(createPinia());
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  // Helper: get all available roles
  async function getAllRoles(): Promise<Role[]> {
    return await RoleService.getRoles();
  }

  // Helper: clean up a test user
  async function cleanupUser(userId: number): Promise<void> {
    try {
      await SuperUserService.deleteUser(userId);
    } catch (e) {
      console.warn('Failed to cleanup user:', e);
    }
  }

  describe('CreateUser - Role Duplication', () => {
    it('should return exactly the same number of roles as sent when creating a user with 1 role', async () => {
      const roles = await getAllRoles();
      if (roles.length < 1) {
        console.warn('Skipping test - no roles available');
        return;
      }

      const timestamp = Date.now();
      const uniqueName = `TestUser_1_Role_${timestamp}`;
      const newUser: SuperUser = {
        userName: uniqueName,
        passWord: 'TestPassword123!',
        firstName: `Test${timestamp}`,
        lastName: `User${timestamp}`,
        roleIDs: [roles[0].id!]
      };

      let result;
      try {
        result = await SuperUserService.createUser(newUser);
      } catch (e: any) {
        console.error('Create user failed:', e.message, e.response?.data);
        throw e;
      }
      
      const rolesCount = result.roles?.length ?? 0;
      console.log(`Create with 1 role: Expected 1, got ${rolesCount}`, result.roles);
      expect(rolesCount).toBe(1);

      // Cleanup
      await cleanupUser(result.id!);
    });

    it('should return exactly the same number of roles as sent when creating a user with 2 roles', async () => {
      const roles = await getAllRoles();
      if (roles.length < 2) {
        console.warn('Skipping test - not enough roles available');
        return;
      }

      const timestamp = Date.now();
      const uniqueName = `TestUser_2_Roles_${timestamp}`;
      const newUser: SuperUser = {
        userName: uniqueName,
        passWord: 'TestPassword123!',
        firstName: `Test${timestamp}`,
        lastName: `User${timestamp}`,
        roleIDs: [roles[0].id!, roles[1].id!]
      };

      const result = await SuperUserService.createUser(newUser);
      
      const rolesCount = result.roles?.length ?? 0;
      console.log(`Create with 2 roles: Expected 2, got ${rolesCount}`, result.roles);
      expect(rolesCount).toBe(2);

      // Cleanup
      await cleanupUser(result.id!);
    });

    it('should return exactly the same number of roles as sent when creating a user with 3 roles', async () => {
      const roles = await getAllRoles();
      if (roles.length < 3) {
        console.warn('Skipping test - not enough roles available');
        return;
      }

      const timestamp = Date.now();
      const uniqueName = `TestUser_3_Roles_${timestamp}`;
      const newUser: SuperUser = {
        userName: uniqueName,
        passWord: 'TestPassword123!',
        firstName: `Test${timestamp}`,
        lastName: `User${timestamp}`,
        roleIDs: [roles[0].id!, roles[1].id!, roles[2].id!]
      };

      const result = await SuperUserService.createUser(newUser);
      
      const rolesCount = result.roles?.length ?? 0;
      console.log(`Create with 3 roles: Expected 3, got ${rolesCount}`, result.roles);
      expect(rolesCount).toBe(3);

      // Cleanup
      await cleanupUser(result.id!);
    });
  });

  describe('UpdateUser - Role Duplication', () => {
    it('should return exactly the same number of roles after updating a user from 2 to 1 role', async () => {
      const roles = await getAllRoles();
      if (roles.length < 2) {
        console.warn('Skipping test - not enough roles available');
        return;
      }

      // First create a user with 2 roles
      const timestamp = Date.now();
      const created = await SuperUserService.createUser({
        userName: `TestUser_Update_${timestamp}`,
        passWord: 'TestPassword123!',
        firstName: `Test${timestamp}`,
        lastName: `User${timestamp}`,
        roleIDs: [roles[0].id!, roles[1].id!]
      });
      
      // Verify initial creation has 2 roles
      const initialRolesCount = created.roles?.length ?? 0;
      console.log(`Initial roles count: ${initialRolesCount}`);
      expect(initialRolesCount).toBe(2);

      // Now update to have only 1 role
      await SuperUserService.updateSuperUser({
        ...created,
        roleIDs: [roles[0].id!]
      });

      // Need to fetch the user again to get roles
      const updated = await SuperUserService.getUser(created.id!);
      const updatedRolesCount = updated.roles?.length ?? 0;
      console.log(`Update 2->1 roles: Expected 1, got ${updatedRolesCount}`, updated.roles);
      expect(updatedRolesCount).toBe(1);

      // Cleanup
      await cleanupUser(created.id!);
    });

    it('should return exactly the same number of roles after updating a user from 1 to 3 roles', async () => {
      const roles = await getAllRoles();
      if (roles.length < 3) {
        console.warn('Skipping test - not enough roles available');
        return;
      }

      // First create a user with 1 role
      const timestamp = Date.now();
      const created = await SuperUserService.createUser({
        userName: `TestUser_Expand_${timestamp}`,
        passWord: 'TestPassword123!',
        firstName: `Test${timestamp}`,
        lastName: `User${timestamp}`,
        roleIDs: [roles[0].id!]
      });
      
      // Now update to have 3 roles
      await SuperUserService.updateSuperUser({
        ...created,
        roleIDs: [roles[0].id!, roles[1].id!, roles[2].id!]
      });

      // Need to fetch the user again to get roles
      const updated = await SuperUserService.getUser(created.id!);
      const updatedRolesCount = updated.roles?.length ?? 0;
      console.log(`Update 1->3 roles: Expected 3, got ${updatedRolesCount}`, updated.roles);
      expect(updatedRolesCount).toBe(3);

      // Cleanup
      await cleanupUser(created.id!);
    });

    it('should not accumulate roles after multiple update cycles', async () => {
      const roles = await getAllRoles();
      if (roles.length < 3) {
        console.warn('Skipping test - not enough roles available');
        return;
      }

      // Create user with 1 role
      const timestamp = Date.now();
      const created = await SuperUserService.createUser({
        userName: `TestUser_Accumulate_${timestamp}`,
        passWord: 'TestPassword123!',
        firstName: `Test${timestamp}`,
        lastName: `User${timestamp}`,
        roleIDs: [roles[0].id!]
      });
      
      // First update: add 2nd role
      await SuperUserService.updateSuperUser({
        ...created,
        roleIDs: [roles[0].id!, roles[1].id!]
      });
      let updated = await SuperUserService.getUser(created.id!);
      let rolesCount = updated.roles?.length ?? 0;
      console.log(`After 1st update: Expected 2, got ${rolesCount}`);
      expect(rolesCount).toBe(2);

      // Second update: add 3rd role
      await SuperUserService.updateSuperUser({
        ...updated,
        roleIDs: [roles[0].id!, roles[1].id!, roles[2].id!]
      });
      updated = await SuperUserService.getUser(created.id!);
      rolesCount = updated.roles?.length ?? 0;
      console.log(`After 2nd update: Expected 3, got ${rolesCount}`);
      expect(rolesCount).toBe(3);

      // Third update: keep same 3 roles (no change to roles, just update userName)
      await SuperUserService.updateSuperUser({
        ...updated,
        firstName: 'Updated'
      });
      updated = await SuperUserService.getUser(created.id!);
      rolesCount = updated.roles?.length ?? 0;
      console.log(`After 3rd update (no change): Expected 3, got ${rolesCount}`, updated.roles);
      expect(rolesCount).toBe(3);

      // Cleanup
      await cleanupUser(created.id!);
    });
  });
});
