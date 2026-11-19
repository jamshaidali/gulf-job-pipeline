'use client';

import React from 'react';
import { Sparkles, CheckCircle2, Undo2, X, Target, Wand2, ListChecks, Type, ArrowRight } from 'lucide-react';

export type SuggestionKey = 'headline' | 'summary' | 'skills' | 'bullets';

export interface AtsContext {
  overallScore?: number;
  missingHardSkills: string[];
  missingSoftSkills: string[];
  tailoredHeadline: string;
  tailoredSummary: string;
  tailoredBullets: Array<{ focus: string; bullet: string }>;
  targetJobTitle: string;
  targetCompany: string;
}

/** What the CV currently contains: used to tell which suggestions are already applied. */
export interface CvSnapshot {
  jobTitle: string;
  summary: string;
  skills: string[];
  firstRoleBullets: string[];
}

interface Suggestion {
  key: SuggestionKey;
  /** Tab that holds the changed content. */
  tab: 'basics' | 'summary' | 'skills' | 'experience';
  title: string;
  why: string;
  applyLabel: string;
  applied: boolean;
  preview: React.ReactNode;
  icon: React.ReactNode;
}

const norm = (s: string) => s.trim().toLowerCase();

/** The suggestions the scan produced, with whether each one is already in the CV. */
export function buildSuggestions(ctx: AtsContext, cv: CvSnapshot): Suggestion[] {
  const out: Suggestion[] = [];

  if (ctx.tailoredHeadline && ctx.tailoredHeadline.trim()) {
    out.push({
      key: 'headline',
      tab: 'basics',
      title: 'Match your headline to the job',
      why: 'Recruiters search by job title. This headline mirrors the role you are applying for.',
      applyLabel: 'Apply tailored headline',
      applied: norm(cv.jobTitle) === norm(ctx.tailoredHeadline),
      icon: <Type className="w-4 h-4" />,
      preview: <span className="font-semibold text-slate-900">{ctx.tailoredHeadline}</span>,
    });
  }

  if (ctx.tailoredSummary && ctx.tailoredSummary.trim()) {
    out.push({
      key: 'summary',
      tab: 'summary',
      title: 'Use a summary written for this job',
      why: 'Reworded to reflect the wording and priorities of the job description.',
      applyLabel: 'Apply ATS-Tailored Summary',
      applied: norm(cv.summary) === norm(ctx.tailoredSummary),
      icon: <Wand2 className="w-4 h-4" />,
      preview: <span className="line-clamp-3 text-slate-700">&ldquo;{ctx.tailoredSummary}&rdquo;</span>,
    });
  }

  if (ctx.missingHardSkills && ctx.missingHardSkills.length > 0) {
    const have = new Set(cv.skills.map(norm));
    const total = ctx.missingHardSkills.length;
    out.push({
      key: 'skills',
      tab: 'skills',
      title: `Add ${total} skill${total === 1 ? '' : 's'} the job asks for`,
      why: 'These keywords are in the job description but missing from your CV. Only add skills you genuinely have.',
      applyLabel: `Add ${total} Missing JD Skills`,
      applied: ctx.missingHardSkills.every((s) => have.has(norm(s))),
      icon: <Target className="w-4 h-4" />,
      preview: (
        <span className="flex flex-wrap gap-1.5">
          {ctx.missingHardSkills.slice(0, 8).map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-900 font-semibold">
              + {s}
            </span>
          ))}
          {total > 8 && <span className="px-1 py-0.5 text-slate-500 font-semibold">+{total - 8} more</span>}
        </span>
      ),
    });
  }

  const bullets = (ctx.tailoredBullets || []).map((b) => (b.bullet || '').trim()).filter(Boolean);
  if (bullets.length > 0) {
    const have = new Set(cv.firstRoleBullets.map(norm));
    out.push({
      key: 'bullets',
      tab: 'experience',
      title: `Add ${bullets.length} stronger, measurable bullet${bullets.length === 1 ? '' : 's'}`,
      why: 'Quantified achievements aimed at this role, added to the top of your most recent job.',
      applyLabel: `Insert ${bullets.length} AI-Tailored Bullets`,
      applied: bullets.every((b) => have.has(norm(b))),
      icon: <ListChecks className="w-4 h-4" />,
      preview: (
        <ul className="space-y-1 text-slate-700">
          {bullets.slice(0, 2).map((b, i) => (
            <li key={i} className="line-clamp-2">
              &bull; {b}
            </li>
          ))}
          {bullets.length > 2 && <li className="text-slate-500 font-semibold">+{bullets.length - 2} more</li>}
        </ul>
      ),
    });
  }

  return out;
}

export default function AtsSuggestionsPanel({
  context,
  cv,
  canUndo,
  onApply,
  onUndo,
  onApplyAll,
  onDismiss,
  onGoToTab,
}: {
  context: AtsContext;
  cv: CvSnapshot;
  /** Which applied suggestions can be undone (the panel applied them in this session). */
  canUndo: (key: SuggestionKey) => boolean;
  onApply: (key: SuggestionKey) => void;
  onUndo: (key: SuggestionKey) => void;
  onApplyAll: () => void;
  onDismiss: () => void;
  onGoToTab: (tab: Suggestion['tab']) => void;
}) {
  const items = buildSuggestions(context, cv);
  if (items.length === 0) return null;

  const done = items.filter((i) => i.applied).length;
  const pending = items.length - done;
  const score = typeof context.overallScore === 'number' ? context.overallScore : null;
  const target = [context.targetJobTitle, context.targetCompany].filter(Boolean).join(' at ');
  const allDone = pending === 0;

  return (
    <section
      id="ats-suggestions"
      data-testid="ats-suggestions"
      aria-label="Suggested improvements from your ATS scan"
      className={`rounded-2xl border-2 overflow-hidden shadow-lg ${
        allDone ? 'border-emerald-300 bg-emerald-50/60' : 'border-indigo-400 bg-gradient-to-br from-indigo-50 via-white to-violet-50'
      }`}
    >
      <div className={`h-1.5 ${allDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500'}`} />
      <div className="p-4 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-md ${
                allDone ? 'bg-emerald-600' : 'bg-gradient-to-br from-indigo-600 to-violet-600'
              }`}
            >
              {allDone ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Synced from ATS Scanner{score !== null ? ` (${score}% Match)` : ''}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {allDone
                  ? 'All suggestions applied'
                  : `${pending} suggested improvement${pending === 1 ? '' : 's'} ready for your CV`}
              </h3>
              {target && <p className="text-xs text-slate-600 mt-0.5 truncate">Tailored for {target}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Hide suggestions"
            title="Hide suggestions"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={done}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${(done / items.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 shrink-0">
            {done} of {items.length} applied
          </span>
        </div>

        {!allDone && items.length > 1 && (
          <button
            type="button"
            onClick={onApplyAll}
            data-testid="ats-apply-all"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply all {pending} improvements</span>
          </button>
        )}

        <ol className="space-y-2.5">
          {items.map((item, idx) => (
            <li
              key={item.key}
              data-testid={`ats-suggestion-${item.key}`}
              data-applied={item.applied ? 'true' : 'false'}
              className={`rounded-xl border p-3 transition ${
                item.applied ? 'border-emerald-200 bg-white/70' : 'border-indigo-200 bg-white shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-black ${
                    item.applied ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {item.applied ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                    <span className={item.applied ? 'text-emerald-700' : 'text-indigo-600'}>{item.icon}</span>
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[13px] text-slate-600 leading-snug">{item.why}</p>
                  <div className="text-[13px] rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2">{item.preview}</div>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {item.applied ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Applied to your CV
                        </span>
                        {canUndo(item.key) && (
                          <button
                            type="button"
                            onClick={() => onUndo(item.key)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Undo
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onGoToTab(item.tab)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                        >
                          View it <ArrowRight className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onApply(item.key)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold shadow-sm transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{item.applyLabel}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {allDone && (
          <p className="text-xs text-emerald-800 font-semibold">
            Nice work. Re-scan your CV against the job to see your new match score.
          </p>
        )}
      </div>
    </section>
  );
}
