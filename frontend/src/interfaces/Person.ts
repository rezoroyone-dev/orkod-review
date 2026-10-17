export default interface Person {
  firstName?: string;
  lastName?: string;
  id?: number | undefined;
  phone?: string;
  birthDate?: string;
  email?: string;
  civilState?: string;
  city?: string;
  address?: string;
  folderNumber?: number | undefined;
  Schedules?: Record<string, unknown>;
  Treatments?: Record<string, unknown>;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string;
  bloodGroup?: string;
  weight?: string;
  height?: string;
}
