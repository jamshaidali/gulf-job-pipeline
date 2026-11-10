import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BookOpen, Sparkles, ArrowRight, Clock, MapPin, CheckCircle, ShieldCheck, FileText, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gulf & Pakistan Career Guides | TalentRadar AI',
  description: 'Authoritative career guides, visa roadmaps, salary benchmarks, and ATS resume strategies for Pakistani professionals targeting jobs in the UAE, Saudi Arabia, and remote international markets.',
  keywords: [
    'Dubai tech jobs for Pakistanis',
    'Saudi Arabia Vision 2030 hiring guide',
    'UAE green visa tech professionals',
    'Gulf ATS resume checklist',
    'Pakistan software engineer salary Dubai'
  ],
  openGraph: {
    title: 'Gulf & Pakistan Career Guides | TalentRadar AI',
    description: 'Expert guides on landing high-paying jobs in the UAE and Saudi Arabia from Pakistan.',
    type: 'website',
  }
};

export const careerGuides = [
  {
    slug: 'how-pakistanis-land-uae-tech-jobs',
    title: 'How Pakistani Tech & Finance Professionals Land High-Paying Jobs in the UAE (Dubai & Abu Dhabi)',
    excerpt: 'Complete 2026 playbook: In-demand roles, AED 15k–45k salary benchmarks, Green Visa pathways, ATS resume keyword optimization, and avoiding common recruiter rejection traps.',
    market: 'UAE 🇦🇪 & Pakistan 🇵🇰',
    category: 'Relocation & Visa',
    readingTime: '8 min read',
    publishedAt: 'October 2026',
    highlights: [
      'Top 10 highest-demand tech and finance skills in Dubai',
      'Realistic tax-free salary benchmarks across Junior to Lead roles',
      'Step-by-step visa sponsorship and visit-to-employment transfer',
      'Why standard Pakistani CVs get filtered out by Gulf ATS bots'
    ]
  },
  {
    slug: 'saudi-arabia-vision-2030-hiring-guide',
    title: 'Saudi Arabia Vision 2030 Career & Relocation Guide for Tech & Engineering Expats',
    excerpt: 'How Saudi Arabia’s massive digital transformation in Riyadh and NEOM is opening thousands of lucrative opportunities for international talent, with Iqama sponsorship and premium allowances.',
    market: 'Saudi Arabia 🇸🇦',
    category: 'Market Trends',
    readingTime: '7 min read',
    publishedAt: 'October 2026',
    highlights: [
      'The Riyadh Regional Headquarters (RHQ) mandate impact on hiring',
      'Saudization quotas: Which technical positions are expat-friendly',
      'Iqama sponsorship, housing allowances, and schooling benefits',
      'How to connect with Saudi government and enterprise hiring leads'
    ]
  },
  {
    slug: 'ats-cv-optimization-checklist-gulf',
    title: 'The 2026 ATS Resume Optimization Checklist for Gulf Recruiters (Taleo, Workday & Greenhouse)',
    excerpt: 'Why 75% of qualified applicants are silently filtered out by applicant tracking systems in the Gulf, and how to format your CV with AI-tailored accomplishment bullets to score 85%+ match rates.',
    market: 'Global & GCC 🌴',
    category: 'ATS & CV Strategy',
    readingTime: '6 min read',
    publishedAt: 'October 2026',
    highlights: [
      'Exact font, layout, and margin rules that pass Workday and Taleo',
      'How to extract high-yield JD keywords and embed them naturally',
      'The STAR metric formula: Transforming duty statements into quantified wins',
      'Common dealbreakers that trigger immediate automated disqualification'
    ]
  }
];

export default function GuidesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Gulf & Pakistan Career Guides',
    description: 'Career advice and relocation blueprints for Pakistan and Gulf professionals.',
    publisher: {
      '@type': 'Organization',
      name: 'TalentRadar AI',
      url: 'https://talentradar.ai'
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-cyan-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="bg-[#0B1120] text-white py-16 sm:py-24 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-cyan-900/20 via-transparent to-transparent opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-black tracking-wider uppercase shadow-inner">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Career Blueprints &amp; Market Insights</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Proven Strategies to Land High-Paying Roles in the <span className="text-cyan-400">Gulf Region</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Exclusively researched for professionals in Pakistan seeking career advancement in the UAE, Saudi Arabia, and international remote positions.
          </p>
        </div>
      </section>

      {/* Main Guides Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {careerGuides.map((guide) => (
            <article
              key={guide.slug}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
            >
              <div className="p-6 sm:p-7 space-y-4">
                
                {/* Meta Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {guide.market}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{guide.readingTime}</span>
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-black text-slate-950 group-hover:text-indigo-600 transition leading-snug tracking-tight">
                  <Link href={`/guides/${guide.slug}`}>
                    {guide.title}
                  </Link>
                </h2>

                {/* Excerpt */}
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {guide.excerpt}
                </p>

                {/* Key Takeaways */}
                <div className="pt-2 space-y-1.5 border-t border-slate-100">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Key Takeaways:
                  </div>
                  {guide.highlights.slice(0, 3).map((item, i) => (
                    <div key={i} className="text-[11px] text-slate-700 font-medium flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Card Footer Link */}
              <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">
                  {guide.category} &bull; {guide.publishedAt}
                </span>
                <Link
                  href={`/guides/${guide.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 group-hover:text-indigo-800 transition"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 transition transform group-hover:translate-x-1" />
                </Link>
              </div>

            </article>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Ready to test your ATS match against live Gulf jobs?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Upload your CV and let TalentRadar scout 46+ verified opportunities across Dubai, Riyadh, and Pakistan, with 1-click tailored resume export.
            </p>
          </div>
          <Link
            href="/register"
            className="px-6 py-3.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 flex-shrink-0"
          >
            <span>Scan Jobs Free</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}
