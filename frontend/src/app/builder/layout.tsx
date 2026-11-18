import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free AI Resume Builder & Live Visual CV Editor | TalentRadar',
  description:
    'Build an ATS-friendly resume in minutes with our Live Visual CV Builder. Import existing PDF/DOCX resumes, quantify bullets with Google X-Y-Z metrics, and export watermark-free PDFs.',
  keywords: [
    'AI Resume Builder',
    'Free CV Builder',
    'Live Visual Resume Editor',
    'Import PDF Resume',
    'ATS Friendly Resume Maker',
    'Google XYZ Resume Bullets',
  ],
  alternates: {
    canonical: '/builder',
  },
  openGraph: {
    title: 'Free AI Resume Builder & Live Visual CV Editor | TalentRadar',
    description:
      'Import your PDF/DOCX resume or build from scratch with real-time ATS scoring, AI bullet quantification, and instant PDF export.',
    url: 'https://gulf-job-pipeline.vercel.app/builder',
    siteName: 'TalentRadar',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Resume Builder & Live Visual CV Editor | TalentRadar',
    description:
      'Create an interview-winning, ATS-verified resume in minutes with live visual editing and AI impact bullets.',
  },
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TalentRadar Live AI Resume Builder',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://gulf-job-pipeline.vercel.app/builder',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Real-time split-screen A4 resume editor',
      'Import existing PDF, DOCX, and TXT resumes with auto-fill',
      'Live ATS Health Score calculator',
      'AI Google X-Y-Z bullet point quantifier',
      'Instant watermark-free PDF and Plain Text export',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      {children}
    </>
  );
}
