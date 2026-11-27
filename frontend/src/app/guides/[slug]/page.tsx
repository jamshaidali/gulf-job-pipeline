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
    title: `${guide.metaTitle} | RateYourCV`,
    description: guide.excerpt,
    alternates: {
      canonical: `/guides/${guide.slug}`,
    },
    openGraph: {
      title: guide.title,
      description: guide.excerpt,
      url: `https://rateyourcv.com/guides/${guide.slug}`,
      siteName: 'RateYourCV',
    images: ['/opengraph-image'],
      type: 'article',
      publishedTime: guide.publishedISO,
      authors: ['RateYourCV Editorial'],
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
    datePublished: guide.publishedISO,
    dateModified: guide.publishedISO,
    mainEntityOfPage: `https://rateyourcv.com/guides/${guide.slug}`,
    author: {
      '@type': 'Organization',
      name: 'RateYourCV Editorial',
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
              <span className="font-bold text-slate-800">RateYourCV Editorial</span>
              <span className="text-slate-400 ml-2">&bull; Published {guide.publishedAt}</span>
            </div>
          </div>
        </header>

        {/* Key Takeaways Box */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-50/80 via-sky-50/50 to-slate-50 rounded-2xl border border-indigo-100 mb-10 space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Key takeaways</span>
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

        {/* Guide content */}
        <article className="space-y-5 text-sm sm:text-base text-slate-700 leading-relaxed">
          {guide.sections.map((section, sIdx) => (
            <section key={section.h} className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-4">
                {sIdx + 1}. {section.h}
              </h2>
              {section.blocks.map((block, bIdx) => {
                if (block.t === 'p') return <p key={bIdx}>{block.text}</p>;
                if (block.t === 'ul')
                  return (
                    <ul key={bIdx} className="list-disc pl-5 space-y-1.5">
                      {block.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  );
                if (block.t === 'ol')
                  return (
                    <ol key={bIdx} className="list-decimal pl-5 space-y-1.5">
                      {block.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ol>
                  );
                if (block.t === 'tip')
                  return (
                    <div key={bIdx} className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm">
                      <strong>Tip: </strong>
                      {block.text}
                    </div>
                  );
                return (
                  <div key={bIdx} className="grid gap-2 sm:grid-cols-2">
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm">
                      <div className="text-[11px] font-black uppercase tracking-wider text-rose-700 mb-1">Before</div>
                      {block.before}
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
                      <div className="text-[11px] font-black uppercase tracking-wider text-emerald-700 mb-1">After</div>
                      {block.after}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </article>

        {/* Related guides (internal links) */}
        <nav aria-label="More guides" className="mt-12 space-y-3">
          <h2 className="text-lg font-black text-slate-900">More guides</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {careerGuides
              .filter((g) => g.slug !== guide.slug)
              .slice(0, 4)
              .map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guides/${g.slug}`}
                    className="block p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-sm font-semibold text-slate-800 transition"
                  >
                    {g.metaTitle}
                    <span className="block text-xs font-medium text-slate-500 mt-0.5">{g.readingTime}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

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
