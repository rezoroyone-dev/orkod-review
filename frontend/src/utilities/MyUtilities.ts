import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { Router } from 'vue-router';
import Cookies from "./Cookies";
import Healer from "@/models/Healer";
import Person from "@/interfaces/Person";
import SuperUser from "@/interfaces/SuperUser";

// BaseObject interface is used by the generic function getIndexOfArrayObject()
interface BaseObject {
  id: number | string | undefined;
}

export function isEmptyOrUndefined<T>(obj: T) {
  if (obj === undefined || obj === null) {
    return true;
  }
  if (typeof (obj) == 'string') {
    const str = String(obj);
    const len = str.trim().length;
    if (len === 0) {
      return true;
    } else {
      return false;
    }
  } else if (Array.isArray(obj)) {
    const array = Array(obj);
    const len = array.length;
    if (len == 0) {
      return true;
    } else {
      return false;
    }
  } else {
    console.log('I assume this object ' + JSON.stringify(obj) + ' is NOT null');
    return false;
  }
}
export function log(message: string) {
  console.log('##############=> ' + message);
}

export function showAlertNotImplemented() {
  console.warn('Feature not implemented yet, stay tuned.');
}

export function translate(key: string): string {
  // TODO: Fix this to use a global i18n instance or pass t from components
  // For now, return key to avoid crash, but proper fix is needed.
  return key;
}

export function HealersHasHealer(healers: Healer[], newHealer: Healer): boolean {
  let result = false;
  healers.forEach(healer => {
    if (healer.personID === newHealer.personID) {
      result = true;
    }
  })
  return result;
}

export function personsHasPerson(pers: Person[], person: Person): boolean {
  let result = false;
  if (pers == undefined || pers.length == 0) {
    return false
  }
  pers.forEach(per => {
    if (per.id === person.id) {
      result = true;
    }
  })
  return result;
}

export function getIndexOfArrayObject<T extends BaseObject>(array: T[], item: T): number {
  if (!array || !item || array.length <= 0 || item.id === undefined) {
    return -1
  }
  let index = -1;
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    if (element.id == item.id) {
      index = i;
      break;
    }
  }
  return index
}

export function currency(value: number) {
  return value.toFixed(2);
}

export function logout(router: Router) {
  const userStore = useUserStore();
  const appStore = useAppStore();

  userStore.setUser(undefined as unknown as SuperUser);
  appStore.setIsToolBarVisible(false);
  // appStore.setIsDrawerVisible(false);

  // TODO: Map these Vuex commits to Pinia store actions as their modules are refactored
  // store.commit('clearActivePerson')
  // store.commit('clearActiveTreatment')
  // store.commit('clearNotificationList')
  // store.commit('clearAttendees')
  // store.commit('clearHealer')
  // store.commit('clearActiveSchedule')
  // store.commit('clearDocuments')
  // store.commit('clearSicknessNatures')
  // store.commit('clearEventSicknessNatures')

  // Clearing the session cookies
  Cookies.eraseCookie("Authorization");

  if (router.currentRoute.value.name === 'login') {
    return;
  }
  router.push('/').catch((error) => {
    console.log(error);
  });
}

export function getAttendeesAsStringsArray(attendees: Person[]): string[] {
  const res: string[] = []
  attendees.forEach((item) => {
    res.push(item.firstName + " " + item.lastName)
  })
  return res
}

export function clearObject<T extends BaseObject>(obj: T): T {
  for (const prop of Object.keys(obj)) {
    delete obj[prop as keyof T];
  }
  return obj
}
