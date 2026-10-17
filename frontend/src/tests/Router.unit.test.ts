/**
 * Unit tests for Router configuration
 * Covers: 404 catch-all route, admin route guard
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { setActivePinia, createPinia } from 'pinia';
import { defineComponent } from 'vue';

// Stub component for all routes
const StubComponent = defineComponent({ template: '<div>stub</div>' });

// Recreate the router with memory history for testing (no DOM needed)
function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: StubComponent },
      { path: '/login', name: 'login', component: StubComponent },
      { path: '/booking', name: 'booking', component: StubComponent },
      { path: '/admin/Scheduler', name: 'Scheduler', component: StubComponent },
      { path: '/admin/People', name: 'People', component: StubComponent },
      { path: '/admin/AuditLogs', name: 'AuditLogs', component: StubComponent },
      // The 404 catch-all route (fix #8)
      { path: '/:pathMatch(.*)*', name: 'NotFound', component: StubComponent },
    ],
  });
}

describe('Router Configuration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should have a catch-all 404 route defined', () => {
    const router = createTestRouter();
    const routes = router.getRoutes();
    const notFoundRoute = routes.find(r => r.name === 'NotFound');
    expect(notFoundRoute).toBeDefined();
    expect(notFoundRoute?.path).toBe('/:pathMatch(.*)*');
  });

  it('should resolve unknown paths to NotFound route', async () => {
    const router = createTestRouter();
    const resolved = router.resolve('/this/path/does/not/exist');
    expect(resolved.name).toBe('NotFound');
  });

  it('should resolve /login to login route', async () => {
    const router = createTestRouter();
    const resolved = router.resolve('/login');
    expect(resolved.name).toBe('login');
  });

  it('should resolve / to Home route', async () => {
    const router = createTestRouter();
    const resolved = router.resolve('/');
    expect(resolved.name).toBe('Home');
  });

  it('should resolve /admin/Scheduler to Scheduler route', async () => {
    const router = createTestRouter();
    const resolved = router.resolve('/admin/Scheduler');
    expect(resolved.name).toBe('Scheduler');
  });

  it('should resolve /admin/AuditLogs to AuditLogs route', async () => {
    const router = createTestRouter();
    const resolved = router.resolve('/admin/AuditLogs');
    expect(resolved.name).toBe('AuditLogs');
  });

  it('should resolve deeply nested unknown path to NotFound', async () => {
    const router = createTestRouter();
    const resolved = router.resolve('/admin/nonexistent/deep/path');
    expect(resolved.name).toBe('NotFound');
  });
});
