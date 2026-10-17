export class HealingLevelEnum {
  Level: HealingLevelEnum.Level

  // private to disallow creating other instances of this type
  private constructor(private readonly key: string, public readonly value: number) {
    this.Level = HealingLevelEnum.Level.divine_healing
  }

  public toString() {
    return this.Level.toString();
  }

  public static getLevelToStringByID(id: number): string {
    const allLevels = HealingLevelEnum.getALlHealingLevels()
    let levelToString = ""
    for (let i = 0; i < allLevels.length; i++) {
      if (allLevels[i].id == id) {
        levelToString = allLevels[i].text
        break
      }
    }
    if (levelToString == "") {
      throw new Error("UnKnown Healer Level");
    }
    return levelToString

  }

  public static getALlHealingLevels(): { text: string, id: number } [] {
    return [
      { text: "divine_healing", id: 1 },
      { text: "Advanced_divine_healing", id: 2 },
      { text: "Pranic_Psychotherapy_Healing", id: 3 },
      { text: "Pranic_Cristal_Healing", id: 4 },
      { text: "Practical_Psychic_Self_Defence", id: 5 }
    ]
  }

}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace HealingLevelEnum {
  export enum Level {
    divine_healing = 1,
      Advanced_divine_healing = 2,
      Pranic_Psychotherapy_Healing = 3,
      Pranic_Cristal_Healing = 4,
      Practical_Psychic_Self_Defence = 5
  }
}
