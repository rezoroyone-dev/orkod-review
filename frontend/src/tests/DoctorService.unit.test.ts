/**
 * Unit tests for the Doctors directory client.
 * Covers: sanitization (no sensitive fields leak) and the 404 -> empty directory contract.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import axios from 'axios';
import DoctorService from '@/services/DoctorService';

vi.mock('@/AppConfigs', () => ({
  default: {
    getServerURL: () => 'http://test.local/api',
  },
}));

function mockGetOnce(payload: unknown) {
  vi.spyOn(axios, 'get').mockResolvedValueOnce({ data: payload });
}

function mockGetErrorOnce(status: number) {
  vi.spyOn(axios, 'get').mockRejectedValueOnce({
    response: { status },
  });
}

function mockPostOnce(payload: unknown) {
  vi.spyOn(axios, 'post').mockResolvedValueOnce({ data: payload });
}

describe('DoctorService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('strips sensitive fields from raw doctor records', async () => {
    mockGetOnce([
      {
        id: 7,
        firstName: 'Amara',
        lastName: 'Ndiaye',
        specialty: 'General practice',
        city: 'Paris',
        verified: true,
        phone: '+33 6 00 00 00 00',
        email: 'amara@example.com',
        address: '1 rue Test',
        practitioner: { id: 11 },
        personID: 11,
      },
    ]);

    const doctors = await DoctorService.getDoctors();
    expect(doctors).toHaveLength(1);
    expect(doctors[0]).toEqual({
      id: 7,
      firstName: 'Amara',
      lastName: 'Ndiaye',
      specialty: 'General practice',
      city: 'Paris',
      verified: true,
    });
    expect(JSON.stringify(doctors)).not.toMatch(/phone|email|address|personID/);
  });

  it('keeps rating aggregates and profile fields when present', async () => {
    mockGetOnce({
      id: 3,
      firstName: 'Yuki',
      lastName: 'Tanaka',
      title: 'MD',
      about: 'Supportive care.',
      certifications: 'Certified Pranic Healer',
      yearsExperience: 12,
      workingHours: 'Mon–Fri',
      isAcceptingNew: true,
      licenseNumber: 'PRIV-99',
      ratingAvg: 4.7,
      ratingCount: 14,
    });

    const doctor = await DoctorService.getDoctor(3);
    expect(doctor).not.toBeNull();
    expect(doctor!.ratingAvg).toBe(4.7);
    expect(doctor!.ratingCount).toBe(14);
    expect(doctor!.title).toBe('MD');
    expect(doctor!.yearsExperience).toBe(12);
    expect(JSON.stringify(doctor)).not.toMatch(/licenseNumber/);
  });

  it('returns null for a missing doctor (404)', async () => {
    mockGetErrorOnce(404);
    const doctor = await DoctorService.getDoctor(999);
    expect(doctor).toBeNull();
  });

  it('sanitizes reviews and drops authorEmail', async () => {
    mockGetOnce([
      {
        id: 1,
        targetType: 'doctor',
        targetId: 3,
        targetName: 'Yuki Tanaka',
        rating: 5,
        title: 'Warm and kind',
        comment: 'Very supportive session.',
        authorName: 'Sam',
        authorEmail: 'sam@example.com',
        createdAt: '2026-01-01',
      },
      {
        id: 2,
        targetType: 'healer',
        targetId: 9,
        rating: 99,
      },
    ]);

    const reviews = await DoctorService.getReviews('doctor', 3);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].rating).toBe(5);
    expect(JSON.stringify(reviews)).not.toMatch(/authorEmail|sam@example\.com/);
  });

  it('requests reviews for the right target', async () => {
    const getSpy = vi.spyOn(axios, 'get').mockResolvedValueOnce({ data: [] });
    await DoctorService.getReviews('healer', 42);
    expect(getSpy).toHaveBeenCalledWith(
      'http://test.local/api/public/reviews',
      { params: { targetType: 'healer', targetId: 42 } }
    );
  });

  it('treats review 404 as an empty list', async () => {
    mockGetErrorOnce(404);
    const reviews = await DoctorService.getReviews('doctor', 1);
    expect(reviews).toEqual([]);
  });

  it('submits a review via POST and returns the sanitized record', async () => {
    mockPostOnce({
      id: 5,
      targetType: 'doctor',
      targetId: 3,
      rating: 4,
      title: 'Gentle guide',
      comment: 'Calming and clear.',
      authorName: 'Sam',
      authorEmail: 'sam@example.com',
      createdAt: '2026-01-02',
    });

    const review = await DoctorService.submitReview({
      targetType: 'doctor',
      targetId: 3,
      rating: 4,
      title: 'Gentle guide',
      comment: 'Calming and clear.',
      authorName: 'Sam',
      authorEmail: 'sam@example.com',
    });

    expect(review.id).toBe(5);
    expect(review.rating).toBe(4);
    expect(JSON.stringify(review)).not.toMatch(/authorEmail/);
  });

  it('treats a 404 as an empty directory (endpoint not published yet)', async () => {
    mockGetErrorOnce(404);
    const doctors = await DoctorService.getDoctors();
    expect(doctors).toEqual([]);
  });

  it('rejects on genuine server errors instead of hiding them', async () => {
    mockGetErrorOnce(500);
    await expect(DoctorService.getDoctors()).rejects.toBeTruthy();
  });

  it('filters out records with a non-numeric id', async () => {
    mockGetOnce([{ id: 'bad', firstName: 'X' }, { id: 2, firstName: 'Y' }]);
    const doctors = await DoctorService.getDoctors();
    expect(doctors).toHaveLength(1);
    expect(doctors[0].firstName).toBe('Y');
  });
});