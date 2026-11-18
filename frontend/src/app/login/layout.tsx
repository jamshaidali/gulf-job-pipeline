import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Your Account | TalentRadar AI Resume Builder',
  description:
    'Sign in to your TalentRadar account to access your saved resumes, ATS scan reports, and 105+ ATS-verified CV templates.',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
