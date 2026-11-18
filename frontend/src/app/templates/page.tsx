'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TemplateAuthModal from '@/components/TemplateAuthModal';
import { fetchCurrentUser, fetchCVTemplates } from '@/lib/api';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Sliders, 
  Download, 
  CheckCircle2, 
  ExternalLink,
  Search,
  Eye,
  Star,
  Lock
} from 'lucide-react';

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  atsScore: string;
  description: string;
  accentColor: string;
  primaryHex?: string;
  layout: 'single' | 'two-column';
  bestFor: string;
}

const TEMPLATES_CATALOG: TemplateItem[] = [
  {
    id: 'ats_minimalist_clean',
    name: 'ATS Minimalist Clean',
    category: 'ATS-Friendly',
    atsScore: '100% ATS Verified',
    description: 'Single-column high-contrast layout tested across Taleo, Workday, and Greenhouse with zero parsing errors.',
    accentColor: 'from-slate-900 to-slate-800',
    layout: 'single',
    bestFor: 'Software Engineers, DevOps, Data Engineers'
  },
  {
    id: 'sapphire_modern_tech',
    name: 'Sapphire Modern Tech',
    category: 'Tech & Engineering',
    atsScore: '98% ATS Verified',
    description: 'Modern two-column layout with technical competency sidebar, optimized for high-salary engineering and fintech roles.',
    accentColor: 'from-cyan-600 to-sky-700',
    layout: 'two-column',
    bestFor: 'Senior Full Stack, Cloud Architects, AI Engineers'
  },
  {
    id: 'executive_leadership_pro',
    name: 'Executive Leadership Pro',
    category: 'Executive & Leadership',
    atsScore: '99% ATS Verified',
    description: 'Distinguished header typography and prominent executive summary section built for VP, Director, and C-Suite leadership roles.',
    accentColor: 'from-amber-600 to-amber-800',
    layout: 'single',
    bestFor: 'Engineering Directors, VP of Product, Heads of Engineering'
  },
  {
    id: 'compact_direct_impact',
    name: 'Compact 1-Page Direct',
    category: 'Compact 1-Page',
    atsScore: '100% ATS Verified',
    description: 'High-density typography engineered to fit 6–10 years of experience on exactly one sheet with Google X-Y-Z bullets.',
    accentColor: 'from-indigo-600 to-indigo-800',
    layout: 'single',
    bestFor: 'Mid-Senior Engineers, Tech Leads, Product Managers'
  },
  {
    id: 'emerald_growth_matrix',
    name: 'Emerald FinTech Modern',
    category: 'Tech & Engineering',
    atsScore: '97% ATS Verified',
    description: 'Clean modern aesthetic with subtle emerald accents, perfect for payments, banking, and fast-growth startups.',
    accentColor: 'from-emerald-600 to-teal-800',
    layout: 'two-column',
    bestFor: 'FinTech Engineers, Product Designers, Growth Leads'
  },
  {
    id: 'monochrome_ivy_league',
    name: 'Monochrome Ivy Classic',
    category: 'ATS-Friendly',
    atsScore: '100% ATS Verified',
    description: 'Timeless serif typography, zero graphics or icons, 100% machine-parsable for hyper-conservative corporate boards.',
    accentColor: 'from-slate-800 to-slate-950',
    layout: 'single',
    bestFor: 'C-Suite, Management Consultants, Legal & Finance'
  },
  {
    id: 'creative_accent_cyan',
    name: 'Digital Product Lead',
    category: 'Creative',
    atsScore: '96% ATS Verified',
    description: 'Striking visual balance highlighting key portfolio projects, design systems, and product metrics.',
    accentColor: 'from-purple-600 to-pink-700',
    layout: 'two-column',
    bestFor: 'UI/UX Leads, Product Designers, Creative Technologists'
  },
  {
    id: 'quantum_cloud_architect',
    name: 'Quantum Systems Specialist',
    category: 'Tech & Engineering',
    atsScore: '99% ATS Verified',
    description: 'Features dedicated technical skills matrix (Languages, Cloud, Databases, Tools) at the top of the resume.',
    accentColor: 'from-blue-600 to-indigo-900',
    layout: 'single',
    bestFor: 'Cloud Architects, DevOps/SRE, Infrastructure Leads'
  }
];

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authModalTemplate, setAuthModalTemplate] = useState<{ id: string; name: string } | null>(null);
  const [dynamicTemplates, setDynamicTemplates] = useState<TemplateItem[]>([]);

  useEffect(() => {
    const checkUserAndLoadTemplates = async () => {
      try {
        if (typeof window !== 'undefined' && localStorage.getItem('tr_auth_user')) {
          setIsAuthenticated(true);
        }
        const user = await fetchCurrentUser();
        if (user) {
          setIsAuthenticated(true);
        }
      } catch {
        // Ignore
      }

      try {
        const res = await fetchCVTemplates();
        if (res && Array.isArray(res.templates)) {
          const existingIds = new Set(TEMPLATES_CATALOG.map((t) => t.id));
          const mapped: TemplateItem[] = res.templates
            .filter((t) => !existingIds.has(t.id))
            .map((t) => {
              const cat = t.category.includes('Tech') || t.category.includes('Data')
                ? 'Tech & Engineering'
                : t.category.includes('Executive') || t.category.includes('Enterprise')
                ? 'Executive & Leadership'
                : t.category.includes('Minimalist')
                ? 'ATS-Friendly'
                : t.category.includes('Creative')
                ? 'Creative'
                : 'Compact 1-Page';
              return {
                id: t.id,
                name: t.name,
                category: cat,
                atsScore: t.ats_score || '99% ATS Verified',
                description: t.description,
                accentColor: 'from-cyan-600 to-indigo-800',
                primaryHex: t.colors?.primary || '#0284c7',
                layout: t.layout === 'split_header' || t.layout === 'modern_accent' ? 'two-column' : 'single',
                bestFor: `${t.category} &bull; ${t.badge || 'Global ATS Standard'}`.replace('&bull;', '•'),
              };
            });
          setDynamicTemplates(mapped);
        }
      } catch {
        // Ignore
      }
    };
    checkUserAndLoadTemplates();
  }, []);

  const handleUseTemplate = (templateId: string, templateName: string, primaryHex?: string) => {
    const accentParam = primaryHex ? `&accent=${encodeURIComponent(primaryHex)}` : '';
    if (isAuthenticated || (typeof window !== 'undefined' && localStorage.getItem('tr_auth_user'))) {
      router.push(`/builder?template=${encodeURIComponent(templateId)}${accentParam}`);
    } else {
      setPreviewTemplate(null);
      setAuthModalTemplate({ id: templateId, name: templateName });
    }
  };

  const categories = [
    'All',
    'ATS-Friendly',
    'Tech & Engineering',
    'Executive & Leadership',
    'Compact 1-Page',
    'Creative'
  ];

  const allTemplates = [...TEMPLATES_CATALOG, ...dynamicTemplates];

  const filteredTemplates = allTemplates.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.bestFor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 flex flex-col font-sans">
      {/* Announcement Ribbon */}
      <div className="bg-slate-900 text-white py-2 px-4 text-center text-xs font-semibold">
        <span className="text-cyan-400 font-bold">✨ 100% Free Public Launch:</span> All 105+ Resume Templates Unlocked with Zero Paywalls &bull;{' '}
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
              <span>Tested on Taleo, Workday, Greenhouse &amp; Lever</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              105+ Recruiter-Approved, <br />
              <span className="bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">
                ATS-Optimized Resume Templates
              </span>
            </h1>

            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              Every template is built with machine-readable typography, precise hierarchy, and clean semantic structures so your resume lands directly in front of human recruiters.
            </p>

            {/* Search Bar */}
            <div className="mt-8 max-w-md mx-auto relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates (e.g. Software Engineer, Executive)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
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
            <span>Showing {filteredTemplates.length} Templates</span>
            <span className="text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> All templates 100% Free &amp; Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {filteredTemplates.map((template) => (
              <div 
                key={template.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                {/* Visual Preview Header */}
                <div className="p-4 bg-slate-100 border-b border-slate-200 relative overflow-hidden">
                  <div className="h-48 rounded-2xl bg-white border border-slate-200 p-4 text-[7px] text-slate-400 font-mono shadow-xs overflow-hidden relative group-hover:scale-[1.02] transition-transform">
                    {/* Simulated Resume Layout */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <div className="h-3 w-24 bg-slate-800 rounded-sm"></div>
                          <div className="h-2 w-32 bg-slate-300 rounded-sm mt-1"></div>
                        </div>
                        <div className={`h-4 w-4 rounded-full bg-gradient-to-tr ${template.accentColor}`}></div>
                      </div>

                      {template.layout === 'two-column' ? (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="col-span-1 space-y-1 border-r border-slate-100 pr-1">
                            <div className="h-2 w-10 bg-cyan-600 rounded-xs"></div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-xs"></div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-xs"></div>
                            <div className="h-2 w-10 bg-cyan-600 rounded-xs mt-2"></div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-xs"></div>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <div className="h-2 w-16 bg-slate-700 rounded-xs"></div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-xs"></div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-xs"></div>
                            <div className="h-1.5 w-3/4 bg-slate-200 rounded-xs"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          <div className="h-2 w-20 bg-slate-700 rounded-xs"></div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-xs"></div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-xs"></div>
                          <div className="h-2 w-20 bg-slate-700 rounded-xs mt-2"></div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-xs"></div>
                          <div className="h-1.5 w-5/6 bg-slate-200 rounded-xs"></div>
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent flex items-end justify-center pb-3">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="px-3 py-1 rounded-full bg-slate-900/90 text-white text-[10px] font-bold shadow-sm hover:bg-black transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>Quick Preview</span>
                      </button>
                    </div>
                  </div>

                  <span className="absolute top-6 right-6 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                    {template.atsScore}
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">
                      {template.category}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {template.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {template.description}
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-900">Best for: </span>
                      {template.bestFor}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => handleUseTemplate(template.id, template.name, template.primaryHex)}
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
        </section>

        {/* QUICK PREVIEW MODAL */}
        {previewTemplate && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs font-bold text-cyan-600 uppercase tracking-wider">{previewTemplate.category}</div>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">{previewTemplate.name}</h3>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3 leading-relaxed">
                <p><strong>Overview:</strong> {previewTemplate.description}</p>
                <p><strong>Ideal Target Careers:</strong> {previewTemplate.bestFor}</p>
                <div className="flex items-center gap-3 pt-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    ✓ {previewTemplate.atsScore}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">
                    ✓ Google X-Y-Z Ready
                  </span>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer text-center"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleUseTemplate(previewTemplate.id, previewTemplate.name, previewTemplate.primaryHex)}
                  className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Open in Visual Builder</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <TemplateAuthModal
        isOpen={!!authModalTemplate}
        onClose={() => setAuthModalTemplate(null)}
        templateId={authModalTemplate?.id || 'ats_minimalist_clean'}
        templateName={authModalTemplate?.name || 'ATS-Optimized Template'}
      />

      <Footer />
    </div>
  );
}
