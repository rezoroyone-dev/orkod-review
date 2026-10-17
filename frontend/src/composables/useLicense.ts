import { ref } from 'vue';
import { parse, format, differenceInDays } from 'date-fns';
import axios from "axios";
import AppConfigs from "@/AppConfigs";
import AuthenticationService from '@/services/AuthenticationService';
import SuperUser from '@/interfaces/SuperUser';
import { useMessageBox } from './useMessageBox';

export function useLicense() {
  const license = ref({ status: "", expirationDate: "", summary: "" });
  const loading = ref(false);
  const { showMsgBox } = useMessageBox();

  function getLicenseSummary() {
    let res = "";
    if (!license.value.status) {
      license.value.summary = "";
      return;
    }
    switch (license.value.status) {
      case "OK":
        res = `License is OK\nExpiration date is ${license.value.expirationDate}`;
        break;
      case "expired":
        res = "License is expired, please renew it";
        break;
    }

    if (license.value.status === "OK") {
      const todayStr = format(new Date(), 'dd-MM-yyyy');
      const today = parse(todayStr, 'dd-MM-yyyy', new Date());
      const expDate = parse(license.value.expirationDate, 'dd-MM-yyyy', new Date());
      const leftDays = differenceInDays(expDate, today);
      if (leftDays <= 7) {
        res += `\nThere are only about ${leftDays} days before Expiration \nIt is better to start requesting a new license now!!!`;
        showMsgBox("Warning: license status", `There are only about ${leftDays} days before License expiration\nit is better to start requesting a new license now!!!`);
      } else {
        res += `\nThere are ${leftDays} days before Expiration`;
      }
    }
    license.value.summary = res;
  }

  async function checkLicenseStatus(authUser?: SuperUser) {
    if (!authUser) {
      return;
    }
    loading.value = true;
    try {
      const url = AppConfigs.getServerURL() + "/public/licenseStatus";
      const config = AuthenticationService.getAxiosConfig(authUser);
      const response = await axios.post(url, null, config);
      license.value = { ...license.value, ...response.data };
      getLicenseSummary();
    } catch (error) {
      showMsgBox("Error checking license status", `Error while requesting license status from server\n${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      loading.value = false;
    }
  }

  return { license, loading, checkLicenseStatus, getLicenseSummary };
}
