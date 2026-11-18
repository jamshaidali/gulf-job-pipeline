'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, ArrowRight, Menu, X, User, LogOut } from 'lucide-react';
import { fetchCurrentUser } from '@/lib/api';

interface NavbarProps {
  user?: { username: string; full_name?: string } | null;
}

const NAV_LINKS: { href: string; label: string; badge?: string; badgeClass?: string }[] = [
  { href: '/builder', label: 'CV Builder' },
  { href: '/ats-scanner', label: 'ATS Scanner', badge: 'FREE', badgeClass: 'bg-emerald-100 text-emerald-800' },
  { href: '/templates', label: 'Templates' },
  { href: '/guides', label: 'Guides' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authUser, setAuthUser] = useState<{ username: string; full_name?: string } | null>(user || null);

  useEffect(() => {
    if (user) {
      setAuthUser(user);
      return;
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tr_auth_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.username) {
            setAuthUser(parsed);
          }
        } catch {
          // ignore
        }
      }
    }
    fetchCurrentUser()
      .then((u) => {
        if (u) {
          setAuthUser(u);
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'tr_auth_user',
              JSON.stringify({ username: u.username, full_name: u.full_name || u.username })
            );
          }
        }
      })
      .catch(() => {});
  }, [user, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tr_auth_user');
    }
    setAuthUser(null);
    setMobileOpen(false);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  // Compact + shadow once the user scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isActive = (href: string) => !href.includes('#') && pathname === href;
  const activeUser = user || authUser;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.15)]'
          : 'bg-white/70 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-6 transition-all duration-300 ${
          scrolled ? 'h-16' : 'h-[72px]'
        }`}
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="TalentRadar home">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
            <Zap className="w-5 h-5 fill-white" />
            <span className="absolute inset-0 rounded-xl ring-2 ring-emerald-400/0 group-hover:ring-emerald-400/40 transition" />
          </div>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">TalentRadar</span>
            <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none">
              FREE
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-slate-600">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg transition-colors hover:text-slate-950 hover:bg-slate-100/70 ${
                isActive(link.href) ? 'text-slate-950 nav-link-active' : ''
              }`}
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${link.badgeClass}`}>
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {activeUser ? (
            <>
              <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold">
                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="max-w-[110px] truncate">{activeUser.full_name || activeUser.username}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 pl-2 border-l border-emerald-300 text-rose-600 hover:text-rose-800 font-extrabold inline-flex items-center gap-1 cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
              <Link
                href="/builder"
                className="btn-shine hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm transition shadow-sm"
              >
                <span>CV Builder</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold text-slate-800 border border-slate-300 hover:border-slate-900 hover:bg-slate-50 transition"
              >
                Log in
              </Link>
              <Link
                href="/builder"
                className="btn-shine hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm transition shadow-sm shadow-emerald-700/20 hover:shadow-md hover:-translate-y-px"
              >
                <span>Build Resume Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`lg:hidden overflow-hidden border-t border-slate-200/80 bg-white transition-[max-height,opacity] duration-300 ease-out ${
          mobileOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0 border-transparent'
        }`}
      >
        <nav className="px-4 sm:px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{ transitionDelay: mobileOpen ? `${60 + i * 40}ms` : '0ms' }}
              className={`flex items-center justify-between px-3 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-50 transition-all duration-300 ${
                mobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'
              } ${isActive(link.href) ? 'bg-emerald-50 text-emerald-800' : ''}`}
            >
              <span className="flex items-center gap-2">
                {link.label}
                {link.badge && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${link.badgeClass}`}>{link.badge}</span>
                )}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          ))}

          <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-slate-100">
            {activeUser ? (
              <>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-sm cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out ({activeUser.username})</span>
                </button>
                <Link
                  href="/builder"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-[#059669] text-white font-bold text-sm"
                >
                  <span>CV Builder</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-slate-300 text-slate-900 font-bold text-sm"
                >
                  Log in
                </Link>
                <Link
                  href="/builder"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-[#059669] text-white font-bold text-sm"
                >
                  Build Free <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
