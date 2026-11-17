import { serializeJsonLd } from '@/lib/jsonLd';
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, Clock, Calendar, CheckCircle2, Share2, Sparkles, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { careerGuides } from '../page';

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
    title: `${guide.title} | TalentRadar Guides`,
    description: guide.excerpt,
    openGraph: {
      title: guide.title,
      description: guide.excerpt,
      type: 'article',
      publishedTime: '2026-10-01T00:00:00Z',
      authors: ['TalentRadar Career Editorial Team'],
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
      name: 'TalentRadar Career Editorial Team',
      url: 'https://talentradar.ai'
    },
    publisher: {
      '@type': 'Organization',
      name: 'TalentRadar AI',
      url: 'https://talentradar.ai'
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
              TR
            </div>
            <div>
              <span className="font-bold text-slate-800">TalentRadar Research &amp; Advisory Team</span>
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
          
          {guide.slug === 'how-pakistanis-land-uae-tech-jobs' && (
            <>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-2">
                1. Understanding the 2026 UAE Job Market Landscape
              </h2>
              <p>
                The United Arab Emirates—anchored by Dubai and Abu Dhabi—continues to represent one of the most dynamic tech and commercial hubs in the world. With zero personal income tax, aggressive investment in AI, FinTech, and cloud migration, companies in Dubai actively source top engineering, accounting, marketing, and product talent from Pakistan.
              </p>
              <p>
                However, applying randomly on generic job boards often yields zero responses. UAE recruiters frequently receive 500+ applications per position within 48 hours. To succeed, candidates must understand what hiring teams look for and bypass the initial ATS filters.
              </p>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                2. Realistic Salary Benchmarks (AED Monthly)
              </h2>
              <div className="overflow-x-auto my-4">
                <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-800 font-extrabold uppercase text-[11px]">
                    <tr>
                      <th className="p-3 border-b">Role Level</th>
                      <th className="p-3 border-b">Experience</th>
                      <th className="p-3 border-b">Monthly Salary (AED)</th>
                      <th className="p-3 border-b">USD Equivalent / Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    <tr>
                      <td className="p-3 font-bold text-slate-900">Junior / Associate</td>
                      <td className="p-3 text-slate-600">1 - 3 Years</td>
                      <td className="p-3 text-emerald-700 font-bold">AED 10,000 - 16,000</td>
                      <td className="p-3 text-slate-600">\$33,000 - \$52,000</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">Mid-Level Professional</td>
                      <td className="p-3 text-slate-600">3 - 6 Years</td>
                      <td className="p-3 text-emerald-700 font-bold">AED 18,000 - 28,000</td>
                      <td className="p-3 text-slate-600">\$59,000 - \$91,000</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">Senior Engineer / Specialist</td>
                      <td className="p-3 text-slate-600">6 - 10 Years</td>
                      <td className="p-3 text-emerald-700 font-bold">AED 28,000 - 42,000</td>
                      <td className="p-3 text-slate-600">\$91,000 - \$137,000</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-900">Lead / Staff / Director</td>
                      <td className="p-3 text-slate-600">10+ Years</td>
                      <td className="p-3 text-emerald-700 font-bold">AED 45,000 - 70,000+</td>
                      <td className="p-3 text-slate-600">\$147,000 - \$228,000+</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                3. Navigating Visas: Sponsorship vs. Green Visa
              </h2>
              <p>
                <strong>Company-Sponsored Employment Visa:</strong> Standard practice for UAE employers. The hiring company covers the visa processing fees, medical fitness test, Emirates ID, and health insurance.
              </p>
              <p>
                <strong>UAE Green Visa for Skilled Employees:</strong> Allows self-residency for 5 years without employer sponsorship if you hold a bachelor’s degree and earn at least AED 15,000/month.
              </p>
              <p>
                <strong>Visit Visa Caution:</strong> While many professionals visit Dubai on a 60-day tourist visa for in-person interviews, working on a tourist visa is strictly illegal. Ensure the employer issues an official entry permit or converts your status before you begin duties.
              </p>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                4. Actionable Next Steps
              </h2>
              <p>
                Ensure your resume highlights quantifiable results rather than routine responsibilities. Instead of writing <em>&quot;Responsible for writing Python code&quot;</em>, write <em>&quot;Architected asynchronous microservices processing 450k transactions/day with 99.98% uptime.&quot;</em>
              </p>
            </>
          )}

          {guide.slug === 'saudi-arabia-vision-2030-hiring-guide' && (
            <>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-2">
                1. The Riyadh Renaissance &amp; Saudi Vision 2030
              </h2>
              <p>
                Saudi Arabia is undergoing the largest economic diversification project in modern Middle Eastern history. Backed by the Public Investment Fund (PIF), gigaprojects like NEOM, Red Sea Global, Qiddiya, and Diriyah require thousands of international specialists in cloud infrastructure, cybersecurity, artificial intelligence, enterprise ERP, and financial engineering.
              </p>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                2. The Regional Headquarters (RHQ) Mandate
              </h2>
              <p>
                Under Saudi government regulations, international corporations seeking public sector contracts must establish their regional headquarters in Riyadh. This has triggered an influx of multinationals (including Google, Microsoft, Amazon, Careem, and PWC) expanding their Saudi engineering and management offices.
              </p>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                3. Total Compensation Package Breakdown
              </h2>
              <p>
                Saudi employment offers are typically structured with attractive non-taxable allowances:
              </p>
              <ul>
                <li><strong>Base Salary:</strong> 60% – 70% of total package.</li>
                <li><strong>Housing Allowance:</strong> Typically 25% of base salary or provided corporate housing.</li>
                <li><strong>Transportation Allowance:</strong> Typically 10% of base salary.</li>
                <li><strong>Annual Relocation &amp; Flights:</strong> Roundtrip airline tickets home for employee and family.</li>
                <li><strong>Schooling Support:</strong> Provided by top tier enterprise and government employers.</li>
              </ul>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                4. Understanding Iqama &amp; Nitaqat Quotas
              </h2>
              <p>
                Under the Nitaqat system, Saudi enterprises must maintain specific Saudization percentages. Highly technical roles (Senior Software Engineers, Cloud Architects, Cybersecurity Analysts, Data Scientists) have higher expat quotas, making them prime targets for experienced Pakistani professionals.
              </p>
            </>
          )}

          {guide.slug === 'ats-cv-optimization-checklist-gulf' && (
            <>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-2">
                1. Why Standard Resumes Fail Gulf ATS Screening
              </h2>
              <p>
                Major employers in Dubai and Riyadh utilize enterprise applicant tracking systems such as Workday, Taleo, Greenhouse, and SAP SuccessFactors. When a job posting receives 400 applications, human recruiters only review the top 15% scored by the parsing engine.
              </p>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                2. The 5 Cardinal Rules of ATS-Compliant Resumes
              </h2>
              <div className="space-y-3 my-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-extrabold text-slate-900 text-sm">Rule 1: Never Use Tables, Columns, or Text Boxes</div>
                  <p className="text-xs text-slate-600 mt-1">
                    Multi-column resume templates generated on Canva confuse ATS parsers, reading across columns instead of down, resulting in jumbled skills and unparsed work history.
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
                3. The STAR Metric Formula for Bullets
              </h2>
              <p>
                Every accomplishment bullet should answer: <strong>What was the action? What technology was used? What was the measured business result?</strong>
              </p>
              <p>
                <strong>Before (Fails ATS):</strong> Worked on backend APIs and fixed database bugs.
              </p>
              <p>
                <strong>After (85%+ Match):</strong> Re-engineered PostgreSQL query indexes and caching layers in FastAPI, reducing transaction latency by 42% and eliminating timeout bottlenecks.
              </p>
            </>
          )}

        </article>

        {/* Call to Action Footer */}
        <div className="mt-12 p-8 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 text-xs font-bold border border-cyan-800">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Apply These Strategies With TalentRadar AI</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Want to see how your CV scores against live Gulf roles?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Upload your resume, see your 0–100% ATS match fit, and download tailored PDF &amp; DOCX resumes customized for each employer.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
