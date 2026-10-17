import {TreatmentStatusEnum} from "@/enumerators/TreatmentStatusEnum";

export default interface TreatmentsTableEntry{
    patientFN:string;
    patientLN:string;
    status: TreatmentStatusEnum.Status;
    totalCost: number;
    nature: number;
    diagnostic: number; 
    payed: number;
    startDate: string;
    healerFN:string;
    healerLN:string;

    // mode: number;
    // healingFrequency: string;
    // protocol: string;
    // comment: string;
}
