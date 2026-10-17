import SuperUser from '@/interfaces/SuperUser';
import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';

export const useUserStore = defineStore('user', () => {
  const superUser = ref<SuperUser | undefined>(loadUserFromStorage());

  // Computed property to extract all permissions from user's roles
  const permissions = computed((): string[] => {
    if (!superUser.value?.roles) return [];
    
    // If user has admin role, they have all permissions
    if (superUser.value.roles.some(r => r.name === 'admin')) {
      return ['admin']; // Special case - admin has all permissions
    }
    
    // Collect all unique permission names from all roles
    const permSet = new Set<string>();
    superUser.value.roles.forEach(role => {
      role.permissions?.forEach(p => permSet.add(p.name));
    });
    return Array.from(permSet);
  });

  // Check if user has a specific permission
  function hasPermission(permission: string): boolean {
    if (!superUser.value) return false;
    
    // Admin has all permissions
    if (superUser.value.roles?.some(r => r.name === 'admin')) return true;
    
    // Check if user has the specific permission
    return permissions.value.includes(permission);
  }

  // Check if user has any of the specified permissions
  function hasAnyPermission(perms: string[]): boolean {
    if (!superUser.value) return false;
    
    // Admin has all permissions
    if (superUser.value.roles?.some(r => r.name === 'admin')) return true;
    
    return perms.some(p => permissions.value.includes(p));
  }

  // Check if user has all of the specified permissions
  function hasAllPermissions(perms: string[]): boolean {
    if (!superUser.value) return false;
    
    // Admin has all permissions
    if (superUser.value.roles?.some(r => r.name === 'admin')) return true;
    
    return perms.every(p => permissions.value.includes(p));
  }

  // Check if user has a specific role
  function hasRole(roleName: string): boolean {
    if (!superUser.value?.roles) return false;
    return superUser.value.roles.some(r => r.name === roleName);
  }

  // Check if user is authenticated
  const isAuthenticated = computed(() => {
    return superUser.value && superUser.value.id !== undefined && superUser.value.id !== -1;
  });

  function setUser(user: SuperUser) {
    // Strip password before storing — only the JWT token is persisted
    const safeUser: SuperUser = { ...user, passWord: undefined };
    superUser.value = safeUser;
    saveUserToStorage(safeUser);
  }

  function clearUser() {
    superUser.value = undefined;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('superUser');
    }
  }

  function loadUserFromStorage(): SuperUser | undefined {
    if (typeof localStorage === 'undefined') return undefined;
    const stored = localStorage.getItem('superUser');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('superUser');
      }
    }
    return undefined;
  }

  function saveUserToStorage(user: SuperUser) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('superUser', JSON.stringify(user));
    }
  }

  // Watch for changes and save automatically
  watch(superUser, (newUser) => {
    if (newUser) {
      saveUserToStorage(newUser);
    } else {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('superUser');
      }
    }
  }, { deep: true });

  return { 
    superUser, 
    permissions,
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    setUser, 
    clearUser 
  };
});
