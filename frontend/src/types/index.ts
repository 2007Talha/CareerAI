/**
 * CareerAI — TypeScript Type Definitions
 *
 * Mirrors the backend Pydantic schemas for full type safety.
 */

// =============================================================================
// Enums
// =============================================================================

export type SkillSource = 'extracted' | 'manual' | 'assessed';
export type Importance = 'required' | 'important' | 'optional';
export type GapClassification = 'critical' | 'developing' | 'strong';
export type ExperienceType = 'internship' | 'full_time' | 'part_time' | 'freelance' | 'research' | 'volunteer';
export type MessageRole = 'user' | 'assistant';

// =============================================================================
// Profile
// =============================================================================

export interface SkillEntry {
  id: string;
  skill_name: string;
  proficiency: number;
  evidence?: string;
  source: SkillSource;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  technologies: string[];
  url?: string;
  highlights: string[];
  complexity?: number;
}

export interface Experience {
  id: string;
  title: string;
  company?: string;
  duration_months?: number;
  description?: string;
  technologies: string[];
  experience_type: ExperienceType;
}

export interface StudentProfile {
  id: string;
  full_name: string;
  email?: string;
  university?: string;
  degree?: string;
  graduation_year?: number;
  gpa?: number;
  gpa_scale?: number;
  profile_confirmed: boolean;
  skills: SkillEntry[];
  projects: Project[];
  experiences: Experience[];
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Scoring & Ranking
// =============================================================================

export interface ScoreBreakdown {
  technical_skills: number;
  projects: number;
  academics: number;
  experience: number;
  assessments: number;
  achievements: number;
}

export interface RankingData {
  student_id: string;
  overall_score: number;
  percentile: number;
  cohort_rank: number;
  cohort_size: number;
  breakdown: ScoreBreakdown;
  computed_at: string;
}

// =============================================================================
// Careers
// =============================================================================

export interface Career {
  id: string;
  name: string;
  description: string;
  avg_salary_usd?: number;
  growth_outlook?: string;
}

export interface CareerFitResult {
  career: Career;
  fit_percentage: number;
  reasons: string[];
  match_rank: number;
}

export interface CareerMatchesResponse {
  student_id: string;
  matches: CareerFitResult[];
}

// =============================================================================
// Gaps
// =============================================================================

export interface GapItem {
  skill_name: string;
  current_level: number;
  target_level: number;
  gap_size: number;
  importance: Importance;
  priority_score: number;
  classification: GapClassification;
}

export interface GapsResponse {
  student_id: string;
  career_id: string;
  career_name: string;
  gaps: GapItem[];
}

// =============================================================================
// Roadmap
// =============================================================================

export interface RoadmapItem {
  id: string;
  action_title: string;
  action_detail: string;
  priority_order: number;
  phase?: string;
  estimated_hours?: number;
  resource_url?: string;
  gap_skill_name?: string;
  is_completed: boolean;
  completed_at?: string;
}

export interface RoadmapResponse {
  student_id: string;
  career_id: string;
  career_name: string;
  items: RoadmapItem[];
}

// =============================================================================
// Coach
// =============================================================================

export interface CoachMessage {
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface CoachChatResponse {
  student_id: string;
  reply: string;
  history: CoachMessage[];
}

// =============================================================================
// Upload
// =============================================================================

export interface UploadResponse {
  student_id: string;
  filename: string;
  raw_text_preview: string;
  extracted_profile: StudentProfile;
  message: string;
}

// =============================================================================
// Progress / What-If
// =============================================================================

export interface RecalculateResponse {
  student_id: string;
  previous_score: number;
  new_score: number;
  score_change: number;
  new_breakdown: ScoreBreakdown;
  message: string;
}

// =============================================================================
// Health
// =============================================================================

export interface HealthResponse {
  status: string;
  database: boolean;
  version: string;
}
