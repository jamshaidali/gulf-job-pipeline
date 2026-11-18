import { serializeJsonLd } from '@/lib/jsonLd';
import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BookOpen, Sparkles, ArrowRight, Clock, MapPin, CheckCircle, ShieldCheck, FileText, Globe } from 'lucide-react';
import { careerGuides } from '@/data/careerGuides';

export const metadata: Metadata = {
  title: 'Career & ATS Resume Guides | TalentRadar AI',
  description: 'Authoritative career guides, ATS resume optimization playbooks, and Google X-Y-Z bullet strategies for software engineers, product managers, and executives.',
  keywords: [
    'ATS resume optimization checklist',
    'Software engineer resume guide',
    'Executive resume blueprint',
    'Google XYZ resume formula',
    'How to beat Workday and Taleo ATS'
  ],
  alternates: {
    canonical: '/guides',
  },
  openGraph: {
    title: 'Career & ATS Resume Guides | TalentRadar AI',
    description: 'Expert guides on crafting ATS-optimized resumes and landing high-paying tech & executive interviews.',
    url: 'https://gulf-job-pipeline.vercel.app/guides',
    siteName: 'TalentRadar',
    type: 'website',
  }
};

export default function GuidesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Career & ATS Resume Guides',
    description: 'Resume optimization and interview blueprints for modern professionals.',
    publisher: {
      '@type': 'Organization',
      name: 'TalentRadar AI',
      url: 'https://gulf-job-pipeline.vercel.app'
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-cyan-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="bg-[#0B1120] text-white py-16 sm:py-24 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-cyan-900/20 via-transparent to-transparent opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-black tracking-wider uppercase shadow-inner">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Career Blueprints &amp; ATS Research</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Proven Strategies to Craft an <span className="text-cyan-400">Interview-Winning Resume</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Data-backed playbooks on passing enterprise Applicant Tracking Systems, quantifying impact with the Google X-Y-Z formula, and tailoring your CV for top roles.
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
              Ready to test your resume against any job description?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Upload your CV or paste a job description to get an instant ATS match score, missing keyword checklist, and 1-click tailored resume export.
            </p>
          </div>
          <Link
            href="/ats-scanner"
            className="px-6 py-3.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 flex-shrink-0"
          >
            <span>Run Free ATS Scan</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
}
