import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create a Free Account | TalentRadar AI Resume Builder',
  description:
    'Create a free TalentRadar account to unlock all 105+ ATS-friendly resume templates, import existing PDF/DOCX CVs, and download watermark-free PDFs.',
  alternates: {
    canonical: '/register',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
