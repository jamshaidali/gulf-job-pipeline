import { serializeJsonLd } from '@/lib/jsonLd';
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, Clock, Calendar, CheckCircle2, Share2, Sparkles, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { careerGuides } from '@/data/careerGuides';

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return careerGuides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = careerGuides.find((g) => g.slug === slug);
  if (!guide) return { title: 'Career Guide Not Found' };

  return {
    title: `${guide.title} | RateYourCV Guides`,
    description: guide.excerpt,
    alternates: {
      canonical: `/guides/${guide.slug}`,
    },
    openGraph: {
      title: guide.title,
      description: guide.excerpt,
      url: `https://rateyourcv.com/guides/${guide.slug}`,
      siteName: 'RateYourCV',
      type: 'article',
      publishedTime: '2026-10-01T00:00:00Z',
      authors: ['RateYourCV Career Editorial Team'],
    },
  };
}

export default async function SingleGuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = careerGuides.find((g) => g.slug === slug);

  if (!guide) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.excerpt,
    datePublished: '2026-10-01T00:00:00Z',
    author: {
      '@type': 'Organization',
      name: 'RateYourCV Career Editorial Team',
      url: 'https://rateyourcv.com'
    },
    publisher: {
      '@type': 'Organization',
      name: 'RateYourCV AI',
      url: 'https://rateyourcv.com'
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-900 selection:bg-cyan-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Navbar />

      {/* Breadcrumb Header */}
      <div className="border-b border-slate-200 bg-slate-50/70 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Career Guides</span>
          </Link>
        </div>
      </div>

      {/* Main Article Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        
        {/* Article Meta Header */}
        <header className="space-y-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              {guide.market}
            </span>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700">
              {guide.category}
            </span>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1 ml-auto">
              <Clock className="w-3.5 h-3.5" />
              <span>{guide.readingTime}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
            {guide.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
            {guide.excerpt}
          </p>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
              RC
            </div>
            <div>
              <span className="font-bold text-slate-800">RateYourCV Research &amp; Advisory Team</span>
              <span className="text-slate-400 ml-2">&bull; Published {guide.publishedAt}</span>
            </div>
          </div>
        </header>

        {/* Key Takeaways Box */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-50/80 via-sky-50/50 to-slate-50 rounded-2xl border border-indigo-100 mb-10 space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Essential Executive Summary</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-800 font-medium">
            {guide.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dynamic Guide Content Body */}
        <article className="prose prose-slate max-w-none space-y-6 text-sm sm:text-base text-slate-700 leading-relaxed">
          
          {guide.slug === 'software-ai-engineer-resume-guide' && (
            <>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-2">
                1. Understanding the 2026 Engineering &amp; AI Hiring Landscape
              </h2>
              <p>
                Modern technology organizations evaluate software, cloud, and AI engineers on measurable architectural impact and production reliability. Generic resumes listing programming languages without system scale are filtered out within seconds by automated ATS screening and engineering managers.
              </p>
              <p>
                Enterprise engineering postings frequently receive 500+ applications within 48 hours. To stand out, your resume must surface distributed systems scale, cloud cost optimization, and latency improvements in the top third of page one.
              </p>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                2. Quantified Impact Benchmarks by Seniority Level
              </h2>
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-800 font-extrabold uppercase text-[11px]">
                    <tr>
                      <th className="p-3 border-b">Role Level</th>
                      <th className="p-3 border-b">Experience</th>
                      <th className="p-3 border-b">Primary Resume Focus</th>
                      <th className="p-3 border-b">Target ATS Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    <tr>
                      <td className="p-3 font-bold text-slate-900">Junior / Associate</td>
                      <td className="p-3 text-slate-600">1 - 3 Years</td>
                      <td className="p-3 text-emerald-700 font-bold">Clean Code, CI/CD &amp; Test Coverage</td>
                      <td className="p-3 text-slate-600">85%+</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">Mid-Level Engineer</td>
                      <td className="p-3 text-slate-600">3 - 6 Years</td>
                      <td className="p-3 text-emerald-700 font-bold">API Latency, Microservices &amp; Throughput</td>
                      <td className="p-3 text-slate-600">88%+</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">Senior / Staff Engineer</td>
                      <td className="p-3 text-slate-600">6 - 10 Years</td>
                      <td className="p-3 text-emerald-700 font-bold">System Design, Cloud Savings &amp; Mentorship</td>
                      <td className="p-3 text-slate-600">92%+</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">Principal / VP Engineering</td>
                      <td className="p-3 text-slate-600">10+ Years</td>
                      <td className="p-3 text-emerald-700 font-bold">Org Scale, Multi-Region Architecture &amp; ROI</td>
                      <td className="p-3 text-slate-600">95%+</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                3. Structuring Technical Skill Matrices for 6-Second Scans
              </h2>
              <p>
                <strong>Group by Domain:</strong> Organize your technical stack into clear categories—<em>Languages</em>, <em>Frameworks &amp; APIs</em>, <em>Cloud &amp; DevOps</em>, and <em>Databases &amp; Streaming</em>—so both ATS parsers and technical leads can verify your stack immediately.
              </p>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                4. Actionable Next Steps
              </h2>
              <p>
                Ensure your resume highlights quantifiable results rather than routine responsibilities. Instead of writing <em>&quot;Responsible for writing Python code&quot;</em>, write <em>&quot;Architected asynchronous microservices processing 450k transactions/day with 99.98% uptime.&quot;</em>
              </p>
            </>
          )}

          {guide.slug === 'executive-product-leadership-resume-blueprint' && (
            <>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-2">
                1. What Executive &amp; Product Hiring Committees Look For
              </h2>
              <p>
                When evaluating Directors, VPs, and Senior Product Leaders, executive search committees look beyond tactical feature delivery. Your resume must immediately communicate strategic vision, P&amp;L ownership, cross-functional org design, and measurable business growth.
              </p>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                2. The Top-Third Executive Summary Rule
              </h2>
              <p>
                Your top summary and key achievements block should anchor your leadership scope in 30 seconds: team size managed, ARR/revenue influenced, retention lift, and market expansion outcomes.
              </p>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                3. Essential Leadership Metrics to Include
              </h2>
              <ul>
                <li><strong>Revenue &amp; ARR Impact:</strong> New product revenue, expansion ARR, or conversion lift (%).</li>
                <li><strong>Operational Efficiency:</strong> Cost reductions, cycle-time acceleration, and SLA improvements.</li>
                <li><strong>Team Scale &amp; Retention:</strong> Squads hired, mentored, and retained across engineering, product, and design.</li>
                <li><strong>Customer Retention:</strong> NPS improvements, churn reduction, and enterprise adoption rates.</li>
              </ul>
            </>
          )}

          {guide.slug === 'ats-resume-optimization-checklist-2026' && (
            <>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-2">
                1. Why Standard Resumes Fail Enterprise ATS Screening
              </h2>
              <p>
                Leading enterprises utilize applicant tracking systems such as Workday, Taleo, Greenhouse, Lever, and iCIMS. When a job posting receives 400+ applications, human recruiters focus on the top-scored candidates ranked by semantic and exact keyword alignment.
              </p>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                2. The 5 Cardinal Rules of ATS-Compliant Resumes
              </h2>
              <div className="space-y-3 my-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-extrabold text-slate-900 text-sm">Rule 1: Use Clean, Selectable Text Layers</div>
                  <p className="text-xs text-slate-600 mt-1">
                    Graphic-heavy resume templates exported as flattened images or floating text boxes confuse ATS parsers, resulting in unparsed work history.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-extrabold text-slate-900 text-sm">Rule 2: Match Exact Keywords from the Job Description</div>
                  <p className="text-xs text-slate-600 mt-1">
                    If the JD requests <em>&quot;PostgreSQL&quot;</em> and your CV only says <em>&quot;SQL&quot;</em>, you lose match points. Always verify high-yield missing keywords.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-extrabold text-slate-900 text-sm">Rule 3: Use Standard Headings</div>
                  <p className="text-xs text-slate-600 mt-1">
                    Stick to standard sections: <em>Professional Summary</em>, <em>Core Technical Competencies</em>, <em>Professional Experience</em>, and <em>Education</em>.
                  </p>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                3. The Google X-Y-Z Metric Formula for Bullets
              </h2>
              <p>
                Every accomplishment bullet should answer: <strong>What was the action? What technology was used? What was the measured business result?</strong>
              </p>
              <p>
                <strong>Before (Fails ATS):</strong> Worked on backend APIs and fixed database bugs.
              </p>
              <p>
                <strong>After (92%+ Match):</strong> Re-engineered PostgreSQL query indexes and caching layers in FastAPI, reducing transaction latency by 42% and eliminating timeout bottlenecks.
              </p>
            </>
          )}

        </article>

        {/* Call to Action Footer */}
        <div className="mt-12 p-8 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 text-xs font-bold border border-cyan-800">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Apply These Strategies With RateYourCV AI</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Want to see how your CV scores against your target role?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Upload your resume, see your 0–100% ATS match fit, and build a tailored PDF resume in minutes.
          </p>
          <div className="pt-2">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition"
            >
              <span>Open Free Resume Builder</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
