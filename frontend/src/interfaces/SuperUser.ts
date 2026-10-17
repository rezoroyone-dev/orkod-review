import Person from './Person';

export default interface SuperUser {
  id?: number | undefined;
  userName?: string;
  passWord?: string;
  token?: string;
  refreshToken?: string;
  roleID?: number;
  roleIDs?: number[];
  personID?: number;
  person?: Person;
  firstName?: string;
  lastName?: string;
  role?: {
    id: number;
    name: string;
    permissions: Array<{ id: number; name: string }>;
  };
  roles?: Array<{
    id: number;
    name: string;
    permissions: Array<{ id: number; name: string }>;
  }>;
  // Two-Factor Authentication
  totpEnabled?: boolean;
  totpSecret?: string;
}
