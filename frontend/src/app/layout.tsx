import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'TalentRadar • AI Resume Builder & ATS Resume Checker',
  description: 'Create an ATS-friendly resume in minutes with our AI Resume Writer, Instant ATS Score Checker, 105+ Templates, and One-Click Job Tailoring.',
  keywords: ['AI Resume Builder', 'ATS Resume Checker', 'CV Templates', 'Resume Tailoring', 'ATS Resume Matcher', 'Career Copilot'],
  authors: [{ name: 'TalentRadar Team' }],
  metadataBase: new URL('https://gulf-job-pipeline.vercel.app'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'TalentRadar • AI Resume Builder & Instant ATS Checker',
    description: 'Build an interview-winning resume with 105+ ATS-verified templates, real-time ATS scoring, and Google X-Y-Z impact bullets.',
    url: 'https://gulf-job-pipeline.vercel.app',
    siteName: 'TalentRadar',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TalentRadar • AI Resume Builder & Instant ATS Checker',
    description: 'Create an ATS-friendly resume in minutes with AI Resume Writer, ATS Check, and 105+ Templates.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased overflow-x-hidden`}>
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
