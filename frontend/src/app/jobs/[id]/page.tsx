import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Job } from '@/types';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  ArrowRight, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Share2 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getJob(id: string): Promise<Job | null> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/jobs/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) {
    return { title: 'Job Not Found | TalentRadar' };
  }

  const title = `${job.title} at ${job.company} (${job.location}) | TalentRadar`;
  const description = `Verified opening for ${job.title} at ${job.company}. Calculate your ATS resume match score and connect directly with hiring managers.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://talentradar.ai/jobs/${job.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  // Schema.org JobPosting JSON-LD for Google Jobs Crawling
  const jobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || job.summary || `${job.title} at ${job.company}`,
    datePosted: job.posted_date || new Date().toISOString(),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressCountry: job.country === 'Pakistan' ? 'PK' : 'AE',
      },
    },
    employmentType: 'FULL_TIME',
    applicantLocationRequirements: {
      '@type': 'Country',
      name: job.country === 'Pakistan' ? 'Pakistan' : 'United Arab Emirates',
    },
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 flex flex-col">
      {/* Google Jobs Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
      />

      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {/* Back Link */}
        <div>
          <Link
            href="/jobs"
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1"
          >
            <span>&larr; Back to all tech roles</span>
          </Link>
        </div>

        {/* Job Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white font-extrabold flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                {(job.company || 'CO').substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      job.country === 'Pakistan'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                    }`}
                  >
                    {job.country === 'Pakistan' ? '🇵🇰 Pakistan & Remote' : '🌴 Gulf Hub'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Posted {job.posted_ago || 'Recently'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {job.title}
                </h1>

                <div className="text-sm text-slate-600 font-semibold mt-1 flex flex-wrap items-center gap-3">
                  <span className="text-slate-900 font-bold">{job.company}</span>
                  <span className="text-slate-300">&bull;</span>
                  <span>{job.location}</span>
                </div>
              </div>
            </div>

            {/* Apply CTA */}
            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
              <a
                href={job.apply_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply on Official Portal</span>
                <ExternalLink className="w-4 h-4 text-cyan-400" />
              </a>
              <span className="text-[11px] text-slate-400 text-center sm:text-right">
                Direct redirect to employer application
              </span>
            </div>

          </div>

          {/* AI Value Proposition Conversion Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-cyan-50 to-white border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Want to see how your CV scores for this role?</span>
              </div>
              <p className="text-xs text-indigo-700 max-w-xl">
                TalentRadar scans your resume against this job, detects missing ATS keywords, and generates a personalized cold message to the hiring manager.
              </p>
            </div>

            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <span>Score My Resume Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Detailed Job Requirements */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-slate-900">Official Job Description &amp; Requirements</h2>
          
          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
            {job.description || job.summary || 'Full details available on official company application portal.'}
          </div>

          {/* Hiring Team If Present */}
          {job.hiring_managers && job.hiring_managers.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Direct Hiring Team &amp; Recruiters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {job.hiring_managers.map((hm) => (
                  <div
                    key={hm.name}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{hm.name}</div>
                      <div className="text-[11px] text-slate-500">{hm.role}</div>
                    </div>
                    <a
                      href={hm.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>LinkedIn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
