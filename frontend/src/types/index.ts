export interface HiringManager {
  name: string;
  role: string;
  linkedin_url: string;
}

export interface TailoredBullet {
  suggested_bullet: string;
  target_skill?: string;
  relevance_reason?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  source: string;
  posted_ago: string;
  posted_date?: string;
  posted_days_ago?: number;
  apply_url: string;
  description: string;
  match_score: number;
  fit_verdict: string;
  summary: string;
  missing_keywords: string[];
  tailored_bullets: TailoredBullet[];
  tailored_headline?: string;
  hiring_managers: HiringManager[];
  status: 'new' | 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'trash';
  feedback_rating?: 'like' | 'dislike' | 'neutral';
  feedback_notes?: string;
  created_at?: string;
  updated_at?: string;
  is_locked?: boolean;
  // Local state extensions
  coverLetter?: string;
  loadingCoverLetter?: boolean;
}

export interface UserProfile {
  id?: number;
  username: string;
  full_name?: string;
  email?: string;
  role?: string;
  searches_count?: number;
  max_free_searches?: number;
  searches_remaining?: number;
  is_pro?: boolean;
  is_unlimited?: boolean;
}

export interface WorkExperienceItem {
  title: string;
  company: string;
  period: string;
  location?: string;
  bullets?: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  year?: string;
}

export interface UserPreferences {
  candidate_name?: string;
  primary_stack?: string[];
  default_roles?: string[];
  excluded_keywords?: string[];
  experience_level?: string;
  active_cv?: string;
  email?: string;
  phone?: string;
  current_location?: string;
  target_locations?: string[];
  expected_salary?: string;
  work_history?: WorkExperienceItem[];
  education?: EducationItem[];
  bio?: string;
}

export interface PipelineStats {
  total_jobs: number;
  high_match: number;
  gulf_jobs: number;
  pakistan_jobs: number;
  applied_jobs: number;
  interviewing_jobs: number;
  saved_jobs: number;
  trashed_jobs: number;
  active_cv?: string;
  candidate_name?: string;
}

export interface RecruiterOutreachResponse {
  status: string;
  job_id: string;
  recruiter_name: string;
  linkedin_note: string;
  email_draft: string;
}

export interface NotificationSettings {
  alerts_enabled: boolean;
  alert_email: string;
  min_match_score: number;
  preferred_regions: string[];
  frequency: 'instant' | 'daily';
  last_alert_sent_at?: string | null;
}

export interface CVTemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  bg: string;
  rule: string;
}

export interface CVTemplate {
  id: string;
  name: string;
  category: string;
  layout: string;
  palette: string;
  badge: string;
  ats_score: string;
  description: string;
  font_family: string;
  colors: CVTemplateColors;
}

export interface CVTemplatesResponse {
  status: string;
  total_templates: number;
  categories: string[];
  templates: CVTemplate[];
}

export interface ATSScanResults {
  overall_score: number;
  fit_verdict: string;
  verdict_badge: string;
  summary_text: string;
  sub_scores: {
    hard_skills: number;
    soft_skills: number;
    keyword_density: number;
    experience_impact: number;
    formatting_audit: number;
  };
  skills_analysis: {
    matched_hard_skills: string[];
    missing_hard_skills: string[];
    matched_soft_skills: string[];
    missing_soft_skills: string[];
  };
  keywords_table: Array<{
    keyword: string;
    count: number;
    in_cv: boolean;
    priority: string;
  }>;
  sections_audit: {
    contact_info: {
      passed: boolean;
      score: number;
      has_email: boolean;
      has_phone: boolean;
      has_linkedin: boolean;
      has_github: boolean;
      notes: string;
    };
    summary: {
      passed: boolean;
      score: number;
      notes: string;
    };
    experience: {
      passed: boolean;
      score: number;
      action_verbs_count: number;
      action_verbs_found: string[];
      metrics_count: number;
      metrics_found: string[];
      weak_verbs_found: string[];
      notes: string;
    };
    skills: {
      passed: boolean;
      score: number;
      count: number;
      notes: string;
    };
    education: {
      passed: boolean;
      score: number;
      notes: string;
    };
  };
  tailored_kit: {
    headline: string;
    summary: string;
    bullets: Array<{
      focus: string;
      bullet: string;
    }>;
  };
  priority_action_items: string[];
  parsed_resume?: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    linkedIn: string;
    github: string;
    summary: string;
    skills: string[];
    experiences: Array<{
      id: string;
      company: string;
      position: string;
      location: string;
      startDate: string;
      endDate: string;
      bullets: string[];
    }>;
    educations: Array<{
      id: string;
      institution: string;
      degree: string;
      year: string;
      honors: string;
    }>;
    projects: Array<{
      id: string;
      title: string;
      description: string;
      techStack: string;
    }>;
  };
  source_filename?: string;
}

export interface ATSSampleData {
  job_title: string;
  company: string;
  job_description: string;
  sample_cv: string;
}

