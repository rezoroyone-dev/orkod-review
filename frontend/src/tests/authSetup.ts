import { beforeAll, afterAll } from 'vitest';
import SuperUserService from '@/services/SuperUserService';
import SuperUser from '@/interfaces/SuperUser';

// Global test authentication state
let authenticatedUser: SuperUser | null = null;

/**
 * Authenticate once before all tests and store the token
 */
export async function setupTestAuth() {
  if (authenticatedUser) {
    return authenticatedUser;
  }

  try {
    // Use real credentials from the test
    const adminCreds: SuperUser = { userName: 'admin', passWord: 'R8g9f6T@21/N' };
    
    console.log('Setting up test authentication...');
    authenticatedUser = await SuperUserService.authenticate(
      adminCreds.userName, 
      adminCreds.passWord
    );
    
    // Store in localStorage for the test HTTP adapter to pick up
    if (authenticatedUser?.token) {
      localStorage.setItem('superUser', JSON.stringify(authenticatedUser));
      console.log('Test authentication successful, token stored');
    }
    
    return authenticatedUser;
  } catch (error) {
    console.warn('Test authentication failed, tests may fail with 401 errors:', error);
    throw error;
  }
}

/**
 * Clear authentication state after tests
 */
export function clearTestAuth() {
  authenticatedUser = null;
  localStorage.removeItem('superUser');
}

// Setup authentication before all tests
beforeAll(async () => {
  try {
    await setupTestAuth();
  } catch (error) {
    console.warn('Failed to setup test authentication:', error);
  }
}, 30000); // 30 second timeout for authentication

// Clear authentication after all tests
afterAll(() => {
  clearTestAuth();
});
