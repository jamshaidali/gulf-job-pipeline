import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '105+ Free ATS-Friendly Resume Templates (2026) | TalentRadar',
  description:
    'Browse 105+ recruiter-approved, ATS-optimized resume templates for software engineers, product managers, executives, and finance professionals. 100% free to customize and download.',
  keywords: [
    'ATS Resume Templates',
    'Free Resume Templates',
    'Software Engineer Resume Template',
    'Executive CV Template',
    'Single Column ATS Resume',
  ],
  alternates: {
    canonical: '/templates',
  },
  openGraph: {
    title: '105+ Free ATS-Friendly Resume Templates | TalentRadar',
    description:
      'Choose from 105+ professionally designed, machine-readable resume templates tested on Workday, Taleo, Greenhouse, and Lever.',
    url: 'https://gulf-job-pipeline.vercel.app/templates',
    siteName: 'TalentRadar',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '105+ Free ATS-Friendly Resume Templates | TalentRadar',
    description:
      'Recruiter-approved single-column and two-column resume templates verified for 100% ATS parsing.',
  },
};

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  const templatesJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '105+ ATS-Optimized Resume Templates',
    description:
      'Curated gallery of recruiter-approved, ATS-friendly resume templates for engineering, product, finance, and executive leadership.',
    url: 'https://gulf-job-pipeline.vercel.app/templates',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(templatesJsonLd) }}
      />
      {children}
    </>
  );
}
