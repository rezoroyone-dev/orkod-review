import Diagnostic from '@/interfaces/Diagnostic';
import SicknessNature from '@/interfaces/SicknessNature';
import { langsEnum } from '@/enumerators/enums';
import { getIndexOfArrayObject } from "@/utilities/MyUtilities";
import { useSicknessNatureStore } from '@/stores/sicknessNature';
import apiClient from "@/plugins/axios";

export default class SicknessNatureService {
  public constructor() {}

  /**
   * get the Healing Frequency by sickness nature ID and Diagnostic ID
   */
  public static getHealingFrequency(diagList: Diagnostic[], diagnosticID: number): string {
    let healingFrequency: string = "";
    diagList.forEach((diagnostic) => {
      if (diagnostic.id === diagnosticID) {
        healingFrequency = diagnostic.healingFrequency;
      }
    });
    return healingFrequency;
  }

  /**
   * get the Protocol by sickness nature ID and Diagnostic ID
   */
  public static getProtocol(diagList: Diagnostic[], diagnosticID: number): string {
    let protocol: string = "";
    diagList.forEach((diagnostic) => {
      if (diagnostic.id === diagnosticID) {
        protocol = diagnostic.protocol;
      }
    });
    return protocol;
  }

  /**
   * get the list of diagnostics by sickness nature ID
   * @param natureID 
   */
  public static getDiagnosticList(natureID: number, lang: langsEnum): Diagnostic[] {
    let diagList: Diagnostic[] = [];
    const sickNatures = SicknessNatureService.getSickNatures(lang);
    sickNatures.forEach((nature) => {
      if (nature.id === natureID) {
        diagList = Object.assign([], nature.items);
      }
    });
    return diagList;
  }

  public static getNatureDescription(natureID: number, lang: langsEnum): string {
    let natureDescription: string = "";
    const sickNatures = SicknessNatureService.getSickNatures(lang);
    sickNatures.forEach((nature) => {
      if (nature.id === natureID) {
        natureDescription = nature.description;
      }
    });
    return natureDescription;
  }

  public static getDiagnosticDescription(natureID: number, diagnosticID: number, lang: langsEnum): string {
    let diagDescription: string = "";
    const diagnosticList: Diagnostic[] = SicknessNatureService.getDiagnosticList(natureID, lang);
    diagnosticList.forEach((item) => {
      if (item.id === diagnosticID) {
        diagDescription = item.description;
      }
    });
    return diagDescription;
  }

  /**
   * get the sickness nature by its ID
   */
  public static getNature(id: number, lang: langsEnum): SicknessNature {
    let sicknessNatureList: SicknessNature[] = []
    sicknessNatureList = SicknessNatureService.getSickNatures(lang);

    let sicknessNature: SicknessNature = { id: id } as SicknessNature
    const index: number = getIndexOfArrayObject(sicknessNatureList, sicknessNature)

    if (index != -1) {
      sicknessNature = Object.assign({}, sicknessNatureList[index])
    }
    return sicknessNature
  }

  /**
   * get the list of sickness nature from store, assuming the list was already populated after user is logged in
   */
  public static getSickNatures(_lang: langsEnum): SicknessNature[] {
    const sicknessNatureStore = useSicknessNatureStore();
    const storeArray = sicknessNatureStore.getSicknessNatures;
    if (storeArray != undefined && storeArray.length > 0) {
      return Array.from(storeArray);
    }
    return [];
  }

  /*
    Populates the list of sickness nature from server after user is logged in, should be invoked after user login is successful using the router guards before leave
  */
  public static async populateSickNatures(lang: langsEnum): Promise<void> {
    const sicknessNatureStore = useSicknessNatureStore();
    const response = await apiClient.post("/sicknessNatures", { lang });
    sicknessNatureStore.setSicknessNatures(response.data);
  }

}
