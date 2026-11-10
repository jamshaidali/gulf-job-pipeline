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
              <span className="text-xl font-extrabold text-white tracking-tight">TalentRadar</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Autonomous career intelligence and job finding copilot. Real-time radar across verified engineering roles in Dubai, Abu Dhabi, Riyadh, and Remote Pakistan.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Verified Tech Roles Scouted Daily</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">Product</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/jobs" className="hover:text-white transition">Live Job Radar</Link></li>
              <li><Link href="/#pricing" className="hover:text-white transition">Pricing & Plans</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition">ATS Tailoring Engine</Link></li>
              <li><Link href="/app" className="hover:text-white transition">Kanban CRM Pipeline</Link></li>
            </ul>
          </div>

          {/* Regional Hubs */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">Regional Hubs</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/jobs?region=gulf" className="hover:text-white transition">Dubai & UAE Tech Jobs</Link></li>
              <li><Link href="/jobs?region=gulf" className="hover:text-white transition">Riyadh & Saudi Arabia</Link></li>
              <li><Link href="/jobs?region=pakistan" className="hover:text-white transition">Pakistan & Lahore Tech Hub</Link></li>
              <li><Link href="/jobs?timeFilter=24h" className="hover:text-white transition">Jobs Posted in Past 24h</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            &copy; 2026 TalentRadar AI. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Built with Next.js 14 & FastAPI</span>
            <span>GDPR &amp; Multi-Tenant Isolated</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
