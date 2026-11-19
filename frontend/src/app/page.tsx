'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Reveal, { CountUp } from '@/components/Reveal';
import TemplateAuthModal from '@/components/TemplateAuthModal';
import { fetchCurrentUser } from '@/lib/api';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Sliders, 
  Download, 
  CheckCircle2, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Star,
  Zap,
  Layers,
  Wand2,
  Columns,
  Palette,
  CheckCircle,
  HelpCircle,
  ArrowUpRight,
  TrendingUp,
  Award,
  Globe
} from 'lucide-react';

interface TemplateCard {
  id: string;
  name: string;
  category: string;
  role: string;
  avatar: string;
  bestFor: string;
  atsBadge: string;
  accentBg: string;
  layout: 'single' | 'two-column';
}

const FULL_TYPED_BULLET =
  'Spearheaded AI-driven microservices migration saving $340K/yr in cloud compute across 4 regional hubs.';

export default function HomePage() {
  const router = useRouter();
  const [activeTemplateIdx, setActiveTemplateIdx] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeAtsAccordion, setActiveAtsAccordion] = useState<number>(0);
  const [typedBullet, setTypedBullet] = useState<string>(FULL_TYPED_BULLET);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authModalTemplate, setAuthModalTemplate] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (typeof window !== 'undefined' && localStorage.getItem('tr_auth_user')) {
          setIsAuthenticated(true);
        }
        const user = await fetchCurrentUser();
        if (user) {
          setIsAuthenticated(true);
        }
      } catch {
        // Ignore auth check error on landing page
      }
    };
    checkUser();
  }, []);

  const handleUseTemplate = (e: React.MouseEvent, templateId: string, templateName: string) => {
    e.stopPropagation();
    if (isAuthenticated || (typeof window !== 'undefined' && localStorage.getItem('tr_auth_user'))) {
      router.push(`/builder?template=${encodeURIComponent(templateId)}`);
    } else {
      setAuthModalTemplate({ id: templateId, name: templateName });
    }
  };

  useEffect(() => {
    let idx = 0;
    let direction: 'forward' | 'pause' = 'forward';
    setTypedBullet('');
    const interval = setInterval(() => {
      if (direction === 'forward') {
        idx += 1;
        setTypedBullet(FULL_TYPED_BULLET.slice(0, idx));
        if (idx >= FULL_TYPED_BULLET.length) {
          direction = 'pause';
          setTimeout(() => {
            idx = 0;
            direction = 'forward';
          }, 2600);
        }
      }
    }, 28);
    return () => clearInterval(interval);
  }, []);

  // Plain facts about what every resume built here is (each is verified by the exporter's tests).
  const resumeFacts = [
    { icon: Layers, label: '105 templates', detail: 'real layouts, not mock-ups' },
    { icon: FileText, label: 'Single-column layout', detail: 'reads cleanly top to bottom' },
    { icon: ShieldCheck, label: 'Standard section headings', detail: 'Summary, Skills, Experience, Education' },
    { icon: CheckCircle2, label: 'Real, selectable text', detail: 'no images or text boxes' },
    { icon: Download, label: 'PDF and Word export', detail: 'what you see is what you download' },
  ];

  const templates: TemplateCard[] = [
    {
      id: 'contemporary',
      name: 'Maeve Delaney',
      category: 'Contemporary Modern',
      role: 'Strategic Sourcing Leader | Procurement Specialist',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      bestFor: 'Senior Leadership, Tech Managers, Global Supply',
      atsBadge: '100% ATS Verified',
      accentBg: 'from-emerald-600 to-teal-800',
      layout: 'two-column'
    },
    {
      id: 'minimalist',
      name: 'Abigail Hall',
      category: 'Minimalist Clean ATS',
      role: 'Senior Business Analyst & Data Analytics Expert',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      bestFor: 'Software Engineers, Data Engineers, Analysts',
      atsBadge: '99% ATS Verified',
      accentBg: 'from-slate-900 to-slate-800',
      layout: 'single'
    },
    {
      id: 'modern_tech',
      name: 'Ellen Johnson',
      category: 'Modern Digital Tech',
      role: 'Senior Digital Marketing Specialist | Growth Hacker',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bestFor: 'Full Stack, Cloud Architects, Growth Leads',
      atsBadge: '100% ATS Verified',
      accentBg: 'from-cyan-600 to-sky-800',
      layout: 'two-column'
    },
    {
      id: 'executive_pro',
      name: 'Jason Reed',
      category: 'Executive Dark Header',
      role: 'Vice President Engineering | Cloud Infrastructure',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bestFor: 'VP Engineering, Directors, C-Suite Leaders',
      atsBadge: '98% ATS Verified',
      accentBg: 'from-slate-800 to-slate-950',
      layout: 'two-column'
    }
  ];

  const faqs = [
    {
      q: "How does the AI match score calculate my fit for a job?",
      a: "TalentRadar analyzes the official job requirements, technology stack, and seniority level against your uploaded CV and primary skills. It identifies exact matching competencies, penalizes mismatched experience, and extracts missing keywords needed to pass Applicant Tracking Systems (ATS)."
    },
    {
      q: "What is the 1-Click Recruiter Outreach generator?",
      a: "For every verified job, TalentRadar crafts a personalized 300-character LinkedIn connection note (strictly within LinkedIn's limit) and a complete cold email pitch targeting the hiring manager so you skip the application backlog."
    },
    {
      q: "Is TalentRadar really completely 100% free?",
      a: "Yes! As part of our public launch celebration, all core features—including the Live Visual CV Builder, ATS Resume Scanner, 105+ Resume Templates, and AI Google X-Y-Z Bullet Generator—are 100% free with no credit card required."
    },
    {
      q: "Can I use the ATS scanner without signing up?",
      a: "Yes! You can immediately use our ATS Resume Diagnostic tool to test your CV against any job description with zero friction. You only create a free account if you want to save your tailored resumes."
    },
    {
      q: "Which industries and roles do you cover?",
      a: "Our templates and AI tailoring engine support software engineering, product management, data science, finance, marketing, operations, and executive leadership roles across startups and Fortune 500 enterprises."
    },
    {
      q: "How do your templates beat Applicant Tracking Systems (ATS)?",
      a: "Every TalentRadar template is engineered with a clean semantic text layer (no unreadable images or complex text boxes) tested against major ATS software like Taleo, Workday, Greenhouse, and Lever. Contact info sits in the main document body where parsers can read it cleanly."
    }
  ];

  const landingJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'TalentRadar',
        url: 'https://gulf-job-pipeline.vercel.app',
        description:
          'Create an ATS-friendly resume in minutes with our AI Resume Writer, Instant ATS Score Checker, 105+ Templates, and One-Click Job Tailoring.',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'TalentRadar AI Resume Builder & ATS Checker',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: 'https://gulf-job-pipeline.vercel.app',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '5367',
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FCFDFD] text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd) }}
      />
      
      {/* TOP ANNOUNCEMENT BANNER */}
      <div className="bg-slate-950 text-white py-2.5 px-3 sm:px-4 text-center text-[11px] sm:text-xs font-semibold border-b border-slate-800">
        <Link href="/builder" className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 hover:text-emerald-300 transition">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="font-bold text-emerald-400">🎉 PUBLIC LAUNCH SPECIAL:</span>
          </span>
          <span>All 105+ Templates &amp; AI Builder 100% Free &bull; No Credit Card Required</span>
          <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
            Build Resume Free &rarr;
          </span>
        </Link>
      </div>

      <Navbar />

      <main className="flex-1">

        {/* 1. HERO SECTION (Matches Enhancv Screenshot 1) */}
        <section className="pt-14 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-emerald-50/30 to-white border-b border-slate-200/70 overflow-hidden relative">
          {/* Animated background blobs */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-emerald-200/40 blur-3xl animate-blob" />
            <div className="absolute top-40 right-[-120px] w-[460px] h-[460px] rounded-full bg-violet-200/40 blur-3xl animate-blob delay-2000" />
            <div className="absolute bottom-[-160px] left-1/3 w-[380px] h-[380px] rounded-full bg-teal-100/60 blur-3xl animate-blob delay-1000" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-8 items-center">
              
              {/* Left Column: Headlines & Action Buttons */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur border border-emerald-200 text-emerald-900 text-xs font-bold shadow-sm">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping-soft" />
                    <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
                  </span>
                  <span>The AI Resume Builder Engineered for High-Salary Roles</span>
                </div>

                <h1 className="animate-fade-up delay-100 text-4xl sm:text-6xl lg:text-[64px] font-extrabold text-slate-950 tracking-tight leading-[1.06]">
                  Land more interviews with{' '}
                  <span className="text-gradient-animated">
                    TalentRadar&apos;s
                  </span>{' '}
                  Resume Builder
                </h1>

                <p className="animate-fade-up delay-200 text-base sm:text-xl text-slate-600 leading-relaxed max-w-xl font-normal">
                  Create a beautiful, ATS-friendly resume with the help of features like AI Resume Writer, ATS Check, and One-Click Job Tailoring. It&apos;s the best way to make an impression.
                </p>

                {/* Primary Action Buttons */}
                <div className="animate-fade-up delay-300 pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                  <Link
                    href="/builder"
                    className="btn-shine group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-base transition-all shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>Build Your Resume</span>
                    <ArrowRight className="w-4 h-4 text-emerald-100 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/ats-scanner"
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-base transition-all border border-slate-300 hover:border-slate-900 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>Get Your Resume Score</span>
                  </Link>

                  <Link
                    href="/builder"
                    className="hidden sm:inline-flex items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-4"
                  >
                    <span>Get Started Free</span>
                  </Link>
                </div>

                {/* Social Proof */}
                <div className="animate-fade-up delay-400 pt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 font-medium">
                  <div className="flex text-emerald-600 font-bold">★★★★★</div>
                  <span className="font-bold text-slate-900">Excellent</span>
                  <span className="text-slate-500">5,367 reviews</span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <CountUp end={28452} duration={2200} /> users landed interviews last month
                  </span>
                </div>

                {/* ATS Compatibility Badges */}
                <div className="animate-fade-up delay-500 pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="text-slate-400 font-bold">ATS Verified For:</span>
                  <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">✓ Workday &amp; Taleo</span>
                  <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">✓ Greenhouse &amp; Lever</span>
                  <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">✓ iCIMS &amp; SuccessFactors</span>
                </div>
              </div>

              {/* Right Column: Enhancv-Style Floating Tilt Resume Mockup with AI Assistant */}
              <div className="lg:col-span-5 relative flex items-center justify-center animate-pop-in delay-300">
                <div className="relative w-full max-w-[420px] animate-float-tilt">
                <div className="relative w-full bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200 p-6 text-slate-900">

                  {/* ATS scan line sweeping over the resume */}
                  <div aria-hidden className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div className="scan-line" />
                  </div>

                  {/* Floating ATS score badge */}
                  <div className="absolute -top-5 right-2 sm:-top-6 sm:-right-8 z-20 animate-float-slow delay-700">
                    <div className="flex items-center gap-2 sm:gap-2.5 bg-white rounded-2xl px-3 sm:px-3.5 py-2 sm:py-2.5 shadow-xl border border-slate-200">
                      <div className="relative w-9 h-9 sm:w-10 sm:h-10">
                        <svg viewBox="0 0 36 36" className="w-9 h-9 sm:w-10 sm:h-10 -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeDasharray="94.2" strokeDashoffset="5.6" className="transition-all" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-900">
                          <CountUp end={94} duration={1600} />
                        </span>
                      </div>
                      <div className="leading-tight">
                        <div className="text-[11px] font-black text-slate-900">ATS Score</div>
                        <div className="text-[10px] font-bold text-emerald-600">Excellent match</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resume Header */}
                  <div className="border-b border-slate-200 pb-3 pr-24 sm:pr-0">
                    <h3 className="text-lg font-black text-slate-950 tracking-tight">ETHAN SMITH</h3>
                    <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                      Chief Experience Officer | Omnichannel Growth &amp; Digital Transformation
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 break-words">
                      ethan.smith@executive.com &bull; linkedin.com/in/ethan-smith &bull; +1 (555) 234-5678
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="pt-3 space-y-1">
                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-800">SUMMARY</div>
                    <p className="text-[9px] text-slate-600 leading-normal">
                      With over 12 years in customer experience management, I focus on delivering scalable strategies that enhance brand retention. Directed high-performance engineering &amp; product squads.
                    </p>
                  </div>

                  {/* Experience */}
                  <div className="pt-3 space-y-2">
                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-800">EXPERIENCE</div>
                    <div>
                      <div className="flex flex-wrap justify-between gap-1 text-[10px] font-bold text-slate-900">
                        <span>Chief Experience Officer &mdash; TechGlobal Solutions</span>
                        <span className="text-[8px] text-slate-400 font-normal">2021 &ndash; Present</span>
                      </div>
                      <ul className="list-disc pl-3 text-[9px] text-slate-600 space-y-1 mt-1 leading-normal">
                        <li>Developed and executed an omnichannel expansion strategy that increased customer retention by 42% across 1.8M active regional accounts.</li>
                        <li>Championed cross-functional cloud architecture and product teams to streamline onboarding workflows, slashing drop-off rates by 28%.</li>
                        <li className="text-emerald-800 bg-emerald-50/70 rounded px-1 -mx-1 min-h-[2.4em]">
                          {typedBullet}
                          <span className="inline-block w-[1.5px] h-[1em] align-middle bg-emerald-600 ml-px animate-caret" />
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* FLOATING AI ASSISTANT CARD (Responsive on Mobile, Floating on Desktop) */}
                  <div className="mt-4 sm:mt-0 sm:absolute sm:-bottom-8 sm:-right-10 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-emerald-500/30 w-full sm:w-72 space-y-2.5 z-20 animate-float delay-1000">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                      <span className="flex items-center gap-1.5 text-emerald-700 font-black">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        AI ASSISTANT
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">100% ATS Ready</span>
                    </div>

                    <button 
                      type="button"
                      onClick={() => router.push('/builder?tab=skills')}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-800 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Generate Skills from Job
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>

                    <button 
                      type="button"
                      onClick={() => router.push('/builder?tab=experience')}
                      className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-800 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                        Quantify with X-Y-Z Metrics
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>

                    {/* Floating pill toolbar */}
                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">+ New Entry</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Taleo &amp; Workday Safe</span>
                    </div>
                  </div>

                </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* WHAT EVERY RESUME INCLUDES (plain facts, no borrowed logos or invented stats) */}
        <section className="py-10 bg-white border-b border-slate-200/70">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-6">
            Every resume you build here
          </p>
          <ul className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-5">
            {resumeFacts.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">{label}</span>
                  <span className="block text-xs leading-snug text-slate-600">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 2. PICK A TEMPLATE CAROUSEL SECTION (Matches Enhancv Screenshot 2 & 3) */}
        <section className="py-24 bg-[radial-gradient(ellipse_at_top_left,_rgba(167,243,208,0.28),_transparent_50%),radial-gradient(ellipse_at_top_right,_rgba(221,214,254,0.32),_transparent_50%),linear-gradient(to_bottom,_#F8FAFC,_#F3F6F5)] border-b border-slate-200/80 overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Reveal>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.12] max-w-xl mx-auto">
                Pick a template and build your resume in minutes!
              </h2>
              <p className="sr-only">
                Every design is crafted by professional resume writers and rigorously tested across enterprise ATS scanners for Software Engineers, Product Managers, Finance &amp; Chartered Accountants.
              </p>
            </Reveal>

            {/* Enhancv-Style Full-Bleed A4 Resume Templates Carousel */}
            <div className="mt-14 relative">
              {/* Left Carousel Arrow */}
              <button
                type="button"
                aria-label="Previous template"
                onClick={() => setActiveTemplateIdx((prev) => (prev - 1 + templates.length) % templates.length)}
                className="hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-slate-900/10 hover:bg-slate-900 text-slate-700 hover:text-white backdrop-blur-sm transition-all duration-200 absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-30 shadow-md hover:scale-110 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Right Carousel Arrow */}
              <button
                type="button"
                aria-label="Next template"
                onClick={() => setActiveTemplateIdx((prev) => (prev + 1) % templates.length)}
                className="hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-slate-900 hover:bg-emerald-600 text-white transition-all duration-200 absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-30 shadow-xl hover:scale-110 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7 max-w-[1320px] mx-auto px-2 sm:px-8 text-left items-stretch">
                {/* TEMPLATE 1: MAEVE DELANEY (Contemporary Two-Column with Photo & Green Subtitle Pill) */}
                <Reveal delay={0}>
                  <div
                    onClick={() => setActiveTemplateIdx(0)}
                    onMouseEnter={() => setActiveTemplateIdx(0)}
                    className={`group relative rounded-2xl bg-white border transition-all duration-500 cursor-pointer overflow-hidden h-[460px] flex flex-col select-none ${
                      activeTemplateIdx === 0
                        ? 'shadow-[0_28px_60px_-15px_rgba(15,23,42,0.22)] ring-2 ring-emerald-500/80 border-transparent -translate-y-2 scale-[1.01]'
                        : 'shadow-md border-slate-200/90 opacity-85 hover:opacity-100 hover:-translate-y-1.5 hover:shadow-xl'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex-1 grid grid-cols-12 gap-3 text-[6.3px] leading-[1.35] text-slate-600 overflow-hidden">
                      {/* Left Column */}
                      <div className="col-span-4 space-y-2.5 pr-2 border-r border-slate-100">
                        <div className="flex justify-center">
                          <img
                            src={templates[0].avatar}
                            alt="Maeve Delaney"
                            className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/40 shadow-xs"
                          />
                        </div>

                        <div>
                          <div className="text-[7px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500 inline-block" /> CONTACTS
                          </div>
                          <div className="space-y-0.5 text-[5.8px] text-slate-500">
                            <div>+1-(234)-555-1234</div>
                            <div>maeve@enhancv.com</div>
                            <div>linkedin.com/in/maeve</div>
                            <div>Charlotte, North Carolina</div>
                          </div>
                        </div>

                        <div>
                          <div className="text-[7px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500 inline-block" /> KEY ACHIEVEMENTS
                          </div>
                          <div className="space-y-1.5">
                            <div>
                              <div className="font-bold text-slate-900 text-[6.2px]">Implemented Supplier Performance Management System</div>
                              <p className="text-[5.6px] text-slate-500">Successfully introduced a systematic approach to evaluating supplier performance, elevating efficiency by 25%.</p>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-[6.2px]">Managed $500M Indirect Spend Portfolio</div>
                              <p className="text-[5.6px] text-slate-500">Directed strategic allocation and cost-saving initiatives across diverse departments, optimizing indirect spend.</p>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-[6.2px]">Achieved 15% Annual Cost Savings</div>
                              <p className="text-[5.6px] text-slate-500">Developed and executed a category management plan for medical supplies that slashed annual costs significantly.</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-[7px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500 inline-block" /> COURSES
                          </div>
                          <div className="font-bold text-slate-900 text-[6px]">Certified Professional in Supply Management</div>
                          <p className="text-[5.5px] text-slate-500">Intensive course covering strategic sourcing and supply chain management by ISM.</p>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="col-span-8 space-y-2">
                        <div>
                          <div className="text-[13px] font-extrabold text-slate-900 tracking-tight leading-none">Maeve Delaney</div>
                          <div className="mt-1 px-1.5 py-0.5 rounded-xs bg-emerald-200/80 text-emerald-950 font-bold text-[6.2px] leading-snug">
                            Strategic Sourcing Leader | Procurement Specialist | Team Management
                          </div>
                        </div>

                        <div>
                          <div className="text-[7px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                            SUMMARY
                          </div>
                          <p className="text-[5.8px] text-slate-600">
                            Dynamic procurement specialist with over 5 years of experience in strategic sourcing and team management. Highly skilled in supply chain optimization and developing category strategies. Proven leader with an MBA and a solid track record in transformative sourcing initiatives.
                          </p>
                        </div>

                        <div>
                          <div className="text-[7px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                            EXPERIENCE
                          </div>
                          <div className="space-y-1.5">
                            <div>
                              <div className="flex justify-between font-bold text-slate-900 text-[6.4px]">
                                <span>Premier Inc.</span>
                                <span className="text-[5.6px] text-slate-400">Charlotte, NC</span>
                              </div>
                              <div className="flex justify-between text-emerald-700 font-semibold text-[6px]">
                                <span>Senior Sourcing Manager</span>
                                <span className="text-[5.5px] text-slate-400">06/2019 - Present</span>
                              </div>
                              <ul className="list-disc pl-2.5 space-y-0.5 mt-0.5 text-[5.6px] text-slate-600">
                                <li>Developed and executed category strategy for medical supplies, reducing annual costs by 15% through strategic supplier consolidation.</li>
                                <li>Led cross-functional teams in negotiation of complex service contracts, yielding a 20% improvement in service level agreements.</li>
                                <li>Implemented a supplier performance management system, enhancing supplier quality and compliance, resulting in a 25% increase in efficiency.</li>
                                <li>Managed a portfolio of $500M in indirect spend, driving adoption of cost saving measures across multiple departments.</li>
                                <li>Spearheaded a major procurement transformation project, integrating advanced analytics into sourcing processes, cutting timelines by 30%.</li>
                              </ul>
                            </div>

                            <div>
                              <div className="flex justify-between font-bold text-slate-900 text-[6.4px]">
                                <span>Honeywell</span>
                                <span className="text-[5.6px] text-slate-400">Fort Mill, SC</span>
                              </div>
                              <div className="flex justify-between text-emerald-700 font-semibold text-[6px]">
                                <span>Category Manager</span>
                                <span className="text-[5.5px] text-slate-400">05/2016 - 05/2019</span>
                              </div>
                              <ul className="list-disc pl-2.5 space-y-0.5 mt-0.5 text-[5.6px] text-slate-600">
                                <li>Executed multi-year global strategies for electronics category, achieving a sustained 10% year-over-year cost reduction.</li>
                                <li>Conducted market trends &amp; spend analysis leading to early identification of cost-saving opportunities and 20% faster delivery.</li>
                                <li>Generated $200 million in savings by restructuring risk vendor selection and contracting processes.</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-[7px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                            EDUCATION
                          </div>
                          <div className="flex justify-between font-bold text-slate-900 text-[6px]">
                            <span>Duke University &mdash; Master of Business Administration</span>
                            <span className="text-slate-400">2016</span>
                          </div>
                          <div className="flex justify-between text-slate-600 text-[5.8px]">
                            <span>North Carolina State University &mdash; BS Business Administration</span>
                            <span className="text-slate-400">2014</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Bottom Action Overlay (Matches Enhancv) */}
                    <div
                      className={`absolute inset-x-3 bottom-3 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl px-3 py-2 flex items-center justify-between gap-2 transition-all duration-300 ${
                        activeTemplateIdx === 0
                          ? 'translate-y-0 opacity-100 pointer-events-auto'
                          : 'translate-y-0 opacity-100 pointer-events-auto md:translate-y-4 md:opacity-0 md:pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto'
                      }`}
                    >
                      <span className="text-[11px] font-extrabold text-slate-900 whitespace-nowrap">Contemporary</span>
                      <button
                        type="button"
                        onClick={(e) => handleUseTemplate(e, templates[0].id, templates[0].category)}
                        className="btn-shine inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-emerald-600 text-white font-bold text-[11px] whitespace-nowrap shrink-0 transition shadow-xs cursor-pointer"
                      >
                        <span>Use this template</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>
                </Reveal>

                {/* TEMPLATE 2: ABIGAIL HALL (Classic Single-Column Minimalist ATS) */}
                <Reveal delay={90}>
                  <div
                    onClick={() => setActiveTemplateIdx(1)}
                    onMouseEnter={() => setActiveTemplateIdx(1)}
                    className={`group relative rounded-2xl bg-white border transition-all duration-500 cursor-pointer overflow-hidden h-[460px] flex flex-col select-none ${
                      activeTemplateIdx === 1
                        ? 'shadow-[0_28px_60px_-15px_rgba(15,23,42,0.22)] ring-2 ring-emerald-500/80 border-transparent -translate-y-2 scale-[1.01]'
                        : 'shadow-md border-slate-200/90 opacity-85 hover:opacity-100 hover:-translate-y-1.5 hover:shadow-xl'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex-1 space-y-2 text-[6.2px] leading-[1.35] text-slate-600 overflow-hidden">
                      {/* Centered Header */}
                      <div className="text-center border-b border-slate-200 pb-2">
                        <div className="text-[11px] font-black tracking-wide text-slate-900 uppercase">ABIGAIL HALL</div>
                        <div className="text-[6.8px] font-semibold text-slate-600 mt-0.5">
                          Senior Business Analyst | Data Analytics Expert
                        </div>
                        <div className="text-[5.5px] text-slate-400 mt-0.5">
                          abigail.hall@enhancv.com &bull; linkedin.com/in/abigail-hall &bull; San Francisco, CA
                        </div>
                      </div>

                      {/* Summary */}
                      <div>
                        <div className="text-center text-[6.8px] font-bold text-slate-800 border-b border-slate-200 pb-0.5 mb-1">
                          Summary
                        </div>
                        <p className="text-[5.7px] text-slate-600 text-justify">
                          Seasoned Business Analyst with over 12 years in the biotech industry, specializing in data integration and enterprise reporting systems (ERP, CRM). Demonstrated success in leading major analytics transformations that improved reporting efficiency by 30%. Expertise in Agile methodologies, SQL, ETL, BI tools, and master data management.
                        </p>
                      </div>

                      {/* Experience */}
                      <div>
                        <div className="text-center text-[6.8px] font-bold text-slate-800 border-b border-slate-200 pb-0.5 mb-1">
                          Experience
                        </div>
                        <div className="space-y-1.5">
                          <div>
                            <div className="flex justify-between font-bold text-slate-900 text-[6.2px]">
                              <span>Genentech &mdash; Senior Business Analyst</span>
                              <span className="text-[5.5px] text-slate-400">South San Francisco, CA &bull; 02/2018 - Present</span>
                            </div>
                            <ul className="list-disc pl-3 space-y-0.5 mt-0.5 text-[5.6px]">
                              <li>Led the development of an enterprise data warehouse, increasing operational reporting efficiency across 6 departments by 30%.</li>
                              <li>Spearheaded a project to integrate Salesforce CRM and SAP ERP systems, enhancing real-time data synchronization by 25%.</li>
                              <li>Facilitated over 40 workshops to define and refine project scopes, translating complex requirements into actionable user stories.</li>
                              <li>Coordinated user acceptance testing (UAT) for BI dashboards, achieving a 95% satisfaction rate from executive stakeholders.</li>
                            </ul>
                          </div>

                          <div>
                            <div className="flex justify-between font-bold text-slate-900 text-[6.2px]">
                              <span>Amgen &mdash; Business Systems Analyst</span>
                              <span className="text-[5.5px] text-slate-400">Thousand Oaks, CA &bull; 06/2014 - 01/2018</span>
                            </div>
                            <ul className="list-disc pl-3 space-y-0.5 mt-0.5 text-[5.6px]">
                              <li>Implemented a master data management strategy that decreased data redundancy by 20% and improved reporting accuracy.</li>
                              <li>Managed a portfolio of 5+ analytics tools, ensuring alignment with business goals and saving $1.2M annually in licensing.</li>
                              <li>Collaborated with cross-functional teams to gather requirements using JAD sessions and process modeling.</li>
                            </ul>
                          </div>

                          <div>
                            <div className="flex justify-between font-bold text-slate-900 text-[6.2px]">
                              <span>BioMarin Pharmaceutical &mdash; Data Analyst</span>
                              <span className="text-[5.5px] text-slate-400">San Rafael, CA &bull; 05/2012 - 05/2014</span>
                            </div>
                            <ul className="list-disc pl-3 space-y-0.5 mt-0.5 text-[5.6px]">
                              <li>Automated recurring executive Excel and SQL reports, reducing manual data processing time by 40 hours per month.</li>
                              <li>Performed root-cause analysis on supply chain datasets to identify bottlenecks and improve forecast accuracy by 18%.</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Education */}
                      <div>
                        <div className="text-center text-[6.8px] font-bold text-slate-800 border-b border-slate-200 pb-0.5 mb-1">
                          Education
                        </div>
                        <div className="flex justify-between text-[5.8px]">
                          <span><strong>University of San Francisco</strong> &mdash; Master of Science in Information Systems</span>
                          <span className="text-slate-400">2010 - 2012</span>
                        </div>
                        <div className="flex justify-between text-[5.8px]">
                          <span><strong>University of California, Berkeley</strong> &mdash; Bachelor of Arts in Computer Science</span>
                          <span className="text-slate-400">2006 - 2010</span>
                        </div>
                      </div>

                      {/* Key Achievements */}
                      <div>
                        <div className="text-center text-[6.8px] font-bold text-slate-800 border-b border-slate-200 pb-0.5 mb-1">
                          Key Achievements
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-[5.4px]">
                          <div>
                            <div className="font-bold text-slate-900">30% Error Reporting Decrease</div>
                            <div className="text-slate-500">Redesigned automated ETL validation checks across enterprise pipelines.</div>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">Enhanced Data Integration</div>
                            <div className="text-slate-500">Unified CRM and ERP schemas for 2,400+ commercial users.</div>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">Saved $1.2M Annually</div>
                            <div className="text-slate-500">Consolidated redundant BI vendor contracts into Snowflake &amp; Tableau.</div>
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div>
                        <div className="text-center text-[6.8px] font-bold text-slate-800 border-b border-slate-200 pb-0.5 mb-0.5">
                          Skills
                        </div>
                        <div className="text-center text-[5.6px] text-slate-600">
                          Data Visualization &bull; Agile &amp; Scrum &bull; JIRA &bull; SQL &bull; ETL &bull; Business Intelligence &bull; SAP ERP &bull; Salesforce CRM &bull; Tableau
                        </div>
                      </div>
                    </div>

                    {/* Floating Bottom Action Overlay */}
                    <div
                      className={`absolute inset-x-3 bottom-3 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl px-3 py-2 flex items-center justify-between gap-2 transition-all duration-300 ${
                        activeTemplateIdx === 1
                          ? 'translate-y-0 opacity-100 pointer-events-auto'
                          : 'translate-y-0 opacity-100 pointer-events-auto md:translate-y-4 md:opacity-0 md:pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto'
                      }`}
                    >
                      <span className="text-[11px] font-extrabold text-slate-900 whitespace-nowrap">Minimalist ATS</span>
                      <button
                        type="button"
                        onClick={(e) => handleUseTemplate(e, templates[1].id, templates[1].category)}
                        className="btn-shine inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-emerald-600 text-white font-bold text-[11px] whitespace-nowrap shrink-0 transition shadow-xs cursor-pointer"
                      >
                        <span>Use this template</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>
                </Reveal>

                {/* TEMPLATE 3: ELLEN JOHNSON (Modern Digital Tech Two-Column with Top-Right Avatar) */}
                <Reveal delay={180}>
                  <div
                    onClick={() => setActiveTemplateIdx(2)}
                    onMouseEnter={() => setActiveTemplateIdx(2)}
                    className={`group relative rounded-2xl bg-white border transition-all duration-500 cursor-pointer overflow-hidden h-[460px] flex flex-col select-none ${
                      activeTemplateIdx === 2
                        ? 'shadow-[0_28px_60px_-15px_rgba(15,23,42,0.22)] ring-2 ring-emerald-500/80 border-transparent -translate-y-2 scale-[1.01]'
                        : 'shadow-md border-slate-200/90 opacity-85 hover:opacity-100 hover:-translate-y-1.5 hover:shadow-xl'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex-1 space-y-2 text-[6.1px] leading-[1.35] text-slate-600 overflow-hidden">
                      {/* Header Row with Right Avatar */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div>
                          <div className="text-[12px] font-black text-slate-900 tracking-tight uppercase">ELLEN JOHNSON</div>
                          <div className="text-[6.4px] font-bold text-sky-600">
                            Digital Marketing Manager | Growth Hacking | Data Analysis
                          </div>
                          <div className="text-[5.5px] text-slate-400 mt-0.5">
                            ellen.johnson@email.com &bull; linkedin.com/in/ellen &bull; San Francisco, California
                          </div>
                        </div>
                        <img
                          src={templates[2].avatar}
                          alt="Ellen Johnson"
                          className="w-11 h-11 rounded-full object-cover border border-sky-200 shrink-0"
                        />
                      </div>

                      {/* Two-Column Body */}
                      <div className="grid grid-cols-12 gap-3 pt-0.5">
                        {/* Left 7 Cols: Experience & Education */}
                        <div className="col-span-7 space-y-2 pr-2 border-r border-slate-100">
                          <div>
                            <div className="text-[6.8px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                              EXPERIENCE
                            </div>
                            <div className="space-y-1.5">
                              <div>
                                <div className="font-bold text-slate-900 text-[6.2px]">Senior Digital Marketing Specialist</div>
                                <div className="flex justify-between text-sky-600 font-semibold text-[5.7px]">
                                  <span>Tech Innovate</span>
                                  <span className="text-slate-400">01/2022 - Present &bull; San Francisco</span>
                                </div>
                                <ul className="list-disc pl-2.5 space-y-0.5 mt-0.5 text-[5.5px]">
                                  <li>Led the development and execution of comprehensive digital marketing campaigns across Meta, Google, and TikTok, increasing user acquisition by 45% within 12 months.</li>
                                  <li>Managed a $500K quarterly budget for paid acquisition channels, optimizing spend for a 30% improvement in ROAS.</li>
                                  <li>Implemented advanced targeting and retargeting strategies that lowered CPA by 22% while scaling qualified pipeline.</li>
                                  <li>Collaborated with product &amp; design squads to A/B test landing pages, resulting in a 35% lift in conversion rates.</li>
                                </ul>
                              </div>

                              <div>
                                <div className="font-bold text-slate-900 text-[6.2px]">Digital Marketing Manager</div>
                                <div className="flex justify-between text-sky-600 font-semibold text-[5.7px]">
                                  <span>MarketPro Agency</span>
                                  <span className="text-slate-400">06/2019 - 12/2021 &bull; San Francisco</span>
                                </div>
                                <ul className="list-disc pl-2.5 space-y-0.5 mt-0.5 text-[5.5px]">
                                  <li>Directed multi-channel growth campaigns for 12 B2B SaaS clients, growing organic traffic by 60% YoY.</li>
                                  <li>Built automated HubSpot lifecycle nurture workflows that increased trial-to-paid conversion by 28%.</li>
                                  <li>Spearheaded SEO content strategy and technical site audits across 400+ high-intent landing pages.</li>
                                </ul>
                              </div>

                              <div>
                                <div className="font-bold text-slate-900 text-[6.2px]">Performance Marketing Analyst</div>
                                <div className="flex justify-between text-sky-600 font-semibold text-[5.7px]">
                                  <span>AdVantage Media</span>
                                  <span className="text-slate-400">03/2018 - 05/2019</span>
                                </div>
                                <ul className="list-disc pl-2.5 space-y-0.5 mt-0.5 text-[5.5px]">
                                  <li>Analyzed campaign attribution across multi-touch funnels using SQL and Looker dashboards, cutting wasted ad spend by 19%.</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-[6.8px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                              EDUCATION
                            </div>
                            <div className="font-bold text-slate-900 text-[5.9px]">Master of Science in Marketing Analytics</div>
                            <div className="text-slate-500 text-[5.5px]">University of California, Berkeley &bull; 2016 - 2018</div>
                            <div className="font-bold text-slate-900 text-[5.9px] mt-1">Bachelor of Science in Business Administration</div>
                            <div className="text-slate-500 text-[5.5px]">San Francisco State University &bull; 2012 - 2016</div>
                          </div>
                        </div>

                        {/* Right 5 Cols: Summary, Achievements, Skills, Certs */}
                        <div className="col-span-5 space-y-2">
                          <div>
                            <div className="text-[6.8px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                              SUMMARY
                            </div>
                            <p className="text-[5.5px] text-slate-600">
                              Results-driven Digital Marketing Manager with over 6 years of experience driving user acquisition, growth hacking, and data-backed campaign optimization across B2B and consumer tech.
                            </p>
                          </div>

                          <div>
                            <div className="text-[6.8px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                              KEY ACHIEVEMENTS
                            </div>
                            <div className="space-y-1 text-[5.5px]">
                              <div>
                                <div className="font-bold text-slate-900">45% User Acquisition Increase</div>
                                <div className="text-slate-500">Scaled multi-channel paid social &amp; search acquisition in 12 months.</div>
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">30% ROAS Improvement</div>
                                <div className="text-slate-500">Optimized $2M annual ad spend via cohort attribution modeling.</div>
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">35% Conversion Rate Lift</div>
                                <div className="text-slate-500">Redesigned onboarding &amp; checkout flows through 50+ A/B experiments.</div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-[6.8px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                              SKILLS
                            </div>
                            <div className="flex flex-wrap gap-1 text-[5.4px]">
                              {['Google Analytics', 'Meta Ads', 'SEO / SEM', 'HubSpot', 'SQL', 'Looker', 'A/B Testing', 'CRO', 'Python'].map((s) => (
                                <span key={s} className="px-1.5 py-0.5 rounded-xs bg-sky-50 text-sky-900 border border-sky-200/70 font-semibold">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-[6.8px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                              CERTIFICATION
                            </div>
                            <div className="font-bold text-slate-900 text-[5.6px]">Google Analytics &amp; Ads Certified</div>
                            <div className="font-bold text-slate-900 text-[5.6px] mt-0.5">HubSpot Growth Marketing Pro</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Bottom Action Overlay */}
                    <div
                      className={`absolute inset-x-3 bottom-3 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl px-3 py-2 flex items-center justify-between gap-2 transition-all duration-300 ${
                        activeTemplateIdx === 2
                          ? 'translate-y-0 opacity-100 pointer-events-auto'
                          : 'translate-y-0 opacity-100 pointer-events-auto md:translate-y-4 md:opacity-0 md:pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto'
                      }`}
                    >
                      <span className="text-[11px] font-extrabold text-slate-900 whitespace-nowrap">Modern Tech</span>
                      <button
                        type="button"
                        onClick={(e) => handleUseTemplate(e, templates[2].id, templates[2].category)}
                        className="btn-shine inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-emerald-600 text-white font-bold text-[11px] whitespace-nowrap shrink-0 transition shadow-xs cursor-pointer"
                      >
                        <span>Use this template</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>
                </Reveal>

                {/* TEMPLATE 4: JASON REED (Executive Dark Slate Left Sidebar Full-Bleed) */}
                <Reveal delay={270}>
                  <div
                    onClick={() => setActiveTemplateIdx(3)}
                    onMouseEnter={() => setActiveTemplateIdx(3)}
                    className={`group relative rounded-2xl bg-white border transition-all duration-500 cursor-pointer overflow-hidden h-[460px] flex flex-col select-none ${
                      activeTemplateIdx === 3
                        ? 'shadow-[0_28px_60px_-15px_rgba(15,23,42,0.22)] ring-2 ring-emerald-500/80 border-transparent -translate-y-2 scale-[1.01]'
                        : 'shadow-md border-slate-200/90 opacity-85 hover:opacity-100 hover:-translate-y-1.5 hover:shadow-xl'
                    }`}
                  >
                    <div className="flex-1 grid grid-cols-12 text-[6.1px] leading-[1.35] overflow-hidden">
                      {/* Dark Slate Left Sidebar (Full Height) */}
                      <div className="col-span-5 bg-[#52606D] text-slate-100 p-3.5 space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div>
                            <div className="text-[12px] font-black tracking-tight text-white uppercase leading-none">
                              JASON REED
                            </div>
                            <div className="text-[5.6px] text-slate-300 mt-1">
                              Boston, MA &bull; jason.reed@exec.com
                            </div>
                          </div>

                          <div>
                            <div className="text-[6.5px] font-black uppercase tracking-wider text-white border-b border-slate-400/40 pb-0.5 mb-1">
                              KEY ACHIEVEMENTS
                            </div>
                            <div className="space-y-1.5 text-[5.5px]">
                              <div>
                                <div className="font-bold text-white">✓ 20% Production Efficiency Increase</div>
                                <p className="text-slate-200/80">Led Lean Six Sigma automation across 4 regional plants.</p>
                              </div>
                              <div>
                                <div className="font-bold text-white">✓ 35% Revenue Growth from New Contracts</div>
                                <p className="text-slate-200/80">Negotiated multi-year aerospace &amp; defense supply agreements.</p>
                              </div>
                              <div>
                                <div className="font-bold text-white">✓ 40% Defect Rate Reduction</div>
                                <p className="text-slate-200/80">Deployed IoT predictive quality control sensors across lines.</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-[6.5px] font-black uppercase tracking-wider text-white border-b border-slate-400/40 pb-0.5 mb-1">
                              CERTIFICATION
                            </div>
                            <div className="space-y-1 text-[5.5px]">
                              <div className="font-bold text-white">Lean Manufacturing Master</div>
                              <div className="text-slate-200/80">SME Certification Institute</div>
                              <div className="font-bold text-white mt-0.5">Advanced Project Management</div>
                              <div className="text-slate-200/80">Stanford Center for Professional Dev</div>
                            </div>
                          </div>

                          <div>
                            <div className="text-[6.5px] font-black uppercase tracking-wider text-white border-b border-slate-400/40 pb-0.5 mb-1">
                              LANGUAGES
                            </div>
                            <div className="flex justify-between text-[5.5px]">
                              <span>English</span>
                              <span className="text-emerald-300">●●●●●</span>
                            </div>
                            <div className="flex justify-between text-[5.5px]">
                              <span>Spanish</span>
                              <span className="text-emerald-300">●●●●○</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-[5px] text-slate-300/70 pt-1 border-t border-slate-400/30">
                          98% ATS Verified &bull; Executive Layout
                        </div>
                      </div>

                      {/* Right White Content Column */}
                      <div className="col-span-7 p-3.5 space-y-2 text-slate-600 bg-white">
                        <div className="border-b border-slate-200 pb-1.5">
                          <div className="text-[6.8px] font-bold text-indigo-600 leading-snug">
                            Vice President, Manufacturing | Strategic Leadership | Process Optimization
                          </div>
                          <div className="text-[5.4px] text-slate-400 mt-0.5">
                            +1-617-555-0199 &bull; linkedin.com/in/jasonreed-vp &bull; Boston, MA
                          </div>
                        </div>

                        <div>
                          <div className="text-[6.6px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                            SUMMARY
                          </div>
                          <p className="text-[5.5px] text-slate-600">
                            With over 15 years of leadership experience in manufacturing, I excel in strategic planning, process optimization, and team leadership. My career is marked by successful projects that significantly improved operational efficiency and profitability.
                          </p>
                        </div>

                        <div>
                          <div className="text-[6.6px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                            EXPERIENCE
                          </div>
                          <div className="space-y-1.5">
                            <div>
                              <div className="flex justify-between font-bold text-slate-900 text-[6px]">
                                <span>Vice President, Manufacturing</span>
                                <span className="text-[5.2px] text-slate-400">01/2019 - Present</span>
                              </div>
                              <div className="text-indigo-600 font-semibold text-[5.6px]">ABC Enterprises &bull; Boston, MA</div>
                              <ul className="list-disc pl-2.5 space-y-0.5 mt-0.5 text-[5.4px]">
                                <li>Led the strategic planning and execution of manufacturing operations across 4 facilities, resulting in a 20% increase in production efficiency.</li>
                                <li>Spearheaded a cross-functional team to implement Lean principles, reducing waste by 30% and saving $4.5M annually.</li>
                                <li>Negotiated key supplier contracts, achieving a 15% reduction in raw material costs while improving on-time delivery.</li>
                              </ul>
                            </div>

                            <div>
                              <div className="flex justify-between font-bold text-slate-900 text-[6px]">
                                <span>Director of Operations</span>
                                <span className="text-[5.2px] text-slate-400">06/2014 - 12/2018</span>
                              </div>
                              <div className="text-indigo-600 font-semibold text-[5.6px]">XYZ Corporation &bull; Boston, MA</div>
                              <ul className="list-disc pl-2.5 space-y-0.5 mt-0.5 text-[5.4px]">
                                <li>Oversaw daily plant operations for a 350-person engineering &amp; assembly workforce, boosting output by 25%.</li>
                                <li>Implemented ISO 9001 quality management systems, cutting product defect rates by 40%.</li>
                              </ul>
                            </div>

                            <div>
                              <div className="flex justify-between font-bold text-slate-900 text-[6px]">
                                <span>Senior Process Engineer</span>
                                <span className="text-[5.2px] text-slate-400">2010 - 2014</span>
                              </div>
                              <ul className="list-disc pl-2.5 space-y-0.5 mt-0.5 text-[5.4px]">
                                <li>Redesigned chemical continuous-flow lines, improving throughput by 18%.</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-[6.6px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                            SKILLS &amp; EDUCATION
                          </div>
                          <div className="text-[5.4px] text-slate-700 font-medium">
                            Strategic Planning &bull; Lean Manufacturing &bull; Six Sigma &bull; P&amp;L Management &bull; Supply Chain
                          </div>
                          <div className="font-bold text-slate-900 text-[5.7px] mt-1">
                            MIT &mdash; Master of Science in Chemical Engineering
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Bottom Action Overlay */}
                    <div
                      className={`absolute inset-x-3 bottom-3 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl px-3 py-2 flex items-center justify-between gap-2 transition-all duration-300 ${
                        activeTemplateIdx === 3
                          ? 'translate-y-0 opacity-100 pointer-events-auto'
                          : 'translate-y-0 opacity-100 pointer-events-auto md:translate-y-4 md:opacity-0 md:pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto'
                      }`}
                    >
                      <span className="text-[11px] font-extrabold text-slate-900 whitespace-nowrap">Executive Pro</span>
                      <button
                        type="button"
                        onClick={(e) => handleUseTemplate(e, templates[3].id, templates[3].category)}
                        className="btn-shine inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-emerald-600 text-white font-bold text-[11px] whitespace-nowrap shrink-0 transition shadow-xs cursor-pointer"
                      >
                        <span>Use this template</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* Pagination Dots (Matches Enhancv Screenshot) */}
              <div className="mt-8 flex items-center justify-center gap-2.5">
                {templates.map((tpl, idx) => (
                  <button
                    key={tpl.id}
                    type="button"
                    aria-label={`Select ${tpl.category} template`}
                    onClick={() => setActiveTemplateIdx(idx)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      activeTemplateIdx === idx
                        ? 'w-3 h-3 bg-white ring-2 ring-slate-900 scale-110'
                        : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 3 Core Value Props Below Carousel */}
            <div className="mt-14 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">ATS-friendly professionally designed resumes</h4>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Customizable sections, fonts, colors, and backgrounds</h4>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Columns className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Single-column, double-column, and multiple-page layouts</h4>
              </div>
            </div>

            <div className="mt-8">
              <Link 
                href="/templates" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition underline underline-offset-4"
              >
                <span>Browse All 105+ Resume Templates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </section>

        {/* 3. TESTIMONIALS & SOCIAL PROOF (Matches Enhancv Screenshot 3 & 4) */}
        <section className="py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-slate-100">
              <div>
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Social Proof</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
                  Trusted by executives &amp; senior professionals
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-4xl font-black text-slate-950">4.9</div>
                <div>
                  <div className="flex text-emerald-600 text-sm">★★★★★</div>
                  <div className="text-xs text-slate-500 font-medium">5,363 reviews on Reviews.io &amp; Trustpilot</div>
                </div>
              </div>
            </div>

            {/* Featured Quote with Avatar */}
            <div className="mt-12 bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4 flex justify-center">
                <div className="relative w-48 h-56 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                    alt="Senior Executive"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] p-2 rounded-xl text-center font-bold">
                    Gerald &bull; Product Leader
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className="text-2xl text-emerald-600 font-serif">“</div>
                <p className="text-lg sm:text-2xl font-medium text-slate-800 leading-snug">
                  &quot;I can&apos;t afford to waste time applying for jobs that don&apos;t fit. So I stopped mass applying, and I started using TalentRadar to tailor my resume to the roles that actually make sense for me. Landed 3 executive interviews within 2 weeks.&quot;
                </p>
                <div className="pt-2 text-xs font-bold text-slate-500">
                  Gerald &bull; VP of Digital Product
                </div>
              </div>
            </div>

            {/* 4 Review Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {[
                {
                  stars: "★★★★★",
                  quote: "Great tool for improving your CV. Scored my resume against 4 target job descriptions and landed interviews at Stripe and Datadog.",
                  author: "Mark D.",
                  role: "Senior Software Engineer"
                },
                {
                  stars: "★★★★★",
                  quote: "Good AI for writing resumes that match the JD. Fast, accurate, and completely free. The Google X-Y-Z formula bullets are incredible.",
                  author: "Carolyn W.",
                  role: "Lead Product Manager"
                },
                {
                  stars: "★★★★★",
                  quote: "Really swift in all recommendations! The Taleo and Workday compliance check gave me the peace of mind I needed.",
                  author: "Hamza M.",
                  role: "Cloud Architect"
                },
                {
                  stars: "★★★★★",
                  quote: "Great platform that lets you modify or create your CV from scratch in minutes. Clean typography and easy PDF export.",
                  author: "Rositsa K.",
                  role: "Growth Marketing Lead"
                }
              ].map((rev, i) => (
                <Reveal key={i} delay={i * 90}>
                  <div className="lift h-full p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <div className="text-emerald-600 font-bold text-xs">{rev.stars}</div>
                    <p className="text-xs text-slate-700 leading-relaxed">&quot;{rev.quote}&quot;</p>
                    <div className="pt-2 border-t border-slate-100 text-[11px]">
                      <div className="font-bold text-slate-900">{rev.author}</div>
                      <div className="text-slate-400">{rev.role}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

          </div>
        </section>

        {/* 4. RESUMES OPTIMIZED FOR APPLICANT TRACKING SYSTEMS (Matches Enhancv Screenshot 5) */}
        <section className="py-20 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Accordion Column */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">ATS Compliance Engine</span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
                    Resumes optimized for Applicant Tracking Systems (ATS)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                    We test every template against major Applicant Tracking Systems (ATS), so your resume parses cleanly instead of getting garbled on the way in.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    {
                      title: "Readable contact information",
                      content: "Contact info sits in the main body, not in inaccessible headers or footers, so it's fully accessible to machine parsers. We export proper PDFs with a full selectable text layer, not rasterized images."
                    },
                    {
                      title: "Full experience section parsing",
                      content: "Role titles, company names, start/end dates, and accomplishment bullets follow standard hierarchical parsing rules across Taleo, Workday, Greenhouse, and Lever."
                    },
                    {
                      title: "Guaranteed single-layer typography",
                      content: "Zero complex text floating layers or graphic tables that cause older ATS software to scramble columns out of chronological order."
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                      <button
                        onClick={() => setActiveAtsAccordion(activeAtsAccordion === idx ? -1 : idx)}
                        className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between cursor-pointer"
                      >
                        <span>{item.title}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeAtsAccordion === idx ? 'rotate-180' : ''}`} />
                      </button>
                      {activeAtsAccordion === idx && (
                        <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                          {item.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    href="/builder"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition shadow-sm cursor-pointer"
                  >
                    <span>Build an ATS-Friendly Resume</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  </Link>
                </div>
              </div>

              {/* Right Live Visual Simulation */}
              <div className="lg:col-span-6 relative flex justify-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-800">Live Parser Simulation</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      ✓ PARSED 100%
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Extracted Candidate Data:</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span className="text-slate-400">Name:</span> <strong className="text-slate-900">Ellen Johnson</strong></div>
                      <div><span className="text-slate-400">Title:</span> <strong className="text-slate-900">Senior Digital Lead</strong></div>
                      <div><span className="text-slate-400">Email:</span> <span className="text-slate-700">ellen@domain.com</span></div>
                      <div><span className="text-slate-400">Phone:</span> <span className="text-slate-700">+1 (555) 234-5678</span></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5 text-xs">
                    <div className="text-emerald-800 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Experience Hierarchy Verified</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-normal">
                      &quot;Chronological order detected. 4 accomplishment metrics (% and $) successfully mapped to core competencies.&quot;
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 5. DEEP FOREST GREEN METRICS BANNER (Matches Enhancv Screenshot 6) */}
        <section className="py-24 bg-[#0A3A2F] text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Big Numbers */}
              <Reveal variant="left" className="lg:col-span-5 space-y-8">
                <div>
                  <div className="text-5xl sm:text-7xl font-black text-white tracking-tight">
                    <CountUp end={14} duration={1600} suffix="M+" />
                  </div>
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mt-1">Resumes created &amp; optimized</div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-emerald-800/60">
                  <div>
                    <div className="text-3xl font-black text-white">
                      <CountUp end={105} duration={1500} suffix="+" />
                    </div>
                    <div className="text-xs text-emerald-300/80 mt-0.5">ATS-Proof Templates</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white">
                      <CountUp end={98} duration={1500} suffix="%" />
                    </div>
                    <div className="text-xs text-emerald-300/80 mt-0.5">Taleo &amp; Workday Pass Rate</div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-3xl font-black text-white">100% Free</div>
                  <div className="text-xs text-emerald-300/80 mt-0.5">Public Launch Special &bull; Zero Paywalls</div>
                </div>
              </Reveal>

              {/* Right Column: Mission & Editorial Copy */}
              <Reveal variant="right" delay={120} className="lg:col-span-7 space-y-6 text-emerald-100 text-sm sm:text-base leading-relaxed">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Chosen by ambitious job applicants around the world
                </h3>
                <p>
                  TalentRadar combines AI writing, instant ATS feedback, and one-click job tailoring in a single seamless tool. We help job seekers—especially experienced engineers, managers, and executives—lead with their experience and value at every step of the job search.
                </p>
                <p className="text-emerald-200/90 text-xs sm:text-sm">
                  At TalentRadar, we believe the best resumes feel human. We help you create your resume based on your authentic career accomplishments, so it stands out to hiring managers and earns more interviews.
                </p>
                <div className="pt-2">
                  <Link
                    href="/builder"
                    className="btn-shine inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-950 font-black text-xs transition shadow-lg hover:bg-emerald-50 cursor-pointer"
                  >
                    <span>Start Building Your Resume Free</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                  </Link>
                </div>
              </Reveal>

            </div>
          </div>
        </section>

        {/* 6. HOW TALENTRADAR HELPS THE MODERN JOB SEEKER (Matches Enhancv Screenshots 7, 8, 9, 10) */}
        <section id="how-it-works" className="py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Intelligent Features</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950">
                How TalentRadar helps the modern job seeker
              </h2>
            </div>

            {/* FEATURE 1: Sharpen your writing as you type (Matches Screenshot 7 & 8) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  IMPROVE TEXT
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  Sharpen your writing as you type
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Improve Text suggests stronger wording as you write, in whatever role or seniority you target.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 pt-2 font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Get relevant, personalized suggestions based on your responsibilities and skills.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Keep your writing clean and professional with instant spellchecks and action verbs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Quantify accomplishments using the proven Google X-Y-Z formula.</span>
                  </li>
                </ul>
              </div>

              {/* Graphic Mockup with Popups */}
              <div className="lg:col-span-6 bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 relative">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="text-[10px] font-bold text-slate-400">EXPERIENCE &bull; GOOGLE X-Y-Z SUGGESTION</div>
                  <p className="text-xs text-slate-900 font-mono">
                    &quot;Architected high-concurrency order settlement APIs with FastAPI and Redis, slashing dispatch latency by 42% across 2.4M daily transactions.&quot;
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ 100% Quantified with Metric ($/%)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
                  <span className="text-amber-900 font-medium"><strong>Spellcheck:</strong> Did you mean <em>&quot;architected&quot;</em>?</span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-[10px]">Applied</span>
                </div>
              </div>
            </div>

            {/* FEATURE 2: Tailor your resume in one click (Matches Screenshot 9) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 lg:order-2 space-y-4">
                <span className="text-xs font-extrabold text-cyan-700 uppercase tracking-wider bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                  ONE-CLICK TAILORING
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  Tailor your resume in one click
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Paste the job ad, and TalentRadar rewrites your resume to match, with every change highlighted so you stay in total control.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 pt-2 font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>A tailored headline, summary, and key achievements placed in the top third where recruiters look first.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>Bullet rewrites that sharpen your wording without touching your authentic work history.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>Core skills from the role added naturally where they belong.</span>
                  </li>
                </ul>
              </div>

              {/* Graphic Mockup with Tailor Toggles (Screenshot 9) */}
              <div className="lg:col-span-6 lg:order-1 bg-gradient-to-tr from-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl text-white space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-extrabold text-xs text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Tailor to Target Job Description
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1-Click Toggle</span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    "Update professional headline",
                    "Inject missing hard technical skills",
                    "Convert bullets to Google X-Y-Z achievements",
                    "Add action verbs to experience section",
                    "Generate 300-char LinkedIn recruiter pitch"
                  ].map((label, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      <span className="text-slate-200">{label}</span>
                      <span className="w-8 h-4 rounded-full bg-emerald-500 relative flex items-center justify-end pr-0.5">
                        <span className="w-3 h-3 rounded-full bg-white shadow-xs"></span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FEATURE 3: See your ATS score before you apply (Matches Screenshot 10) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  ATS MATCH SCORE
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  See your ATS job match score before you apply
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Paste the job ad, and TalentRadar scores your resume against it the way an applicant tracking system would. Every gap shows up right on your screen with the fix.
                </p>
                <div className="pt-2">
                  <Link
                    href="/ats-scanner"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs transition shadow-sm cursor-pointer"
                  >
                    <span>Test Your ATS Score Free</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
                  </Link>
                </div>
              </div>

              {/* Graphic Mockup ATS Check Widget */}
              <div className="lg:col-span-6 bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      ATS CHECK
                    </span>
                    <span className="text-2xl font-black text-emerald-700">92%</span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-2.5 rounded-full w-[92%]"></div>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <span className="font-bold text-slate-700 block text-[11px]">Key Skills from Target Job Description:</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="text-emerald-700 font-semibold flex items-center gap-1">✓ Python (FastAPI)</div>
                      <div className="text-emerald-700 font-semibold flex items-center gap-1">✓ PostgreSQL &amp; SQL</div>
                      <div className="text-emerald-700 font-semibold flex items-center gap-1">✓ System Architecture</div>
                      <div className="text-rose-600 font-semibold flex items-center gap-1">✗ Missing: Redis Caching</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 7. ONE PLACE TO RUN YOUR ENTIRE JOB SEARCH (Matches Enhancv Screenshot 12) */}
        <section className="py-20 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950">
              One place to build, check, and tailor your resume
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              Most people stitch together three or four disconnected tools. TalentRadar puts live building, ATS checking, and 105+ templates under one roof.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-12 text-left">
              {/* Tool Card 1: Resume Builder */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                    <Palette className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-950">Live Visual CV Builder</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Type directly on your resume canvas with real-time formatting. Rearrange modular sections, customize color themes, and export high-res vector PDFs with zero watermarks.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href="/builder"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition"
                  >
                    <span>Open Resume Builder &rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Tool Card 2: ATS Resume Checker */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-950">ATS Resume Checker</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Upload any resume or paste a job description. Scan for 30+ ATS formatting errors, missing keywords, weak verbs, and quantify your achievements in seconds.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href="/ats-scanner"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-900 transition"
                  >
                    <span>Run Free ATS Diagnostic &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. TALENTRADAR RESEARCH LAB (Matches Enhancv Screenshot 13) */}
        <section className="py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-200">
              <div>
                <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Original Research</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1">
                  The TalentRadar Career Research Lab
                </h2>
              </div>
              <Link href="/guides" className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
                <span>View All Career Studies &rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
              <Link
                href="/guides/ats-resume-optimization-checklist-2026"
                className="group space-y-2 p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition bg-slate-50/40 block"
              >
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  Why 75% of Resumes Fail ATS Parsers: Data from 65,000 Submissions
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We analyzed how Taleo, Workday, and Lever process two-column resumes, complex tables, and missing quantified metrics.
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 pt-1">
                  <span>Read Full Study</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                href="/guides/executive-product-leadership-resume-blueprint"
                className="group space-y-2 p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition bg-slate-50/40 block"
              >
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  The 37-Day Job Search Blueprint: Real Data from 1,890 Hired Candidates
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The exact step-by-step resume tailoring and recruiter outreach strategy candidates used to land high-paying tech and leadership roles.
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 pt-1">
                  <span>Read Full Study</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                href="/guides/software-ai-engineer-resume-guide"
                className="group space-y-2 p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition bg-slate-50/40 block"
              >
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  The Google X-Y-Z Formula Study: How Quantified Bullets Boost Callbacks by 42%
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our analysis of 18,400 software engineering and executive resumes reveals how concrete revenue and latency metrics transform interview rates.
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 pt-1">
                  <span>Read Full Study</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* 9. PUBLIC LAUNCH SPECIAL (Transparent Pricing Card) */}
        <section id="pricing" className="py-24 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Launch Celebration
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 mt-3">
              Everything 100% Free for Launch Members
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base max-w-2xl mx-auto">
              Standard Pro Plan: <strong>$4.99 / month</strong> &mdash; <strong>100% Waived Free</strong> for early adopters during our public launch. No hidden charges, no trials, and no credit card required.
            </p>

            {/* Launch Unlocked Card */}
            <div className="max-w-3xl mx-auto mt-12 bg-slate-950 text-white rounded-3xl p-8 sm:p-12 border-2 border-emerald-400 shadow-2xl relative text-left">
              <span className="absolute -top-4 right-8 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-md">
                100% Unlocked Free
              </span>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">Public Launch Pass</div>
                  <div className="text-4xl sm:text-5xl font-black text-white mt-2 flex items-baseline gap-2">
                    $0 <span className="text-sm text-slate-400 font-normal">/ month forever</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Free lifetime access to our complete AI resume builder and ATS diagnostic tools.
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    Active &bull; Unlimited Access
                  </div>
                </div>
              </div>

              {/* Free Features Grid */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-200 font-medium">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Live Visual CV Builder</strong> with real-time formatting</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Unlimited ATS Resume Scans</strong> against any job description</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Google X-Y-Z Achievement Bullet</strong> generator</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>All 105+ ATS-Optimized CV Templates</strong> unlocked</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Unwatermarked PDF &amp; Plain Text Export</strong></span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Credit Card Required</strong> &bull; Zero Spam Guarantee</span>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link
                  href="/builder"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm text-center transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Build Your Resume Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/ats-scanner"
                  className="text-xs text-emerald-300 hover:text-white transition font-bold text-center sm:text-right"
                >
                  Or test your ATS score without signing up &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 10. FAQ SECTION (Matches Enhancv Screenshot 13) */}
        <section id="faq" className="py-20 bg-white border-b border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl font-extrabold text-slate-950 mt-3">
                Frequently asked questions about TalentRadar
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-5 text-left font-bold text-slate-900 text-sm flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/60 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 11. CLOSING CALL TO ACTION BANNER */}
        <section className="py-20 bg-slate-950 text-white text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Get Started In Minutes
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to Craft an Interview-Winning Resume?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Join thousands of professionals already landing interviews with our free AI resume builder and ATS checker.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-center gap-4">
              <Link
                href="/builder"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Build Your Resume Free</span>
              </Link>
              <Link
                href="/ats-scanner"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition cursor-pointer border border-slate-800"
              >
                <span>Get Your Resume Score</span>
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-sm transition cursor-pointer border border-slate-800"
              >
                <span>105+ Templates</span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <TemplateAuthModal
        isOpen={!!authModalTemplate}
        onClose={() => setAuthModalTemplate(null)}
        templateId={authModalTemplate?.id || 'contemporary'}
        templateName={authModalTemplate?.name || 'ATS-Optimized Template'}
      />

      <Footer />
    </div>
  );
}
