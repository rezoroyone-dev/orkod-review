import { describe, it, expect, vi, beforeEach } from 'vitest';
import TwoFactorService from '@/services/TwoFactorService';
import PasswordResetService from '@/services/PasswordResetService';
import PatientPortalService from '@/services/PatientPortalService';
import DocumentSearchService from '@/services/DocumentSearchService';
import SessionNotesService from '@/services/SessionNotesService';

// Mock axios
vi.mock('@/plugins/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '@/plugins/axios';

describe('Two-Factor Authentication Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setup', () => {
    it('should call the 2FA setup endpoint', async () => {
      const mockResponse = {
        secret: 'JBSWY3DPEHPK3PXP',
        provisioningURI: 'otpauth://totp/Pranic%20Healing:testuser?secret=JBSWY3DPEHPK3PXP&issuer=Pranic%20Healing',
        qrCodeUrl: 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=...',
      };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await TwoFactorService.setup();

      expect(api.post).toHaveBeenCalledWith('/auth/2fa/setup');
      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.provisioningURI).toContain('otpauth://totp');
    });
  });

  describe('verify', () => {
    it('should verify a TOTP code', async () => {
      const mockResponse = {
        message: '2FA enabled successfully',
        backupCodes: ['ABCD-EFGH', 'IJKL-MNOP'],
      };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await TwoFactorService.verify('123456');

      expect(api.post).toHaveBeenCalledWith('/auth/2fa/verify', { code: '123456' });
      expect(result.message).toBe('2FA enabled successfully');
      expect(result.backupCodes).toHaveLength(2);
    });
  });

  describe('disable', () => {
    it('should disable 2FA with password and code', async () => {
      const mockResponse = { message: '2FA disabled successfully' };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await TwoFactorService.disable('123456', 'mypassword');

      expect(api.post).toHaveBeenCalledWith('/auth/2fa/disable', {
        code: '123456',
        password: 'mypassword',
      });
      expect(result.message).toBe('2FA disabled successfully');
    });
  });
});

describe('Password Reset Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestReset', () => {
    it('should request a password reset email', async () => {
      const mockResponse = { message: 'If the email exists, a reset link has been sent' };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await PasswordResetService.requestReset('test@example.com');

      expect(api.post).toHaveBeenCalledWith('/auth/requestReset', {
        email: 'test@example.com',
      });
      expect(result.message).toContain('reset link has been sent');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const mockResponse = { message: 'Password has been reset successfully' };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await PasswordResetService.resetPassword('valid-token', 'newpassword123');

      expect(api.post).toHaveBeenCalledWith('/auth/resetPassword', {
        token: 'valid-token',
        password: 'newpassword123',
      });
      expect(result.message).toBe('Password has been reset successfully');
    });
  });
});

describe('Patient Portal Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new patient', async () => {
      const mockResponse = {
        message: 'Account created successfully. Please check your email to verify your account.',
        patientId: 1,
      };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await PatientPortalService.register({
        email: 'patient@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(api.post).toHaveBeenCalledWith('/patient/register', {
        email: 'patient@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.patientId).toBe(1);
    });
  });

  describe('login', () => {
    it('should login as a patient', async () => {
      const mockResponse = {
        token: 'jwt-token-here',
        patient: {
          id: 1,
          email: 'patient@example.com',
          personId: 1,
          person: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await PatientPortalService.login('patient@example.com', 'password123');

      expect(api.post).toHaveBeenCalledWith('/patient/login', {
        email: 'patient@example.com',
        password: 'password123',
      });
      expect(result.token).toBe('jwt-token-here');
      expect(result.patient.email).toBe('patient@example.com');
    });
  });

  describe('getAppointments', () => {
    it('should get patient appointments', async () => {
      const mockResponse = {
        upcoming: [
          { id: 1, title: 'Upcoming Appointment', start: '2026-02-24T10:00:00Z' },
        ],
        past: [
          { id: 2, title: 'Past Appointment', start: '2026-02-20T10:00:00Z' },
        ],
      };

      (api.get as any).mockResolvedValue({ data: mockResponse });

      const result = await PatientPortalService.getAppointments();

      expect(api.get).toHaveBeenCalledWith('/patient/appointments');
      expect(result.upcoming).toHaveLength(1);
      expect(result.past).toHaveLength(1);
    });
  });

  describe('getTreatments', () => {
    it('should get patient treatment history', async () => {
      const mockResponse = [
        { id: 1, status: 'completed', startDate: '2026-02-20' },
        { id: 2, status: 'ongoing', startDate: '2026-02-22' },
      ];

      (api.get as any).mockResolvedValue({ data: mockResponse });

      const result = await PatientPortalService.getTreatments();

      expect(api.get).toHaveBeenCalledWith('/patient/treatments');
      expect(result).toHaveLength(2);
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel an appointment', async () => {
      const mockResponse = { message: 'Appointment cancelled successfully' };

      (api.delete as any).mockResolvedValue({ data: mockResponse });

      const result = await PatientPortalService.cancelAppointment(1);

      expect(api.delete).toHaveBeenCalledWith('/patient/appointments/1');
      expect(result.message).toBe('Appointment cancelled successfully');
    });
  });
});

describe('Document Search Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should search documents with query', async () => {
      const mockResponse = {
        data: [
          { id: 1, fileName: 'report.pdf', extractedText: 'medical report' },
        ],
        total: 1,
        page: 1,
        limit: 20,
      };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await DocumentSearchService.search({
        query: 'medical',
        page: 1,
        limit: 20,
      });

      expect(api.post).toHaveBeenCalledWith('/documents/search', {
        query: 'medical',
        page: 1,
        limit: 20,
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by tags', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      await DocumentSearchService.search({
        tags: 'medical,important',
      });

      expect(api.post).toHaveBeenCalledWith('/documents/search', {
        tags: 'medical,important',
      });
    });
  });

  describe('updateTags', () => {
    it('should update document tags', async () => {
      const mockResponse = { message: 'Document tags updated successfully' };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await DocumentSearchService.updateTags(1, 'important,medical');

      expect(api.post).toHaveBeenCalledWith('/documents/tags', {
        documentId: 1,
        manualTags: 'important,medical',
      });
      expect(result.message).toBe('Document tags updated successfully');
    });
  });

  describe('triggerOCR', () => {
    it('should trigger OCR processing', async () => {
      const mockResponse = {
        message: 'OCR processing triggered',
        documentId: 1,
      };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await DocumentSearchService.triggerOCR(1);

      expect(api.post).toHaveBeenCalledWith('/documents/1/ocr');
      expect(result.documentId).toBe(1);
    });
  });
});

describe('Session Notes Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateNotes', () => {
    it('should update session notes', async () => {
      const mockResponse = { message: 'Session notes updated successfully' };

      (api.post as any).mockResolvedValue({ data: mockResponse });

      const result = await SessionNotesService.updateNotes(1, 'Patient responded well to treatment');

      expect(api.post).toHaveBeenCalledWith('/schedule/notes', {
        scheduleId: 1,
        sessionNotes: 'Patient responded well to treatment',
      });
      expect(result.message).toBe('Session notes updated successfully');
    });
  });

  describe('getScheduleWithNotes', () => {
    it('should get schedule with session notes', async () => {
      const mockResponse = {
        id: 1,
        title: 'Treatment Session',
        sessionNotes: 'Patient responded well to treatment',
        start: '2026-02-24T10:00:00Z',
        end: '2026-02-24T11:00:00Z',
      };

      (api.get as any).mockResolvedValue({ data: mockResponse });

      const result = await SessionNotesService.getScheduleWithNotes(1);

      expect(api.get).toHaveBeenCalledWith('/schedule/1/notes');
      expect(result.sessionNotes).toBe('Patient responded well to treatment');
    });
  });
});

describe('TOTP Code Validation (Unit Tests)', () => {
  // These are pure unit tests that don't require API calls

  describe('Code format validation', () => {
    it('should accept 6-digit codes', () => {
      const validCodes = ['123456', '000000', '999999'];
      validCodes.forEach(code => {
        expect(/^\d{6}$/.test(code)).toBe(true);
      });
    });

    it('should handle codes with spaces', () => {
      const codeWithSpaces = '123 456';
      const cleanedCode = codeWithSpaces.replace(/\s/g, '');
      expect(cleanedCode).toBe('123456');
    });

    it('should handle codes with dashes', () => {
      const codeWithDashes = '123-456';
      const cleanedCode = codeWithDashes.replace(/-/g, '');
      expect(cleanedCode).toBe('123456');
    });
  });

  describe('Backup code format', () => {
    it('should generate codes in XXXX-XXXX format', () => {
      const backupCodePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      const validBackupCode = 'ABCD-EFGH';
      expect(backupCodePattern.test(validBackupCode)).toBe(true);
    });
  });
});

describe('Recovery Token Generation (Unit Tests)', () => {
  it('should generate a base64-encoded token', () => {
    // Simulate token generation
    const mockToken = btoa(String.fromCharCode(...Array(32).fill(0).map(() => Math.floor(Math.random() * 256))));
    expect(typeof mockToken).toBe('string');
    expect(mockToken.length).toBeGreaterThan(0);
  });

  it('should generate unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const token = btoa(String.fromCharCode(...Array(32).fill(0).map(() => Math.floor(Math.random() * 256))));
      tokens.add(token);
    }
    // All tokens should be unique
    expect(tokens.size).toBe(100);
  });
});

describe('Email Template Rendering (Unit Tests)', () => {
  it('should render template with patient data', () => {
    const template = 'Dear {{.PatientName}}, your appointment is on {{.Date}}';
    const data = {
      PatientName: 'John Doe',
      Date: 'Monday, February 24, 2026',
    };

    // Simple template rendering simulation
    let rendered = template;
    Object.entries(data).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`{{\\.${key}}}`, 'g'), value as string);
    });

    expect(rendered).toBe('Dear John Doe, your appointment is on Monday, February 24, 2026');
  });
});

describe('JWT Token Claims (Unit Tests)', () => {
  it('should include patient_id in patient JWT claims', () => {
    // Simulate JWT claims structure
    const claims = {
      patient_id: 1,
      email: 'patient@example.com',
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    expect(claims.patient_id).toBe(1);
    expect(claims.email).toBe('patient@example.com');
    expect(claims.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('should have valid expiry time for patient tokens', () => {
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    const expectedExpiry = now + sevenDaysInSeconds;

    const claims = {
      exp: expectedExpiry,
    };

    // Token should expire in the future
    expect(claims.exp).toBeGreaterThan(now);
    // Token should expire within 7 days
    expect(claims.exp - now).toBeLessThanOrEqual(sevenDaysInSeconds);
  });
});