'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  fetchJobs, 
  fetchStats, 
  fetchCurrentUser, 
  fetchPreferences, 
  updateJobStatus, 
  setJobFeedback, 
  triggerScan, 
  generateRecruiterOutreach,
  upgradeToPro,
  resetSearchQuota,
  downgradeToFree
} from '@/lib/api';
import { 
  Job, 
  PipelineStats, 
  UserProfile, 
  UserPreferences, 
  RecruiterOutreachResponse 
} from '@/types';
import Sidebar from '@/components/dashboard/Sidebar';
import JobCard from '@/components/dashboard/JobCard';
import KanbanBoard from '@/components/dashboard/KanbanBoard';
import RecruiterModal from '@/components/dashboard/RecruiterModal';
import SettingsDrawer from '@/components/dashboard/SettingsDrawer';
import { 
  Zap, 
  Search, 
  RotateCw, 
  SlidersHorizontal, 
  LayoutList, 
  Kanban, 
  Crown, 
  Loader2, 
  Menu, 
  ArrowLeft, 
  Sparkles,
  Target,
  Briefcase,
  TrendingUp,
  Clock,
  Compass,
  CheckCircle2,
  Sliders,
  Lock
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  // Core State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<PipelineStats>({
    total_jobs: 0,
    high_match: 0,
    gulf_jobs: 0,
    pakistan_jobs: 0,
    applied_jobs: 0,
    interviewing_jobs: 0,
    saved_jobs: 0,
    trashed_jobs: 0,
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [region, setRegion] = useState('all');
  const [status, setStatus] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [search, setSearch] = useState('');

  // Recruiter Modal
  const [recruiterJob, setRecruiterJob] = useState<Job | null>(null);
  const [recruiterData, setRecruiterData] = useState<RecruiterOutreachResponse | null>(null);
  const [loadingRecruiter, setLoadingRecruiter] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<{ id: number; message: string; icon: string }[]>([]);

  const showToast = (message: string, icon = '✨') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Initial Auth & Data Load
  useEffect(() => {
    async function init() {
      const user = await fetchCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      try {
        const [statsData, prefsData] = await Promise.all([
          fetchStats(),
          fetchPreferences(),
        ]);
        setStats(statsData);
        setPreferences(prefsData.preferences || {});
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, [router]);

  // Load Jobs
  const loadJobs = useCallback(async (reset = true) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    }

    try {
      const limit = viewMode === 'kanban' ? 100 : 25;
      const targetPage = reset ? 1 : page + 1;

      const data = await fetchJobs({
        region,
        status: viewMode === 'kanban' ? 'all' : status,
        timeFilter,
        search,
        minScore: minScoreFilter,
        page: targetPage,
        limit,
      });

      if (reset) {
        setJobs(data);
      } else {
        setJobs((prev) => [...prev, ...data]);
        setPage(targetPage);
      }
      setHasMore(data.length >= limit);

      // Refresh user profile if a search was conducted to update search quota counter live
      if (search && search.trim()) {
        const updatedUser = await fetchCurrentUser();
        if (updatedUser) setCurrentUser(updatedUser);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Error loading opportunities';
      if (errMsg.toLowerCase().includes('search limit') || errMsg.toLowerCase().includes('quota')) {
        showToast(errMsg, '🔒');
        setUpgradeOpen(true);
      } else {
        showToast(errMsg, '⚠️');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [region, status, timeFilter, search, minScoreFilter, viewMode, page]);

  const handleUpgradeToPro = async () => {
    try {
      const res = await upgradeToPro();
      if (res.user) {
        setCurrentUser(res.user);
      } else {
        const u = await fetchCurrentUser();
        if (u) setCurrentUser(u);
      }
      await loadJobs(true);
      setUpgradeOpen(false);
      showToast('🎉 Welcome to RateYourCV Pro! Unlimited searches & all jobs unlocked.', '👑');
    } catch (err: any) {
      showToast(err?.message || 'Upgrade failed', '⚠️');
    }
  };

  const handleDowngradeToFree = async () => {
    try {
      const res = await downgradeToFree();
      if (res.user) {
        setCurrentUser(res.user);
      } else {
        const u = await fetchCurrentUser();
        if (u) setCurrentUser(u);
      }
      await loadJobs(true);
      setUpgradeOpen(false);
      showToast('Switched to Free Tier (Top 3 jobs & 10 searches limit)', 'ℹ️');
    } catch (err: any) {
      showToast(err?.message || 'Failed to switch to free', '⚠️');
    }
  };

  const handleResetQuota = async () => {
    try {
      await resetSearchQuota();
      const u = await fetchCurrentUser();
      if (u) setCurrentUser(u);
      showToast('Search quota reset to 0/10', '🔄');
    } catch (err: any) {
      showToast(err?.message || 'Failed to reset quota', '⚠️');
    }
  };

  useEffect(() => {
    loadJobs(true);
  }, [region, status, timeFilter, minScoreFilter, viewMode]);

  const handleNavFilter = (newStatus: string, newRegion: string = 'all', newMinScore: number = 0) => {
    setStatus(newStatus);
    setRegion(newRegion);
    setMinScoreFilter(newMinScore);
    setMobileSidebarOpen(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadJobs(false);
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await updateJobStatus(jobId, newStatus);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus as any } : j))
      );
      const updatedStats = await fetchStats();
      setStats(updatedStats);
      showToast(`Stage updated to ${newStatus.toUpperCase()}`, '🚀');
    } catch {
      showToast('Failed to update stage', '⚠️');
    }
  };

  const handleFeedback = async (jobId: string, rating: 'like' | 'dislike') => {
    try {
      await setJobFeedback(jobId, rating);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, feedback_rating: rating } : j))
      );
      showToast('AI tuned with your preference!', '🧠');
    } catch {
      showToast('Failed to submit feedback', '⚠️');
    }
  };

  const handleTrash = async (jobId: string) => {
    await handleStatusChange(jobId, 'trash');
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    showToast('Moved to Trash 🗑️', '🗑️');
  };

  const handleRestore = async (jobId: string) => {
    await handleStatusChange(jobId, 'new');
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    showToast('Job restored to Active Feed! ♻️', '✅');
  };

  const handleOpenRecruiter = async (job: Job) => {
    setRecruiterJob(job);
    setLoadingRecruiter(true);
    setRecruiterData(null);

    try {
      const data = await generateRecruiterOutreach(job.id);
      setRecruiterData(data);
    } catch {
      showToast('Failed to generate recruiter outreach', '⚠️');
    } finally {
      setLoadingRecruiter(false);
    }
  };

  const handleTriggerScan = async () => {
    setScanning(true);
    showToast('⚡ Live market scan launched in background!', '⚡');
    try {
      await triggerScan(region, timeFilter);
      let count = 0;
      const interval = setInterval(async () => {
        count++;
        const updatedStats = await fetchStats();
        setStats(updatedStats);
        await loadJobs(true);
        if (count >= 4) {
          clearInterval(interval);
          setScanning(false);
          showToast('✅ Fresh opportunities synced!', '✅');
        }
      }, 3000);
    } catch {
      setScanning(false);
      showToast('Scan error', '⚠️');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout');
    router.push('/login');
  };

  const getBreadcrumbTitle = () => {
    if (viewMode === 'kanban') return 'Application Kanban Board';
    if (status === 'trash') return 'Archived & Trashed Roles';
    if (status === 'applied') return 'Application Pipeline: Applied';
    if (status === 'interviewing') return 'Application Pipeline: Interviewing';
    if (status === 'saved') return 'Application Pipeline: Saved Bookmarks';
    if (region === 'gulf') return 'Gulf Tech Hub (UAE & Saudi Arabia)';
    if (region === 'pakistan') return 'Pakistan & Remote Tech';
    if (minScoreFilter >= 75) return 'Top ATS Fit (≥70% Match)';
    return 'Live Opportunities Radar';
  };

  const userName = currentUser?.full_name || currentUser?.username || 'Member';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 antialiased font-sans">
      
      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 px-4.5 py-3 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700 text-xs sm:text-sm font-semibold max-w-md backdrop-blur-md"
          >
            <span className="text-lg">{t.icon}</span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>

      {/* 1. Permanent Left Sidebar (Visible on all >= md screens) */}
      <Sidebar
        stats={stats}
        currentUser={currentUser}
        currentRegion={region}
        currentStatus={status}
        minScoreFilter={minScoreFilter}
        viewMode={viewMode}
        onViewModeChange={(m) => setViewMode(m)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onFilterChange={handleNavFilter}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenUpgrade={() => setUpgradeOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top SaaS Header */}
        <header className="h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 flex-shrink-0 shadow-2xs">
          
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="font-extrabold text-slate-400">RateYourCV</span>
              <span className="text-slate-300">/</span>
              <span className="font-black text-slate-900">{getBreadcrumbTitle()}</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{stats.total_jobs || 143} Roles Live • Gulf &amp; PK</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Run Scan Button */}
            <button
              onClick={handleTriggerScan}
              disabled={scanning}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {scanning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{scanning ? 'Scanning Market...' : 'Run Scan Now'}</span>
            </button>

            {/* Target Stack & CV Drawer Trigger */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Target Stack & CV Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Pro Upgrade Trigger */}
            <button
              onClick={() => setUpgradeOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Pro Perks</span>
            </button>

          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Welcome & Context Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight">
                    Welcome back, {userName} 👋
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    Live Copilot Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Scouting high-paying tech roles across <strong>UAE (Dubai)</strong>, <strong>Saudi Arabia (Riyadh)</strong>, and <strong>Pakistan</strong> matching your active resume and stack.
                </p>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
                <button
                  onClick={() => {
                    setViewMode('list');
                    handleNavFilter('all', 'all', 75);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>View Top Fit ({stats.high_match || 0})</span>
                </button>
              </div>
            </div>

            {/* 3. Interactive KPI Metric Command Ribbon */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                
                {/* Metric 1: Total Jobs */}
                <div
                  onClick={() => {
                    setViewMode('list');
                    handleNavFilter('all', 'all', 0);
                  }}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition cursor-pointer card-hover-elevate ${
                    status === 'all' && region === 'all' && minScoreFilter === 0 && viewMode === 'list'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Scored Jobs</span>
                    <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">⚡</div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {stats.total_jobs || 0}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>Scouted across Gulf &amp; PK</span>
                    <span className="text-indigo-600 font-bold">&rarr;</span>
                  </div>
                </div>

                {/* Metric 2: High Fit */}
                <div
                  onClick={() => {
                    setViewMode('list');
                    handleNavFilter('all', 'all', 75);
                  }}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition cursor-pointer card-hover-elevate ${
                    minScoreFilter === 75 && viewMode === 'list'
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200/90 shadow-2xs hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">Top ATS Fit (≥70%)</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">🎯</div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                    {stats.high_match || 0}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-emerald-700 flex items-center justify-between">
                    <span>High CV match alignment</span>
                    <span className="text-emerald-700 font-bold">&rarr;</span>
                  </div>
                </div>

                {/* Metric 3: Gulf Tech Hub */}
                <div
                  onClick={() => {
                    setViewMode('list');
                    handleNavFilter('all', 'gulf', 0);
                  }}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition cursor-pointer card-hover-elevate ${
                    region === 'gulf' && status !== 'trash' && minScoreFilter === 0 && viewMode === 'list'
                      ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-md'
                      : 'border-slate-200/90 shadow-2xs hover:border-cyan-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">🌴 Gulf Tech Hub</span>
                    <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-xs">🏖️</div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {stats.gulf_jobs || 0}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-cyan-700 flex items-center justify-between">
                    <span>UAE (Dubai) &amp; Saudi</span>
                    <span className="text-cyan-700 font-bold">&rarr;</span>
                  </div>
                </div>

                {/* Metric 4: Pipeline In Progress */}
                <div
                  onClick={() => setViewMode('kanban')}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition cursor-pointer card-hover-elevate ${
                    viewMode === 'kanban'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-slate-200/90 shadow-2xs hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900">🚀 Pipeline Active</span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">📋</div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight">
                    {(stats.applied_jobs || 0) + (stats.interviewing_jobs || 0)}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>{stats.applied_jobs || 0} Applied &bull; {stats.interviewing_jobs || 0} Interviewing</span>
                    <span className="text-indigo-600 font-bold">&rarr;</span>
                  </div>
                </div>

              </div>

              <div className="text-[11px] text-slate-400 font-medium px-1">
                💡 <em>Click any metric above to instantly filter your stream or switch to your application board.</em>
              </div>
            </div>

            {/* Archived/Trash Banner */}
            {status === 'trash' && (
              <div className="p-4.5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-900 font-medium shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🗑️</span>
                  <div>
                    <strong className="font-bold text-rose-950 block">Viewing Archived &amp; Trashed Postings:</strong>
                    <span>These jobs are excluded from your main feed and will never trigger email alerts. Click <em>&quot;Restore&quot;</em> on any job to return it to active.</span>
                  </div>
                </div>
                <button
                  onClick={() => handleNavFilter('all', 'all', 0)}
                  className="px-3.5 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 rounded-xl font-bold transition flex-shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Active Feed</span>
                </button>
              </div>
            )}

            {/* 4. Controls & Search Center (Clean, organized & intuitive) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
              
              {/* Free Tier Quota Alert Banner */}
              {currentUser?.role === 'user' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/50 to-orange-50/40 border border-amber-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <div>
                      <span className="font-semibold text-slate-700">Free Search Limit: </span>
                      <strong className="font-black text-amber-950">
                        {currentUser.searches_count || 0} / {currentUser.max_free_searches || 10} searches used
                      </strong>
                      {(currentUser.searches_count || 0) >= (currentUser.max_free_searches || 10) ? (
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse">
                          LIMIT REACHED
                        </span>
                      ) : (
                        <span className="ml-1.5 text-[11px] text-amber-800 font-medium">
                          ({(currentUser.max_free_searches || 10) - (currentUser.searches_count || 0)} searches left &bull; Top 3 results unlocked)
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setUpgradeOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shadow-xs cursor-pointer transition flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Upgrade to Pro ($4.99/mo)</span>
                  </button>
                </div>
              )}

              {/* Row 1: Search + View Mode Switcher */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadJobs(true)}
                    placeholder="Search by job title, company, skills (Python, Docker, FastAPI)..."
                    className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  {search && (
                    <button
                      onClick={() => { setSearch(''); loadJobs(true); }}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* View Mode Toggle: List vs Kanban */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200 self-start sm:self-auto">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white text-slate-900 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span>List View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === 'kanban'
                        ? 'bg-white text-slate-900 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Kanban className="w-3.5 h-3.5" />
                    <span>Kanban Pipeline</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-100 text-indigo-800 font-black">CRM</span>
                  </button>
                </div>

              </div>

              {/* Row 2: Region, Match Score Pills, Freshness, Counter */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Region Filter */}
                  <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Region:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setRegion('all'); loadJobs(true); }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        region === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Markets
                    </button>
                    <button
                      onClick={() => { setRegion('gulf'); loadJobs(true); }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        region === 'gulf' ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      🌴 Gulf
                    </button>
                    <button
                      onClick={() => { setRegion('pakistan'); loadJobs(true); }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        region === 'pakistan' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      🇵🇰 Pakistan
                    </button>
                  </div>

                  <span className="text-slate-200 mx-1">|</span>

                  {/* Match Score Filter */}
                  <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">ATS Score:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMinScoreFilter(0)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        minScoreFilter === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Scores
                    </button>
                    <button
                      onClick={() => setMinScoreFilter(60)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        minScoreFilter === 60 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      60%+ Good Match
                    </button>
                    <button
                      onClick={() => setMinScoreFilter(75)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        minScoreFilter === 75 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      75%+ Top Fit
                    </button>
                  </div>

                  <span className="text-slate-200 mx-1">|</span>

                  {/* Freshness Window */}
                  <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Posted:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTimeFilter('all')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                        timeFilter === 'all' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => setTimeFilter('24h')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                        timeFilter === '24h' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Past 24h
                    </button>
                    <button
                      onClick={() => setTimeFilter('3d')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                        timeFilter === '3d' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Past 3d
                    </button>
                    <button
                      onClick={() => setTimeFilter('week')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                        timeFilter === 'week' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Week
                    </button>
                  </div>
                </div>

                {/* Counter */}
                <div className="text-slate-400 font-semibold text-xs">
                  {!currentUser?.is_pro ? (
                    <span>
                      Showing top <strong className="text-slate-900 font-extrabold">3</strong> free matches (remaining locked)
                    </span>
                  ) : (
                    <span>
                      Showing <strong className="text-slate-900 font-extrabold">{jobs.length}</strong> opportunities
                    </span>
                  )}
                </div>

              </div>
            </div>

            {/* 5. Loading Skeleton */}
            {loading && (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-16 text-center shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                <div className="text-base font-bold text-slate-900">Scanning &amp; Scoring Opportunities...</div>
                <p className="text-xs text-slate-400 mt-1">Filtering matches against your active tech stack and CV</p>
              </div>
            )}

            {/* 6. Empty State */}
            {!loading && jobs.length === 0 && (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-16 text-center shadow-sm space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mx-auto">🔍</div>
                <div className="text-base font-extrabold text-slate-900">No opportunities match your current filter</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Try clearing search keywords, selecting &quot;All Scores&quot;, or running a fresh market scan.
                </p>
                <button
                  onClick={() => {
                    setMinScoreFilter(0);
                    setStatus('all');
                    setRegion('all');
                    setTimeFilter('all');
                    setSearch('');
                    loadJobs(true);
                  }}
                  className="px-4 py-2 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* 7. View Mode: List View */}
            {!loading && viewMode === 'list' && (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onStatusChange={handleStatusChange}
                    onFeedback={handleFeedback}
                    onTrash={handleTrash}
                    onRestore={handleRestore}
                    onOpenRecruiter={handleOpenRecruiter}
                    onToast={showToast}
                    onOpenUpgrade={() => setUpgradeOpen(true)}
                  />
                ))}

                {/* Free Tier: Remaining Opportunities Locked Banner */}
                {!currentUser?.is_pro && (
                  <div className="mt-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 text-center space-y-3.5 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto text-xl font-black">
                      🔒
                    </div>
                    <div className="text-lg sm:text-xl font-black tracking-tight">
                      Showing Top 3 Free Opportunities
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                      Free accounts are limited to the top 3 search results. The remaining <strong>{(stats.total_jobs || 46) - 3}+ opportunities</strong>, direct recruiter LinkedIn contacts, and 1-click ATS application kits are locked.
                    </p>
                    <button
                      onClick={() => setUpgradeOpen(true)}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition inline-flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                    >
                      <Crown className="w-4 h-4 text-slate-950" />
                      <span>Upgrade to RateYourCV Pro ($4.99/mo) to Unlock All Results &rarr;</span>
                    </button>
                  </div>
                )}

                {/* Pro Tier: Load More Button */}
                {currentUser?.is_pro && hasMore && (
                  <div className="text-center py-6">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : null}
                      <span>{loadingMore ? 'Streaming next batch...' : 'Load More Opportunities (25 more)'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 8. View Mode: Kanban Pipeline View */}
            {!loading && viewMode === 'kanban' && (
              <KanbanBoard
                jobs={jobs}
                onStatusChange={handleStatusChange}
                onOpenRecruiter={handleOpenRecruiter}
                onTrash={handleTrash}
                onToast={showToast}
              />
            )}

          </div>
        </main>
      </div>

      {/* Recruiter Cold Outreach Modal */}
      <RecruiterModal
        job={recruiterJob}
        data={recruiterData}
        loading={loadingRecruiter}
        onClose={() => setRecruiterJob(null)}
        onToast={showToast}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={settingsOpen}
        preferences={preferences}
        onClose={() => setSettingsOpen(false)}
        onPreferencesUpdated={(p) => setPreferences(p)}
        onToast={showToast}
        onTriggerScan={handleTriggerScan}
      />

      {/* Upgrade Pro Modal */}
      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setUpgradeOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 text-2xl font-bold cursor-pointer transition"
            >
              &times;
            </button>

            <div className="text-center mb-6">
              <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 inline-flex items-center gap-1.5 shadow-2xs">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>RateYourCV Pro Accelerator</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mt-3 tracking-tight">
                Unlock Uncapped Market Access
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Free accounts can search up to 10 times and view only the top 3 results. Upgrade to unlock all 46+ opportunities, direct recruiter access, and tailored ATS kits.
              </p>
            </div>

            {/* Plan Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {/* Free Tier Card */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">Free Tier</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">Current</span>
                </div>
                <div className="text-xl font-black text-slate-900">$0 <span className="text-[11px] font-normal text-slate-500">/ forever</span></div>
                <ul className="space-y-1.5 text-slate-600 font-medium text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <span className="text-slate-400">&bull;</span>
                    <span>Max <strong>10 Searches</strong> total</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-slate-400">&bull;</span>
                    <span>View only <strong>Top 3 Results</strong></span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-400 line-through">
                    <span>✕ Direct Recruiter LinkedIn</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-400 line-through">
                    <span>✕ 1-Click ATS Application Kits</span>
                  </li>
                </ul>
              </div>

              {/* Pro Tier Card */}
              <div className="p-4 rounded-2xl border-2 border-indigo-600 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 text-xs space-y-2.5 shadow-sm relative">
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-950 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pro Member</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-600 text-white uppercase">Recommended</span>
                </div>
                <div className="text-xl font-black text-slate-950">$4.99 <span className="text-[11px] font-normal text-slate-500">/ month</span></div>
                <ul className="space-y-1.5 text-slate-900 font-bold text-[11px]">
                  <li className="flex items-center gap-1.5 text-indigo-950">
                    <span className="text-indigo-600">✓</span>
                    <span><strong>Unlimited Searches</strong> &amp; Live Scans</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-indigo-950">
                    <span className="text-indigo-600">✓</span>
                    <span><strong>100% Unlocked Results</strong> (All 46+ Jobs)</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-indigo-950">
                    <span className="text-indigo-600">✓</span>
                    <span><strong>Direct Recruiter LinkedIn</strong> &amp; 300c Notes</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-indigo-950">
                    <span className="text-indigo-600">✓</span>
                    <span><strong>1-Click ATS Kits</strong> &amp; Cover Letters</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Upgrade CTA */}
            <button
              onClick={handleUpgradeToPro}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-sm shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-cyan-200" />
              <span>Unlock All Opportunities with Pro Now &rarr;</span>
            </button>

            {/* Developer Testing Controls */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-400">QA / Switcher:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDowngradeToFree}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                  title="Switch account back to Free Tier to test 10 search quota and top 3 results gating"
                >
                  Test Free Tier (Gated)
                </button>
                <button
                  onClick={handleResetQuota}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                  title="Reset searches count back to 0/10"
                >
                  Reset Quota to 0
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
