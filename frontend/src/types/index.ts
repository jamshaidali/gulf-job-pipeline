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

