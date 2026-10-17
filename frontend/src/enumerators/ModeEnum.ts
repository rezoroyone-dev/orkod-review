export class ModeEnum {
    Mode: ModeEnum.Mode
      
    // private to disallow creating other instances of this type
    private constructor(private readonly key: string, public readonly value: number) {
      this.Mode = ModeEnum.Mode.LOCAL
    }
    
    public static toString() {
      return this.Mode.toString();
    }
    
    public static getModeByID(id: number): string {
      switch (id) {
        case 1:
          return ModeEnum.Mode.LOCAL.toString();
        case 2:
          return ModeEnum.Mode.REMOTE.toString();
        default:
          return ModeEnum.Mode.LOCAL.toString();
      }
    }
    
    public static getMode(id: number): ModeEnum.Mode {
      switch (id) {
        case 1:
          return ModeEnum.Mode.LOCAL;
        case 2:
          return ModeEnum.Mode.REMOTE;
        default:
          return ModeEnum.Mode.LOCAL;
      }
    }
  }

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ModeEnum
{
    export enum Mode
    {
      LOCAL="Local", REMOTE = "Remote"
    }
}
