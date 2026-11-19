/**
 * CareerAI — Production API Client with Defensive Guardrails
 *
 * Centralized API client incorporating:
 * - Deterministic hash-keyed LRU response caching for GET queries
 * - Pre-LLM Defensive Security Pipeline (Sanitization, PII Redaction, Prompt Guard)
 * - Strict type annotations with zero 'any'
 * - Resource timeouts and standardized error propagation
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  StudentProfile,
  RankingData,
  CareerMatchesResponse,
  Career,
  GapsResponse,
  RoadmapResponse,
  CoachChatResponse,
  UploadResponse,
  RecalculateResponse,
  HealthResponse,
} from '../types';
import { sanitizeInput } from '../lib/security/sanitizer';
import { redactPII } from '../lib/security/piiRedactor';
import { inspectPrompt } from '../lib/security/promptGuard';
import { globalResponseCache } from '../lib/cache/responseCache';
import { APP_CONFIG } from '../config/constants';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: APP_CONFIG.DEFAULT_API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; error?: string }>) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

/**
 * Checks backend health status.
 * @returns HealthResponse payload
 */
export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await axios.get<HealthResponse>(`${API_BASE_URL}/health`, {
    timeout: APP_CONFIG.ABORT_TIMEOUT_MS,
  });
  return data;
}

/**
 * Uploads a student resume document for structured parsing.
 * @param file PDF or DOCX resume file
 * @returns UploadResponse containing extracted profile and readiness data
 */
export async function uploadResume(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<UploadResponse>('/profiles/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data;
}

/**
 * Imports public student profile data from LinkedIn URL.
 * @param linkedinUrl Public LinkedIn URL
 * @returns UploadResponse
 */
export async function importLinkedInProfile(linkedinUrl: string): Promise<UploadResponse> {
  const cleanUrl = sanitizeInput(linkedinUrl);
  const { data } = await api.post<UploadResponse>('/profiles/linkedin', {
    linkedin_url: cleanUrl,
  }, {
    timeout: 60000,
  });
  return data;
}

/**
 * Creates a student profile from manual form submission.
 * @param profileData Partial student profile payload
 * @returns Created StudentProfile
 */
export async function createProfile(profileData: Partial<StudentProfile>): Promise<StudentProfile> {
  const { data } = await api.post<StudentProfile>('/profiles', profileData);
  return data;
}

/**
 * Retrieves a student profile by identifier with LRU caching.
 * @param profileId Unique profile UUID
 * @returns StudentProfile
 */
export async function getProfile(profileId: string): Promise<StudentProfile> {
  const cacheKey = globalResponseCache.generateKey('profile', profileId);
  const cached = globalResponseCache.get(cacheKey) as StudentProfile | null;
  if (cached) return cached;

  const { data } = await api.get<StudentProfile>(`/profiles/${profileId}`);
  globalResponseCache.set(cacheKey, data);
  return data;
}

/**
 * Updates an existing student profile.
 * @param profileId Unique profile UUID
 * @param updateData Partial update payload
 * @returns Updated StudentProfile
 */
export async function updateProfile(
  profileId: string,
  updateData: Partial<StudentProfile>
): Promise<StudentProfile> {
  const { data } = await api.put<StudentProfile>(`/profiles/${profileId}`, updateData);
  globalResponseCache.clear();
  return data;
}

/**
 * Triggers AI analysis on an existing profile.
 * @param profileId Unique profile UUID
 * @returns Updated StudentProfile
 */
export async function analyzeProfile(profileId: string): Promise<StudentProfile> {
  const { data } = await api.post<StudentProfile>(`/profiles/${profileId}/analyze`);
  globalResponseCache.clear();
  return data;
}

/**
 * Retrieves student cohort ranking, percentile, and score breakdown.
 * @param profileId Unique profile UUID
 * @returns RankingData
 */
export async function getRanking(profileId: string): Promise<RankingData> {
  const cacheKey = globalResponseCache.generateKey('ranking', profileId);
  const cached = globalResponseCache.get(cacheKey) as RankingData | null;
  if (cached) return cached;

  const { data } = await api.get<RankingData>(`/ranking/${profileId}`);
  globalResponseCache.set(cacheKey, data);
  return data;
}

/**
 * Lists all predefined career paths.
 * @returns Array of Career definitions
 */
export async function listCareers(): Promise<Career[]> {
  const cacheKey = 'careers::list';
  const cached = globalResponseCache.get(cacheKey) as Career[] | null;
  if (cached) return cached;

  const { data } = await api.get<Career[]>('/careers');
  globalResponseCache.set(cacheKey, data);
  return data;
}

/**
 * Retrieves prioritized career matches for the student.
 * @param profileId Unique profile UUID
 * @returns CareerMatchesResponse
 */
export async function getCareerMatches(profileId: string): Promise<CareerMatchesResponse> {
  const cacheKey = globalResponseCache.generateKey('career_matches', profileId);
  const cached = globalResponseCache.get(cacheKey) as CareerMatchesResponse | null;
  if (cached) return cached;

  const { data } = await api.get<CareerMatchesResponse>(`/careers/${profileId}/matches`);
  globalResponseCache.set(cacheKey, data);
  return data;
}

/**
 * Retrieves prioritized skill gaps for a targeted career.
 * @param profileId Student profile UUID
 * @param careerId Target career UUID
 * @returns GapsResponse
 */
export async function getSkillGaps(profileId: string, careerId: string): Promise<GapsResponse> {
  const cacheKey = globalResponseCache.generateKey('gaps', profileId, careerId);
  const cached = globalResponseCache.get(cacheKey) as GapsResponse | null;
  if (cached) return cached;

  const { data } = await api.get<GapsResponse>(`/gaps/${profileId}`, {
    params: { career_id: careerId },
  });
  globalResponseCache.set(cacheKey, data);
  return data;
}

/**
 * Retrieves a phased actionable roadmap tailored to closing skill gaps.
 * @param profileId Student profile UUID
 * @param careerId Target career UUID
 * @returns RoadmapResponse
 */
export async function getRoadmap(profileId: string, careerId: string): Promise<RoadmapResponse> {
  const cacheKey = globalResponseCache.generateKey('roadmap', profileId, careerId);
  const cached = globalResponseCache.get(cacheKey) as RoadmapResponse | null;
  if (cached) return cached;

  const { data } = await api.get<RoadmapResponse>(`/roadmap/${profileId}`, {
    params: { career_id: careerId },
  });
  globalResponseCache.set(cacheKey, data);
  return data;
}

/**
 * Sends a message to the AI Career Coach with pre-LLM security defenses.
 * @param profileId Student profile UUID
 * @param message Raw student message
 * @param careerId Optional career path ID
 * @returns CoachChatResponse
 */
export async function sendCoachMessage(
  profileId: string,
  message: string,
  careerId?: string
): Promise<CoachChatResponse> {
  // 1. Sanitization: Strip dangerous script & XSS payloads
  const sanitized = sanitizeInput(message);

  // 2. Prompt Guard: Check for jailbreak & prompt injection attempts
  const inspection = inspectPrompt(sanitized);
  if (!inspection.isSafe) {
    return {
      student_id: profileId,
      reply: "I am your AI Career Coach. I am programmed to focus strictly on career readiness, skill development, and professional growth. Let's keep our discussion focused on your career goals!",
      history: [
        {
          role: 'user',
          content: sanitized,
          created_at: new Date().toISOString(),
        },
        {
          role: 'assistant',
          content: "I am your AI Career Coach. I am programmed to focus strictly on career readiness, skill development, and professional growth. Let's keep our discussion focused on your career goals!",
          created_at: new Date().toISOString(),
        },
      ],
    };
  }

  // 3. PII Redaction: Pre-LLM redaction of personal credentials
  const { redactedText } = redactPII(sanitized);

  const { data } = await api.post<CoachChatResponse>(
    `/coach/${profileId}/chat`,
    { message: redactedText },
    {
      params: careerId ? { career_id: careerId } : {},
      timeout: APP_CONFIG.AI_API_TIMEOUT_MS,
    }
  );
  return data;
}

/**
 * Simulates readiness score recalculation for completed milestones.
 * @param profileId Student profile UUID
 * @param completedItemIds Array of completed milestone IDs
 * @returns RecalculateResponse
 */
export async function recalculateScore(
  profileId: string,
  completedItemIds: string[]
): Promise<RecalculateResponse> {
  const { data } = await api.post<RecalculateResponse>(`/progress/${profileId}/recalculate`, {
    completed_item_ids: completedItemIds,
  });
  return data;
}

export default api;
