import { describe, it, expect } from 'vitest';
import { dateFormater, isValidDate } from '@/utilities/dateTime';

/**
 * Unit tests for dateTime.ts utility.
 *
 * Key regression being tested:
 *   In date-fns v2+, the token 'T' means "Unix timestamp in seconds".
 *   The literal ISO separator 'T' must be escaped as "'T'" in format strings.
 *   The toDateFnsFormat() function must handle this correctly, otherwise
 *   format() produces corrupt strings like "2026-02-211771684140000014:29:00+00:00".
 */
describe('dateTime utility', () => {

  // ─── isValidDate ────────────────────────────────────────────────────────────

  describe('isValidDate', () => {
    it('should return true for a valid ISO datetime string', () => {
      expect(isValidDate('2026-02-21T14:29:00+00:00', 'YYYY-MM-DDTHH:mm:ssZ')).toBe(true);
    });

    it('should return true for ISO datetime with milliseconds', () => {
      expect(isValidDate('2026-02-21T14:29:00.0000+00:00', 'YYYY-MM-DDTHH:mm:ss.SSSSZ')).toBe(true);
    });

    it('should return true for a valid display datetime string', () => {
      expect(isValidDate('21-02-2026 14:29', 'DD-MM-YYYY HH:mm')).toBe(true);
    });

    it('should return true for a valid date-only string', () => {
      expect(isValidDate('2026-02-21', 'yyyy-MM-dd')).toBe(true);
    });

    it('should return false for an empty string', () => {
      expect(isValidDate('', 'YYYY-MM-DDTHH:mm:ssZ')).toBe(false);
    });

    it('should return false for a string that does not match the format', () => {
      expect(isValidDate('not-a-date', 'YYYY-MM-DDTHH:mm:ssZ')).toBe(false);
    });

    it('should return true when any format in an array matches', () => {
      expect(isValidDate(
        '2026-02-21T14:29:00+00:00',
        ['YYYY-MM-DDTHH:mm:ssZ', 'YYYY-MM-DDTHH:mm:ss.SSSSZ']
      )).toBe(true);
    });
  });

  // ─── dateFormater ────────────────────────────────────────────────────────────

  describe('dateFormater', () => {

    it('should return empty string for empty input', () => {
      expect(dateFormater('', 'DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ssZ')).toBe('');
    });

    it('should return empty string for invalid input', () => {
      expect(dateFormater('not-a-date', 'DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ssZ')).toBe('');
    });

    // ── Critical regression: T must not be treated as a date-fns token ──────

    it('should produce a valid ISO string without embedding Unix timestamp (T-token regression)', () => {
      const result = dateFormater('21-02-2026 14:29', 'DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ssZ');
      // Must NOT contain a long numeric sequence (Unix timestamp) between date and time
      expect(result).not.toMatch(/\d{10,}/);
      // Must match ISO 8601 format: YYYY-MM-DDTHH:mm:ss±HH:MM
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
    });

    it('should correctly convert display datetime to ISO format', () => {
      const result = dateFormater('21-02-2026 14:29', 'DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ssZ');
      // Date part must be correct
      expect(result.startsWith('2026-02-21T')).toBe(true);
      // Time part must be correct
      expect(result).toContain('14:29:00');
    });

    it('should correctly convert ISO datetime to display format', () => {
      const result = dateFormater('2026-02-21T14:29:00+00:00', 'YYYY-MM-DDTHH:mm:ssZ', 'DD-MM-YYYY HH:mm');
      expect(result).toBe('21-02-2026 14:29');
    });

    it('should correctly convert ISO datetime with milliseconds to display format', () => {
      const result = dateFormater(
        '2026-02-21T14:29:00.0000+00:00',
        ['YYYY-MM-DDTHH:mm:ssZ', 'YYYY-MM-DDTHH:mm:ss.SSSSZ'],
        'DD-MM-YYYY HH:mm'
      );
      expect(result).toBe('21-02-2026 14:29');
    });

    it('should correctly convert date-only string to display format', () => {
      const result = dateFormater('2026-02-21', 'yyyy-MM-dd', 'DD-MM-YYYY');
      expect(result).toBe('21-02-2026');
    });

    it('should correctly convert date-only string to ISO format (for recurrence end date)', () => {
      const result = dateFormater('2026-02-21', 'yyyy-MM-dd', 'YYYY-MM-DDTHH:mm:ssZ');
      // Must be a valid ISO string
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
      // Date part must be correct
      expect(result.startsWith('2026-02-21T')).toBe(true);
      // Must NOT contain Unix timestamp
      expect(result).not.toMatch(/\d{10,}/);
    });

    it('should handle array of source formats and use the matching one', () => {
      // ISO with seconds
      const r1 = dateFormater(
        '2026-02-21T14:29:00+00:00',
        ['YYYY-MM-DDTHH:mm:ssZ', 'YYYY-MM-DDTHH:mm:ss.SSSSZ'],
        'DD-MM-YYYY HH:mm'
      );
      expect(r1).toBe('21-02-2026 14:29');

      // ISO with milliseconds
      const r2 = dateFormater(
        '2026-02-21T14:29:00.1234+00:00',
        ['YYYY-MM-DDTHH:mm:ssZ', 'YYYY-MM-DDTHH:mm:ss.SSSSZ'],
        'DD-MM-YYYY HH:mm'
      );
      expect(r2).toBe('21-02-2026 14:29');
    });

    it('should round-trip: display → ISO → display', () => {
      const display = '21-02-2026 14:29';
      const iso = dateFormater(display, 'DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ssZ');
      const backToDisplay = dateFormater(iso, 'YYYY-MM-DDTHH:mm:ssZ', 'DD-MM-YYYY HH:mm');
      expect(backToDisplay).toBe(display);
    });
  });
});
