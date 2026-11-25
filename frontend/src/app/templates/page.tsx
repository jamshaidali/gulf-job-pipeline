'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TemplateAuthModal from '@/components/TemplateAuthModal';
import TemplateThumbnail from '@/components/builder/TemplateThumbnail';
import { fetchCurrentUser, fetchCVTemplates } from '@/lib/api';
import { DESIGNER_NOTE, styleTagline } from '@/lib/templatePreview';
import type { CVTemplate } from '@/types';
import { Sparkles, ArrowRight, ShieldCheck, Search, Eye, Lock, Loader2, X } from 'lucide-react';

// Extra filters that cut across the categories: designer layouts (photo & sidebar) vs. ATS-safe single-column ones.
const FILTER_DESIGNER = 'Designer: photo & sidebar';
const FILTER_ATS_SAFE = 'ATS-safe: single column';

const FALLBACK_CATEGORIES = [
  'All',
  'Tech & Software',
  'Executive & Leadership',
  'Minimalist ATS',
  'Data & AI',
  'Finance & Banking',
  'Creative & Remote',
  'Enterprise & Global',
];

const FONT_LABELS: Record<string, string> = {
  Helvetica: 'Arial-style sans',
  'Times-Roman': 'Times-style serif',
  Carlito: 'Calibri-style sans',
  Caladea: 'Cambria-style serif',
};
const fontLabel = (fontFamily: string) => FONT_LABELS[fontFamily] || 'Sans-serif';

// Cards are rendered in pages: 500+ full previews at once would be slow, and nobody scrolls through them all.
const PAGE_SIZE = 36;

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<CVTemplate | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authModalTemplate, setAuthModalTemplate] = useState<{ id: string; name: string } | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (typeof window !== 'undefined' && localStorage.getItem('tr_auth_user')) {
          setIsAuthenticated(true);
        }
        const user = await fetchCurrentUser();
        if (user) setIsAuthenticated(true);
      } catch {
        // Signed-out visitors are fine.
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetchCVTemplates()
      .then((res) => {
        if (cancelled) return;
        setTemplates(Array.isArray(res.templates) ? res.templates : []);
        if (Array.isArray(res.categories) && res.categories.length > 0) setCategories(res.categories);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!previewTemplate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewTemplate(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewTemplate]);

  const handleUseTemplate = (template: CVTemplate) => {
    if (isAuthenticated || (typeof window !== 'undefined' && localStorage.getItem('tr_auth_user'))) {
      router.push(`/builder?template=${encodeURIComponent(template.id)}`);
    } else {
      setPreviewTemplate(null);
      setAuthModalTemplate({ id: template.id, name: template.name });
    }
  };

  // A new search or filter starts again from the first page
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, searchQuery]);

  // Load the next page automatically when the "show more" area scrolls into view
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setVisibleCount((n) => n + PAGE_SIZE);
    }, { rootMargin: '600px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, loading, selectedCategory, searchQuery]);

  const filterPills = ['All', FILTER_DESIGNER, FILTER_ATS_SAFE, ...categories.filter((c) => c !== 'All')];

  const query = searchQuery.toLowerCase().trim();
  const filteredTemplates = templates.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      (selectedCategory === FILTER_DESIGNER && Boolean(item.designer)) ||
      (selectedCategory === FILTER_ATS_SAFE && !item.designer) ||
      item.category === selectedCategory;
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      styleTagline(item).toLowerCase().includes(query) ||
      fontLabel(item.font_family).toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 flex flex-col font-sans">
      {/* Announcement Ribbon */}
      <div className="bg-slate-900 text-white py-2 px-4 text-center text-xs font-semibold">
        <span className="text-cyan-400 font-bold">✨ 100% Free Public Launch:</span> All 500+ Resume Templates Unlocked with Zero Paywalls &bull;{' '}
        <Link href="/builder" className="text-cyan-300 underline font-bold hover:text-white transition">
          Open Live CV Builder &rarr;
        </Link>
      </div>

      <Navbar />

      <main className="flex-1 pb-24">
        {/* HERO SECTION */}
        <section className="bg-white border-b border-slate-200/80 pt-12 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>ATS-safe single-column styles &bull; Designer styles with photos</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              500+ Resume Templates, <br />
              <span className="bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">
                from ATS-safe to designer
              </span>
            </h1>

            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              Every preview below is the real template, filled with sample content. Pick one, open it in the builder, and
              your own details flow into the same layout you download. Choose an ATS-safe single-column style for online
              applications, or a designer style with a photo and sidebar to share directly.
            </p>

            {/* Search Bar */}
            <div className="mt-8 max-w-md mx-auto relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates (e.g. Executive, Compact, Data)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {filterPills.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* TEMPLATES GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="flex items-center justify-between pb-6 border-b border-slate-200 text-xs font-bold text-slate-500">
            <span>{loading ? 'Loading templates…' : `Showing ${filteredTemplates.length} Templates`}</span>
            <span className="text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Free account required to use a template
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-500 text-sm font-semibold">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
              <span>Rendering templates…</span>
            </div>
          ) : loadError ? (
            <div className="text-center py-20 space-y-3">
              <div className="font-extrabold text-slate-800">We couldn&apos;t load the templates.</div>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-20 space-y-2">
              <div className="font-extrabold text-slate-800">No templates match your search.</div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mt-8">
              {filteredTemplates.slice(0, visibleCount).map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                  style={{ contentVisibility: 'auto', containIntrinsicSize: '440px 700px' }}
                >
                  {/* The actual template, rendered with sample content */}
                  <div className="p-4 bg-slate-100 border-b border-slate-200 relative">
                    <div
                      className="rounded-lg border border-slate-200 shadow-sm overflow-hidden"
                      data-testid="template-thumbnail"
                      data-layout={template.layout}
                      aria-label={`${template.name} preview`}
                    >
                      <TemplateThumbnail template={template} crop />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      className="absolute bottom-7 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-md hover:bg-black transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Quick Preview</span>
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">{template.category}</div>
                      <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{template.name}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{template.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {styleTagline(template)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {fontLabel(template.font_family)}
                        </span>
                        {template.designer && (
                          <>
                            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-semibold">
                              Designer
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold">
                              Not for strict ATS
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleUseTemplate(template)}
                        className="w-full py-2.5 px-4 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                        <span>Use This Template</span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !loadError && filteredTemplates.length > visibleCount && (
            <div ref={loadMoreRef} className="mt-10 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Showing {visibleCount} of {filteredTemplates.length}
              </p>
              <button
                type="button"
                data-testid="load-more-templates"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-xs cursor-pointer"
              >
                Show more templates
              </button>
            </div>
          )}
        </section>

        {/* QUICK PREVIEW: the real template at reading size */}
        {previewTemplate && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`${previewTemplate.name} preview`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewTemplate(null);
            }}
          >
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between gap-3 px-5 sm:px-7 py-4 border-b border-slate-200">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-cyan-700 uppercase tracking-wider">{previewTemplate.category}</div>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">{previewTemplate.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {styleTagline(previewTemplate)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {fontLabel(previewTemplate.font_family)}
                    </span>
                    {previewTemplate.designer ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold">
                        Designer layout
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                        Single column, real text
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  aria-label="Close preview"
                  className="w-9 h-9 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-100 px-3 sm:px-6 py-5">
                <div
                  className="mx-auto max-w-[620px] rounded-md border border-slate-300 shadow-lg overflow-hidden"
                  data-testid="template-quick-preview"
                  data-layout={previewTemplate.layout}
                >
                  <TemplateThumbnail template={previewTemplate} />
                </div>
                <p className="text-center text-xs text-slate-500 mt-3">
                  Sample content shown. Your own details fill this exact layout in the builder.
                </p>
                {previewTemplate.designer && (
                  <p className="text-center text-xs text-amber-800 font-semibold mt-2 max-w-md mx-auto">{DESIGNER_NOTE}</p>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 px-5 sm:px-7 py-4 border-t border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer text-center"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleUseTemplate(previewTemplate)}
                  className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Use this template in the builder</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Crawlable guidance text (server-rendered with the page) */}
        <section aria-labelledby="choose-template" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-8 text-sm text-slate-700 leading-relaxed">
          <div className="space-y-3">
            <h2 id="choose-template" className="text-2xl font-black text-slate-900">How to choose a resume template</h2>
            <p>
              A good resume template makes your experience easy to read. It does not need to be fancy. Recruiters skim, and applicant tracking systems (ATS) read your resume into fields, so the layout should be clean, with a clear name, headings that are easy to find and dates that line up.
            </p>
            <p>
              Every template here is free to customize in the builder and download as a PDF or Word file. The text in the PDF is real, selectable text, not an image.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900">ATS-safe, single-column templates</h3>
              <p>
                These use one column, standard headings and common fonts. Choose one of these for online applications, where your file goes through employer software first. Most people should start here.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900">Designer templates with a photo or sidebar</h3>
              <p>
                These add a coloured sidebar or banner and an optional profile photo. They look striking when you send a resume directly to a person, but strict ATS software may read them poorly. Photos are expected in some countries and discouraged in others, so check local norms and the job posting.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-900">Style choices that change the look</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Header: left-aligned, centered, split with contact details on the right, or a full-width banner</li>
              <li>Headings: ruled lines, tinted bands, accent bars, short underlines or plain</li>
              <li>Fonts: Arial-, Times-, Calibri- and Cambria-style families, with open-licensed equivalents embedded in the PDF</li>
              <li>Spacing: compact, standard or airy, without shrinking text below 10 pt</li>
              <li>Colour: 36 palettes checked for readable contrast on white</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-900">Tips for picking the right one</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>For most corporate, technical and public-sector jobs, use a single-column, mostly black-and-white layout with one accent colour.</li>
              <li>For design, marketing and creative roles, a designer template can show personality.</li>
              <li>If you have a lot of experience, choose a compact or standard spacing so it fits two pages comfortably.</li>
              <li>Pick the template first, then edit the content. You can switch templates at any time and your text stays.</li>
            </ul>
            <p>
              Not sure what to write? Read our guides on{' '}
              <Link href="/guides/how-to-write-a-resume-summary" className="text-indigo-700 font-semibold hover:underline">writing a resume summary</Link>,{' '}
              <Link href="/guides/resume-bullet-points-xyz-formula" className="text-indigo-700 font-semibold hover:underline">resume bullet points</Link> and the{' '}
              <Link href="/guides/ats-resume-optimization-checklist-2026" className="text-indigo-700 font-semibold hover:underline">ATS resume checklist</Link>, or run your resume through the{' '}
              <Link href="/ats-scanner" className="text-indigo-700 font-semibold hover:underline">free ATS Scanner</Link>.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-900">Frequently asked questions</h3>
            <div>
              <h4 className="font-bold text-slate-900">Are the templates free?</h4>
              <p>You can browse all of them without an account. Sign up to use a template in the builder.</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Can I download my resume as a Word file?</h4>
              <p>Yes. Every template exports to PDF and to an editable Word (.docx) file. Word styling is close to the PDF but not identical.</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Which template is best for applicant tracking systems?</h4>
              <p>A single-column template with standard headings is the safest. No template can guarantee how a particular employer&apos;s software will read it.</p>
            </div>
          </div>
        </section>
      </main>

      <TemplateAuthModal
        isOpen={!!authModalTemplate}
        onClose={() => setAuthModalTemplate(null)}
        templateId={authModalTemplate?.id || 'gulf_dubai_sapphire'}
        templateName={authModalTemplate?.name || 'ATS-Optimized Template'}
      />

      <Footer />
    </div>
  );
}
