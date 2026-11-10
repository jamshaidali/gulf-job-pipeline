'use client';

import React from 'react';
import { Job } from '@/types';
import { 
  Send, 
  ExternalLink, 
  Copy, 
  Trash2, 
  ArrowRight, 
  Star, 
  PhoneCall, 
  Award, 
  CheckCircle2 
} from 'lucide-react';

interface KanbanBoardProps {
  jobs: Job[];
  onStatusChange: (jobId: string, status: string) => void;
  onOpenRecruiter: (job: Job) => void;
  onTrash: (jobId: string) => void;
  onToast: (msg: string, icon?: string) => void;
}

export default function KanbanBoard({
  jobs,
  onStatusChange,
  onOpenRecruiter,
  onTrash,
  onToast,
}: KanbanBoardProps) {
  
  const columns = [
    {
      id: 'new',
      title: 'Discovered',
      subtitle: 'Top Matched Roles',
      icon: '⚡',
      badgeClass: 'bg-slate-200 text-slate-800',
      headerBorder: 'border-slate-300',
    },
    {
      id: 'saved',
      title: 'Saved',
      subtitle: 'Shortlisted Bookmarks',
      icon: '⭐',
      badgeClass: 'bg-amber-100 text-amber-900',
      headerBorder: 'border-amber-300',
    },
    {
      id: 'applied',
      title: 'Applied',
      subtitle: 'Applications Submitted',
      icon: '🚀',
      badgeClass: 'bg-indigo-100 text-indigo-900',
      headerBorder: 'border-indigo-300',
    },
    {
      id: 'interviewing',
      title: 'Interviewing',
      subtitle: 'Screenings & Loops',
      icon: '📞',
      badgeClass: 'bg-purple-100 text-purple-900',
      headerBorder: 'border-purple-300',
    },
    {
      id: 'offer',
      title: 'Offers',
      subtitle: 'Final Discussions',
      icon: '🎉',
      badgeClass: 'bg-emerald-100 text-emerald-900',
      headerBorder: 'border-emerald-300',
    },
  ];

  const getJobsForColumn = (colId: string) => {
    return jobs.filter((j) => {
      if (j.status === 'trash') return false;
      if (colId === 'new') return j.status === 'new' || !j.status;
      if (colId === 'offer') return j.status === 'offer';
      return j.status === colId;
    });
  };

  const copyAtsKit = (job: Job) => {
    const bullets = (job.tailored_bullets || [])
      .map((b) => `• ${b.suggested_bullet || b}`)
      .join('\n');
    const keywords = (job.missing_keywords || []).join(', ');
    const kit = `=== ATS APPLICATION KIT FOR ${job.title.toUpperCase()} at ${job.company.toUpperCase()} ===
Match Fit: ${job.match_score || 0}% | Location: ${job.location || 'Remote'}
Apply Link: ${job.apply_url || 'N/A'}

[TAILORED RESUME HEADLINE]
${job.tailored_headline || `${job.title} | Software Engineer`}

[RECOMMENDED ATS BULLETS]
${bullets || '• Architected production systems with high scalability.'}

[TARGET ATS KEYWORDS]
${keywords || 'Full stack competencies covered'}
`;
    navigator.clipboard.writeText(kit);
    onToast('Complete ATS Kit copied! 📋', '📋');
  };

  return (
    <div className="overflow-x-auto pb-6 custom-scrollbar">
      <div className="flex gap-4 min-w-[1280px]">
        {columns.map((col) => {
          const colJobs = getJobsForColumn(col.id);

          return (
            <div
              key={col.id}
              className="w-80 flex-shrink-0 bg-slate-100/80 border border-slate-200/90 rounded-2xl p-3 flex flex-col max-h-[calc(100vh-250px)]"
            >
              {/* Column Header */}
              <div className={`p-3 bg-white rounded-xl border-b-2 ${col.headerBorder} shadow-2xs mb-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{col.icon}</span>
                  <div>
                    <div className="text-xs font-black text-slate-900 leading-tight">{col.title}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{col.subtitle}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${col.badgeClass}`}>
                  {colJobs.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {colJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition-all space-y-3"
                  >
                    {/* Top Row: Company & Score */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                          {(job.company || 'CO').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-800 truncate">{job.company}</span>
                      </div>
                      
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black flex-shrink-0 ${
                          (job.match_score || 0) >= 75
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {job.match_score || 0}%
                      </span>
                    </div>

                    {/* Job Title */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition line-clamp-2 leading-snug">
                        {job.title}
                      </h4>
                      <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                        <span className="truncate">{job.location}</span>
                        <span>&bull;</span>
                        <span className="flex-shrink-0 text-slate-400">{job.posted_ago || 'Recent'}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      {/* Recruiter Outreach */}
                      <button
                        onClick={() => onOpenRecruiter(job)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Generate 300-char LinkedIn outreach note"
                      >
                        <Send className="w-3 h-3 text-indigo-600" />
                        <span>Reach Recruiter</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyAtsKit(job)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Copy ATS Kit"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={job.apply_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          title="Open Application Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Move Stage Selector */}
                    <div className="pt-1 flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-slate-400 font-semibold">Move:</span>
                      <select
                        value={job.status}
                        onChange={(e) => onStatusChange(job.id, e.target.value)}
                        className="flex-1 text-[10px] font-bold py-1 px-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="new">⚡ Discovered</option>
                        <option value="saved">⭐ Saved</option>
                        <option value="applied">🚀 Applied</option>
                        <option value="interviewing">📞 Interviewing</option>
                        <option value="offer">🎉 Offer</option>
                      </select>
                    </div>

                  </div>
                ))}

                {colJobs.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400 italic bg-white/60 rounded-xl border border-dashed border-slate-200">
                    No roles in this stage.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
