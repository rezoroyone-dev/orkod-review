/**
 * Test for many-to-many duplication issues in Schedule CRUD operations
 * Issue: CRUD operations in schedule creation and update may create extra associations
 * 
 * This test verifies that when creating/updating a schedule with N healers/attendees,
 * the backend returns exactly N associations (not more)
 */
import AppConfigs from '@/AppConfigs';
import Person from '@/interfaces/Person';
import Schedule from '@/interfaces/Schedule';
import SuperUser from '@/interfaces/SuperUser';
import AuthenticationService from '@/services/AuthenticationService';
import HealerService from '@/services/HealerService';
import SchedulerService from '@/services/SchedulerService';
import UserService from '@/services/UserService';
import { useUserStore } from '@/stores/user';
import axios from 'axios';
import { addDays, addHours, format, startOfHour } from 'date-fns';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

const fmtISO = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ssxxx");

describe('Schedule Many-to-Many Duplication Issue', () => {
  let adminUser: SuperUser;

  beforeAll(async () => {
    adminUser = await getAdminUser();
  }, 30_000);

  beforeEach(() => {
    setActivePinia(createPinia());
    if (adminUser) {
      const userStore = useUserStore();
      userStore.setUser(adminUser);
    }
    process.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9091';
  });

  // Helper: create a test person directly via API
  async function createTestPerson(firstName: string, lastName: string): Promise<Person> {
    const config = AuthenticationService.getAxiosConfig(adminUser);
    const url = AppConfigs.getServerURL() + "/people";
    const response = await axios.post(url, {
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.com`,
      phone: '+1234567890',
      isStaff: false,
      isActive: true
    }, config);
    return response.data;
  }

  // Helper: get or create test people for attendees
  async function getOrCreateTestPeople(count: number): Promise<Person[]> {
    // Try to get existing people first by searching for common names
    const existingPeople = await UserService.findUsers('a');
    if (Array.isArray(existingPeople) && existingPeople.length >= count) {
      return existingPeople.slice(0, count);
    }
    
    // Create test people if not enough exist
    const people: Person[] = (existingPeople || []) as Person[];
    const timestamp = Date.now();
    
    while (people.length < count) {
      const index = people.length;
      try {
        const newPerson = await createTestPerson(
          `TestPerson${timestamp}_${index}`,
          `Attendee${timestamp}`
        );
        people.push(newPerson);
      } catch (e) {
        console.warn('Failed to create test person:', e);
        break;
      }
    }
    
    return people.slice(0, count);
  }

  // Helper: get real healers from the backend
  async function getRealHealers(count: number) {
    const healers = await HealerService.getAllHealers();
    if (!Array.isArray(healers) || healers.length === 0) throw new Error('No healers found in backend');
    return healers.slice(0, count);
  }

  // Helper: create a basic schedule for testing
  async function createBasicSchedule(title: string, startOffsetDays: number = 1): Promise<Schedule> {
    const healers = await getRealHealers(1);
    const attendees = await getOrCreateTestPeople(1);
    
    const startTime = fmtISO(startOfHour(addDays(new Date(), startOffsetDays)));
    const endTime = fmtISO(addHours(startOfHour(addDays(new Date(), startOffsetDays)), 1));

    return {
      id: undefined,
      title,
      start: startTime,
      end: endTime,
      isLocal: false,
      healers: healers,
      attendees: attendees,
      calendarID: "1",
      bgColor: 'blue',
      color: 'white',
      isAllDay: false,
      sicknessNatures: [],
      location: '',
      meditations: [],
      centerID: undefined,
      center: undefined
    };
  }

  describe('CreateSchedule - Healer Duplication', () => {
    it('should return exactly the same number of healers as sent when creating a schedule with 1 healer', async () => {
      const healers = await getRealHealers(1);
      const attendees = await getOrCreateTestPeople(1);
      
      const startTime = fmtISO(startOfHour(addDays(new Date(), 1)));
      const endTime = fmtISO(addHours(startOfHour(addDays(new Date(), 1)), 1));

      const newSchedule: Schedule = {
        id: undefined,
        title: 'Schedule 1 Healer Test',
        start: startTime,
        end: endTime,
        isLocal: false,
        healers: healers,
        attendees: attendees,
        calendarID: "1",
        bgColor: 'blue',
        color: 'white',
        sicknessNatures: [],
        location: '',
        meditations: [],
        centerID: undefined,
        center: undefined,
        isAllDay: false
      };

      const result = await SchedulerService.createSchedule(newSchedule);
      
      const healersCount = result.healers?.length ?? 0;
      console.log(`Create with 1 healer: Expected 1, got ${healersCount}`, result.healers);
      expect(healersCount).toBe(1);

      // Cleanup
      await SchedulerService.deleteSchedule(result.id!);
    });

    it('should return exactly the same number of healers as sent when creating a schedule with 2 healers', async () => {
      const healers = await getRealHealers(2);
      const attendees = await getOrCreateTestPeople(1);
      
      const startTime = fmtISO(startOfHour(addDays(new Date(), 1)));
      const endTime = fmtISO(addHours(startOfHour(addDays(new Date(), 1)), 1));

      const newSchedule: Schedule = {
        id: undefined,
        title: 'Schedule 2 Healers Test',
        start: startTime,
        end: endTime,
        isLocal: false,
        healers: healers,
        attendees: attendees,
        calendarID: "1",
        bgColor: 'green',
        color: 'white',
        sicknessNatures: [],
        location: '',
        meditations: [],
        centerID: undefined,
        center: undefined,
        isAllDay: false
      };

      const result = await SchedulerService.createSchedule(newSchedule);
      
      const healersCount = result.healers?.length ?? 0;
      console.log(`Create with 2 healers: Expected 2, got ${healersCount}`, result.healers);
      expect(healersCount).toBe(2);

      // Cleanup
      await SchedulerService.deleteSchedule(result.id!);
    });

    it('should return exactly the same number of healers as sent when creating a schedule with 3 healers', async () => {
      const healers = await getRealHealers(3);
      const attendees = await getOrCreateTestPeople(1);
      
      const startTime = fmtISO(startOfHour(addDays(new Date(), 1)));
      const endTime = fmtISO(addHours(startOfHour(addDays(new Date(), 1)), 1));

      const newSchedule: Schedule = {
        id: undefined,
        title: 'Schedule 3 Healers Test',
        start: startTime,
        end: endTime,
        isLocal: false,
        healers: healers,
        attendees: attendees,
        calendarID: "1",
        bgColor: 'orange',
        color: 'white',
        sicknessNatures: [],
        location: '',
        meditations: [],
        centerID: undefined,
        center: undefined,
        isAllDay: false
      };

      const result = await SchedulerService.createSchedule(newSchedule);
      
      const healersCount = result.healers?.length ?? 0;
      console.log(`Create with 3 healers: Expected 3, got ${healersCount}`, result.healers);
      expect(healersCount).toBe(3);

      // Cleanup
      await SchedulerService.deleteSchedule(result.id!);
    });
  });

  describe('UpdateSchedule - Healer Duplication', () => {
    it('should return exactly the same number of healers after updating a schedule from 2 to 1 healer', async () => {
      const healers = await getRealHealers(2);
      
      // First create a schedule with 2 healers
      const created = await createBasicSchedule('Update Healer Test - Initial', 2);
      created.healers = healers;
      
      const result = await SchedulerService.createSchedule(created);
      
      // Verify initial creation has 2 healers
      const initialHealersCount = result.healers?.length ?? 0;
      console.log(`Initial healers count: ${initialHealersCount}`);
      expect(initialHealersCount).toBe(2);

      // Now update to have only 1 healer
      const updated = await SchedulerService.updateSchedule({
        ...result,
        healers: [healers[0]], // Only 1 healer
      });

      const updatedHealersCount = updated.healers?.length ?? 0;
      console.log(`Update 2->1 healers: Expected 1, got ${updatedHealersCount}`, updated.healers);
      expect(updatedHealersCount).toBe(1);

      // Cleanup
      await SchedulerService.deleteSchedule(result.id!);
    });

    it('should return exactly the same number of healers after updating a schedule from 1 to 3 healers', async () => {
      const healers = await getRealHealers(3);
      
      // First create a schedule with 1 healer
      const created = await createBasicSchedule('Update Healer Test - Expand', 3);
      created.healers = [healers[0]];
      
      const result = await SchedulerService.createSchedule(created);
      
      // Now update to have 3 healers
      const updated = await SchedulerService.updateSchedule({
        ...result,
        healers: healers, // 3 healers
      });

      const updatedHealersCount = updated.healers?.length ?? 0;
      console.log(`Update 1->3 healers: Expected 3, got ${updatedHealersCount}`, updated.healers);
      expect(updatedHealersCount).toBe(3);

      // Cleanup
      await SchedulerService.deleteSchedule(result.id!);
    });

    it('should not accumulate healers after multiple update cycles', async () => {
      const healers = await getRealHealers(3);
      
      // Create schedule with 1 healer
      const created = await createBasicSchedule('Healer Accumulation Test', 4);
      created.healers = [healers[0]];
      
      const result = await SchedulerService.createSchedule(created);
      
      // First update: add 2nd healer
      let updated = await SchedulerService.updateSchedule({
        ...result,
        healers: [healers[0], healers[1]],
      });
      let healersCount = updated.healers?.length ?? 0;
      console.log(`After 1st update: Expected 2, got ${healersCount}`);
      expect(healersCount).toBe(2);

      // Second update: add 3rd healer
      updated = await SchedulerService.updateSchedule({
        ...updated,
        healers: [healers[0], healers[1], healers[2]],
      });
      healersCount = updated.healers?.length ?? 0;
      console.log(`After 2nd update: Expected 3, got ${healersCount}`);
      expect(healersCount).toBe(3);

      // Third update: keep same 3 healers (no change to healers, just title)
      updated = await SchedulerService.updateSchedule({
        ...updated,
        title: 'Final update - no healer change',
      });
      healersCount = updated.healers?.length ?? 0;
      console.log(`After 3rd update (no change): Expected 3, got ${healersCount}`, updated.healers);
      expect(healersCount).toBe(3);

      // Cleanup
      await SchedulerService.deleteSchedule(result.id!);
    });
  });

  describe('UpdateSchedule - Attendee Duplication', () => {
    it('should return exactly the same number of attendees after updating from 2 to 1 attendee', async () => {
      const healers = await getRealHealers(1);
      const attendees = await getOrCreateTestPeople(2);
      
      // First create a schedule with 2 attendees
      const created = await createBasicSchedule('Update Attendee Test - Reduce', 5);
      created.healers = healers;
      created.attendees = attendees;
      
      const result = await SchedulerService.createSchedule(created);
      
      // Verify initial creation has 2 attendees
      const initialAttendeesCount = result.attendees?.length ?? 0;
      console.log(`Initial attendees count: ${initialAttendeesCount}`);
      expect(initialAttendeesCount).toBe(2);

      // Now update to have only 1 attendee
      const updated = await SchedulerService.updateSchedule({
        ...result,
        attendees: [attendees[0]], // Only 1 attendee
      });

      const updatedAttendeesCount = updated.attendees?.length ?? 0;
      console.log(`Update 2->1 attendees: Expected 1, got ${updatedAttendeesCount}`, updated.attendees);
      expect(updatedAttendeesCount).toBe(1);

      // Cleanup
      await SchedulerService.deleteSchedule(result.id!);
    });

    it('should return exactly the same number of attendees after updating from 1 to 3 attendees', async () => {
      const healers = await getRealHealers(1);
      const attendees = await getOrCreateTestPeople(3);
      
      // First create a schedule with 1 attendee
      const created = await createBasicSchedule('Update Attendee Test - Expand', 6);
      created.healers = healers;
      created.attendees = [attendees[0]];
      
      const result = await SchedulerService.createSchedule(created);
      
      // Now update to have 3 attendees
      const updated = await SchedulerService.updateSchedule({
        ...result,
        attendees: attendees, // 3 attendees
      });

      const updatedAttendeesCount = updated.attendees?.length ?? 0;
      console.log(`Update 1->3 attendees: Expected 3, got ${updatedAttendeesCount}`, updated.attendees);
      expect(updatedAttendeesCount).toBe(3);

      // Cleanup
      await SchedulerService.deleteSchedule(result.id!);
    });
  });
});
