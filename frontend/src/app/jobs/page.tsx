'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Job } from '@/types';
import { Search, MapPin, Building2, ExternalLink, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadPublicJobs() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (region !== 'all') query.set('region', region);
        if (search) query.set('search', search);
        query.set('limit', '30');

        const res = await fetch(`/api/jobs?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (err) {
        console.error('Failed to load public jobs', err);
      } finally {
        setLoading(false);
      }
    }
    loadPublicJobs();
  }, [region, search]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>Verified Tech Openings in Gulf &amp; Remote</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Explore Open Tech Roles in Dubai, Riyadh &amp; Pakistan
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            Aggregated and verified continuously from top employer career portals. Create a free account to calculate your personal ATS match score.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, skill (Python, React), or company..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:bg-white focus:border-cyan-600 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setRegion('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                region === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Regions
            </button>
            <button
              onClick={() => setRegion('gulf')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                region === 'gulf' ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌴 Gulf (UAE &amp; KSA)
            </button>
            <button
              onClick={() => setRegion('pakistan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                region === 'pakistan' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🇵🇰 Pakistan &amp; Remote
            </button>
          </div>
        </div>

        {/* Job Grid */}
        {loading ? (
          <div className="p-16 text-center text-xs font-bold text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
            <span>Loading verified tech roles...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center">
                      {(job.company || 'CO').substring(0, 2).toUpperCase()}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        job.country === 'Pakistan'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                      }`}
                    >
                      {job.country === 'Pakistan' ? '🇵🇰 Pakistan' : '🌴 Gulf Hub'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug hover:text-cyan-700 transition">
                      <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                    </h3>
                    <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{job.company}</span>
                      <span>&bull;</span>
                      <span>{job.location}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                    {job.summary || job.description || 'Verified engineering role.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {job.posted_ago || 'Recent'}
                  </span>

                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer"
                  >
                    <span>View Role &amp; Match</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
