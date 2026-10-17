import { TreatmentStatusEnum } from '@/enumerators/TreatmentStatusEnum';

import Healer from '@/models/Healer';

export default interface Treatment {
  id?: number | undefined;
  personID?: number;
  nature?: number;
  mode?: number;
  healers?: Healer[];
  healingFrequency?: string;
  protocol?: string;
  diagnostic?: number;
  payed?: number;
  startDate?: string;
  startTime?: string;
  status?: TreatmentStatusEnum.Status;
  totalCost?: number;
  comment?: string;
}

// PDF Viewer interfaces
export interface ICanvasSize {
  width: number;
  height: number;
}

export interface IPDFFileInfo {
  url?: string;
  pageNumber?: number;
  numPages?: number;
  lang: string;
  fileName: string;
}
