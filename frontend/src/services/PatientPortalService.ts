import api from '@/plugins/axios';
import Schedule from '@/interfaces/Schedule';
import Treatment from '@/interfaces/Treatment';

export interface Patient {
  id: number;
  email: string;
  personId: number;
  person: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}

export interface PatientAppointments {
  upcoming: Schedule[];
  past: Schedule[];
}

export interface PatientLoginResponse {
  token: string;
  patient: Patient;
}

export default {
  /**
   * Register a new patient account
   */
  async register(data: {
    email: string;
    password: string;
    phone?: string;
    personId?: number;
    firstName?: string;
    lastName?: string;
  }): Promise<{ message: string; patientId: number }> {
    const response = await api.post<{ message: string; patientId: number }>('/patient/register', data);
    return response.data;
  },

  /**
   * Login as a patient
   */
  async login(email: string, password: string): Promise<PatientLoginResponse> {
    const response = await api.post<PatientLoginResponse>('/patient/login', { email, password });
    return response.data;
  },

  /**
   * Get patient appointments
   */
  async getAppointments(): Promise<PatientAppointments> {
    const response = await api.get<PatientAppointments>('/patient/appointments');
    return response.data;
  },

  /**
   * Get patient treatment history
   */
  async getTreatments(): Promise<Treatment[]> {
    const response = await api.get<Treatment[]>('/patient/treatments');
    return response.data;
  },

  /**
   * Cancel an appointment
   */
  async cancelAppointment(scheduleId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/patient/appointments/${scheduleId}`);
    return response.data;
  },
};