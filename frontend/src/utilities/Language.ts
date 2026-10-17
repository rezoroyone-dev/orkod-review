import {langsEnum} from "@/enumerators/enums";

export default class Language {
    text:string = "";
    value:langsEnum = langsEnum.ENGLISH

    constructor(text:string, value: langsEnum) {
        this.text = text;
        this.value = value;
    }

    public static get langs():Language[] {
        return [
            new Language("English", langsEnum.ENGLISH),
            new Language("العربية", langsEnum.ARABIC),
            new Language("Français", langsEnum.FRENCH),
            new Language("Bahasa Indonesia", langsEnum.INDONESIAN),
        ];
    }

    public static getActiveLang(browserLanguage:string):langsEnum {
        if (browserLanguage == undefined || browserLanguage.startsWith("en")){
            return langsEnum.ENGLISH
        }
        if (browserLanguage.startsWith("fr")){
            return langsEnum.FRENCH
        }
        if (browserLanguage.startsWith("ar")){
            return langsEnum.ARABIC
        }
        if (browserLanguage.startsWith("id")){
            return langsEnum.INDONESIAN
        }
        return langsEnum.ENGLISH
    }

}
