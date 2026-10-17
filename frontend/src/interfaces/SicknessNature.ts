import Diagnostic from "@/interfaces/Diagnostic";

export const ALL: SicknessNature = { id: 0, description: "ALL", items: [] }

export default interface SicknessNature {
  id: number;
  description: string;
  items: Diagnostic[]
}