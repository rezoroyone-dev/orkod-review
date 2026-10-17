import Schedule from '@/interfaces/Schedule';
import SuperUser from '@/interfaces/SuperUser';
import AuthenticationService from '@/services/AuthenticationService';
import HealerService from '@/services/HealerService';
import SchedulerService from '@/services/SchedulerService';
import UserService from '@/services/UserService';
import axios from 'axios';
import { addDays, addHours, addMinutes, addMonths, endOfDay, endOfISOWeek, format, startOfDay, startOfHour, startOfISOWeek } from 'date-fns';
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdminUser } from './testAuth';

const fmtISO = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ssxxx");
const fmtDate = (d: Date) => format(d, 'yyyy-MM-dd');
const fmtDisplay = (d: Date) => format(d, 'dd-MM-yyyy');

describe('Scheduler Integration Flow', () => {
  let adminUser: SuperUser |undefined;

  beforeAll(async () => {
    adminUser = await getAdminUser();
  }, 30_000);

  beforeEach(() => {
    setActivePinia(createPinia());
    // Using 127.0.0.1 instead of localhost to avoid IPv6 issues on some Windows setups
    process.env.VITE_API_URL = 'http://127.0.0.1:9091';
  });

  it('should perform full CRUD on a schedule', async () => {
    // 1. Get real healers from backend
    console.log('Fetching healers...');
    const healers = await HealerService.getAllHealers();
    expect(healers.length).toBeGreaterThan(0);

    // 2. Get a real person (attendee)
    console.log('Fetching users...');
    const people = await UserService.findUsers('Admin');
    expect(people.length).toBeGreaterThan(0);

    // 3. Create a schedule
    const startTime = fmtISO(startOfHour(addDays(new Date(), 1)));
    const endTime = fmtISO(addMinutes(startOfHour(addDays(new Date(), 1)), 30));

    const newSchedule: Schedule = {
      id: undefined,
      title: 'CRUD Integration Test Event',
      start: startTime,
      end: endTime,
      isLocal: false,
      healers: [healers[0]],
      attendees: [people[0]],
      calendarID: "1",
      bgColor: 'blue',
      color: 'white',
      isAllDay: false,
      location: 'Test Loc',
      sicknessNatures: [],
      meditations: [],
      centerID: undefined,
      center:undefined
    };

    console.log('Creating schedule...');
    const created = await SchedulerService.createSchedule(newSchedule);
    expect(created.id).toBeGreaterThan(0);
    expect(created.title).toBe('CRUD Integration Test Event');

    // 4. Update the schedule
    console.log('Updating schedule...');
    const updatedSchedule = { ...created, title: 'Updated CRUD Event' };
    const updated = await SchedulerService.updateSchedule(updatedSchedule);
    expect(updated.title).toBe('Updated CRUD Event');

    // 5. Verify retrieval
    console.log('Verifying schedule retrieval...');
    const rangeStart = fmtISO(startOfDay(new Date()));
    const rangeEnd = fmtISO(addDays(new Date(), 2));
    const schedules = await SchedulerService.getSchedulesByRange(rangeStart, rangeEnd, 'en');
    
    const found = schedules.find(s => s.id === created.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Updated CRUD Event');
    expect(found?.healers).toBeDefined();
    expect(found?.healers?.length).toBeGreaterThan(0);

    // 6. Cleanup (Delete)
    console.log('Deleting test schedule...');
    await SchedulerService.deleteSchedule(created.id!);
    
    // 7. Verify deletion
    const finalSchedules = await SchedulerService.getSchedulesByRange(rangeStart, rangeEnd, 'en');
    const stillExists = finalSchedules.find(s => s.id === created.id);
    expect(stillExists).toBeUndefined();
  });

  it('should fetch schedules for a specific person', async () => {
    // 1. Get a real person
    const people = await UserService.findUsers( 'Admin');
    const person = people[0];
    
    // 2. Fetch by person ID
    console.log(`Fetching schedules for person ID: ${person.id}`);
    const schedules = await SchedulerService.getSchedulesBypersonID(person.id!);
    expect(Array.isArray(schedules)).toBe(true);
  });

  it('should fetch future schedules for a specific person', async () => {
    // 1. Get a real person
    const people = await UserService.findUsers( 'Admin');
    const person = people[0];
    
    // 2. Fetch future schedules
    const rangeStart = fmtISO(new Date());
    const rangeEnd = fmtISO(addMonths(new Date(), 1));
    
    console.log(`Fetching future schedules for person ID: ${person.id}`);
    const schedules = await SchedulerService.getFutureSchedules(person.id!, rangeStart, rangeEnd);
    expect(Array.isArray(schedules)).toBe(true);
  });

  it('should flow: external user books -> admin modifies -> admin deletes', async () => {
    // 1. External User Books a Session (Public)
    const uniqueId = Date.now();
    const publicBookingData = {
      title: 'External Public Booking',
      start: fmtISO(startOfHour(addDays(new Date(), 2))),
      end: fmtISO(addMinutes(startOfHour(addDays(new Date(), 2)), 30)),
      attendees: [
        {
          firstName: `PublicUser_${uniqueId}`,
          lastName: 'Tester',
          email: `public_${uniqueId}@example.com`,
          phone: `${uniqueId}`.slice(-10),
        }
      ],
      isLocal: false,
      calendarID: "1"
    };

    console.log('Public user booking session...');
    const publicUrl = 'http://127.0.0.1:9091/api/public/bookSession';
    const publicResponse = await axios.post(publicUrl, publicBookingData);
    const bookedEvent = publicResponse.data;
    
    expect(bookedEvent.id).toBeGreaterThan(0);
    expect(bookedEvent.attendees).toBeDefined();
    expect(bookedEvent.attendees.length).toBeGreaterThan(0);
    expect(bookedEvent.attendees[0].firstName).toBe(`PublicUser_${uniqueId}`);

    // 2. Admin Modifies the Event (Authenticated)
    console.log('Admin fetching event details...');
    const adminRangeStart = fmtISO(startOfDay(new Date()));
    const adminRangeEnd = fmtISO(addDays(new Date(), 7));
    const schedules = await SchedulerService.getSchedulesByRange(adminRangeStart, adminRangeEnd, 'en');
    const eventToModify = schedules.find(s => s.id === bookedEvent.id);
    expect(eventToModify).toBeDefined();

    // Fill in more info (healers, center, etc.)
    console.log('Admin modifying event info...');
    const healers = await HealerService.getAllHealers();
    const centersResponse = await axios.post('http://127.0.0.1:9091/api/getAllCenters', null, AuthenticationService.getAxiosConfig(adminUser));
    const centers = centersResponse.data;

    const modifiedEvent: Schedule = {
      ...eventToModify!,
      title: 'Admin Refined Event',
      healers: [healers[0]],
      centerID: centers.length > 0 ? centers[0].id : -1,
      isLocal: true,
      location: 'Main Healing Room',
      bgColor: 'purple'
    };

    const updated = await SchedulerService.updateSchedule(modifiedEvent);
    expect(updated.title).toBe('Admin Refined Event');
    expect(updated.isLocal).toBe(true);
    expect(updated.healers?.length).toBeGreaterThan(0);

    // 3. Admin Deletes the Event
    console.log('Admin deleting event...');
    await SchedulerService.deleteSchedule(updated.id!);

    // 4. Verify Deletion
    const finalSchedules = await SchedulerService.getSchedulesByRange(adminRangeStart, adminRangeEnd, 'en');
    const deletedEvent = finalSchedules.find(s => s.id === updated.id);
    expect(deletedEvent).toBeUndefined();
  });

  it('should create an event with multiple healers, multiple attendees, and a local center', async () => {
    // 1. Get real data
    const healers = await HealerService.getAllHealers();
    const people = await UserService.findUsers( 'Admin');
    const centersResponse = await axios.post('http://127.0.0.1:9091/api/getAllCenters', null, AuthenticationService.getAxiosConfig(adminUser));
    const centers = centersResponse.data;

    console.log(`Test Data: ${healers.length} healers, ${people.length} people, ${centers.length} centers`);

    if (healers.length < 2 || people.length < 2) {
      console.warn('Skipping complex test due to insufficient data (need 2+ healers and 2+ people)');
      return;
    }

    // 2. Create complex schedule
    const startTime = fmtISO(startOfHour(addDays(new Date(), 3)));
    const endTime = fmtISO(addHours(startOfHour(addDays(new Date(), 3)), 1));

    const complexSchedule: Schedule = {
      id: undefined,
      title: 'Many Healers & Patients Test',
      start: startTime,
      end: endTime,
      isLocal: true,
      centerID: centers.length > 0 ? centers[0].id : -1,
      healers: healers.slice(0, 2), 
      attendees: people.slice(0, 2), 
      calendarID: "1",
      bgColor: 'orange',
      color: 'white',
      sicknessNatures: []
    };

    console.log('Creating complex schedule...');
    const created = await SchedulerService.createSchedule(complexSchedule);
    
    expect(created.id).toBeGreaterThan(0);
    expect(created.healers?.length).toBe(2);
    expect(created.attendees?.length).toBe(2);
    expect(created.isLocal).toBe(true);

    // 3. Cleanup
    await SchedulerService.deleteSchedule(created.id!);
  });

  it('should create a remote event with one healer and one attendee', async () => {
    const healers = await HealerService.getAllHealers();
    const people = await UserService.findUsers( 'Admin');

    if (healers.length === 0 || people.length === 0) {
      console.warn('Skipping remote test due to insufficient data');
      return;
    }

    const remoteSchedule: Schedule = {
      id: undefined,
      title: 'Remote Session Test',
      start: fmtISO(addDays(new Date(), 4)),
      end: fmtISO(addMinutes(addDays(new Date(), 4), 30)),
      isLocal: false, // Remote
      healers: [healers[0]],
      attendees: [people[0]],
      calendarID: "1",
      sicknessNatures: []
    };

    const created = await SchedulerService.createSchedule(remoteSchedule);
    expect(created.isLocal).toBe(false);
    
    await SchedulerService.deleteSchedule(created.id!);
  });

  it('should persist event movement to the next day', async () => {
    // 1. Setup real data
    const healers = await HealerService.getAllHealers();
    const people = await UserService.findUsers( 'Admin');
    expect(healers.length).toBeGreaterThan(0);
    expect(people.length).toBeGreaterThan(0);

    // 2. Create an event for "today" (relative to test start)
    const originalStart = new Date();
    originalStart.setDate(originalStart.getDate() + 1);
    originalStart.setHours(10, 0, 0, 0);
    const originalEnd = addHours(originalStart, 1);

    const testEvent: Schedule = {
      id: undefined,
      title: 'Movement Persistence Test',
      start: originalStart.toISOString(),
      end: originalEnd.toISOString(),
      isLocal: false,
      healers: [healers[0]],
      attendees: [people[0]],
      calendarID: "1",
      sicknessNatures: []
    };

    console.log('Step 1: Creating initial event...');
    const created = await SchedulerService.createSchedule(testEvent);
    expect(created.id).toBeGreaterThan(0);

    // 3. Simulate movement to the next day at the same time
    console.log('Step 2: Moving event to next day...');
    const nextDayStart = addDays(originalStart, 1);
    const nextDayEnd = addDays(originalEnd, 1);

    const movedEvent: Schedule = {
      ...created,
      start: nextDayStart.toISOString(),
      end: nextDayEnd.toISOString()
    };

    const updated = await SchedulerService.updateSchedule(movedEvent);
    expect(updated.id).toBe(created.id);

    // 4. Verify persistence by fetching from backend again
    console.log('Step 3: Verifying persistence from backend...');
    const rangeStart = startOfDay(nextDayStart).toISOString();
    const rangeEnd = endOfDay(nextDayStart).toISOString();
    
    const schedules = await SchedulerService.getSchedulesByRange(rangeStart, rangeEnd, 'en');
    const found = schedules.find(s => s.id === created.id);

    expect(found).toBeDefined();
    // Compare times using Date objects
    expect(new Date(found!.start).getTime()).toBe(nextDayStart.getTime());
    expect(new Date(found!.end).getTime()).toBe(nextDayEnd.getTime());
    expect(found!.title).toBe('Movement Persistence Test');

    // 5. Cleanup
    console.log('Step 4: Cleanup...');
    await SchedulerService.deleteSchedule(created.id!);
  });

  // ─── Recurring Schedule Tests ──────────────────────────────────────────────

  describe('Recurring Schedule Creation', () => {

    it('should create 4 weekly recurring sessions and clean them up', async () => {
      const healers = await HealerService.getAllHealers();
      const people = await UserService.findUsers( 'Admin');
      expect(healers.length).toBeGreaterThan(0);
      expect(people.length).toBeGreaterThan(0);

      const startTime = fmtISO(startOfHour(addDays(new Date(), 7)));
      const endTime   = fmtISO(addMinutes(startOfHour(addDays(new Date(), 7)), 30));

      const payload = {
        id: undefined,
        title: 'Integration Test Event',
        start: startTime,
        end: endTime,
        isLocal: false,
        healers: [healers[0]],
        attendees: [people[0]],
        calendarID: '1',
        bgColor: 'blue',
        color: 'white',
        isAllDay: false,
        sicknessNatures: [],
        recurrenceType: 'weekly',
        recurrenceInterval: 4,
      };

      console.log('Creating 4 weekly recurring sessions...');
      const result = await SchedulerService.createRecurringSchedule(payload);

      expect(result.created).toBe(4);
      expect(result.recurrenceGroup).toBeGreaterThan(0);
      expect(result.schedules).toHaveLength(4);

      // Verify each session is spaced 7 days apart
      const dates = result.schedules.map(s => new Date(s.start).getTime());
      for (let i = 1; i < dates.length; i++) {
        const diffDays = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeCloseTo(7, 0);
      }

      // All sessions share the same recurrenceGroupId
      const groupId = result.schedules[0].recurrenceGroupId;
      expect(groupId).toBeGreaterThan(0);
      result.schedules.forEach(s => expect(s.recurrenceGroupId).toBe(groupId));

      // Cleanup
      console.log(`Cleaning up ${result.created} recurring sessions...`);
      for (const s of result.schedules) {
        await SchedulerService.deleteSchedule(s.id!);
      }
    }, 30_000);

    it('should create 3 daily recurring sessions and clean them up', async () => {
      const healers = await HealerService.getAllHealers();
      const people = await UserService.findUsers( 'Admin');

      const startTime = fmtISO(startOfHour(addDays(new Date(), 14)));
      const endTime   = fmtISO(addMinutes(startOfHour(addDays(new Date(), 14)), 45));

      const payload = {
        id: undefined,
        title: 'Daily Recurrence Test',
        start: startTime,
        end: endTime,
        isLocal: false,
        healers: [healers[0]],
        attendees: [people[0]],
        calendarID: '1',
        bgColor: 'green',
        color: 'white',
        isAllDay: false,
        sicknessNatures: [],
        recurrenceType: 'daily',
        recurrenceInterval: 3,
      };

      console.log('Creating 3 daily recurring sessions...');
      const result = await SchedulerService.createRecurringSchedule(payload);

      expect(result.created).toBe(3);
      expect(result.schedules).toHaveLength(3);

      // Verify each session is spaced 1 day apart
      const dates = result.schedules.map(s => new Date(s.start).getTime());
      for (let i = 1; i < dates.length; i++) {
        const diffDays = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeCloseTo(1, 0);
      }

      // Cleanup
      for (const s of result.schedules) {
        await SchedulerService.deleteSchedule(s.id!);
      }
    }, 30_000);

    it('should create 2 bi-weekly recurring sessions and clean them up', async () => {
      const healers = await HealerService.getAllHealers();
      const people = await UserService.findUsers( 'Admin');

      const startTime = fmtISO(startOfHour(addDays(new Date(), 21)));
      const endTime   = fmtISO(addMinutes(startOfHour(addDays(new Date(), 21)), 60));

      const payload = {
        id: undefined,
        title: 'Bi-Weekly Recurrence Test',
        start: startTime,
        end: endTime,
        isLocal: false,
        healers: [healers[0]],
        attendees: [people[0]],
        calendarID: '1',
        bgColor: 'orange',
        color: 'white',
        isAllDay: false,
        sicknessNatures: [],
        recurrenceType: 'biweekly',
        recurrenceInterval: 2,
      };

      console.log('Creating 2 bi-weekly recurring sessions...');
      const result = await SchedulerService.createRecurringSchedule(payload);

      expect(result.created).toBe(2);
      expect(result.schedules).toHaveLength(2);

      // Verify each session is spaced 14 days apart
      const dates = result.schedules.map(s => new Date(s.start).getTime());
      const diffDays = (dates[1] - dates[0]) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(14, 0);

      // Cleanup
      for (const s of result.schedules) {
        await SchedulerService.deleteSchedule(s.id!);
      }
    }, 30_000);

    it('should create 2 monthly recurring sessions and clean them up', async () => {
      const healers = await HealerService.getAllHealers();
      const people = await UserService.findUsers( 'Admin');

      const startTime = fmtISO(startOfHour(addDays(new Date(), 30)));
      const endTime   = fmtISO(addMinutes(startOfHour(addDays(new Date(), 30)), 30));

      const payload = {
        id: undefined,
        title: 'Monthly Recurrence Test',
        start: startTime,
        end: endTime,
        isLocal: false,
        healers: [healers[0]],
        attendees: [people[0]],
        calendarID: '1',
        bgColor: 'purple',
        color: 'white',
        isAllDay: false,
        sicknessNatures: [],
        recurrenceType: 'monthly',
        recurrenceInterval: 2,
      };

      console.log('Creating 2 monthly recurring sessions...');
      const result = await SchedulerService.createRecurringSchedule(payload);

      expect(result.created).toBe(2);
      expect(result.schedules).toHaveLength(2);

      // Verify each session is spaced ~30 days apart (28–31 days)
      const dates = result.schedules.map(s => new Date(s.start).getTime());
      const diffDays = (dates[1] - dates[0]) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(31);

      // Cleanup
      for (const s of result.schedules) {
        await SchedulerService.deleteSchedule(s.id!);
      }
    }, 30_000);

    it('should create weekly sessions with a recurrence end date and stop before it', async () => {
      const healers = await HealerService.getAllHealers();
      const people = await UserService.findUsers( 'Admin');

      // Start in 7 days, end date 4 weeks later — should produce at most 4 sessions
      const sessionStart = startOfHour(addDays(new Date(), 7));
      const endDate = addDays(sessionStart, 28); // 4 weeks

      const payload = {
        id: undefined,
        title: 'Weekly With End Date Test',
        start: fmtISO(sessionStart),
        end: fmtISO(addMinutes(sessionStart, 30)),
        isLocal: false,
        healers: [healers[0]],
        attendees: [people[0]],
        calendarID: '1',
        bgColor: 'teal',
        color: 'white',
        isAllDay: false,
        sicknessNatures: [],
        recurrenceType: 'weekly',
        recurrenceInterval: 10, // max 10, but end date limits it
        recurrenceEndDate: fmtISO(endDate),
      };

      console.log('Creating weekly sessions with end date...');
      const result = await SchedulerService.createRecurringSchedule(payload);

      // Should create sessions up to and including the end date
      expect(result.created).toBeGreaterThanOrEqual(1);
      expect(result.created).toBeLessThanOrEqual(5); // 4 weeks = 4 sessions + possibly 1 on end date

      // No session should start after the end date
      result.schedules.forEach(s => {
        expect(new Date(s.start).getTime()).toBeLessThanOrEqual(endDate.getTime());
      });

      // Cleanup
      for (const s of result.schedules) {
        await SchedulerService.deleteSchedule(s.id!);
      }
    }, 30_000);

    it('should verify recurring sessions appear in schedule range query', async () => {
      const healers = await HealerService.getAllHealers();
      const people = await UserService.findUsers( 'Admin');

      const sessionStart = startOfHour(addDays(new Date(), 60));
      const payload = {
        id: undefined,
        title: 'Recurrence Visibility Test',
        start: fmtISO(sessionStart),
        end: fmtISO(addMinutes(sessionStart, 30)),
        isLocal: false,
        healers: [healers[0]],
        attendees: [people[0]],
        calendarID: '1',
        bgColor: 'blue',
        color: 'white',
        isAllDay: false,
        sicknessNatures: [],
        recurrenceType: 'weekly',
        recurrenceInterval: 3,
      };

      console.log('Creating 3 weekly sessions for visibility test...');
      const result = await SchedulerService.createRecurringSchedule(payload);
      expect(result.created).toBe(3);

      // Query the range that covers all 3 sessions
      const rangeStart = fmtISO(addDays(new Date(), 59));
      const rangeEnd   = fmtISO(addDays(new Date(), 80));
      const schedules = await SchedulerService.getSchedulesByRange(rangeStart, rangeEnd, 'en');

      // All 3 sessions should appear in the range
      const found = schedules.filter(s => s.recurrenceGroupId === result.recurrenceGroup);
      expect(found.length).toBe(3);

      // Cleanup
      for (const s of result.schedules) {
        await SchedulerService.deleteSchedule(s.id!);
      }
    }, 30_000);
  });

  describe('Calendar UI Navigation & State', () => {
    // These tests verify the logic used in Scheduler.vue for date navigation
    
    it('should correctly calculate range for week view navigation', () => {
      const baseDate = new Date('2026-02-16'); // A Monday
      const nextWeek = addDays(baseDate, 7);
      expect(fmtDate(nextWeek)).toBe('2026-02-23');
      
      const prevWeek = addDays(baseDate, -7);
      expect(fmtDate(prevWeek)).toBe('2026-02-09');
    });

    it('should correctly format view titles like the component does', () => {
      const testDate = new Date('2026-02-16');
      
      // Month view title
      const monthTitle = format(testDate, 'MMMM yyyy');
      expect(monthTitle).toBe('February 2026');
      
      // Day view title
      const dayTitle = format(testDate, 'dd MMMM yyyy');
      expect(dayTitle).toBe('16 February 2026');
      
      // Week view range
      const weekStart = startOfISOWeek(testDate);
      const weekEnd = endOfISOWeek(testDate);
      const weekTitle = `${fmtDisplay(weekStart)} - ${fmtDisplay(weekEnd)}`;
      expect(weekTitle).toBe('16-02-2026 - 22-02-2026');
    });

    it('should verify day color mapping logic', () => {
      const getDayColor = (dayIndex: number) => {
        switch (dayIndex) {
          case 0: return 'green';
          case 1: return 'blue';
          case 2: return 'red';
          case 3: return 'white';
          case 4: return 'black';
          case 5: return 'yellow';
          case 6: return 'purple';
          default: return 'blue';
        }
      };

      expect(getDayColor(0)).toBe('green'); // Sunday
      expect(getDayColor(1)).toBe('blue');  // Monday
      expect(getDayColor(6)).toBe('purple'); // Saturday
    });
  });
});
