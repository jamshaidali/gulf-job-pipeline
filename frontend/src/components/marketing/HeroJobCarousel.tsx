'use client';

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Target,
  Briefcase
} from 'lucide-react';

interface CarouselJob {
  id: string;
  category: string;
  categoryIcon: string;
  title: string;
  company: string;
  location: string;
  monogram: string;
  avatarGradient: string;
  matchScore: number;
  fitVerdict: string;
  tailoredHeadline: string;
  suggestedBullet: string;
  recruiterTitle: string;
}

const CAROUSEL_JOBS: CarouselJob[] = [
  {
    id: 'software',
    category: 'Software Engineering',
    categoryIcon: '💻',
    title: 'Senior Full Stack Engineer',
    company: 'Careem / Uber',
    location: 'Dubai, UAE',
    monogram: 'CR',
    avatarGradient: 'from-indigo-600 via-sky-600 to-cyan-500',
    matchScore: 96,
    fitVerdict: 'Top ATS Fit',
    tailoredHeadline: 'Senior Python & Cloud Architect | Distributed Microservices & High-Scale APIs (6+ Yrs)',
    suggestedBullet: 'Architected high-throughput FastAPI and PostgreSQL order processing pipelines reducing latency by 42%.',
    recruiterTitle: 'Hiring Lead (Core Platform Engineering)',
  },
  {
    id: 'product',
    category: 'Product & FinTech',
    categoryIcon: '🚀',
    title: 'Lead Product Manager (FinTech)',
    company: 'Tamara / Tabby',
    location: 'Riyadh, Saudi Arabia',
    monogram: 'TM',
    avatarGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    matchScore: 94,
    fitVerdict: 'Exceptional Fit',
    tailoredHeadline: 'Senior FinTech Product Leader | Scaling High-Growth BNPL & Consumer Mobile Apps Across MENA',
    suggestedBullet: 'Spearheaded cross-functional squad of 16 engineers to launch 1-click checkout, lifting conversion by 28%.',
    recruiterTitle: 'VP of Digital Product & Experience',
  },
  {
    id: 'ai-data',
    category: 'AI & Data Science',
    categoryIcon: '🧠',
    title: 'AI & Machine Learning Specialist',
    company: 'G42 / Inception',
    location: 'Abu Dhabi, UAE',
    monogram: 'AI',
    avatarGradient: 'from-purple-600 via-violet-600 to-indigo-600',
    matchScore: 98,
    fitVerdict: 'Elite Match',
    tailoredHeadline: 'Applied AI & LLM Systems Engineer | Enterprise RAG Pipelines & High-Performance Deep Learning',
    suggestedBullet: 'Fine-tuned open-source LLMs and built vector search infrastructure serving 50k+ daily queries at sub-100ms latency.',
    recruiterTitle: 'Director of Applied Artificial Intelligence',
  },
  {
    id: 'finance',
    category: 'Finance & Investment',
    categoryIcon: '📈',
    title: 'Senior Financial Analyst & Modeler',
    company: 'Emirates NBD',
    location: 'Dubai, UAE',
    monogram: 'EN',
    avatarGradient: 'from-amber-500 via-orange-600 to-red-500',
    matchScore: 92,
    fitVerdict: 'High Alignment',
    tailoredHeadline: 'Chartered Financial Analyst (CFA) | Corporate Valuation & M&A Financial Modeling ($100M+)',
    suggestedBullet: 'Constructed automated forecasting and DCF models evaluating $140M+ capital investment portfolios across GCC markets.',
    recruiterTitle: 'Group Head of Corporate Finance',
  },
  {
    id: 'growth',
    category: 'Growth & Marketing',
    categoryIcon: '📣',
    title: 'Growth Marketing & Performance Lead',
    company: 'Noon / Chalhoub Group',
    location: 'Dubai, UAE',
    monogram: 'NN',
    avatarGradient: 'from-rose-500 via-pink-600 to-indigo-600',
    matchScore: 95,
    fitVerdict: 'Top ATS Fit',
    tailoredHeadline: 'Omnichannel Growth Strategist | Performance Marketing & CAC Optimization ($2M+ Annual Spend)',
    suggestedBullet: 'Orchestrated multi-channel acquisition campaigns driving 48% YoY customer growth while slashing CAC by 24%.',
    recruiterTitle: 'Head of Regional Growth & Performance',
  },
  {
    id: 'supply-chain',
    category: 'Operations & Supply Chain',
    categoryIcon: '📦',
    title: 'Head of Logistics & Supply Chain',
    company: 'Amazon MENA',
    location: 'Riyadh, Saudi Arabia',
    monogram: 'AZ',
    avatarGradient: 'from-cyan-600 via-blue-600 to-slate-900',
    matchScore: 93,
    fitVerdict: 'Strong Alignment',
    tailoredHeadline: 'Supply Chain Strategist | Last-Mile Fulfillment & Cross-Border Logistics Operations',
    suggestedBullet: 'Streamlined fulfillment center turnaround times by 35% through automated warehouse routing and vendor SLAs.',
    recruiterTitle: 'Director of Regional Operations & Logistics',
  },
];

export default function HeroJobCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedHeadline, setCopiedHeadline] = useState(false);

  // Auto-rotate every 4 seconds unless hovered
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_JOBS.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [isPaused]);

  const currentJob = CAROUSEL_JOBS[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? CAROUSEL_JOBS.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_JOBS.length);
  };

  const copyHeadline = () => {
    navigator.clipboard.writeText(currentJob.tailoredHeadline);
    setCopiedHeadline(true);
    setTimeout(() => setCopiedHeadline(false), 2000);
  };

  return (
    <div 
      className="relative mx-auto max-w-md w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Decorative Blur Rings */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-sky-500/20 rounded-[32px] blur-lg opacity-70 group-hover:opacity-100 transition duration-1000 -z-10" />

      {/* Main Glass Card */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 space-y-4 transition-all duration-300">
        
        {/* Top Control Bar: Category Pill & Carousel Navigation */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-extrabold">
            <span>{currentJob.categoryIcon}</span>
            <span>{currentJob.category}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
              title="Previous profession"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-[10px] font-black text-slate-400 px-1">
              {currentIndex + 1} / {CAROUSEL_JOBS.length}
            </div>

            <button
              onClick={handleNext}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
              title="Next profession"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Header: Monogram Avatar, Title, Location & Match Score */}
        <div className="flex items-start justify-between gap-3 min-h-[58px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentJob.avatarGradient} text-white font-black flex items-center justify-center text-base shadow-sm flex-shrink-0 transition-all duration-500`}>
              {currentJob.monogram}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-950 text-base leading-snug truncate">
                {currentJob.title}
              </h3>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="font-extrabold text-slate-800">{currentJob.company}</span>
                <span>&bull;</span>
                <span className="text-slate-600">{currentJob.location}</span>
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 flex-shrink-0 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{currentJob.matchScore}% Match</span>
          </span>
        </div>

        {/* Tailored Headline Box */}
        <div className="p-3 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-white rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px] block">
              ✨ Tailored ATS Headline:
            </span>
            <button
              onClick={copyHeadline}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center gap-1"
            >
              {copiedHeadline ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedHeadline ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="font-bold text-slate-800 leading-snug line-clamp-2 italic">
            &ldquo;{currentJob.tailoredHeadline}&rdquo;
          </p>
        </div>

        {/* ATS Recommended Bullet */}
        <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs space-y-1">
          <div className="flex items-center justify-between text-amber-900 font-extrabold text-[11px]">
            <span>✍️ Suggested CV Accomplishment Bullet:</span>
            <span className="text-emerald-800 bg-emerald-100 font-bold px-1.5 py-0.2 rounded text-[10px]">
              100% ATS Matched
            </span>
          </div>
          <p className="text-slate-800 text-xs leading-relaxed font-medium">
            &bull; {currentJob.suggestedBullet}
          </p>
        </div>

        {/* Quick Action Preview */}
        <div className="pt-1 flex items-center gap-2">
          <button className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer">
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>1-Click Recruiter Pitch</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/20 text-white font-black">300c</span>
          </button>
          <button className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer">
            📋 ATS Kit
          </button>
        </div>

        {/* Carousel Progress Indicators */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            {CAROUSEL_JOBS.map((j, idx) => (
              <button
                key={j.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 bg-indigo-600'
                    : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Switch to ${j.category}`}
              />
            ))}
          </div>

          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <span>⚡ Showing {currentJob.category}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
