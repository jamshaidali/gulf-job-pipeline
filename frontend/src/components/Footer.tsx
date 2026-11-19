import React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-sky-400 flex items-center justify-center text-white shadow-sm">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">RateYourCV</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              AI resume builder and ATS scanner. Craft clear, well-structured CVs with templates from ATS-safe single column to designer styles.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Free to use &bull; Create a free account to unlock all 500+ templates</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">CV Products</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/builder" className="hover:text-white transition">Live AI Resume Builder</Link></li>
              <li><Link href="/ats-scanner" className="hover:text-white transition">Free ATS Resume Scanner</Link></li>
              <li><Link href="/templates" className="hover:text-white transition">500+ Resume Templates</Link></li>
              <li><Link href="/#pricing" className="hover:text-white transition">Launch Offer ($0 Free)</Link></li>
            </ul>
          </div>

          {/* Resources & Guides */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">Career Resources</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/guides/software-ai-engineer-resume-guide" className="hover:text-white transition">Engineering &amp; AI Resume Guide</Link></li>
              <li><Link href="/guides/executive-product-leadership-resume-blueprint" className="hover:text-white transition">Executive &amp; Product CV Blueprint</Link></li>
              <li><Link href="/guides/ats-resume-optimization-checklist-2026" className="hover:text-white transition">ATS CV Optimization Checklist</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition">Frequently Asked Questions</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            &copy; 2026 RateYourCV AI. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Built with Next.js 16 &amp; FastAPI</span>
            <span>GDPR &amp; Multi-Tenant Isolated</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
