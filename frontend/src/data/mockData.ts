import type { StudentProfile, RankingData, CareerMatchesResponse } from '../types';

export const INITIAL_DEMO_PROFILE: StudentProfile = {
  id: 'd0000001-0000-0000-0000-000000000001',
  full_name: 'Alex Rivera',
  email: 'engineeringcandidate@exemple.com',
  university: 'University',
  degree: 'B.Tech Computer Science',
  graduation_year: 2025,
  gpa: 8.5,
  gpa_scale: 10.0,
  profile_confirmed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  skills: [
    { id: 's1', skill_name: 'Python', proficiency: 4, evidence: 'Used in 2 backend projects', source: 'extracted' },
    { id: 's2', skill_name: 'JavaScript', proficiency: 3, evidence: 'React frontend experience', source: 'extracted' },
    { id: 's3', skill_name: 'SQL', proficiency: 3, evidence: 'PostgreSQL database design', source: 'extracted' },
    { id: 's4', skill_name: 'Git', proficiency: 4, evidence: 'Version control & collaboration', source: 'extracted' },
  ],
  projects: [
    {
      id: 'p1',
      title: 'Full-Stack Web Application',
      description: 'Designed and engineered end-to-end full stack software application featured in resume portfolio.',
      complexity: 3,
      technologies: ['Python', 'JavaScript', 'SQL', 'Git'],
      highlights: ['Engineered responsive UI and REST endpoints', 'Integrated database persistence'],
    },
  ],
  experiences: [
    {
      id: 'e1',
      title: 'Software Intern',
      company: 'Tech Solutions Lab',
      duration_months: 3,
      description: 'Assisted in building REST APIs and frontend components.',
      technologies: ['Python', 'FastAPI', 'PostgreSQL'],
      experience_type: 'internship',
    },
  ],
};

export const INITIAL_DEMO_RANKING: RankingData = {
  student_id: 'd0000001-0000-0000-0000-000000000001',
  overall_score: 42.2,
  percentile: 33.0,
  cohort_rank: 4,
  cohort_size: 6,
  breakdown: {
    technical_skills: 51.8,
    projects: 29.1,
    academics: 96.0,
    experience: 27.7,
    assessments: 0.0,
    achievements: 0.0,
  },
  computed_at: new Date().toISOString(),
};

export const INITIAL_DEMO_CAREER_MATCHES: CareerMatchesResponse = {
  student_id: 'd0000001-0000-0000-0000-000000000001',
  matches: [
    {
      career: {
        id: 'e0000001-0000-0000-0000-000000000001',
        name: 'Software Engineer',
        description: 'Design and build full-stack web and backend applications.',
        avg_salary_usd: 120000,
        growth_outlook: 'High',
      },
      fit_percentage: 35.0,
      reasons: ['Strong foundation in Python and JavaScript with demonstrated full-stack project.'],
      match_rank: 1,
    },
    {
      career: {
        id: 'e0000001-0000-0000-0000-000000000002',
        name: 'ML Engineer',
        description: 'Develop and deploy machine learning models in production.',
        avg_salary_usd: 140000,
        growth_outlook: 'Very High',
      },
      fit_percentage: 28.0,
      reasons: ['Proficient in Python and SQL; needs machine learning and MLOps coursework.'],
      match_rank: 2,
    },
  ],
};
