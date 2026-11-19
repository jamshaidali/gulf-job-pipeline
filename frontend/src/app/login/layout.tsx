import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Your Account | RateYourCV AI Resume Builder',
  description:
    'Sign in to your RateYourCV account to access your saved resumes, ATS scan reports, and 500+ resume templates.',
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
