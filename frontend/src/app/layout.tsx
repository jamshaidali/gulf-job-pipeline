import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'TalentRadar Pro • AI Career Copilot & Real-Time Job Radar',
  description: 'Automated scouting across high-paying Gulf & Pakistan tech roles. Tailor your resume for ATS, contact decision-makers directly, and track your application pipeline.',
  keywords: ['Gulf Tech Jobs', 'Dubai Software Engineer', 'Saudi Tech Jobs', 'Pakistan Remote Developer', 'ATS Resume Matcher', 'Job Application Copilot'],
  authors: [{ name: 'TalentRadar Team' }],
  metadataBase: new URL('https://talentradar.ai'),
  openGraph: {
    title: 'TalentRadar Pro • AI Career Intelligence & Job Finding Copilot',
    description: 'Instant ATS fit analysis, 1-click recruiter cold outreach, and real-time job radar across Dubai, Riyadh & Pakistan.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
