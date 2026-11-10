'use client';

import React, { useState, useEffect } from 'react';
import { CVTemplate } from '@/types';
import { fetchCVTemplates } from '@/lib/api';
import { 
  X, 
  Search, 
  Sparkles, 
  Check, 
  Download, 
  FileText, 
  Loader2, 
  ShieldCheck, 
  Layers,
  Crown
} from 'lucide-react';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  selectedTemplateId: string;
  onSelectTemplate: (template: CVTemplate) => void;
  onClose: () => void;
  onExport: (format: 'pdf' | 'docx', templateId: string) => void;
  isExporting: boolean;
}

export default function TemplateGalleryModal({
  isOpen,
  selectedTemplateId,
  onSelectTemplate,
  onClose,
  onExport,
  isExporting,
}: TemplateGalleryModalProps) {
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchCVTemplates()
        .then((res) => {
          setTemplates(res.templates || []);
          setCategories(res.categories || []);
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

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0B1120] text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>105+ Professional CV Designs</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
                100% ATS Ready
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
              Select Your Tailored CV Template
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose from 100+ proven layouts for Gulf corporate, Silicon Valley tech, executive, and minimalist ATS parsers.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl transition cursor-pointer bg-slate-900 border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          
          {/* Row 1: Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 100+ templates by role, style or country (e.g. Dubai, Riyadh, Backend, Minimalist, Executive)..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-600 shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Row 2: Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {(categories.length > 0 ? categories : ['All', 'Gulf & Middle East', 'Tech & Software', 'Executive & Leadership', 'Data & AI', 'Finance & Banking', 'Minimalist ATS', 'Creative & Remote']).map((cat) => (
              <button
                key={cat}
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-100/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-indigo-600 font-bold text-xs">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading 100+ curated CV templates...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <div className="text-3xl">🔍</div>
              <div className="font-extrabold text-slate-800 text-sm">No templates matched &quot;{searchQuery}&quot;</div>
              <p className="text-xs text-slate-500">Try searching for &quot;Dubai&quot;, &quot;Executive&quot;, &quot;Clean&quot;, or reset categories.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer mt-2"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => onSelectTemplate(tmpl)}
                    className={`bg-white rounded-2xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between relative group hover:shadow-lg ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Layout Badge & Color Swatches */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                          {tmpl.category}
                        </span>

                        {/* Swatches */}
                        <div className="flex items-center gap-1">
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
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
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
                          onSelectTemplate(tmpl);
                        }}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Selected ✓' : 'Select'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-7 h-7 rounded-lg border border-slate-300 shadow-2xs flex-shrink-0"
              style={{ backgroundColor: currentTemplate?.colors?.primary || '#0F172A' }}
            />
            <div>
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>Active Template:</span>
                <span className="text-indigo-600 font-black">{currentTemplate?.name || 'Dubai Silicon Oasis Pro'}</span>
              </div>
              <div className="text-[10px] text-slate-500">
                {currentTemplate?.category} &bull; {currentTemplate?.ats_score}
              </div>
            </div>
          </div>

          {/* Quick Export Trigger Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onExport('pdf', currentTemplate?.id || 'gulf_dubai_sapphire')}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download PDF in this Style</span>
            </button>

            <button
              onClick={() => onExport('docx', currentTemplate?.id || 'gulf_dubai_sapphire')}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              <span>Word Doc (.docx)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
