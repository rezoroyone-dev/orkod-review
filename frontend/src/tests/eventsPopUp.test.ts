import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useEventsPopUpStore } from '@/stores/eventsPopUp';
import Healer from '@/models/Healer';

describe('eventsPopUp Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with all healers available by default', () => {
    const store = useEventsPopUpStore();
    expect(store.isAllHealersAvailable).toBe(true);
    expect(store.healers).toHaveLength(0);
  });

  it('should set healers and disable allHealersAvailable flag', () => {
    const store = useEventsPopUpStore();
    const mockHealers: Healer[] = [
      { id: 1, firstName: 'John', lastName: 'Doe' } as Healer,
      { id: 2, firstName: 'Jane', lastName: 'Smith' } as Healer
    ];
    
    store.setHealers(mockHealers);
    expect(store.healers).toHaveLength(2);
    expect(store.healers[0].firstName).toBe('John');
  });

  it('should clear healers and toggle availability', () => {
    const store = useEventsPopUpStore();
    store.setHealers([{ id: 1 } as Healer]);
    store.setIsAllHealersAvailable(true);
    store.clearHealers();
    
    expect(store.healers).toHaveLength(0);
    expect(store.isAllHealersAvailable).toBe(true);
  });
});
