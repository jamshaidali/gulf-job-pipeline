import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';

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
  title: 'RateYourCV • AI Resume Builder & ATS Resume Checker',
  description: 'Create an ATS-friendly resume in minutes with our AI Resume Writer, Instant ATS Score Checker, 500+ Templates, and One-Click Job Tailoring.',
  keywords: ['AI Resume Builder', 'ATS Resume Checker', 'CV Templates', 'Resume Tailoring', 'ATS Resume Matcher', 'Career Copilot'],
  authors: [{ name: 'RateYourCV Team' }],
  metadataBase: new URL('https://rateyourcv.com'),
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
    title: 'RateYourCV • AI Resume Builder & Instant ATS Checker',
    description: 'Build an interview-winning resume with 500+ resume templates, real-time ATS scoring, and Google X-Y-Z impact bullets.',
    url: 'https://rateyourcv.com',
    siteName: 'RateYourCV',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RateYourCV • AI Resume Builder & Instant ATS Checker',
    description: 'Create an ATS-friendly resume in minutes with AI Resume Writer, ATS Check, and 500+ Templates.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased overflow-x-clip`}>
      <body className="min-h-full flex flex-col font-sans overflow-x-clip selection:bg-indigo-600 selection:text-white">
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
