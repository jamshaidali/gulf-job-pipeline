'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import TemplateThumbnail from '@/components/builder/TemplateThumbnail';
import { fetchCVTemplates } from '@/lib/api';
import { styleTagline } from '@/lib/templatePreview';
import type { CVTemplate } from '@/types';

const VISIBLE = 3;
const FEATURED = 9;

/** The looks we want to lead with, most eye-catching first. */
const LOOK_ORDER = [
  'sidebar_photo|Helvetica',
  'photo_banner|Helvetica',
  'sidebar_light|Helvetica',
  'split_header|Helvetica',
  'modern_accent|Helvetica',
  'single_column|Times-Roman',
  'sidebar_photo|Times-Roman',
  'photo_banner|Times-Roman',
  'single_column|Helvetica',
  'compact_dense|Helvetica',
];

/** One template per distinct look first (designer styles leading), then fill with the rest. */
const pickFeatured = (all: CVTemplate[]): CVTemplate[] => {
  const byLook = new Map<string, CVTemplate>();
  const rest: CVTemplate[] = [];
  for (const t of all) {
    const key = `${t.layout}|${t.font_family}`;
    if (byLook.has(key)) rest.push(t);
    else byLook.set(key, t);
  }
  const ordered: CVTemplate[] = [];
  for (const key of LOOK_ORDER) {
    const t = byLook.get(key);
    if (t) {
      ordered.push(t);
      byLook.delete(key);
    }
  }
  return [...ordered, ...byLook.values(), ...rest].slice(0, FEATURED);
};

/** Landing-page carousel of REAL catalog templates. Choosing one opens it in the builder. */
export default function TemplateShowcase({
  onUse,
  locked,
}: {
  onUse: (template: CVTemplate) => void;
  /** Visitor is signed out: show the lock hint on the button. */
  locked: boolean;
}) {
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [failed, setFailed] = useState<boolean>(false);
  const [start, setStart] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    fetchCVTemplates()
      .then((res) => {
        if (!cancelled) setTemplates(pickFeatured(Array.isArray(res.templates) ? res.templates : []));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (templates.length === 0) return [];
    const count = Math.min(VISIBLE, templates.length);
    return Array.from({ length: count }, (_, i) => templates[(start + i) % templates.length]);
  }, [templates, start]);

  if (failed) {
    return null; // The "Browse all templates" link below the carousel still works.
  }

  const step = (delta: number) => setStart((s) => (s + delta + templates.length) % templates.length);

  return (
    <div className="mt-14 relative" data-testid="template-showcase">
      {templates.length > VISIBLE && (
        <>
          <button
            type="button"
            aria-label="Previous template"
            onClick={() => step(-1)}
            className="hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-white hover:bg-slate-900 text-slate-700 hover:text-white border border-slate-200 transition-all duration-200 absolute left-0 lg:-left-2 top-1/2 -translate-y-1/2 z-30 shadow-md cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next template"
            onClick={() => step(1)}
            className="hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-slate-900 hover:bg-emerald-600 text-white transition-all duration-200 absolute right-0 lg:-right-2 top-1/2 -translate-y-1/2 z-30 shadow-xl cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-[1100px] mx-auto px-2 sm:px-10 text-left items-stretch">
        {templates.length === 0
          ? Array.from({ length: VISIBLE }, (_, i) => (
              <div key={i} className="rounded-2xl bg-white/70 border border-slate-200 aspect-[8.5/10] animate-pulse" />
            ))
          : visible.map((tpl) => (
              <div
                key={tpl.id}
                className="group rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="p-3 bg-slate-100 border-b border-slate-200">
                  <div
                    className="relative rounded-md border border-slate-200 shadow-sm overflow-hidden"
                    data-testid="showcase-thumbnail"
                    data-template={tpl.id}
                    data-layout={tpl.layout}
                  >
                    <TemplateThumbnail template={tpl} crop />
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      <span>{tpl.category}</span>
                      {tpl.designer && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-900 text-white text-[10px] normal-case tracking-normal">
                          Designer
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{tpl.name}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{styleTagline(tpl)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUse(tpl)}
                    className="w-full py-2.5 px-4 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    {locked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                    <span>Use this template</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </button>
                </div>
              </div>
            ))}
      </div>

      {templates.length > VISIBLE && (
        <div className="mt-8 flex items-center justify-center gap-2.5">
          {templates.map((tpl, idx) => (
            <button
              key={tpl.id}
              type="button"
              aria-label={`Show templates starting from ${tpl.name}`}
              onClick={() => setStart(idx)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                start === idx ? 'w-3 h-3 bg-white ring-2 ring-slate-900 scale-110' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
