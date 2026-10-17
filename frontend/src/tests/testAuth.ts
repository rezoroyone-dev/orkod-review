/**
 * Shared authentication helper for integration tests.
 *
 * Problem: bun runs test files in parallel (each in its own process).
 * Each file's beforeAll calls SuperUserService.authenticate() simultaneously,
 * which triggers the rate limiter on /authenticate (HTTP 429).
 *
 * Solution: This module wraps authenticate() with retry + exponential backoff.
 * Import getAdminUser() in every test file instead of calling authenticate() directly.
 *
 * Note: Use `beforeAll(async () => { ... }, 30_000)` in test files to allow
 * enough time for retries when the rate limiter is hit.
 */
import SuperUser from '@/interfaces/SuperUser';
import SuperUserService from '@/services/SuperUserService';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'R8g9f6T@21/N';
const MAX_RETRIES = 10;
const BASE_DELAY_MS = 2000; // 2s base, doubles each retry: 2, 4, 8, 16, 32, 64s

/**
 * Authenticate as admin with retry logic to handle HTTP 429 rate limiting.
 * Each test file process calls this independently; retries handle the burst.
 * Skips gracefully if backend is not available (network error).
 */
export async function getAdminUser(): Promise<SuperUser | undefined> {
  // Use environment variable if available, fallback to localhost
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  process.env.VITE_API_URL = apiUrl;

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const user = await SuperUserService.authenticate(ADMIN_USERNAME, ADMIN_PASSWORD);
      return user;
    } catch (err: any) {
      lastError = err;

      // Check for network errors (backend unavailable)
      const isNetworkError = err?.code === 'ERR_NETWORK' || 
                           String(err?.message ?? '').includes('Network Error');
      
      if (isNetworkError) {
        console.log('[testAuth] Network error - backend unavailable. Returning null.');
        return null;
      }

      // Check for 429 Too Many Requests
      const status = err?.response?.status ?? err?.status;
      const isRateLimit = status === 429 || String(err?.message ?? '').includes('429');

      if (isRateLimit && attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt); // 0.5s, 1s, 2s, 4s, 8s, 16s
        console.warn(`[testAuth] Rate limited (429). Retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }

      // Non-rate-limit error or exhausted retries — rethrow
      throw err;
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
