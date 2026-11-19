/**
 * CareerAI — Centralized System Constants
 *
 * Centralizes all numeric thresholds, timeouts, scoring weights,
 * and strings to guarantee zero magic literals across the frontend codebase.
 */

export const APP_CONFIG = {
  APP_NAME: 'CareerAI',
  DEFAULT_API_TIMEOUT_MS: 30000,
  ABORT_TIMEOUT_MS: 5000,
  AI_API_TIMEOUT_MS: 45000,
  CACHE_TTL_MS: 300000, // 5 minutes
  MAX_CACHE_ENTRIES: 100,
  DEBOUNCE_DELAY_MS: 300,
} as const;

export const SCORING_WEIGHTS = {
  TECHNICAL_SKILLS: 0.25,
  PROJECTS: 0.25,
  ACADEMICS: 0.20,
  EXPERIENCE: 0.10,
  ASSESSMENTS: 0.10,
  ACHIEVEMENTS: 0.10,
} as const;

export const READINESS_THRESHOLDS = {
  EXCEPTIONAL: 85,
  COMPETITIVE: 70,
  DEVELOPING: 50,
  EMERGING: 0,
} as const;

export const ACCESSIBILITY_CONFIG = {
  COMFORT_TARGET_MIN_PX: 56,
  DEFAULT_TARGET_MIN_PX: 44,
} as const;

export const TELEMETRY_DEFAULTS = {
  SANITIZER_STATUS: 'Active (0 Threats)',
  PROMPT_GUARD_STATUS: 'Guarded (0.00 Risk)',
  PII_SCRUBBED_COUNT: 0,
  CACHE_HIT_RATE: '100% Deterministic',
} as const;
