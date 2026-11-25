import Link from 'next/link';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { careerGuides } from '@/data/careerGuides';

export const metadata: Metadata = {
  title: 'Page not found | RateYourCV',
  description: 'This page does not exist. Try the resume builder, ATS scanner, templates or career guides.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-900">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 text-center space-y-6">
        <p className="text-sm font-black tracking-wider text-indigo-600 uppercase">Error 404</p>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">We could not find that page</h1>
        <p className="text-slate-600">
          The link may be old or mistyped. Here are some places to go instead.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/builder" className="px-5 py-2.5 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-black transition">
            Resume builder
          </Link>
          <Link href="/ats-scanner" className="px-5 py-2.5 rounded-full border border-slate-300 font-bold text-sm hover:bg-slate-50 transition">
            ATS scanner
          </Link>
          <Link href="/templates" className="px-5 py-2.5 rounded-full border border-slate-300 font-bold text-sm hover:bg-slate-50 transition">
            Templates
          </Link>
          <Link href="/" className="px-5 py-2.5 rounded-full border border-slate-300 font-bold text-sm hover:bg-slate-50 transition">
            Home
          </Link>
        </div>
        <div className="pt-10 text-left space-y-3">
          <h2 className="text-lg font-black">Popular guides</h2>
          <ul className="space-y-2">
            {careerGuides.slice(0, 4).map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="text-indigo-700 font-semibold hover:underline">
                  {g.metaTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
