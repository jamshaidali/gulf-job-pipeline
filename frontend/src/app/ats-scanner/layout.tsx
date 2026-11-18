import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free ATS Resume Checker & Job Match Score Scanner | TalentRadar',
  description:
    'Scan your resume against any job description for free. Get an instant 0–100% ATS match score, uncover missing keywords, pass Workday & Taleo filters, and generate tailored bullets.',
  keywords: [
    'ATS Resume Checker',
    'Free ATS Resume Scanner',
    'Resume Keyword Matcher',
    'Job Description Resume Match',
    'Workday Taleo Greenhouse ATS Test',
  ],
  alternates: {
    canonical: '/ats-scanner',
  },
  openGraph: {
    title: 'Free ATS Resume Checker & Job Match Score Scanner | TalentRadar',
    description:
      'Upload your PDF/DOCX resume and paste any job description to get an instant ATS compatibility score, missing keyword checklist, and AI-tailored impact bullets.',
    url: 'https://gulf-job-pipeline.vercel.app/ats-scanner',
    siteName: 'TalentRadar',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free ATS Resume Checker & Job Match Score Scanner | TalentRadar',
    description:
      'Test your resume against any job description in seconds with our 30-point ATS diagnostic scanner.',
  },
};

export default function ATSScannerLayout({ children }: { children: React.ReactNode }) {
  const scannerJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TalentRadar Free ATS Resume Scanner',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://gulf-job-pipeline.vercel.app/ats-scanner',
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
