'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroJobCarousel from '@/components/marketing/HeroJobCarousel';
import { 
  Check, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Compass, 
  Building2, 
  Target, 
  Send, 
  ChevronDown, 
  FileText 
} from 'lucide-react';

export default function HomePage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does the AI match score calculate my fit for a job?",
      a: "TalentRadar analyzes the official job requirements, technology stack, and seniority level against your uploaded CV and primary skills. It identifies exact matching competencies, penalizes mismatched experience, and extracts missing keywords needed to pass Applicant Tracking Systems (ATS)."
    },
    {
      q: "Which regions and companies do you cover?",
      a: "We scout tech hubs across the Gulf Cooperation Council (UAE: Dubai & Abu Dhabi, Saudi Arabia: Riyadh) as well as Pakistan tech hubs and worldwide remote roles. We aggregate directly from verified career portals and company ATS systems."
    },
    {
      q: "What is the 1-Click Recruiter Outreach generator?",
      a: "For every verified job, TalentRadar crafts a personalized 300-character LinkedIn connection note (strictly within LinkedIn's limit) and a complete cold email pitch targeting the hiring manager so you skip the application backlog."
    },
    {
      q: "Can I cancel my Pro subscription anytime?",
      a: "Yes, you can cancel your subscription with 1-click inside your account at any time with zero long-term commitments. You keep full Pro access through the end of your billing cycle."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 flex flex-col">
      {/* Top Announcement Ribbon */}
      <div className="bg-slate-900 text-white py-2 px-4 text-center text-xs font-semibold">
        <Link href="/jobs" className="inline-flex items-center gap-2 hover:text-cyan-300 transition">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Fresh: Over 140+ verified tech roles scouted today across UAE, Saudi Arabia &amp; Remote PK</span>
          <span className="text-cyan-400 font-bold ml-1">&rarr;</span>
        </Link>
      </div>

      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="pt-16 pb-20 lg:pt-24 lg:pb-32 bg-white border-b border-slate-200/80 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Editorial Headline & Actions */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  <span>The AI Career Copilot for the Gulf &amp; Tech Hubs</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-extrabold text-slate-950 tracking-tight leading-[1.08]">
                  Get hired 3x faster with your <span className="bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">AI job search</span> partner.
                </h1>

                <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-xl font-normal">
                  TalentRadar proactively matches high-salary tech, product, finance, and leadership roles across Dubai, Riyadh &amp; Remote Pakistan, tailors your CV for ATS robots, and prepares cold pitches to decision-makers.
                </p>

                {/* Primary Action Button */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-base transition shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <span>Launch Free Radar</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </Link>
                  <Link
                    href="/jobs"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition cursor-pointer"
                  >
                    <span>Browse Live Jobs</span>
                  </Link>
                </div>

                {/* Social Proof */}
                <div className="pt-4 flex items-center gap-3 text-xs sm:text-sm text-slate-600 font-medium">
                  <div className="flex text-amber-400 text-base">★★★★★</div>
                  <span className="font-bold text-slate-900">4.9/5</span>
                  <span className="text-slate-300">&bull;</span>
                  <span>Trusted by 10,000+ ambitious professionals targeting Dubai, Riyadh &amp; Global Remote</span>
                </div>

                {/* Target Hubs Ticker */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="text-slate-400 font-bold">Live Markets:</span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">🇦🇪 Dubai &amp; Abu Dhabi</span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">🇸🇦 Riyadh &amp; Saudi Hub</span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">🇵🇰 Remote Pakistan</span>
                </div>
              </div>

              {/* Right Column: Dynamic Auto-Rotating Multi-Profession Carousel */}
              <div className="lg:col-span-5 relative flex items-center justify-center">
                <HeroJobCarousel />
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: The 3-Step Advantage */}
        <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-extrabold text-cyan-600 uppercase tracking-wider">The Intelligent Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              How TalentRadar Accelerates Your Job Search
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base max-w-xl mx-auto">
              Skip applying to hundreds of ghost postings. Turn your job hunt into a targeted, high-conversion outbound strategy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
              {/* Step 1 */}
              <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 font-extrabold flex items-center justify-center text-lg">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900">Upload Your Resume &amp; Skills</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our parser extracts your primary tech stack, years of experience, and target roles in seconds, isolating your profile securely.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-lg">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900">Scout &amp; Score Real-Time Roles</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Scrapers continuously aggregate active tech jobs across Dubai, Abu Dhabi, Riyadh, and Remote PK, scoring match fitness from 0 to 100%.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-lg">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900">1-Click ATS Tailoring &amp; Cold Pitch</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate tailored resume bullet points, cover letters, and 300-char LinkedIn connection notes to decision-makers in 1 click.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Transparent Pricing */}
        <section id="pricing" className="py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-extrabold text-cyan-600 uppercase tracking-wider">Transparent Pricing</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-2">
              Invest in your next international career leap.
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Predictable pricing. No long-term contracts. Cancel anytime.
            </p>

            {/* Billing Switcher */}
            <div className="mt-8 inline-flex items-center gap-2 bg-slate-100 p-1.5 rounded-full text-xs font-bold">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full transition cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Save 25%</span>
              </button>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12 text-left">
              
              {/* Plan 1: Starter Free */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Starter Free</div>
                  <div className="text-4xl font-black text-slate-900 mt-2">
                    $0 <span className="text-xs text-slate-400 font-normal">/ month</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Essential tools to scout and track open roles.</p>
                  
                  <div className="my-6 border-t border-slate-200"></div>

                  <ul className="space-y-3 text-xs text-slate-700 font-medium">
                    <li className="flex items-center gap-2">✓ 15 fresh jobs scanned daily</li>
                    <li className="flex items-center gap-2">✓ Basic keyword match score</li>
                    <li className="flex items-center gap-2">✓ Kanban Application Pipeline</li>
                    <li className="flex items-center gap-2 text-slate-400">✗ Automated daily email digests</li>
                    <li className="flex items-center gap-2 text-slate-400">✗ 1-Click Recruiter LinkedIn Note generator</li>
                    <li className="flex items-center gap-2 text-slate-400">✗ AI ATS Accomplishment Tailoring</li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-8 w-full py-3.5 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs text-center transition cursor-pointer"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Plan 2: Career Pro Accelerator */}
              <div className="bg-slate-950 text-white rounded-3xl p-8 border-2 border-cyan-400/80 shadow-2xl flex flex-col justify-between relative">
                <span className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950">
                  Recommended
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">Career Pro Accelerator</div>
                  <div className="text-4xl font-black text-white mt-2">
                    {billingCycle === 'monthly' ? '$4.99' : '$3.99'} <span className="text-xs text-slate-400 font-normal">/ month</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Complete automated copilot for aggressive international hiring.</p>
                  
                  <div className="my-6 border-t border-slate-800"></div>

                  <ul className="space-y-3 text-xs text-slate-300 font-medium">
                    <li className="flex items-center gap-2 text-cyan-300">✓ Unlimited Gulf &amp; PK opportunities scouted</li>
                    <li className="flex items-center gap-2 text-cyan-300">✓ AI ATS CV accomplishment tailoring</li>
                    <li className="flex items-center gap-2 text-cyan-300">✓ 1-Click 300-char LinkedIn recruiter notes</li>
                    <li className="flex items-center gap-2 text-cyan-300">✓ Cold InMail &amp; email pitch drafts</li>
                    <li className="flex items-center gap-2 text-cyan-300">✓ Full Kanban CRM application tracker</li>
                    <li className="flex items-center gap-2 text-cyan-300">✓ Automated daily Gmail alert digests</li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-8 w-full py-3.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs text-center transition shadow-lg cursor-pointer"
                >
                  Join Pro Accelerator &rarr;
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: FAQ Accordion */}
        <section id="faq" className="py-20 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-extrabold text-cyan-600 uppercase tracking-wider">Frequently Asked Questions</span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Everything You Need to Know</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-5 text-left font-bold text-slate-900 text-sm flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
