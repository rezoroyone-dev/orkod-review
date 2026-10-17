import AppConfigs from "@/AppConfigs";
import axios from "axios";

export interface Doctor {
  id: number;
  title?: string;
  firstName?: string;
  lastName?: string;
  specialty?: string;
  city?: string;
  about?: string;
  certifications?: string;
  yearsExperience?: number;
  workingHours?: string;
  photoUrl?: string;
  verified?: boolean;
  isAcceptingNew?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
}

export interface Review {
  id: number;
  targetType: "doctor" | "healer";
  targetId: number;
  targetName?: string;
  rating: number;
  title?: string;
  comment?: string;
  authorName?: string;
  createdAt?: string;
}

export interface ReviewInput {
  targetType: "doctor" | "healer";
  targetId: number;
  rating: number;
  title?: string;
  comment?: string;
  authorName: string;
  authorEmail?: string;
}

const SENSITIVE_KEYS = ['phone', 'email', 'address', 'birthDate', 'folderNumber', 'personID', 'licenseNumber'];

function sanitizeDoctor(raw: any): Doctor {
  if (!raw || typeof raw !== "object") {
    return { id: Number(raw?.id) };
  }
  const doctor: Doctor = {
    id: Number(raw.id),
    title: raw.title,
    firstName: raw.firstName,
    lastName: raw.lastName,
    specialty: raw.specialty,
    city: raw.city,
    about: raw.about,
    certifications: raw.certifications,
    yearsExperience: Number(raw.yearsExperience) || undefined,
    workingHours: raw.workingHours,
    photoUrl: raw.photoUrl,
    verified: raw.verified,
    isAcceptingNew: raw.isAcceptingNew,
  };
  if (typeof raw.ratingAvg === "number" && Number.isFinite(raw.ratingAvg)) {
    doctor.ratingAvg = raw.ratingAvg;
  }
  if (typeof raw.ratingCount === "number" && Number.isFinite(raw.ratingCount)) {
    doctor.ratingCount = raw.ratingCount;
  }
  // Defense in depth: never let private fields through even if a future
  // backend version accidentally includes them.
  for (const key of SENSITIVE_KEYS) {
    delete (doctor as any)[key];
  }
  return doctor;
}

function sanitizeReview(raw: any): Review | null {
  if (!raw || typeof raw !== "object") return null;
  const rating = Number(raw.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  const review: Review = {
    id: Number(raw.id),
    targetType: raw.targetType === "healer" ? "healer" : "doctor",
    targetId: Number(raw.targetId),
    targetName: raw.targetName,
    rating,
    title: raw.title,
    comment: raw.comment,
    authorName: raw.authorName,
    createdAt: raw.createdAt,
  };
  delete (review as any).authorEmail;
  return review;
}

/**
 * Doctors directory + reviews client.
 *
 * Consumes the safe public backend endpoints (`GET/POST /api/public/doctors`,
 * `/api/public/reviews`). A 404 from either endpoint is treated as "directory
 * empty yet", which drives the honest empty state on the pages.
 */
export default class DoctorService {
  public static async getDoctors(): Promise<Doctor[]> {
    try {
      const response = await axios.get(AppConfigs.getServerURL() + "/public/doctors");
      const data: any[] = Array.isArray(response.data) ? response.data : [];
      return data.map(sanitizeDoctor).filter((d) => Number.isFinite(d.id));
    } catch (e: any) {
      if (e?.response?.status === 404) return [];
      throw e;
    }
  }

  public static async getDoctor(id: number): Promise<Doctor | null> {
    try {
      const response = await axios.get(AppConfigs.getServerURL() + `/public/doctors/${id}`);
      return sanitizeDoctor(response.data);
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  }

  public static async getReviews(targetType: "doctor" | "healer", targetId: number): Promise<Review[]> {
    try {
      const response = await axios.get(AppConfigs.getServerURL() + "/public/reviews", {
        params: { targetType, targetId },
      });
      const data: any[] = Array.isArray(response.data) ? response.data : [];
      return data
        .map(sanitizeReview)
        .filter((r): r is Review => r !== null);
    } catch (e: any) {
      if (e?.response?.status === 404) return [];
      throw e;
    }
  }

  public static async submitReview(input: ReviewInput): Promise<Review> {
    const response = await axios.post(AppConfigs.getServerURL() + "/public/reviews", input);
    const review = sanitizeReview(response.data);
    if (!review) throw new Error("Invalid review response");
    return review;
  }
}

// Kept for reference/documentation of what is stripped by the sanitizer.
void SENSITIVE_KEYS;