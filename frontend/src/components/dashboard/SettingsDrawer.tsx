'use client';

import React, { useState, useEffect } from 'react';
import { UserPreferences, NotificationSettings, WorkExperienceItem, EducationItem } from '@/types';
import { 
  uploadCvFile, 
  savePreferences, 
  fetchNotificationSettings, 
  saveNotificationSettings, 
  sendTestNotification, 
  triggerDigestNow 
} from '@/lib/api';
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  Loader2, 
  Sparkles, 
  Bell, 
  Mail, 
  Check, 
  Send, 
  SlidersHorizontal,
  Clock,
  Target,
  User,
  Briefcase,
  GraduationCap,
  Globe,
  MapPin,
  Phone,
  DollarSign,
  FileText
} from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  preferences: UserPreferences;
  onClose: () => void;
  onPreferencesUpdated: (prefs: UserPreferences) => void;
  onToast: (msg: string, icon?: string) => void;
  onTriggerScan: () => void;
}

export default function SettingsDrawer({
  isOpen,
  preferences,
  onClose,
  onPreferencesUpdated,
  onToast,
  onTriggerScan,
}: SettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'stack' | 'experience' | 'alerts'>('profile');
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);
  const [newSkill, setNewSkill] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newExcluded, setNewExcluded] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Work Experience Form State
  const [showAddExp, setShowAddExp] = useState(false);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpCompany, setNewExpCompany] = useState('');
  const [newExpPeriod, setNewExpPeriod] = useState('');
  const [newExpLocation, setNewExpLocation] = useState('');
  const [newExpBullet, setNewExpBullet] = useState('');

  // New Education Form State
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newEduDegree, setNewEduDegree] = useState('');
  const [newEduSchool, setNewEduSchool] = useState('');
  const [newEduYear, setNewEduYear] = useState('');

  // Notification Settings State
  const [notifySettings, setNotifySettings] = useState<NotificationSettings>({
    alerts_enabled: true,
    alert_email: '',
    min_match_score: 70,
    preferred_regions: ['all'],
    frequency: 'instant',
    last_alert_sent_at: null,
  });
  const [loadingNotify, setLoadingNotify] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [dispatchingDigest, setDispatchingDigest] = useState(false);

  // Sync state if props change
  useEffect(() => {
    setPrefs(preferences);
  }, [preferences]);

  // Load notification settings when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLoadingNotify(true);
      fetchNotificationSettings()
        .then((s) => {
          setNotifySettings(s);
        })
        .catch(() => {
          // Fallback gracefully
        })
        .finally(() => setLoadingNotify(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadCvFile(file);
      onToast(res.message || 'CV parsed & skills updated!', '📄');
      setPrefs((prev) => ({ ...prev, active_cv: res.filename }));
    } catch (err: any) {
      onToast(err.message || 'CV upload failed', '⚠️');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const current = prefs.primary_stack || [];
    if (!current.includes(newSkill.trim())) {
      setPrefs({ ...prefs, primary_stack: [...current, newSkill.trim()] });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    setPrefs({
      ...prefs,
      primary_stack: (prefs.primary_stack || []).filter((s) => s !== skill),
    });
  };

  const handleAddRole = () => {
    if (!newRole.trim()) return;
    const current = prefs.default_roles || [];
    if (!current.includes(newRole.trim())) {
      setPrefs({ ...prefs, default_roles: [...current, newRole.trim()] });
    }
    setNewRole('');
  };

  const handleRemoveRole = (role: string) => {
    setPrefs({
      ...prefs,
      default_roles: (prefs.default_roles || []).filter((r) => r !== role),
    });
  };

  const handleAddExcluded = () => {
    if (!newExcluded.trim()) return;
    const current = prefs.excluded_keywords || [];
    if (!current.includes(newExcluded.trim())) {
      setPrefs({ ...prefs, excluded_keywords: [...current, newExcluded.trim()] });
    }
    setNewExcluded('');
  };

  const handleRemoveExcluded = (kw: string) => {
    setPrefs({
      ...prefs,
      excluded_keywords: (prefs.excluded_keywords || []).filter((k) => k !== kw),
    });
  };

  const toggleTargetLocation = (country: string) => {
    const current = prefs.target_locations || ['Pakistan', 'United Arab Emirates', 'Saudi Arabia'];
    let updated: string[];
    if (current.includes(country)) {
      if (current.length === 1) return; // Keep at least one
      updated = current.filter((c) => c !== country);
    } else {
      updated = [...current, country];
    }
    setPrefs({ ...prefs, target_locations: updated });
  };

  const handleAddWorkExp = () => {
    if (!newExpTitle.trim() || !newExpCompany.trim()) return;
    const item: WorkExperienceItem = {
      title: newExpTitle.trim(),
      company: newExpCompany.trim(),
      period: newExpPeriod.trim() || 'Present',
      location: newExpLocation.trim() || 'Pakistan / Gulf',
      bullets: newExpBullet.trim() ? [newExpBullet.trim()] : ['Architected production services and delivered sprint goals.'],
    };
    const current = prefs.work_history || [];
    setPrefs({ ...prefs, work_history: [item, ...current] });
    setNewExpTitle('');
    setNewExpCompany('');
    setNewExpPeriod('');
    setNewExpLocation('');
    setNewExpBullet('');
    setShowAddExp(false);
  };

  const handleRemoveWorkExp = (index: number) => {
    const current = [...(prefs.work_history || [])];
    current.splice(index, 1);
    setPrefs({ ...prefs, work_history: current });
  };

  const handleAddEducation = () => {
    if (!newEduDegree.trim() || !newEduSchool.trim()) return;
    const item: EducationItem = {
      degree: newEduDegree.trim(),
      institution: newEduSchool.trim(),
      year: newEduYear.trim() || '2020',
    };
    const current = prefs.education || [];
    setPrefs({ ...prefs, education: [item, ...current] });
    setNewEduDegree('');
    setNewEduSchool('');
    setNewEduYear('');
    setShowAddEdu(false);
  };

  const handleRemoveEducation = (index: number) => {
    const current = [...(prefs.education || [])];
    current.splice(index, 1);
    setPrefs({ ...prefs, education: current });
  };

  const handleSaveAll = async (triggerScanNow = false) => {
    setSaving(true);
    try {
      await Promise.all([
        savePreferences(prefs),
        saveNotificationSettings(notifySettings),
      ]);
      onPreferencesUpdated(prefs);
      onToast('Career Profile & Alert preferences saved! ✅', '✅');
      onClose();
      if (triggerScanNow) {
        onTriggerScan();
      }
    } catch {
      onToast('Failed to save settings', '⚠️');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      const res = await sendTestNotification(notifySettings.alert_email);
      onToast(res.message || 'Test alert email sent to your inbox! 📬', '📬');
    } catch (err: any) {
      onToast(err.message || 'Failed to dispatch test email', '⚠️');
    } finally {
      setSendingTest(false);
    }
  };

  const handleDispatchDigestNow = async () => {
    setDispatchingDigest(true);
    try {
      const res = await triggerDigestNow();
      if (res.status === 'skipped') {
        onToast(res.message || 'No new unnotified high-match jobs.', 'ℹ️');
      } else {
        onToast(res.message || 'High-match digest dispatched! 🚀', '🚀');
        const updated = await fetchNotificationSettings();
        setNotifySettings(updated);
      }
    } catch (err: any) {
      onToast(err.message || 'Digest dispatch failed', '⚠️');
    } finally {
      setDispatchingDigest(false);
    }
  };

  const targetCountryOptions = [
    { id: 'Pakistan', label: '🇵🇰 Pakistan' },
    { id: 'United Arab Emirates', label: '🇦🇪 UAE (Dubai/Abu Dhabi)' },
    { id: 'Saudi Arabia', label: '🇸🇦 Saudi Arabia (Riyadh/NEOM)' },
    { id: 'Qatar', label: '🇶🇦 Qatar' },
    { id: 'Remote', label: '🌐 Remote International' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-5 bg-[#0B1120] text-white flex items-center justify-between border-b border-slate-800">
            <div>
              <div className="text-sm font-extrabold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Career Profile &amp; AI Intelligence Settings</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Manage your profile, target Gulf markets, tech stack &amp; alerts
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl text-xs font-black transition cursor-pointer border-b-2 flex-shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-white text-indigo-600 border-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Personal &amp; Goals</span>
            </button>

            <button
              onClick={() => setActiveTab('stack')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl text-xs font-black transition cursor-pointer border-b-2 flex-shrink-0 ${
                activeTab === 'stack'
                  ? 'bg-white text-indigo-600 border-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Tech Stack &amp; CV</span>
            </button>

            <button
              onClick={() => setActiveTab('experience')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl text-xs font-black transition cursor-pointer border-b-2 flex-shrink-0 ${
                activeTab === 'experience'
                  ? 'bg-white text-indigo-600 border-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              <span>Experience &amp; Edu</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl text-xs font-black transition cursor-pointer border-b-2 flex-shrink-0 ${
                activeTab === 'alerts'
                  ? 'bg-white text-indigo-600 border-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-indigo-600" />
              <span>Email Alerts</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs custom-scrollbar">
            
            {/* TAB 1: PERSONAL & CAREER GOALS */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                
                {/* Candidate Full Name */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-900 block flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Candidate Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={prefs.candidate_name || ''}
                    onChange={(e) => setPrefs({ ...prefs, candidate_name: e.target.value })}
                    placeholder="e.g. Jamshaid Ali"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition text-xs font-bold text-slate-900"
                  />
                  <p className="text-[11px] text-slate-400">
                    Used on your tailored ATS resume headers and cover letter sign-offs.
                  </p>
                </div>

                {/* Email & Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Contact Email</span>
                    </label>
                    <input
                      type="email"
                      value={prefs.email || ''}
                      onChange={(e) => setPrefs({ ...prefs, email: e.target.value })}
                      placeholder="e.g. dev@example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Phone / WhatsApp</span>
                    </label>
                    <input
                      type="text"
                      value={prefs.phone || ''}
                      onChange={(e) => setPrefs({ ...prefs, phone: e.target.value })}
                      placeholder="+92 (300) 123-4567"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Current Location & Target Salary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>Current Location</span>
                    </label>
                    <input
                      type="text"
                      value={prefs.current_location || ''}
                      onChange={(e) => setPrefs({ ...prefs, current_location: e.target.value })}
                      placeholder="e.g. Lahore, Pakistan"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Expected Salary</span>
                    </label>
                    <input
                      type="text"
                      value={prefs.expected_salary || ''}
                      onChange={(e) => setPrefs({ ...prefs, expected_salary: e.target.value })}
                      placeholder="e.g. 15,000 - 25,000 AED / mo"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Experience Level */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Seniority / Experience Level</span>
                  </label>
                  <select
                    value={prefs.experience_level || 'Mid-Senior'}
                    onChange={(e) => setPrefs({ ...prefs, experience_level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs font-bold text-slate-800"
                  >
                    <option value="Entry-Level">Fresh Graduate / Entry-Level (0 - 2 Years)</option>
                    <option value="Mid-Level">Mid-Level Engineer (2 - 5 Years)</option>
                    <option value="Mid-Senior">Mid-Senior Professional (5 - 8 Years)</option>
                    <option value="Senior">Senior Specialist (8 - 12 Years)</option>
                    <option value="Lead/Principal">Technical Lead / Principal / Director (12+ Years)</option>
                  </select>
                </div>

                {/* Target Gulf & International Locations */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Target Job Markets</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {targetCountryOptions.map((country) => {
                      const isSelected = (prefs.target_locations || ['Pakistan', 'United Arab Emirates', 'Saudi Arabia']).includes(country.id);
                      return (
                        <button
                          key={country.id}
                          type="button"
                          onClick={() => toggleTargetLocation(country.id)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{country.label}</span>
                          {isSelected ? <Check className="w-3 h-3 text-indigo-600" /> : null}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Jobs from your chosen target markets will be prioritized in matching and email digests.
                  </p>
                </div>

                {/* Professional Bio / Executive Summary */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Professional Bio / Profile Pitch</span>
                  </label>
                  <textarea
                    rows={3}
                    value={prefs.bio || ''}
                    onChange={(e) => setPrefs({ ...prefs, bio: e.target.value })}
                    placeholder="Brief 2-3 sentence overview of your career achievements and core strengths..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 text-xs font-medium resize-none"
                  />
                </div>

              </div>
            )}

            {/* TAB 2: TECH STACK & CV */}
            {activeTab === 'stack' && (
              <div className="space-y-5">
                
                {/* Active CV Section */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">📄 Active Resume / CV</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono truncate max-w-[150px]">
                      {prefs.active_cv || 'None'}
                    </span>
                  </div>
                  
                  <label className="border-2 border-dashed border-slate-300 hover:border-indigo-600 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-white">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="font-bold text-slate-800">Upload New Resume (PDF / DOCX)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Max 5 MB &bull; Auto-syncs skills</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.docx,.doc,.txt"
                    />
                  </label>

                  {uploading && (
                    <div className="text-center font-bold text-indigo-600 flex items-center justify-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing resume and syncing skills...</span>
                    </div>
                  )}
                </div>

                {/* Permanent Tech Stack */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-900 block">
                    ⚡ Permanent Tech Stack (Primary Skills)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="e.g. FastAPI, Celery, Docker, React"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                    />
                    <button
                      onClick={handleAddSkill}
                      className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(prefs.primary_stack || []).map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg font-bold flex items-center gap-1.5"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-indigo-400 hover:text-indigo-800 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Target Job Titles */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-900 block">🎯 Target Job Titles</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                      placeholder="e.g. Senior Backend Engineer"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                    />
                    <button
                      onClick={handleAddRole}
                      className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(prefs.default_roles || []).map((role) => (
                      <span
                        key={role}
                        className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg font-bold flex items-center gap-1.5"
                      >
                        <span>{role}</span>
                        <button
                          onClick={() => handleRemoveRole(role)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Excluded Keywords */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-900 block">🚫 Negative / Excluded Keywords</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExcluded}
                      onChange={(e) => setNewExcluded(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExcluded())}
                      placeholder="e.g. PHP, WordPress, Junior"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                    />
                    <button
                      onClick={handleAddExcluded}
                      className="px-3 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(prefs.excluded_keywords || []).map((kw) => (
                      <span
                        key={kw}
                        className="px-2.5 py-1 bg-rose-50 text-rose-900 border border-rose-200 rounded-lg font-bold flex items-center gap-1.5"
                      >
                        <span>{kw}</span>
                        <button
                          onClick={() => handleRemoveExcluded(kw)}
                          className="text-rose-400 hover:text-rose-800 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: EXPERIENCE & EDUCATION */}
            {activeTab === 'experience' && (
              <div className="space-y-5">
                
                {/* Work Experience Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <span>Work History &amp; Roles</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddExp(!showAddExp)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddExp ? 'Cancel' : 'Add Role'}</span>
                    </button>
                  </div>

                  {/* Add Experience Form */}
                  {showAddExp && (
                    <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Job Title (e.g. Senior Backend Engineer)"
                          value={newExpTitle}
                          onChange={(e) => setNewExpTitle(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Company (e.g. Careem / Uber)"
                          value={newExpCompany}
                          onChange={(e) => setNewExpCompany(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Period (e.g. 2022 - Present)"
                          value={newExpPeriod}
                          onChange={(e) => setNewExpPeriod(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Location (e.g. Dubai, UAE / Lahore)"
                          value={newExpLocation}
                          onChange={(e) => setNewExpLocation(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Key accomplishment bullet (e.g. Architected microservices...)"
                        value={newExpBullet}
                        onChange={(e) => setNewExpBullet(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddWorkExp}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                      >
                        Save Experience
                      </button>
                    </div>
                  )}

                  {/* List of Experiences */}
                  <div className="space-y-2">
                    {(prefs.work_history || []).map((exp, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 relative group">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs">{exp.title}</div>
                            <div className="text-[11px] text-slate-600 font-medium">
                              {exp.company} &bull; <span className="text-slate-400">{exp.period}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveWorkExp(idx)}
                            className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {exp.location && <div className="text-[10px] text-slate-400">{exp.location}</div>}
                        {exp.bullets && exp.bullets.length > 0 && (
                          <div className="text-[11px] text-slate-700 pt-1 leading-relaxed">
                            &bull; {exp.bullets[0]}
                          </div>
                        )}
                      </div>
                    ))}
                    {(!prefs.work_history || prefs.work_history.length === 0) && (
                      <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl">
                        No previous work history added yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Education Section */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>Education &amp; Degrees</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddEdu(!showAddEdu)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddEdu ? 'Cancel' : 'Add Degree'}</span>
                    </button>
                  </div>

                  {/* Add Education Form */}
                  {showAddEdu && (
                    <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                      <input
                        type="text"
                        placeholder="Degree / Qualification (e.g. BS Computer Science)"
                        value={newEduDegree}
                        onChange={(e) => setNewEduDegree(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Institution / University (e.g. FAST-NUCES)"
                          value={newEduSchool}
                          onChange={(e) => setNewEduSchool(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Year (e.g. 2020)"
                          value={newEduYear}
                          onChange={(e) => setNewEduYear(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddEducation}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                      >
                        Save Degree
                      </button>
                    </div>
                  )}

                  {/* List of Education */}
                  <div className="space-y-2">
                    {(prefs.education || []).map((edu, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">{edu.degree}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {edu.institution} {edu.year ? `(${edu.year})` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(idx)}
                          className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {(!prefs.education || prefs.education.length === 0) && (
                      <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl">
                        No degrees recorded yet.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: AUTOMATED ALERTS & DIGEST */}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                
                {/* Master Alert Toggle */}
                <div className="p-4 bg-gradient-to-r from-indigo-50/70 via-sky-50/40 to-slate-50 rounded-2xl border border-indigo-100 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">Email Alerts for High-Match Roles</span>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase ${
                        notifySettings.alerts_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {notifySettings.alerts_enabled ? 'ACTIVE 🟢' : 'PAUSED ⚪'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Receive automated emails whenever new roles matching your target tech stack and CV are scouted.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setNotifySettings({ ...notifySettings, alerts_enabled: !notifySettings.alerts_enabled })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifySettings.alerts_enabled ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notifySettings.alerts_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Recipient Email */}
                <div className="space-y-1.5">
                  <label className="font-black text-slate-900 block flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Recipient Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={notifySettings.alert_email}
                    onChange={(e) => setNotifySettings({ ...notifySettings, alert_email: e.target.value })}
                    placeholder="e.g. your-email@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition text-xs font-medium"
                  />
                  <p className="text-[11px] text-slate-400">
                    High-match alerts and morning digests will be delivered directly to this inbox.
                  </p>
                </div>

                {/* Minimum ATS Match Score Threshold */}
                <div className="space-y-2">
                  <label className="font-black text-slate-900 block flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Minimum ATS Match Threshold</span>
                    </span>
                    <span className="text-emerald-700 font-extrabold text-xs">
                      ≥{notifySettings.min_match_score}% Match
                    </span>
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNotifySettings({ ...notifySettings, min_match_score: 60 })}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        notifySettings.min_match_score === 60
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-black shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <div className="text-xs font-black">60%+</div>
                      <div className="text-[10px] text-slate-500 font-medium">Good Match</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotifySettings({ ...notifySettings, min_match_score: 70 })}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        notifySettings.min_match_score === 70
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-2xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <div className="text-xs font-black">70%+</div>
                      <div className="text-[10px] text-emerald-700 font-bold">Top Fit (Recommended)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotifySettings({ ...notifySettings, min_match_score: 85 })}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        notifySettings.min_match_score === 85
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-black shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <div className="text-xs font-black">85%+</div>
                      <div className="text-[10px] text-slate-500 font-medium">Elite Match Only</div>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Roles scoring below this threshold are quietly saved to your feed without triggering email alerts.
                  </p>
                </div>

                {/* Alert Frequency */}
                <div className="space-y-2">
                  <label className="font-black text-slate-900 block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Dispatch Frequency</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNotifySettings({ ...notifySettings, frequency: 'instant' })}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        notifySettings.frequency === 'instant'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-black shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>⚡ Real-Time Alert</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Sent as soon as scan finishes
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotifySettings({ ...notifySettings, frequency: 'daily' })}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        notifySettings.frequency === 'daily'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-black shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>📅 Daily Morning Digest</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Batched summary once daily
                      </div>
                    </button>
                  </div>
                </div>

                {/* Instant Actions Box: Send Test Alert & Dispatch Now */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">🧪 Live Email Verification</span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {notifySettings.last_alert_sent_at 
                        ? `Last sent: ${new Date(notifySettings.last_alert_sent_at).toLocaleDateString()}` 
                        : 'No alerts sent yet'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={sendingTest}
                      className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Send className="w-3.5 h-3.5 text-indigo-600" />}
                      <span>{sendingTest ? 'Sending Test...' : 'Send Test Alert Email'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDispatchDigestNow}
                      disabled={dispatchingDigest}
                      className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {dispatchingDigest ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Mail className="w-3.5 h-3.5 text-cyan-200" />}
                      <span>{dispatchingDigest ? 'Dispatching...' : 'Dispatch Digest Now'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    Uses verified SMTP relay to dispatch high-match opportunities directly to your inbox.
                  </p>
                </div>

              </div>
            )}

          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-white transition text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveAll(true)}
              disabled={saving}
              className="px-5 py-2 bg-slate-950 hover:bg-black text-white rounded-xl font-bold transition text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Check className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{saving ? 'Saving...' : 'Save Profile & Trigger Scan'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
