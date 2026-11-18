'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Job } from '@/types';
import { generateCoverLetter, downloadTailoredCv } from '@/lib/api';
import { 
  Send, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  ThumbsDown, 
  Trash2, 
  RotateCcw, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  MapPin, 
  Target, 
  FileText,
  Briefcase,
  Users,
  Lock,
  Crown,
  Download,
  FileCheck,
  Loader2,
  Palette
} from 'lucide-react';
import TemplateGalleryModal from './TemplateGalleryModal';
import { CVTemplate } from '@/types';

interface JobCardProps {
  job: Job;
  onStatusChange: (jobId: string, status: string) => void;
  onFeedback: (jobId: string, rating: 'like' | 'dislike') => void;
  onTrash: (jobId: string) => void;
  onRestore: (jobId: string) => void;
  onOpenRecruiter: (job: Job) => void;
  onToast: (msg: string, icon?: string) => void;
  onOpenUpgrade?: () => void;
}

export default function JobCard({
  job,
  onStatusChange,
  onFeedback,
  onTrash,
  onRestore,
  onOpenRecruiter,
  onToast,
  onOpenUpgrade,
}: JobCardProps) {
  const [openDetail, setOpenDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'ats' | 'coverletter' | 'tailoredcv' | 'recruiters' | 'jd'>('ats');
  const [coverLetter, setCoverLetter] = useState<string>(job.coverLetter || '');
  const [loadingCoverLetter, setLoadingCoverLetter] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [copiedHeadline, setCopiedHeadline] = useState(false);
  const [copiedKeywords, setCopiedKeywords] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('gulf_dubai_sapphire');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('Dubai Silicon Oasis Pro');
  const [galleryOpen, setGalleryOpen] = useState(false);

  const handleDownloadCv = async (format: 'pdf' | 'docx', targetTmplId?: string) => {
    if (job.is_locked) {
      onOpenUpgrade?.();
      return;
    }
    const tmplToUse = targetTmplId || selectedTemplateId;
    if (format === 'pdf') setDownloadingPdf(true);
    else setDownloadingDocx(true);

    try {
      await downloadTailoredCv(job.id, format, tmplToUse);
      onToast(`ATS Tailored Resume (${format.toUpperCase()}) downloaded in ${selectedTemplateName}! 📄`, '📥');
    } catch (err: any) {
      onToast(err.message || 'Download failed', '⚠️');
      if (err.message && err.message.toLowerCase().includes('upgrade')) {
        onOpenUpgrade?.();
      }
    } finally {
      if (format === 'pdf') setDownloadingPdf(false);
      else setDownloadingDocx(false);
    }
  };

  const copyText = (text: string, msg: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    onToast(msg, '📋');
  };

  const copyHeadline = () => {
    if (!job.tailored_headline) return;
    copyText(job.tailored_headline, 'Tailored Headline copied! 📋');
    setCopiedHeadline(true);
    setTimeout(() => setCopiedHeadline(false), 2000);
  };

  const copyKeywordsList = () => {
    const kw = (job.missing_keywords || []).join(', ');
    if (!kw) return;
    copyText(kw, 'Target ATS Keywords copied! 📋');
    setCopiedKeywords(true);
    setTimeout(() => setCopiedKeywords(false), 2000);
  };

  const copyCompleteAtsKit = () => {
    const bullets = (job.tailored_bullets || [])
      .map((b) => `• ${b.suggested_bullet || b}`)
      .join('\n');
    const keywords = (job.missing_keywords || []).join(', ');
    const kit = `=== ATS APPLICATION KIT FOR ${job.title.toUpperCase()} at ${job.company.toUpperCase()} ===
Match Fit: ${job.match_score || 0}% | Location: ${job.location || 'Remote'}
Apply Link: ${job.apply_url || 'N/A'}

[TAILORED RESUME HEADLINE]
${job.tailored_headline || `${job.title} | Software Engineer`}

[RECOMMENDED ATS BULLETS TO ADD TO CV]
${bullets || '• Architected and deployed scalable production services.'}

[HIGH-PRIORITY ATS KEYWORDS TO INCLUDE]
${keywords || 'Core competencies covered in active stack'}

[AI FIT SUMMARY]
${job.summary || 'Strong technical and architectural alignment.'}
`;
    copyText(kit, 'Complete ATS Application Kit copied! 📋');
  };

  const handleGenerateCoverLetter = async () => {
    setLoadingCoverLetter(true);
    try {
      const cl = await generateCoverLetter(job.id);
      setCoverLetter(cl);
      onToast('Cover Letter tailored for this role! ✍️', '✨');
    } catch {
      onToast('Failed to generate cover letter', '⚠️');
    } finally {
      setLoadingCoverLetter(false);
    }
  };

  const matchScore = job.match_score || 0;
  const isTopFit = matchScore >= 75;
  const isGoodFit = matchScore >= 60;

  return (
    <>
      <div className="bg-white border border-slate-200/90 hover:border-indigo-500/40 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 space-y-4 card-hover-elevate">
      
      {/* 1. Header Section: Company, Title, Meta, Match Score & Apply */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left: Avatar + Title & Company Metadata */}
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          {/* Company Monogram Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-white font-black text-sm sm:text-base flex items-center justify-center shadow-xs border border-slate-700/40 flex-shrink-0">
            {(job.company || 'CO').substring(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-950 hover:text-indigo-600 transition tracking-tight">
                {job.title}
              </h2>
              
              {/* Country Tag */}
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                  job.country === 'Pakistan'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                }`}
              >
                {job.country === 'Pakistan' ? '🇵🇰 Pakistan & Remote' : '🌴 Gulf Tech Hub'}
              </span>

              {/* Date Tag */}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-100 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{job.posted_ago || 'Recent'}</span>
              </span>
            </div>

            {/* Company & Location Info */}
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 font-medium">
              <span className="font-extrabold text-slate-900">{job.company}</span>
              <span className="text-slate-300">&bull;</span>
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{job.location}</span>
              </span>
              {job.source && (
                <>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-slate-400 text-[11px]">via {job.source}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Match Score Badge & Primary Apply Action */}
        <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
          <div className="text-right">
            <div
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-2xs ${
                isTopFit
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-800 border border-emerald-300/80'
                  : isGoodFit
                  ? 'bg-gradient-to-r from-cyan-500/15 to-sky-500/10 text-cyan-800 border border-cyan-300/80'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isTopFit ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`}></span>
              <span>{matchScore}% Match</span>
            </div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
              {job.fit_verdict || (isTopFit ? 'Top ATS Fit' : 'Matched Role')}
            </div>
          </div>

          {/* External Apply Button or Unlock Action */}
          {job.is_locked ? (
            <button
              onClick={onOpenUpgrade}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-950" />
              <span>Unlock with Pro</span>
            </button>
          ) : (
            <a
              href={job.apply_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
            >
              <span>Apply Now</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-200" />
            </a>
          )}
        </div>
      </div>

      {/* Locked Paywall Card vs Unlocked Features */}
      {job.is_locked ? (
        <div className="relative rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/80 via-white to-slate-50/90 p-5 shadow-2xs space-y-3.5 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-950 border border-amber-400/50 flex items-center justify-center font-black flex-shrink-0">
                <Lock className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-950 uppercase tracking-wider">Pro Tier Opportunity</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-300">
                    Result #4+
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Top 3 search results are free. Upgrade to TalentRadar Pro to unlock this role, direct recruiter contacts, and 1-click ATS kits.
                </div>
              </div>
            </div>

            <button
              onClick={onOpenUpgrade}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-black text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Upgrade to Pro ($4.99/mo)</span>
            </button>
          </div>

          {/* Locked Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-amber-200/60 text-xs">
            <div className="p-3 bg-white/90 rounded-xl border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-[11px]">
                <span>🎯 Direct Recruiter Outreach</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Hiring managers&apos; verified LinkedIn profiles and 1-click customized 300-char connection request notes.
              </p>
            </div>

            <div className="p-3 bg-white/90 rounded-xl border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-[11px]">
                <span>⚡ 1-Click ATS Application Kit</span>
              </div>
              <p className="text-[11px] text-slate-500">
                AI-tailored headline pitch, target missing keywords, and custom cover letters matching this company.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Highlighted Selling Point: AI-Tailored Resume Pitch Box */}
          {job.tailored_headline && (
            <div className="p-3.5 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-white border border-indigo-100 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-indigo-950 font-extrabold text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI-Tailored Resume Pitch (Optimized for ATS Screening):</span>
            </div>
            <button
              onClick={copyHeadline}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-950 bg-indigo-100/70 hover:bg-indigo-200/70 px-2.5 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer"
            >
              {copiedHeadline ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedHeadline ? 'Copied!' : 'Copy Headline'}</span>
            </button>
          </div>
          <p className="text-slate-800 font-medium leading-relaxed italic">
            &ldquo;{job.tailored_headline}&rdquo;
          </p>

          {/* Missing Keywords Row */}
          {job.missing_keywords && job.missing_keywords.length > 0 && (
            <div className="pt-2 border-t border-indigo-100/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Keywords:</span>
                {job.missing_keywords.slice(0, 5).map((kw) => (
                  <span key={kw} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[10px] font-bold">
                    {kw}
                  </span>
                ))}
                {job.missing_keywords.length > 5 && (
                  <span className="text-[10px] text-slate-400 font-semibold">
                    +{job.missing_keywords.length - 5} more
                  </span>
                )}
              </div>
              <button
                onClick={copyKeywordsList}
                className="text-[10px] font-bold text-slate-600 hover:text-indigo-600 underline cursor-pointer"
              >
                {copiedKeywords ? 'Copied!' : 'Copy All Keywords'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Action Toolbar: Outreach, ATS Kit, Intelligence Dropdown, CRM Stage */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left Actions: Reach Recruiter + ATS Kit + Intelligence Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Reach Recruiter (300 Chars) */}
          <button
            onClick={() => onOpenRecruiter(job)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-cyan-300" />
            <span>Reach Recruiter</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/20 text-white font-black">300c</span>
          </button>

          {/* 1-Click ATS Kit */}
          <button
            onClick={copyCompleteAtsKit}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Copies headline, tailored bullets, and missing keywords in 1 click"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>1-Click ATS Kit</span>
          </button>

          {/* Collapsible Intelligence Toggle */}
          <button
            onClick={() => setOpenDetail(!openDetail)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
          >
            <span>{openDetail ? 'Hide Intelligence' : 'ATS Bullets & Cover Letter'}</span>
            {openDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right Actions: CRM Pipeline Stage Dropdown, Feedback, Trash */}
        <div className="flex items-center gap-2">
          {/* CRM Stage Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Stage:</span>
            <select
              value={job.status}
              onChange={(e) => onStatusChange(job.id, e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 outline-none cursor-pointer shadow-2xs transition"
            >
              <option value="new">⚡ Discovered</option>
              <option value="saved">⭐ Saved</option>
              <option value="applied">🚀 Applied</option>
              <option value="interviewing">📞 Interviewing</option>
              <option value="offer">🎉 Offer Received</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>

          {/* Thumbs Up (Boost in scans) */}
          <button
            onClick={() => onFeedback(job.id, 'like')}
            className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
              job.feedback_rating === 'like'
                ? 'text-emerald-600 bg-emerald-50 border-emerald-300'
                : 'text-slate-400 hover:text-slate-700 border-slate-200 bg-white'
            }`}
            title="Boost this company in market scans"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>

          {/* Thumbs Down (Penalize in scans) */}
          <button
            onClick={() => onFeedback(job.id, 'dislike')}
            className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
              job.feedback_rating === 'dislike'
                ? 'text-rose-600 bg-rose-50 border-rose-300'
                : 'text-slate-400 hover:text-slate-700 border-slate-200 bg-white'
            }`}
            title="Penalize this company in market scans"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>

          {/* Trash or Restore */}
          {job.status !== 'trash' ? (
            <button
              onClick={() => onTrash(job.id)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 bg-white transition cursor-pointer"
              title="Move to Trash / Ignore this role"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onRestore(job.id)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore</span>
            </button>
          )}
        </div>

      </div>

      {/* 4. Collapsible Deep Intelligence Panel */}
      {openDetail && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          
          {/* Sub-Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setActiveTab('ats')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                activeTab === 'ats' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🎯 ATS Keywords &amp; Tailored Bullets
            </button>
            <button
              onClick={() => {
                setActiveTab('coverletter');
                if (!coverLetter) handleGenerateCoverLetter();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'coverletter' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>✍️ AI Cover Letter</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-400 text-slate-950 font-black">AI</span>
            </button>
            <button
              onClick={() => setActiveTab('tailoredcv')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeTab === 'tailoredcv' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>📄 1-Click Tailored CV</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400 text-slate-950 font-black">PDF / DOCX</span>
            </button>
            <button
              onClick={() => setActiveTab('recruiters')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                activeTab === 'recruiters' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              👔 Hiring Leads ({job.hiring_managers?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('jd')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                activeTab === 'jd' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📄 Job Description (JD)
            </button>
          </div>

          {/* Sub-Tab 1: ATS Keywords & Bullets */}
          {activeTab === 'ats' && (
            <div className="space-y-3">
              {/* Full ATS Scanner Shortcut Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-gradient-to-r from-cyan-50 via-sky-50 to-indigo-50 border border-cyan-200/90 rounded-xl shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span className="text-xs font-extrabold text-slate-800">
                    Want a deep-dive ATS diagnostics report with hard/soft skills &amp; formatting audit?
                  </span>
                </div>
                <Link
                  href="/ats-scanner"
                  className="inline-flex items-center gap-1 text-xs font-black text-cyan-800 hover:text-cyan-950 bg-white border border-cyan-300 px-3 py-1.5 rounded-lg transition shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  <span>Open Full ATS Scanner</span>
                  <ExternalLink className="w-3 h-3 text-cyan-600" />
                </Link>
              </div>

              {/* High-Impact Keywords */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900">
                    🎯 Keywords to Add to Pass ATS Screening:
                  </span>
                  <button
                    onClick={() => copyText((job.missing_keywords || []).join(', '), 'Keywords copied!')}
                    className="text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-200/70 px-2.5 py-0.5 rounded-md transition cursor-pointer"
                  >
                    Copy Keywords
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(job.missing_keywords || []).map((kw) => (
                    <span key={kw} className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-950 text-xs font-bold shadow-2xs">
                      {kw}
                    </span>
                  ))}
                  {(!job.missing_keywords || job.missing_keywords.length === 0) && (
                    <span className="text-xs text-amber-800 font-medium">All core keywords already covered in your active resume profile!</span>
                  )}
                </div>
              </div>

              {/* Tailored Bullets */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  ✍️ Recommended CV Accomplishment Bullets for this Role:
                </div>
                {(job.tailored_bullets || []).map((b, idx) => (
                  <div key={idx} className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200 font-medium flex items-start justify-between gap-3 shadow-2xs">
                    <span className="leading-relaxed">&bull; {b.suggested_bullet}</span>
                    <button
                      onClick={() => copyText(b.suggested_bullet, 'Bullet copied!')}
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md flex-shrink-0 cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Tab 2: AI Cover Letter */}
          {activeTab === 'coverletter' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>✍️</span> <span>AI-Tailored Cover Letter for {job.company}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateCoverLetter}
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      Regenerate 🔄
                    </button>
                    <button
                      onClick={() => copyText(coverLetter, 'Cover letter copied!')}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      Copy Cover Letter 📋
                    </button>
                  </div>
                </div>

                {loadingCoverLetter ? (
                  <div className="text-xs text-indigo-600 font-bold p-8 text-center animate-pulse">
                    Analyzing job requirements &amp; drafting tailored cover letter...
                  </div>
                ) : coverLetter ? (
                  <div className="text-xs text-slate-800 bg-white p-4 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto custom-scrollbar font-medium">
                    {coverLetter}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                    Click &quot;Generate Cover Letter&quot; to craft an ATS-tailored letter for this role.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab: Tailored CV / Resume Export */}
          {activeTab === 'tailoredcv' && (
            <div className="space-y-4">
              
              {/* Highlight Banner */}
              <div className="p-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm border border-indigo-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-cyan-300">ATS Optimized &amp; Tailored CV</span>
                    </div>
                    <div className="text-sm font-extrabold text-white mt-1">
                      Ready-to-Submit Resume for {job.company}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Tailored specifically for <strong>{job.title}</strong> with target ATS keywords and verified accomplishments.
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDownloadCv('pdf')}
                      disabled={downloadingPdf}
                      className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>{downloadingPdf ? 'Compiling PDF...' : 'Download PDF (.pdf)'}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadCv('docx')}
                      disabled={downloadingDocx}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {downloadingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <FileText className="w-3.5 h-3.5 text-blue-300" />}
                      <span>{downloadingDocx ? 'Exporting Word...' : 'Word Doc (.docx)'}</span>
                    </button>
                  </div>
                </div>

                {/* Template Selector Strip */}
                <div className="pt-2.5 border-t border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">Selected Design:</span>
                    <span className="text-xs font-black text-cyan-300 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      <span>{selectedTemplateName}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGalleryOpen(true)}
                    className="px-3 py-1 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-white font-extrabold text-xs transition border border-indigo-400/40 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Palette className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Choose from 100+ Templates &rarr;</span>
                  </button>
                </div>
              </div>

              {/* Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                
                {/* 1. Tailored Headline */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800">📌 Tailored Resume Headline:</span>
                    <button
                      onClick={copyHeadline}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
                    >
                      {copiedHeadline ? 'Copied! ✓' : 'Copy'}
                    </button>
                  </div>
                  <div className="font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200">
                    {job.tailored_headline || `${job.title} | High-Scale Production Engineering`}
                  </div>
                </div>

                {/* 2. ATS Match Keywords */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800">🎯 Matched High-Yield Keywords:</span>
                    <button
                      onClick={copyKeywordsList}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
                    >
                      {copiedKeywords ? 'Copied! ✓' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 bg-white p-2.5 rounded-lg border border-slate-200 min-h-[42px]">
                    {(job.missing_keywords || []).slice(0, 6).map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[10px] font-bold">
                        +{kw}
                      </span>
                    ))}
                    {(!job.missing_keywords || job.missing_keywords.length === 0) && (
                      <span className="text-[11px] text-emerald-700 font-bold">All primary keywords matched!</span>
                    )}
                  </div>
                </div>

              </div>

              {/* 3. Accomplishments Preview */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-extrabold text-slate-800 text-xs">
                  ⚡ Included Accomplishment Bullets Grounded in Your Tech Stack:
                </div>
                {(job.tailored_bullets || []).map((b, i) => {
                  const bulletText = typeof b === 'string' ? b : b.suggested_bullet;
                  return (
                    <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800 text-xs font-medium leading-relaxed">
                      &bull; {bulletText}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Sub-Tab 3: Recruiters */}
          {activeTab === 'recruiters' && (
            <div className="space-y-2">
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-cyan-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-indigo-950">1-Click Decision-Maker Outreach Generator</div>
                  <div className="text-[11px] text-indigo-700">Get a 300-char LinkedIn connection note and cold email pitch.</div>
                </div>
                <button
                  onClick={() => onOpenRecruiter(job)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Draft Outreach &rarr;</span>
                </button>
              </div>

              {(job.hiring_managers || []).map((hm) => (
                <div key={hm.name} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{hm.name}</div>
                    <div className="text-[11px] text-slate-500">{hm.role}</div>
                  </div>
                  <a
                    href={hm.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
              {(!job.hiring_managers || job.hiring_managers.length === 0) && (
                <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-50 rounded-xl">
                  No verified recruiter directly linked for this posting yet. Apply directly via the portal.
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 4: JD */}
          {activeTab === 'jd' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Requirements</span>
                <button
                  onClick={() => copyText(job.description, 'JD copied!')}
                  className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  Copy Full Text
                </button>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 max-h-80 overflow-y-auto whitespace-pre-line custom-scrollbar leading-relaxed">
                {job.description || 'Full description available on application portal.'}
              </div>
            </div>
          )}

        </div>
      )}
    </>
  )}
</div>

  {/* 100+ CV Templates Gallery Modal */}
  <TemplateGalleryModal
    isOpen={galleryOpen}
    selectedTemplateId={selectedTemplateId}
    onSelectTemplate={(tmpl) => {
      setSelectedTemplateId(tmpl.id);
      setSelectedTemplateName(tmpl.name);
      onToast(`Selected template: ${tmpl.name}! 🎨`, '✨');
    }}
    onClose={() => setGalleryOpen(false)}
    onExport={(format, tmplId) => {
      handleDownloadCv(format, tmplId);
      setGalleryOpen(false);
    }}
    isExporting={downloadingPdf || downloadingDocx}
  />
</>
  );
}
