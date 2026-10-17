export default interface Document {
  id: number;
  fileName: string;
  path: string;
  comment ? : string;
  createdOn ? : string;
  personID ? : number;
}