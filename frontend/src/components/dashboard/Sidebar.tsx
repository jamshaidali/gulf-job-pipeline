'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Target, 
  Send, 
  PhoneCall, 
  Star, 
  Trash2, 
  SlidersHorizontal, 
  Crown, 
  LogOut, 
  X,
  FileText,
  ChevronRight,
  Kanban,
  Compass,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { PipelineStats, UserProfile } from '@/types';

interface SidebarProps {
  stats: PipelineStats;
  currentUser: UserProfile | null;
  currentRegion: string;
  currentStatus: string;
  minScoreFilter: number;
  viewMode: 'list' | 'kanban';
  onViewModeChange: (mode: 'list' | 'kanban') => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onFilterChange: (status: string, region: string, minScore?: number) => void;
  onOpenSettings: () => void;
  onOpenUpgrade: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  stats,
  currentUser,
  currentRegion,
  currentStatus,
  minScoreFilter,
  viewMode,
  onViewModeChange,
  mobileOpen,
  onCloseMobile,
  onFilterChange,
  onOpenSettings,
  onOpenUpgrade,
  onLogout,
}: SidebarProps) {
  
  const isNavActive = (status: string, region: string, minScore = 0) => {
    if (viewMode === 'kanban' && status === 'kanban') return true;
    if (viewMode === 'kanban') return false;
    if (minScore > 0) return minScoreFilter === minScore;
    return currentStatus === status && currentRegion === region && minScoreFilter === 0;
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#0B1120] text-slate-300 border-r border-slate-800/90 shadow-2xl select-none">
      
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800/90">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-md transition group-hover:scale-105">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>TalentRadar</span>
              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/60 uppercase">PRO</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-400 tracking-wide">
              AI Career Copilot
            </div>
          </div>
        </Link>
        
        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-6">
        
        {/* Section 1: Discovery Radar */}
        <div>
          <div className="px-3 mb-2.5 text-[10px] font-extrabold tracking-wider uppercase text-slate-400 flex items-center justify-between">
            <span>Discovery Radar</span>
            <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>LIVE</span>
            </span>
          </div>

          <nav className="space-y-1">
            {/* Live Feed (All) */}
            <button
              onClick={() => {
                onViewModeChange('list');
                onFilterChange('all', 'all', 0);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                isNavActive('all', 'all', 0)
                  ? 'bg-gradient-to-r from-cyan-500/20 to-sky-500/10 text-white border-l-4 border-cyan-400 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">⚡</span>
                <span>All Opportunities</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-800 text-slate-200">
                {stats.total_jobs || 0}
              </span>
            </button>

            {/* High Match (75%+) */}
            <button
              onClick={() => {
                onViewModeChange('list');
                onFilterChange('all', 'all', 75);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                minScoreFilter === 75 && viewMode === 'list'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border-l-4 border-emerald-400 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🎯</span>
                <span>Top ATS Fit (≥70%)</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {stats.high_match || 0}
              </span>
            </button>

            {/* Gulf Tech Hub */}
            <button
              onClick={() => {
                onViewModeChange('list');
                onFilterChange('all', 'gulf', 0);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                currentRegion === 'gulf' && currentStatus !== 'trash' && minScoreFilter === 0 && viewMode === 'list'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-sky-500/10 text-cyan-300 border-l-4 border-cyan-400 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🌴</span>
                <span>Gulf Tech Hub</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-800 text-slate-200">
                {stats.gulf_jobs || 0}
              </span>
            </button>

            {/* Pakistan & Remote */}
            <button
              onClick={() => {
                onViewModeChange('list');
                onFilterChange('all', 'pakistan', 0);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                currentRegion === 'pakistan' && currentStatus !== 'trash' && minScoreFilter === 0 && viewMode === 'list'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border-l-4 border-emerald-400 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🇵🇰</span>
                <span>Pakistan &amp; Remote</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-800 text-slate-200">
                {stats.pakistan_jobs || 0}
              </span>
            </button>
          </nav>
        </div>

        {/* Section 2: Application Pipeline (CRM) */}
        <div>
          <div className="px-3 mb-2.5 text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
            Application Pipeline (CRM)
          </div>

          <nav className="space-y-1">
            {/* Kanban Pipeline Board */}
            <button
              onClick={() => {
                onViewModeChange('kanban');
                onFilterChange('all', 'all', 0);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-gradient-to-r from-indigo-500/25 to-blue-500/15 text-indigo-200 border-l-4 border-indigo-400 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Kanban className="w-4 h-4 text-indigo-400" />
                <span>Kanban Pipeline</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                BOARD
              </span>
            </button>

            {/* Applied */}
            <button
              onClick={() => {
                onViewModeChange('list');
                onFilterChange('applied', 'all', 0);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                currentStatus === 'applied' && viewMode === 'list'
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-300 border-l-4 border-indigo-400 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🚀</span>
                <span>Applied</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-900/60 text-indigo-300">
                {stats.applied_jobs || 0}
              </span>
            </button>

            {/* Interviewing */}
            <button
              onClick={() => {
                onViewModeChange('list');
                onFilterChange('interviewing', 'all', 0);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                currentStatus === 'interviewing' && viewMode === 'list'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 text-purple-300 border-l-4 border-purple-400 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📞</span>
                <span>Interviewing</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-900/60 text-purple-300">
                {stats.interviewing_jobs || 0}
              </span>
            </button>

            {/* Saved Bookmarks */}
            <button
              onClick={() => {
                onViewModeChange('list');
                onFilterChange('saved', 'all', 0);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                currentStatus === 'saved' && viewMode === 'list'
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-300 border-l-4 border-amber-400 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">⭐</span>
                <span>Saved Bookmarks</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-900/60 text-amber-300">
                {stats.saved_jobs || 0}
              </span>
            </button>

            {/* Archive & Trash */}
            <button
              onClick={() => {
                onViewModeChange('list');
                onFilterChange('trash', 'all', 0);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                currentStatus === 'trash' && viewMode === 'list'
                  ? 'bg-gradient-to-r from-rose-500/20 to-red-500/10 text-rose-300 border-l-4 border-rose-400 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🗑️</span>
                <span>Archive &amp; Trash</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-900/60 text-rose-300">
                {stats.trashed_jobs || 0}
              </span>
            </button>
          </nav>
        </div>

        {/* Section 3: Copilot & Intelligence */}
        <div>
          <div className="px-3 mb-2.5 text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
            Copilot &amp; Intelligence
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/70 border border-slate-800/80 transition text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">🧠</span>
                <div className="min-w-0">
                  <div className="font-bold text-slate-200">Target Stack &amp; CV</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                    {stats.active_cv || 'Resume active'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition flex-shrink-0" />
            </button>

            <button
              onClick={onOpenUpgrade}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-amber-300 hover:bg-amber-950/40 transition text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">💎</span>
                <div>
                  <div className="font-bold text-amber-200">
                    {currentUser?.role === 'user' ? 'Upgrade to Pro' : 'Pro Accelerator'}
                  </div>
                  <div className="text-[10px] text-amber-400/80">
                    {currentUser?.role === 'user' ? 'Unlock All Roles & Searches' : 'All Roles Unlocked'}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                currentUser?.role === 'user'
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {currentUser?.role === 'user' ? 'Upgrade' : 'Active'}
              </span>
            </button>
          </nav>
        </div>

      </div>

      {/* User Profile Footer */}
      <div className="p-3.5 border-t border-slate-800/90 bg-slate-950/95 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0">
              {(currentUser?.full_name || currentUser?.username || 'TR').substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-white truncate">
                {currentUser?.full_name || currentUser?.username || 'Member'}
              </div>
              <div className="text-[10px] text-cyan-400 font-bold flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${currentUser?.role === 'user' ? 'bg-amber-400' : 'bg-cyan-400 animate-pulse'}`}></span>
                <span className={currentUser?.role === 'user' ? 'text-amber-400' : 'text-cyan-400'}>
                  {currentUser?.role === 'admin'
                    ? 'Administrator'
                    : currentUser?.role === 'pro'
                    ? 'Career Pro Member'
                    : 'Free Tier (Limited)'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign out of TalentRadar"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Free Tier Search Quota Bar */}
        {currentUser?.role === 'user' && (
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-400 flex items-center gap-1">
                <span>⚡ Searches:</span>
                <strong className="text-white">{currentUser.searches_count || 0} / {currentUser.max_free_searches || 10}</strong>
              </span>
              {(currentUser.searches_count || 0) >= (currentUser.max_free_searches || 10) ? (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  EXHAUSTED
                </span>
              ) : (
                <span className="text-[10px] text-amber-400">
                  {(currentUser.max_free_searches || 10) - (currentUser.searches_count || 0)} left
                </span>
              )}
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  (currentUser.searches_count || 0) >= (currentUser.max_free_searches || 10)
                    ? 'bg-rose-500'
                    : (currentUser.searches_count || 0) >= 7
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.round(((currentUser.searches_count || 0) / (currentUser.max_free_searches || 10)) * 100))}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar: VISIBLE ON ALL SCREENS >= md (768px) */}
      <aside className="w-64 flex-shrink-0 hidden md:flex flex-col z-30 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile Slide-Over Overlay (< 768px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-full flex-1 flex flex-col z-10 shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
