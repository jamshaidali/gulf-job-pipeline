'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CVTemplate } from '@/types';
import { fetchCVTemplates } from '@/lib/api';
import TemplateAuthModal from '@/components/TemplateAuthModal';
import { 
  X, 
  Search, 
  Sparkles, 
  Check, 
  Download, 
  FileText, 
  Loader2, 
  ShieldCheck, 
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface TemplateGalleryModalProps {
  /**
   * 'export' (default): download a tailored CV straight from the gallery (dashboard job cards, ATS scanner).
   * 'select': only choose a template; the caller applies it and the user edits and downloads elsewhere (builder).
   */
  mode?: 'export' | 'select';
  isOpen: boolean;
  selectedTemplateId: string;
  onSelectTemplate: (template: CVTemplate) => void;
  onClose: () => void;
  onExport?: (format: 'pdf' | 'docx', templateId: string) => Promise<void> | void;
  /** select mode: the user confirmed "Use this template". */
  onUseTemplate?: (template: CVTemplate) => void;
  isExporting?: boolean;
  isAuthenticated?: boolean;
  onAuthSuccess?: () => void;
  exportError?: string | null;
  onOpenInBuilder?: (template: CVTemplate) => void;
}

export default function TemplateGalleryModal({
  mode = 'export',
  isOpen,
  selectedTemplateId,
  onSelectTemplate,
  onClose,
  onExport,
  onUseTemplate,
  isExporting = false,
  isAuthenticated = false,
  onAuthSuccess,
  exportError = null,
  onOpenInBuilder,
}: TemplateGalleryModalProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [authed, setAuthed] = useState<boolean>(Boolean(isAuthenticated));
  // select mode: the highlighted card is only a pending choice until "Use this template" is pressed
  const [chosenId, setChosenId] = useState<string>(selectedTemplateId);
  useEffect(() => {
    if (isOpen) setChosenId(selectedTemplateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  const [pendingAction, setPendingAction] = useState<{
    type: 'select' | 'export' | 'builder' | 'use';
    format?: 'pdf' | 'docx';
    template: CVTemplate;
  } | null>(null);

  useEffect(() => {
    setAuthed(
      Boolean(isAuthenticated) ||
        (typeof window !== 'undefined' && Boolean(localStorage.getItem('tr_auth_user')))
    );
  }, [isAuthenticated, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchCVTemplates()
        .then((res) => {
          const loaded = res.templates || [];
          setTemplates(loaded);
          setCategories(res.categories || []);
          if (mode !== 'select' && loaded.length > 0 && !loaded.some((t) => t.id === selectedTemplateId)) {
            onSelectTemplate(loaded[0]);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTemplates = templates.filter((tmpl) => {
    const matchesCategory = selectedCategory === 'All' || tmpl.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      tmpl.name.toLowerCase().includes(query) || 
      tmpl.description.toLowerCase().includes(query) ||
      tmpl.badge.toLowerCase().includes(query) ||
      tmpl.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const activeId = mode === 'select' ? chosenId : selectedTemplateId;
  const currentTemplate = templates.find((t) => t.id === activeId) || templates[0] || {
    id: 'gulf_dubai_sapphire',
    name: 'Sapphire Modern Tech Pro',
    category: 'Tech & Software',
    layout: 'split_header',
    palette: 'dubai_sapphire',
    badge: 'Top Choice',
    ats_score: '99% ATS Pass',
    description: 'ATS-optimized professional resume template.',
    font_family: 'Helvetica',
    colors: {
      primary: '#1E1B4B',
      secondary: '#4338CA',
      accent: '#06B6D4',
      text: '#0F172A',
      bg: '#F0FDF4',
      rule: '#C7D2FE',
    },
  };

  const triggerOpenInBuilder = (tmpl: CVTemplate) => {
    if (onOpenInBuilder) {
      onOpenInBuilder(tmpl);
    } else {
      router.push(
        `/builder?template=${encodeURIComponent(tmpl.id)}&accent=${encodeURIComponent(tmpl.colors.primary)}`
      );
      onClose();
    }
  };

  const handleTemplateCardClick = (tmpl: CVTemplate) => {
    if (authed) {
      if (mode === 'select') setChosenId(tmpl.id);
      else onSelectTemplate(tmpl);
    } else {
      setPendingAction({
        type: 'select',
        template: tmpl,
      });
    }
  };

  const handleOpenInBuilderClick = () => {
    if (authed) {
      triggerOpenInBuilder(currentTemplate);
    } else {
      setPendingAction({
        type: 'builder',
        template: currentTemplate,
      });
    }
  };

  const isSelectMode = mode === 'select';

  const handleUseTemplateClick = () => {
    if (authed) {
      onUseTemplate?.(currentTemplate);
    } else {
      setPendingAction({ type: 'use', template: currentTemplate });
    }
  };

  const handleDownloadClick = (format: 'pdf' | 'docx') => {
    if (authed) {
      onExport?.(format, currentTemplate.id);
    } else {
      setPendingAction({
        type: 'export',
        format,
        template: currentTemplate,
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/80 backdrop-blur-md" role="dialog" aria-modal="true">
        <div className="bg-white rounded-3xl max-w-5xl w-full h-[92vh] sm:h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#0B1120] text-white flex items-start sm:items-center justify-between gap-3 border-b border-slate-800">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>105+ Professional CV Designs</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  100% ATS Ready
                </span>
                {authed ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{isSelectMode ? 'Unlocked' : 'Unlocked & Ready to Download'}</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>{isSelectMode ? 'Free Signup Required to Use Templates' : 'Free Signup Required to Download'}</span>
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white mt-1.5 tracking-tight">
                {isSelectMode ? 'Choose Your Resume Template' : 'Select Your Tailored CV Template'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                {isSelectMode
                  ? 'Pick a layout and color style. It opens in the builder, where you edit your details and then download as an ATS-friendly PDF or Word (.docx).'
                  : 'Choose from 105+ proven layouts and download your tailored resume as an ATS-friendly PDF or Word (.docx).'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close template gallery"
              className="text-slate-400 hover:text-white p-2 rounded-xl transition cursor-pointer bg-slate-900 border border-slate-800 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-2.5">
            {!isSelectMode && exportError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{exportError}</span>
              </div>
            )}

            {/* Row 1: Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 105+ templates by role, style, or industry (e.g. Backend, Minimalist, Executive)..."
                className="w-full pl-10 pr-14 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-600 shadow-2xs"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Row 2: Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {(categories.length > 0 ? categories : ['All', 'Tech & Software', 'Executive & Leadership', 'Minimalist ATS', 'Data & AI', 'Finance & Banking', 'Creative & Remote', 'Enterprise & Global']).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid Container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar bg-slate-100/60">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2 text-indigo-600 font-bold text-xs">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading 105+ curated CV templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <div className="text-3xl">🔍</div>
                <div className="font-extrabold text-slate-800 text-sm">No templates matched &quot;{searchQuery}&quot;</div>
                <p className="text-xs text-slate-500">Try searching for &quot;Tech&quot;, &quot;Executive&quot;, &quot;Clean&quot;, or reset categories.</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer mt-2"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredTemplates.map((tmpl) => {
                  const isSelected = tmpl.id === currentTemplate.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleTemplateCardClick(tmpl)}
                      className={`bg-white rounded-2xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between relative group hover:shadow-lg ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Row: Layout Badge & Color Swatches */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 truncate">
                            {tmpl.category}
                          </span>

                          {/* Swatches */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" 
                              style={{ backgroundColor: tmpl.colors.primary }}
                              title="Primary Color"
                            />
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" 
                              style={{ backgroundColor: tmpl.colors.secondary }}
                              title="Secondary Accent"
                            />
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" 
                              style={{ backgroundColor: tmpl.colors.accent }}
                              title="Highlight Accent"
                            />
                          </div>
                        </div>

                        {/* Visual Mini Resume Thumbnail Representation */}
                        <div 
                          className="h-28 rounded-xl border border-slate-200 p-2.5 mb-3 flex flex-col justify-between relative overflow-hidden transition group-hover:scale-[1.01]"
                          style={{ backgroundColor: tmpl.colors.bg || '#FFFFFF' }}
                        >
                          {/* Mock Header */}
                          {tmpl.layout === 'split_header' ? (
                            <div 
                              className="w-full rounded p-1.5 mb-1.5 flex items-center justify-between"
                              style={{ backgroundColor: tmpl.colors.primary }}
                            >
                              <div className="h-2.5 w-20 bg-white/90 rounded-xs"></div>
                              <div className="h-1.5 w-12 bg-cyan-200/80 rounded-xs"></div>
                            </div>
                          ) : (
                            <div className="space-y-1 mb-1">
                              <div className="flex items-center justify-between">
                                <div className="h-2.5 w-24 rounded-xs" style={{ backgroundColor: tmpl.colors.primary }}></div>
                                <div className="h-1.5 w-10 bg-slate-300 rounded-xs"></div>
                              </div>
                              <div className="h-1.5 w-32 rounded-xs" style={{ backgroundColor: tmpl.colors.secondary }}></div>
                              <div className="w-full h-0.5" style={{ backgroundColor: tmpl.colors.rule }}></div>
                            </div>
                          )}

                          {/* Mock Body Lines */}
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1">
                              {tmpl.layout === 'modern_accent' && (
                                <div className="w-1.5 h-2 rounded-2xs" style={{ backgroundColor: tmpl.colors.accent }}></div>
                              )}
                              <div className="h-1.5 w-16 rounded-xs" style={{ backgroundColor: tmpl.colors.secondary }}></div>
                            </div>
                            <div className="h-1 w-full bg-slate-200 rounded-2xs"></div>
                            <div className="h-1 w-4/5 bg-slate-200 rounded-2xs"></div>
                            <div className="h-1.5 w-14 rounded-xs mt-1" style={{ backgroundColor: tmpl.colors.secondary }}></div>
                            <div className="h-1 w-full bg-slate-200 rounded-2xs"></div>
                          </div>

                          {/* Selected Checkmark Overlay */}
                          {isSelected ? (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : !authed ? (
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-100/95 border border-amber-300 text-amber-900 text-[9px] font-extrabold flex items-center gap-0.5 shadow-2xs">
                              <Lock className="w-2.5 h-2.5 text-amber-700" />
                              <span>Sign Up</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Template Title */}
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight flex items-center justify-between">
                          <span>{tmpl.name}</span>
                        </h3>

                        {/* Description */}
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-2">
                          {tmpl.description}
                        </p>
                      </div>

                      {/* Bottom Meta & Selection */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{tmpl.ats_score}</span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateCardClick(tmpl);
                          }}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : !authed
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {!authed && !isSelected && <Lock className="w-2.5 h-2.5 text-amber-700" />}
                          <span>{isSelected ? 'Selected ✓' : !authed ? 'Unlock' : 'Select'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky Action Footer */}
          <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="w-7 h-7 rounded-lg border border-slate-300 shadow-2xs flex-shrink-0"
                style={{ backgroundColor: currentTemplate?.colors?.primary || '#0F172A' }}
              />
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 flex flex-wrap items-center gap-1.5">
                  <span>Active Template:</span>
                  <span className="text-indigo-600 font-black truncate">{currentTemplate?.name}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentTemplate?.category} &bull; {currentTemplate?.ats_score}
                  {!authed && (
                    <span className="ml-2 text-amber-700 font-bold">
                      &bull; {isSelectMode ? 'Free account required to use templates' : 'Free account required to download'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isSelectMode ? (
              <>
            {/* Select mode: choose the template, then edit and download in the builder */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleUseTemplateClick}
                    data-testid="modal-use-template-btn"
                    className="flex-1 sm:flex-initial justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    {!authed && <Lock className="w-3.5 h-3.5 text-indigo-100" />}
                    <span>Use this template</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
            {/* Quick Export Trigger Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleOpenInBuilderClick}
                    data-testid="modal-open-builder-btn"
                    className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {!authed && <Lock className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>Edit in Live Builder</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadClick('pdf')}
                    disabled={isExporting}
                    data-testid="modal-download-pdf-btn"
                    className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : !authed ? (
                      <Lock className="w-3.5 h-3.5 text-slate-900" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isExporting
                        ? 'Generating PDF...'
                        : 'Download PDF in this Style'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadClick('docx')}
                    disabled={isExporting}
                    data-testid="modal-download-docx-btn"
                    className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {!authed ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-blue-300" />
                    )}
                    <span>Word Doc (.docx)</span>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Signup / Login Gate Modal when unauthenticated user clicks Download or Unlock */}
      <TemplateAuthModal
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        templateId={pendingAction?.template?.id || currentTemplate.id}
        templateName={
          pendingAction?.type === 'export'
            ? `${pendingAction.template.name} (${(pendingAction.format || 'pdf').toUpperCase()} Download)`
            : pendingAction?.template?.name || currentTemplate.name
        }
        onSuccess={() => {
          const action = pendingAction;
          setAuthed(true);
          setPendingAction(null);
          if (onAuthSuccess) {
            onAuthSuccess();
          }
          if (action) {
            if (mode === 'select') setChosenId(action.template.id);
            else onSelectTemplate(action.template);
            if (action.type === 'export' && action.format) {
              onExport?.(action.format, action.template.id);
            } else if (action.type === 'use') {
              onUseTemplate?.(action.template);
            } else if (action.type === 'builder') {
              triggerOpenInBuilder(action.template);
            }
          }
        }}
      />
    </>
  );
}
