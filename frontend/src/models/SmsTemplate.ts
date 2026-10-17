import axios, { AxiosRequestConfig } from 'axios';
import SuperUser from '@/interfaces/SuperUser';
import AuthenticationService from '@/services/AuthenticationService';
import AppConfigs from "@/AppConfigs";

export interface SmsServerResponse {
  usedLanguage: string; // used language
  templates: SMSTemplate[]
}
export default class SMSTemplate {
  id: number = -1;
  lang: string = "";
  text: string = "";
  static usedLang: string = "";

  public constructor(id: number, lang: string, text: string) {
    this.id = id;
    this.lang = lang;
    this.text = text;
  }

  public static getTemplate(templates: SMSTemplate[], lang: string): SMSTemplate {
    if (!templates || templates.length === 0) {
      throw new Error("Empty Templates array");
    }
    const template = templates.find(t => t.lang === lang);
    if (!template || template.id < 0) {
      throw new Error("Can't get template from server");
    }
    return { ...template };
  }

  public static async getAllTemplates(authUser: SuperUser): Promise<SMSTemplate[]> {
    const config: AxiosRequestConfig = AuthenticationService.getAxiosConfig(authUser);
    const url = AppConfigs.getServerURL() + "/smsTemplates";
    try {
      const response = await axios.post(url, null, config);
      const serverResponse: SmsServerResponse = response.data;
      SMSTemplate.usedLang = serverResponse.usedLanguage;
      return serverResponse.templates;
    } catch (error: any) {
      if (error.response?.status) {
        throw new Error(`${error.response.status} ${error}`);
      } else {
        throw error;
      }
    }
  }

  public static async saveAllTemplates(authUser: SuperUser, serverResponse: SmsServerResponse): Promise<void> {
    const config: AxiosRequestConfig = AuthenticationService.getAxiosConfig(authUser);
    const url = AppConfigs.getServerURL() + "/saveSmsTemplates";
    try {
      await axios.post(url, serverResponse, config);
    } catch (error: any) {
      if (error.response?.status) {
        throw new Error(`${error.response.status} ${error}`);
      } else {
        throw error;
      }
    }
  }

  public static async getServerIP(authUser: SuperUser): Promise<string> {
    const config: AxiosRequestConfig = AuthenticationService.getAxiosConfig(authUser);
    const url = AppConfigs.getServerURL() + "/getServerIP";
    const response = await axios.post(url, null, config);
    return response.data;
  }
}