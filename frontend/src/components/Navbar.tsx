'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';

interface NavbarProps {
  user?: { username: string; full_name?: string } | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 flex items-center justify-center text-white shadow-sm transition group-hover:scale-105">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              TalentRadar
            </span>
            <span className="text-[10px] ml-1.5 font-bold px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">PRO</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <Link href="/#how-it-works" className="hover:text-slate-900 transition">Copilot</Link>
          <Link href="/jobs" className="hover:text-slate-900 transition">Job Radar</Link>
          <Link href="/guides" className="hover:text-slate-900 transition">Career Guides</Link>
          <Link href="/#pricing" className="hover:text-slate-900 transition">Pricing</Link>
          <Link href="/#faq" className="hover:text-slate-900 transition">FAQ</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm transition shadow-sm"
            >
              <span>Go to App Dashboard</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 px-3 py-2 transition"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm transition shadow-sm hover:shadow"
              >
                <span>Join Free</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
