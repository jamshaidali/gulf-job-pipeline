'use client';

import React, { useState } from 'react';
import { Job, RecruiterOutreachResponse } from '@/types';
import { X, Copy, Check, MessageSquare, Mail, ExternalLink, Loader2 } from 'lucide-react';

interface RecruiterModalProps {
  job: Job | null;
  data: RecruiterOutreachResponse | null;
  loading: boolean;
  onClose: () => void;
  onToast: (msg: string, icon?: string) => void;
}

export default function RecruiterModal({
  job,
  data,
  loading,
  onClose,
  onToast,
}: RecruiterModalProps) {
  const [activeTab, setActiveTab] = useState<'linkedin' | 'email'>('linkedin');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!job) return null;

  const copyToClipboard = (text: string, field: string, toastMessage: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    onToast(toastMessage, '📋');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const linkedinNoteLength = (data?.linkedin_note || '').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 text-xl font-bold cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              1-Click Direct Outreach
            </span>
            <span className="text-xs text-slate-400 font-semibold">{job.company}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {job.title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Decision-Maker: <strong className="text-slate-800">{data?.recruiter_name || 'Hiring Lead / Technical Recruiter'}</strong>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('linkedin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'linkedin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>LinkedIn Note (300 Chars)</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'email'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Cold InMail / Email Pitch</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
          {loading ? (
            <div className="p-16 text-center text-xs font-bold text-indigo-600 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Analyzing job profile and crafting high-converting outreach pitch...</span>
            </div>
          ) : (
            <>
              {/* LinkedIn Note Tab */}
              {activeTab === 'linkedin' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">LinkedIn Free Connection Request Note:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                        linkedinNoteLength <= 300
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {linkedinNoteLength} / 300 characters
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap select-all">
                    {data?.linkedin_note}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Strictly trimmed to fit within LinkedIn&apos;s free connection request limit.
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          data?.linkedin_note || '',
                          'li',
                          'LinkedIn connection note copied! 📋'
                        )
                      }
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedField === 'li' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'li' ? 'Copied!' : 'Copy LinkedIn Note'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Cold Email Tab */}
              {activeTab === 'email' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">Complete Cold Pitch / InMail Message:</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          data?.email_draft || '',
                          'email',
                          'Cold email pitch copied to clipboard! ✉️'
                        )
                      }
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedField === 'email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'email' ? 'Copied!' : 'Copy Full Email Draft'}</span>
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap select-all max-h-72 overflow-y-auto custom-scrollbar">
                    {data?.email_draft}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition text-xs cursor-pointer"
          >
            Close
          </button>
          
          <div className="flex items-center gap-2">
            {job.hiring_managers?.map((hm) => (
              <a
                key={hm.name}
                href={hm.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{hm.name}</span>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
