import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import LogIn from "@/components/LogIn.vue";
import { useUserStore } from '@/stores/user';

// Route permission requirements map (admin area only)
const routePermissions: Record<string, string | string[] | undefined> = {
  'Dashboard': undefined,           // Any authenticated user
  'Profile': undefined,             // Any authenticated user
  'Scheduler': 'manage_schedules',  // Requires manage_schedules permission
  'People': undefined,              // Any authenticated user (view people)
  'bill': 'manage_schedules',       // Requires manage_schedules permission
  'healers': 'manage_healers',      // Requires manage_healers permission
  'sms': undefined,                 // Any authenticated user
  'license': undefined,             // Any authenticated user
  'ToolBar': undefined,             // Any authenticated user
  'report': 'view_reports',         // Requires view_reports permission
  'Meditations': 'manage_meditations', // Requires manage_meditations permission
  'Center': 'manage_centers',       // Requires manage_centers permission
  'ToolBox': undefined,             // Any authenticated user
  'Help': undefined,                // Any authenticated user
  'Roles': 'manage_roles',          // Requires manage_roles permission
  'Users': 'manage_users',          // Requires manage_users permission
  'Availability': 'set_availability', // Requires set_availability permission
  'Inbox': 'manage_inbox',          // Requires manage_inbox permission
  'AuditLogs': 'view_audit_logs',   // Requires view_audit_logs permission
};

/**
 * Chrome meta controls which shell wraps a route in App.vue:
 *   'none'   — bare (language gate, login, 404)
 *   'public' — PublicHeader + PublicFooter
 *   'admin'  — admin toolbar + drawer
 * `stage: true` tells the public header it is sitting on the full-bleed
 * black 3D body stage.
 */
const routes: Array<RouteRecordRaw> = [
  // ── Public site ────────────────────────────────────────────────────────────
  {
    path: '/',
    name: 'LanguageGate',
    component: () => import('@/views/LanguageGate.vue'),
    meta: { chrome: 'none' },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/body',
    name: 'BodyExplorer',
    component: () => import('@/views/public/BodyExplorer3D.vue'),
    meta: { chrome: 'public', stage: true },
  },
  {
    path: '/organs/:region',
    name: 'OrganInfo',
    component: () => import('@/views/public/OrganInfoPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/symptoms',
    name: 'Symptoms',
    component: () => import('@/views/public/SymptomsPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/symptoms/:slug',
    name: 'SymptomDetail',
    component: () => import('@/views/public/SymptomDetailPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/quiz',
    name: 'Quiz',
    component: () => import('@/views/public/QuizPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/practitioners',
    name: 'practitioners',
    component: () => import('@/views/public/PractitionersPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/practitioners/:id',
    name: 'PractitionerDetail',
    component: () => import('@/views/public/PractitionerDetailPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/doctors',
    name: 'Doctors',
    component: () => import('@/views/public/DoctorsPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/doctors/:id',
    name: 'DoctorDetail',
    component: () => import('@/views/public/DoctorDetailPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/academy',
    name: 'Academy',
    component: () => import('@/views/public/AcademyPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/academy/:slug',
    name: 'AcademyCourse',
    component: () => import('@/views/public/AcademyCoursePage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('@/views/public/CommunityPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/consultations',
    name: 'Consultations',
    component: () => import('@/views/public/ConsultationsPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/assistant',
    name: 'Assistant',
    component: () => import('@/views/public/AssistantPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/donations',
    name: 'Donations',
    component: () => import('@/views/public/DonationsPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/family',
    name: 'Family',
    component: () => import('@/views/public/FamilyPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/book',
    name: 'BookShop',
    component: () => import('@/views/public/BookShopPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/booking',
    name: 'Booking',
    component: () => import('@/views/public/BookingLandingPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/specialty/:slug',
    name: 'SpecialtyBooking',
    component: () => import('@/views/public/SpecialtyBookingPage.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/contact',
    name: 'ContactUs',
    component: () => import('@/views/ContactUs.vue'),
    meta: { chrome: 'public' },
  },
  {
    path: '/login',
    name: 'login',
    component: LogIn,
    meta: { chrome: 'none' },
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  {
    path: '/admin/Dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/Profile',
    name: 'Profile',
    component: () => import('@/components/Profile.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/Scheduler',
    name: 'Scheduler',
    component: () => import('@/components/scheduler/Scheduler.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/People',
    name: 'People',
    component: () => import('@/components/people/People.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/bill',
    name: 'bill',
    component: () => import('@/components/Bill.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/healers',
    name: 'healers',
    component: () => import('@/components/healers/Healers.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/sms',
    name: 'sms',
    component: () => import('@/components/Sms.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/license',
    name: 'license',
    component: () => import('@/components/License.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/ToolBar',
    name: 'ToolBar',
    component: () => import('@/views/ToolBar.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/report',
    name: 'report',
    component: () => import('@/components/reporting/Report.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/Meditations',
    name: 'Meditations',
    component: () => import('@/components/Meditations.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/Center',
    name: 'Center',
    component: () => import('@/components/Center.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/ToolBox',
    name: 'ToolBox',
    component: () => import('@/components/ToolBox.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/Help',
    name: 'Help',
    component: () => import('@/components/Help.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/Roles',
    name: 'Roles',
    component: () => import('@/components/RoleManagement.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/Users',
    name: 'Users',
    component: () => import('@/components/UserManagement.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/Availability',
    name: 'Availability',
    component: () => import('@/components/healers/HealerAvailability.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/Inbox',
    name: 'Inbox',
    component: () => import('@/components/Inbox.vue'),
    meta: { chrome: 'admin' },
  },
  {
    path: '/admin/AuditLogs',
    name: 'AuditLogs',
    component: () => import('@/components/AuditLogs.vue'),
    meta: { chrome: 'admin' },
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { chrome: 'none' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isAdminRoute = to.path.startsWith('/admin');
  const isAuthenticated = userStore.isAuthenticated;

  // Allow access to login page always
  if (to.path === '/login') {
    next();
    return;
  }

  // Redirect to login if not authenticated for admin routes
  // BUT allow the login page to handle 2FA flow
  if (isAdminRoute && !isAuthenticated) {
    if (from.path === '/login') {
      next();
      return;
    }
    next('/login');
    return;
  }

  // Check route-specific permissions
  const routeName = to.name as string;
  const requiredPermission = routePermissions[routeName];

  if (requiredPermission && isAuthenticated) {
    const hasAccess = Array.isArray(requiredPermission)
      ? userStore.hasAnyPermission(requiredPermission)
      : userStore.hasPermission(requiredPermission);

    if (!hasAccess) {
      console.warn(`Access denied: Missing permission "${requiredPermission}" for route "${routeName}"`);
      next('/admin/Dashboard');
      return;
    }
  }

  next();
});

export default router;
