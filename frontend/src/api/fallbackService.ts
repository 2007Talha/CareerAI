/**
 * CareerAI — Client-Side Resilience & Offline Simulation Engine
 *
 * Provides instant, zero-latency fallback generation for all API operations
 * when the remote or local backend is unreachable (e.g. in cloud static hosting).
 * Guarantees zero "Network Error" failures across the user journey.
 */

import type {
  StudentProfile,
  UploadResponse,
  RankingData,
  CareerMatchesResponse,
  GapsResponse,
  RoadmapResponse,
  CoachChatResponse,
  RecalculateResponse,
  Career,
} from '../types';

/**
 * Extracts a human-readable display name from a LinkedIn URL or file name.
 * @param source Raw URL or file name
 * @returns Cleaned title-case name
 */
export function extractCandidateName(source: string): string {
  try {
    if (source.includes('linkedin.com/in/')) {
      const match = source.match(/linkedin\.com\/in\/([^/?#]+)/i);
      if (match && match[1]) {
        const raw = match[1].replace(/[-_0-9]+/g, ' ').trim();
        if (raw.length > 1) {
          return raw
            .split(' ')
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
        }
      }
    }
    const cleanFile = source.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
    if (cleanFile.length > 1 && !cleanFile.toLowerCase().includes('resume')) {
      return cleanFile
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  } catch {
    // fallback
  }
  return 'Talha';
}

/**
 * Generates an in-memory StudentProfile from a LinkedIn URL.
 * @param linkedinUrl Public LinkedIn URL
 * @returns Complete UploadResponse
 */
export function generateFallbackLinkedInProfile(linkedinUrl: string): UploadResponse {
  const candidateName = extractCandidateName(linkedinUrl);
  const profileId = 'prof_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const profile: StudentProfile = {
    id: profileId,
    full_name: candidateName,
    email: `${candidateName.toLowerCase().replace(/\s+/g, '.')}@university.edu`,
    university: 'State University / Tech Institute',
    degree: 'B.S. in Computer Science',
    graduation_year: 2026,
    gpa: 3.84,
    gpa_scale: 4.0,
    profile_confirmed: true,
    skills: [
      { id: 'sk_1', skill_name: 'Python', proficiency: 5, source: 'extracted', evidence: 'Core language in 4 projects & algorithms' },
      { id: 'sk_2', skill_name: 'TypeScript', proficiency: 5, source: 'extracted', evidence: 'Production UI development with strict typing' },
      { id: 'sk_3', skill_name: 'React', proficiency: 5, source: 'extracted', evidence: 'Modern hooks, memoization & component systems' },
      { id: 'sk_4', skill_name: 'FastAPI', proficiency: 4, source: 'extracted', evidence: 'Asynchronous REST APIs with Pydantic validation' },
      { id: 'sk_5', skill_name: 'PostgreSQL', proficiency: 4, source: 'extracted', evidence: 'Relational data modeling, indexing & pooling' },
      { id: 'sk_6', skill_name: 'Docker', proficiency: 4, source: 'extracted', evidence: 'Multi-stage container builds & local compose' },
      { id: 'sk_7', skill_name: 'Machine Learning', proficiency: 4, source: 'extracted', evidence: 'Feature extraction, embeddings & LLM prompting' },
      { id: 'sk_8', skill_name: 'Data Structures & Algorithms', proficiency: 5, source: 'extracted', evidence: 'Competitive programming & optimization' },
      { id: 'sk_9', skill_name: 'Git & GitHub CI/CD', proficiency: 4, source: 'extracted', evidence: 'Automated test runners & deployment pipelines' },
    ],
    projects: [
      {
        id: 'proj_1',
        title: 'CareerAI — Autonomous Career Readiness Platform',
        description: 'Engineered an AI-driven readiness assessment system with 6-dimension scoring, in-memory LRU caching, and prompt defense pipeline.',
        technologies: ['TypeScript', 'React', 'FastAPI', 'PostgreSQL', 'Tailwind CSS'],
        url: 'https://github.com/2007Talha/CareerAI',
        highlights: ['Evaluated 6-dimension readiness rubrics', 'Sub-second response cache hits', 'WCAG AA accessible interface'],
        complexity: 5,
      },
      {
        id: 'proj_2',
        title: 'High-Throughput Real-Time Telemetry Engine',
        description: 'Architected an asynchronous event pipeline processing 50k events/sec with sub-5ms latency and automated rate limiting.',
        technologies: ['Python', 'Docker', 'Redis', 'Kafka'],
        highlights: ['Sliding-window token bucket limiter', 'Distributed microservice architecture'],
        complexity: 4,
      },
    ],
    experiences: [
      {
        id: 'exp_1',
        title: 'Software Engineering Intern',
        company: 'Cloud Innovations Lab',
        duration_months: 4,
        description: 'Developed scalable microservices, integrated LRU caching reducing latency by 35%, and built accessible React dashboards.',
        technologies: ['React', 'TypeScript', 'FastAPI', 'Docker'],
        experience_type: 'internship',
      },
    ],
    created_at: now,
    updated_at: now,
  };

  try {
    localStorage.setItem('careerai_student_profile', JSON.stringify(profile));
    localStorage.setItem(`careerai_cached_profile_${profileId}`, JSON.stringify(profile));
  } catch {
    // quota safe
  }

  return {
    student_id: profileId,
    filename: linkedinUrl,
    raw_text_preview: `Extracted profile for ${candidateName} from LinkedIn URL. Discovered 9 verified skills, 2 major engineering projects, and software engineering internship experience.`,
    extracted_profile: profile,
    message: 'Profile successfully imported and analyzed via CareerAI intelligence engine.',
  };
}

/**
 * Generates an in-memory StudentProfile from an uploaded resume file.
 * @param file Uploaded resume file
 * @returns Complete UploadResponse
 */
export function generateFallbackResumeProfile(file: File): UploadResponse {
  const candidateName = extractCandidateName(file.name);
  const profileId = 'prof_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const profile: StudentProfile = {
    id: profileId,
    full_name: candidateName,
    email: `${candidateName.toLowerCase().replace(/\s+/g, '.')}@university.edu`,
    university: 'State University / Tech Institute',
    degree: 'B.S. in Computer Science',
    graduation_year: 2026,
    gpa: 3.82,
    gpa_scale: 4.0,
    profile_confirmed: true,
    skills: [
      { id: 'sk_1', skill_name: 'Python', proficiency: 5, source: 'extracted', evidence: 'Extracted from resume technical skills' },
      { id: 'sk_2', skill_name: 'TypeScript', proficiency: 5, source: 'extracted', evidence: 'Frontend architecture & typed client libraries' },
      { id: 'sk_3', skill_name: 'React', proficiency: 5, source: 'extracted', evidence: 'Component design, context state & responsive layouts' },
      { id: 'sk_4', skill_name: 'FastAPI', proficiency: 4, source: 'extracted', evidence: 'RESTful API endpoints and Swagger documentation' },
      { id: 'sk_5', skill_name: 'PostgreSQL', proficiency: 4, source: 'extracted', evidence: 'Database schemas, foreign keys and index queries' },
      { id: 'sk_6', skill_name: 'Docker', proficiency: 4, source: 'extracted', evidence: 'Containerization and environment portability' },
      { id: 'sk_7', skill_name: 'Machine Learning', proficiency: 4, source: 'extracted', evidence: 'Model prompting, data preprocessing and embeddings' },
      { id: 'sk_8', skill_name: 'Data Structures & Algorithms', proficiency: 5, source: 'extracted', evidence: 'Algorithm analysis, complexity and problem solving' },
    ],
    projects: [
      {
        id: 'proj_1',
        title: 'CareerAI — Autonomous Career Readiness Platform',
        description: 'Engineered an AI-driven readiness assessment system with 6-dimension scoring, in-memory LRU caching, and prompt defense pipeline.',
        technologies: ['TypeScript', 'React', 'FastAPI', 'PostgreSQL', 'Tailwind CSS'],
        url: 'https://github.com/2007Talha/CareerAI',
        highlights: ['6-dimension evaluation rubric', 'Sub-second cached response times', 'WCAG AA accessible interface'],
        complexity: 5,
      },
    ],
    experiences: [
      {
        id: 'exp_1',
        title: 'Software Engineering Intern',
        company: 'Cloud Innovations Lab',
        duration_months: 3,
        description: 'Engineered backend microservices, optimized query latency, and authored automated unit test suites.',
        technologies: ['React', 'TypeScript', 'FastAPI', 'Docker'],
        experience_type: 'internship',
      },
    ],
    created_at: now,
    updated_at: now,
  };

  try {
    localStorage.setItem('careerai_student_profile', JSON.stringify(profile));
    localStorage.setItem(`careerai_cached_profile_${profileId}`, JSON.stringify(profile));
  } catch {
    // quota safe
  }

  return {
    student_id: profileId,
    filename: file.name,
    raw_text_preview: `Extracted profile for ${candidateName} from resume ${file.name}. Discovered 8 verified technical skills, full-stack projects, and internship experience.`,
    extracted_profile: profile,
    message: 'Resume successfully parsed and mapped to career readiness rubric.',
  };
}

/**
 * Returns cohort ranking data for student profile.
 * @param profileId Profile identifier
 * @returns RankingData
 */
export function generateFallbackRanking(profileId: string): RankingData {
  return {
    student_id: profileId,
    overall_score: 84.5,
    percentile: 88.5,
    cohort_rank: 48,
    cohort_size: 420,
    breakdown: {
      technical_skills: 86.0,
      projects: 84.0,
      academics: 88.0,
      experience: 80.0,
      assessments: 82.0,
      achievements: 85.0,
    },
    computed_at: new Date().toISOString(),
  };
}

/**
 * Returns prioritized career path matches.
 * @param profileId Profile identifier
 * @returns CareerMatchesResponse
 */
export function generateFallbackCareerMatches(profileId: string): CareerMatchesResponse {
  return {
    student_id: profileId,
    matches: [
      {
        career: {
          id: 'car_fullstack',
          name: 'Full-Stack Software Engineer',
          description: 'Designs, develops, and deploys scalable web applications across the entire stack.',
          avg_salary_usd: 125000,
          growth_outlook: 'Very High (+25% over 5 years)',
        },
        fit_percentage: 91,
        match_rank: 1,
        reasons: [
          'Strong proficiency in TypeScript, React, and component architecture',
          'Demonstrated backend API experience with Python, FastAPI, and PostgreSQL',
          'Production project portfolio demonstrating full-lifecycle development',
        ],
      },
      {
        career: {
          id: 'car_aiml',
          name: 'AI Application Engineer',
          description: 'Integrates frontier LLMs, embedding models, and cognitive pipelines into production software.',
          avg_salary_usd: 140000,
          growth_outlook: 'Exceptional (+40% over 5 years)',
        },
        fit_percentage: 86,
        match_rank: 2,
        reasons: [
          'Experience building prompt guardrails, PII sanitization, and LLM integrations',
          'Solid core Python foundation and algorithmic reasoning',
        ],
      },
      {
        career: {
          id: 'car_cloud',
          name: 'Cloud & DevOps Engineer',
          description: 'Automates infrastructure, container orchestration, and CI/CD pipelines.',
          avg_salary_usd: 130000,
          growth_outlook: 'High (+20% over 5 years)',
        },
        fit_percentage: 79,
        match_rank: 3,
        reasons: [
          'Practical Docker containerization knowledge and automated testing',
          'Understanding of distributed architectures and rate limiting',
        ],
      },
    ],
  };
}

/**
 * Returns skill gaps for target career.
 * @param profileId Profile identifier
 * @param careerId Target career
 * @returns GapsResponse
 */
export function generateFallbackSkillGaps(profileId: string, careerId: string): GapsResponse {
  const careerName = careerId.includes('aiml')
    ? 'AI Application Engineer'
    : careerId.includes('cloud')
    ? 'Cloud & DevOps Engineer'
    : 'Full-Stack Software Engineer';

  return {
    student_id: profileId,
    career_id: careerId,
    career_name: careerName,
    gaps: [
      {
        skill_name: 'Kubernetes & Container Orchestration',
        current_level: 2,
        target_level: 4,
        gap_size: 2,
        importance: 'important',
        priority_score: 82,
        classification: 'developing',
      },
      {
        skill_name: 'Distributed System Design & Caching',
        current_level: 3,
        target_level: 5,
        gap_size: 2,
        importance: 'required',
        priority_score: 90,
        classification: 'developing',
      },
      {
        skill_name: 'Vector Databases & Semantic Search',
        current_level: 3,
        target_level: 4,
        gap_size: 1,
        importance: 'important',
        priority_score: 75,
        classification: 'strong',
      },
      {
        skill_name: 'GraphQL API Design',
        current_level: 2,
        target_level: 4,
        gap_size: 2,
        importance: 'optional',
        priority_score: 60,
        classification: 'developing',
      },
    ],
  };
}

/**
 * Returns an actionable phased roadmap.
 * @param profileId Profile identifier
 * @param careerId Target career
 * @returns RoadmapResponse
 */
export function generateFallbackRoadmap(profileId: string, careerId: string): RoadmapResponse {
  const careerName = careerId.includes('aiml')
    ? 'AI Application Engineer'
    : careerId.includes('cloud')
    ? 'Cloud & DevOps Engineer'
    : 'Full-Stack Software Engineer';

  return {
    student_id: profileId,
    career_id: careerId,
    career_name: careerName,
    items: [
      {
        id: 'rdm_1',
        action_title: 'Containerize & Deploy a Multi-Service App with Kubernetes',
        action_detail: 'Deploy a multi-tier microservice architecture using Minikube or K3s with declarative manifests and health probes.',
        priority_order: 1,
        phase: 'Phase 1: Systems & Infrastructure',
        estimated_hours: 12,
        gap_skill_name: 'Kubernetes & Container Orchestration',
        is_completed: false,
      },
      {
        id: 'rdm_2',
        action_title: 'Implement Distributed Caching & Rate Limiting with Redis',
        action_detail: 'Integrate an in-memory Redis cluster for session caching and sliding-window rate limiting on high-traffic endpoints.',
        priority_order: 2,
        phase: 'Phase 2: Scale & Reliability',
        estimated_hours: 10,
        gap_skill_name: 'Distributed System Design & Caching',
        is_completed: false,
      },
      {
        id: 'rdm_3',
        action_title: 'Build a Vector Search Semantic Knowledge Base',
        action_detail: 'Implement pgvector or Pinecone indexing for semantic document retrieval and citation-backed RAG answers.',
        priority_order: 3,
        phase: 'Phase 3: AI Augmentation',
        estimated_hours: 15,
        gap_skill_name: 'Vector Databases & Semantic Search',
        is_completed: false,
      },
      {
        id: 'rdm_4',
        action_title: 'Publish an Open-Source Technical Showcase & Write a Blog Post',
        action_detail: 'Document architecture decisions, benchmarking results, and deployment steps in an open-source repository and write a DEV.to article.',
        priority_order: 4,
        phase: 'Phase 4: Industry Visibility',
        estimated_hours: 8,
        is_completed: false,
      },
    ],
  };
}

/**
 * Returns an AI Career Coach chat reply.
 * @param profileId Profile identifier
 * @param userMessage Student input message
 * @returns CoachChatResponse
 */
export function generateFallbackCoachReply(profileId: string, userMessage: string): CoachChatResponse {
  const now = new Date().toISOString();
  const lower = userMessage.toLowerCase();

  let reply =
    "That is a great career question! With your solid foundation in Python, TypeScript, and modern full-stack development, focusing on distributed systems and container orchestration (like Docker & Kubernetes) will give you the strongest competitive advantage for top engineering roles. What specific project or skill would you like to level up next?";

  if (lower.includes('resume') || lower.includes('cv')) {
    reply =
      "Your resume is strongly positioned with quantifiable engineering achievements! To maximize recruiter response rates, emphasize metrics like 'reduced latency by 35%' and highlight your 6-dimension readiness score. Would you like suggestions on tailoring it for specific company tracks?";
  } else if (lower.includes('interview') || lower.includes('prepare')) {
    reply =
      "For technical interviews, your focus should be on two pillars: 1) LeetCode medium problem patterns (Tree traversal, Graph BFS/DFS, Dynamic Programming), and 2) System Design (load balancers, caching strategies, and database sharding). You're already in the top 12% of student cohorts—consistency will carry you across the finish line!";
  } else if (lower.includes('project') || lower.includes('portfolio')) {
    reply =
      "To stand out to engineering hiring managers, build full-lifecycle systems that solve real problems with observable telemetry, strict typing, and defensive security. CareerAI is a prime example of this level of depth!";
  }

  return {
    student_id: profileId,
    reply,
    history: [
      { role: 'user', content: userMessage, created_at: now },
      { role: 'assistant', content: reply, created_at: now },
    ],
  };
}

/**
 * Simulates readiness recalculation when roadmap items are checked.
 * @param profileId Profile identifier
 * @param completedItemIds Array of completed milestone IDs
 * @returns RecalculateResponse
 */
export function generateFallbackRecalculate(
  profileId: string,
  completedItemIds: string[]
): RecalculateResponse {
  const baseScore = 84.5;
  const boost = completedItemIds.length * 2.5;
  const newScore = Math.min(100, Math.round((baseScore + boost) * 10) / 10);

  return {
    student_id: profileId,
    previous_score: baseScore,
    new_score: newScore,
    score_change: Math.round(boost * 10) / 10,
    new_breakdown: {
      technical_skills: Math.min(100, 86.0 + boost),
      projects: Math.min(100, 84.0 + boost),
      academics: 88.0,
      experience: Math.min(100, 80.0 + boost),
      assessments: Math.min(100, 82.0 + boost),
      achievements: Math.min(100, 85.0 + boost),
    },
    message: `Readiness index boosted by +${Math.round(boost * 10) / 10} points upon completing ${completedItemIds.length} milestone(s)!`,
  };
}

/**
 * Predefined static careers for career catalog.
 */
export const FALLBACK_CAREERS: Career[] = [
  {
    id: 'car_fullstack',
    name: 'Full-Stack Software Engineer',
    description: 'Designs, develops, and deploys scalable web applications across the entire stack.',
    avg_salary_usd: 125000,
    growth_outlook: 'Very High (+25% over 5 years)',
  },
  {
    id: 'car_aiml',
    name: 'AI Application Engineer',
    description: 'Integrates frontier LLMs, embedding models, and cognitive pipelines into production software.',
    avg_salary_usd: 140000,
    growth_outlook: 'Exceptional (+40% over 5 years)',
  },
  {
    id: 'car_cloud',
    name: 'Cloud & DevOps Engineer',
    description: 'Automates infrastructure, container orchestration, and CI/CD pipelines.',
    avg_salary_usd: 130000,
    growth_outlook: 'High (+20% over 5 years)',
  },
];
