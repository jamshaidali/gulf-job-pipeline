import { 
  Job, 
  PipelineStats, 
  UserPreferences, 
  UserProfile, 
  RecruiterOutreachResponse,
  NotificationSettings,
  CVTemplatesResponse
} from '@/types';

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function fetchStats(): Promise<PipelineStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchJobs(params: {
  region?: string;
  status?: string;
  timeFilter?: string;
  search?: string;
  minScore?: number;
  page?: number;
  limit?: number;
}): Promise<Job[]> {
  const query = new URLSearchParams();
  if (params.region) query.set('region', params.region);
  if (params.status) query.set('status', params.status);
  if (params.timeFilter) query.set('time_filter', params.timeFilter);
  if (params.search) query.set('search', params.search);
  if (params.minScore) query.set('min_score', String(params.minScore));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`/api/jobs?${query.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to load opportunities');
  }
  return res.json();
}

export async function fetchPreferences(): Promise<{ preferences: UserPreferences; active_cv: any }> {
  const res = await fetch('/api/preferences');
  if (!res.ok) throw new Error('Failed to load preferences');
  return res.json();
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  const res = await fetch('/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Failed to save preferences');
}

export async function updateJobStatus(jobId: string, status: string): Promise<void> {
  const res = await fetch(`/api/jobs/${jobId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
}

export async function setJobFeedback(jobId: string, rating: 'like' | 'dislike' | 'neutral'): Promise<void> {
  const res = await fetch(`/api/jobs/${jobId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, notes: '' }),
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
}

export async function generateCoverLetter(jobId: string): Promise<string> {
  const res = await fetch(`/api/cover-letter/${jobId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate cover letter');
  const data = await res.json();
  return data.cover_letter;
}

export async function generateRecruiterOutreach(jobId: string): Promise<RecruiterOutreachResponse> {
  const res = await fetch(`/api/recruiter-outreach/${jobId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate recruiter outreach');
  return res.json();
}

export async function uploadCvFile(file: File): Promise<{ filename: string; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload-cv', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'CV upload failed');
  }
  return res.json();
}

export async function triggerScan(region: string = 'all', timeWindow: string = 'week'): Promise<void> {
  const res = await fetch(`/api/scan?region=${region}&time_window=${timeWindow}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger scan');
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const res = await fetch('/api/notifications/settings');
  if (!res.ok) throw new Error('Failed to fetch notification settings');
  const data = await res.json();
  return data.settings;
}

export async function saveNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
  const res = await fetch('/api/notifications/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save notification settings');
  const data = await res.json();
  return data.settings;
}

export async function sendTestNotification(email?: string): Promise<{ status: string; message: string }> {
  const res = await fetch('/api/notifications/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || 'Failed to dispatch test notification');
  }
  return res.json();
}

export async function triggerDigestNow(): Promise<{ status: string; message: string }> {
  const res = await fetch('/api/notifications/send-digest', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to dispatch digest');
  return res.json();
}

export async function upgradeToPro(): Promise<{ status: string; message: string; user: UserProfile }> {
  const res = await fetch('/api/subscription/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Failed to upgrade to Pro');
  return res.json();
}

export async function resetSearchQuota(): Promise<void> {
  const res = await fetch('/api/subscription/reset-quota', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset quota');
}

export async function downgradeToFree(): Promise<{ status: string; message: string; user: UserProfile }> {
  const res = await fetch('/api/subscription/downgrade', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to switch to free');
  return res.json();
}

export async function fetchCVTemplates(category?: string): Promise<CVTemplatesResponse> {
  const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`/api/cv/templates${query}`);
  if (!res.ok) throw new Error('Failed to load CV templates');
  return res.json();
}

export async function downloadTailoredCv(
  jobId: string, 
  format: 'pdf' | 'docx' = 'pdf',
  templateId: string = 'gulf_dubai_sapphire'
): Promise<void> {
  const query = `?template=${encodeURIComponent(templateId)}`;
  const endpoint = format === 'pdf' ? `/api/cv/export-pdf/${jobId}${query}` : `/api/cv/export-docx/${jobId}${query}`;
  const res = await fetch(endpoint);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to download tailored ${format.toUpperCase()}`);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const disposition = res.headers.get('Content-Disposition');
  let filename = `Tailored_CV_${jobId}_${templateId}.${format}`;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) filename = match[1];
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}


