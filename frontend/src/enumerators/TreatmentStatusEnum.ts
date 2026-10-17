export class TreatmentStatusEnum {
    Status: TreatmentStatusEnum.Status
      
    // private to disallow creating other instances of this type
    private constructor(private readonly key: string, public readonly value: number) {
      this.Status = TreatmentStatusEnum.Status.OPEN
    }
    public static toString() {
      return this.Status.toString();
    }
    
    public static getStatusByID(id:number):string{
      switch (id) {
        case 1:
          return TreatmentStatusEnum.Status.OPEN.toString()
          break;
      
          case 2:
          return TreatmentStatusEnum.Status.CLOSED.toString()
          break;

          case 3:
          return TreatmentStatusEnum.Status.ALL.toString()
          break;

          default:
            return TreatmentStatusEnum.Status.OPEN.toString()
      }
    }
  }

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TreatmentStatusEnum
{
    export enum Status
    {
      OPEN="Open", CLOSED = "Closed", ALL = "All"
    }
}
