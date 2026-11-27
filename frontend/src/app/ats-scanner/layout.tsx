import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free ATS Resume Checker & Job Match Score Scanner | RateYourCV',
  description:
    'Paste a job description and your resume to see a keyword match estimate, the skills you are missing and formatting issues to fix. Free to use.',
  keywords: [
    'ATS Resume Checker',
    'Free ATS Resume Scanner',
    'Resume Keyword Matcher',
    'Job Description Resume Match',
  ],
  alternates: {
    canonical: '/ats-scanner',
  },
  openGraph: {
    title: 'Free ATS Resume Checker & Job Match Score Scanner | RateYourCV',
    description:
      'Upload your PDF/DOCX resume and paste any job description to get an instant ATS compatibility score, missing keyword checklist, and AI-tailored impact bullets.',
    url: 'https://rateyourcv.com/ats-scanner',
    siteName: 'RateYourCV',
    images: ['/opengraph-image'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image'],
    title: 'Free ATS Resume Checker & Job Match Score Scanner | RateYourCV',
    description:
      'Test your resume against any job description in seconds with our 30-point ATS diagnostic scanner.',
  },
};

export default function ATSScannerLayout({ children }: { children: React.ReactNode }) {
  const scannerJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'RateYourCV Free ATS Resume Scanner',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://rateyourcv.com/ats-scanner',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(scannerJsonLd) }}
      />
      {children}
    </>
  );
}
