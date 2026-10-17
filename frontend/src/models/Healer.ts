import { HealingLevelEnum } from "@/enumerators/HealingLevelEnum";
import Person from "@/interfaces/Person";
//export default healers;

export default class Healer implements Person {
  id: number | undefined = undefined;
  level: number = 1;
  personID: number | undefined = undefined;
  person?: Person = undefined;
  firstName: string = "";
  lastName: string = "";
  phone: string = "";
  birthDate: string = "";
  email: string = "";
  civilState: string = "";
  city: string = "";
  address: string = "";
  folderNumber: number | undefined = -1;
  Schedules?: Record<string, unknown> | undefined = {};
  Treatments?: Record<string, unknown> | undefined = {};
  CreatedAt ? : string | undefined = "";
  UpdatedAt ? : string | undefined = "";
  DeletedAt ? : string | undefined = "";

  constructor({ id, level, firstName, lastName, phone }: { id: number | undefined, level: number, firstName: string, lastName: string, phone: string }) {
    this.id = id;
    this.level = level;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
  }

  /**
   * getInitialHealer
   */
  public static getInitialHealer(): Healer {
    return new Healer({ id: -1, level: 1, firstName: "", lastName: "", phone: "" })
  }

  public get healerName(): string {
    return this.firstName + " " + this.lastName;
  }

  public get levelAsString(): string {
    return HealingLevelEnum.getLevelToStringByID(this.level)
  }

  public static getLevelAsString(level: number): string {
    return HealingLevelEnum.getLevelToStringByID(level)
  }

}