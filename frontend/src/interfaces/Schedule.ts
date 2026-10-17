import Center from "@/models/Center";
import Healer from "@/models/Healer";
import Meditation from "@/models/Meditation";
import Person from './Person';
import SicknessNature from "./SicknessNature";


export default interface Schedule {
  id?: number | undefined;
  title?: string;
  location?: string;
  attendees?: Person[];
  meditations?: Meditation[];
  centerID?: number | undefined;
  center?: Center | undefined;
  healers?: Healer[];
  calendarID?: string;
  category?: string;
  dueDateClass?: string;
  start?: string;
  end?: string;
  isAllDay?: boolean | undefined;
  busy?: boolean;
  isLocal?: boolean; // Treatment Mode is Local or remote
  color?: string;
  bgColor?: string;
  sicknessNatures?: SicknessNature[] | undefined;
  sessionNotes?: string;
  // Recurrence fields
  recurrenceType?: string;       // "daily" | "weekly" | "biweekly" | "monthly" | ""
  recurrenceInterval?: number;   // number of occurrences (2–52)
  recurrenceEndDate?: string;    // ISO timestamp — optional hard stop
  recurrenceGroupId?: number;    // links all occurrences of a series together
}

/*
SELECT
SC.id,
  SC.healer_id,
  SC.start_date,
  SC.end_date,
  SC.calendar_id,
  PER.first_name as patient_fn,
  PER.last_name as patient_ln
FROM(
  (
    SELECT *
    FROM schedules
  ) SC LEFT OUTER JOIN(
    SELECT person_id,
    schedule_id FROM persons_schedules
  ) PER_SC on SC.id = PER_SC.schedule_id LEFT OUTER JOIN(
    SELECT persons.id,
    persons.first_name,
    persons.last_name FROM persons
  ) PER on PER.id = PER_SC.person_id
)
*/