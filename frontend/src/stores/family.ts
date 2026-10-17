import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export type FamilyRelation =
  | 'self'
  | 'partner'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'grandparent'
  | 'other';

export type FamilyAgeGroup = 'child' | 'teen' | 'adult' | 'senior';

export interface FamilyMember {
  id: string;
  name: string;
  relation: FamilyRelation;
  ageGroup: FamilyAgeGroup;
}

const STORAGE_KEY = 'familyCircle';

interface FamilyState {
  members: FamilyMember[];
  activeMemberId: string | null;
}

function loadState(): FamilyState {
  if (typeof localStorage === 'undefined') {
    return { members: [], activeMemberId: null };
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as FamilyState;
    } catch (e) {
      console.error('Failed to parse family circle', e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return { members: [], activeMemberId: null };
}

export const useFamilyStore = defineStore('family', () => {
  const state = ref<FamilyState>(loadState());

  const members = computed(() => state.value.members);

  const activeMember = computed<FamilyMember | undefined>(() =>
    state.value.members.find((m) => m.id === state.value.activeMemberId)
  );

  function persist() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value));
    }
  }

  function addMember(member: Omit<FamilyMember, 'id'>): FamilyMember {
    const created: FamilyMember = {
      ...member,
      id: `member-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    };
    state.value.members.push(created);
    if (state.value.activeMemberId === null) {
      state.value.activeMemberId = created.id;
    }
    persist();
    return created;
  }

  function removeMember(id: string) {
    state.value.members = state.value.members.filter((m) => m.id !== id);
    if (state.value.activeMemberId === id) {
      state.value.activeMemberId = state.value.members[0]?.id ?? null;
    }
    persist();
  }

  function selectMember(id: string) {
    if (state.value.members.some((m) => m.id === id)) {
      state.value.activeMemberId = id;
      persist();
    }
  }

  function clearCircle() {
    state.value = { members: [], activeMemberId: null };
    persist();
  }

  return {
    members,
    activeMember,
    addMember,
    removeMember,
    selectMember,
    clearCircle,
  };
});