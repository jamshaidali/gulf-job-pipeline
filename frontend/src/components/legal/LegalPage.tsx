import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SITE } from '@/lib/site';

/** Shared layout for privacy, terms and contact pages. */
export default function LegalPage({
  title,
  intro,
  updated = true,
  children,
}: {
  title: string;
  intro?: string;
  updated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-900">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">{title}</h1>
        {updated && <p className="mt-2 text-xs text-slate-500">Last updated {SITE.legalUpdated}</p>}
        {intro && <p className="mt-5 text-slate-700 leading-relaxed">{intro}</p>}
        <div className="mt-8 space-y-6 text-sm sm:text-base text-slate-700 leading-relaxed">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-extrabold text-slate-900 pt-4">{children}</h2>;
}

export function Contact() {
  return SITE.contactEmail ? (
    <a href={`mailto:${SITE.contactEmail}`} className="text-indigo-700 font-semibold hover:underline">
      {SITE.contactEmail}
    </a>
  ) : (
    <a href="/contact" className="text-indigo-700 font-semibold hover:underline">
      our contact page
    </a>
  );
}
