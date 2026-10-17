export enum meditationType {
  "LINK" = 0,
  "FILE" = 1
}

export enum playStatus {
  "PLAYING" = 0,
  "PAUSED" = 1,
  "STOPPED" = 2
}

/* export interface IMeditation {
  id: number | undefined;
  name: string;
  medType: meditationType;
  path: string;
  comment ? : string;
  status ? : playStatus;
}
 */
export default class Meditation {
  id: number | undefined;
  name: string = "";
  path: string = "";
  comment ? : string = "";
  medType: meditationType = meditationType.LINK;
  status: playStatus = playStatus.STOPPED;

  constructor({ id, name, path, comment, medType }: { id: number | undefined, name: string, path: string, comment: string, medType ? : meditationType }) {
    this.id = id;
    this.name = name;
    this.path = path;
    this.comment = comment;
    if (medType == undefined) {
      medType = meditationType.LINK
    }
    this.medType = medType;
  }

  public static getInitialMeditation(): Meditation {
    return new Meditation({ id: undefined, name: "", path: "", comment: "", medType: meditationType.LINK })
  }

  // Clears the meditation data
  public clear(): void {
    Object.assign(this, Meditation.getInitialMeditation())
  }

  public get canPlay(): boolean {
    return this.status != playStatus.PLAYING
  }

  public get canPause(): boolean {
    return this.status == playStatus.PLAYING
  }

  public get canStop(): boolean {
    return this.status != playStatus.STOPPED
  }

  public get icon(): string {
    return this.medType == meditationType.FILE ? "mdi-file" : "link"
  }

  public get tooltip(): string {
    return this.medType == meditationType.FILE ? "File" : "Link"
  }

  public get isLink(): boolean {
    return this.medType == meditationType.LINK
  }

  public set isLink(val: boolean) {
    this.medType = val ? meditationType.LINK : meditationType.FILE
  }

}