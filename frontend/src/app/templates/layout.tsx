import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '500+ Free ATS-Friendly Resume Templates (2026) | TalentRadar',
  description:
    'Browse 500+ resume templates, from ATS-safe single-column styles to designer layouts with a photo and sidebar. Free to customize, with PDF and Word download.',
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
    title: '500+ Free ATS-Friendly Resume Templates | TalentRadar',
    description:
      'Choose from 500+ resume templates with real, selectable text: ATS-safe single-column styles and designer layouts with a photo.',
    url: 'https://gulf-job-pipeline.vercel.app/templates',
    siteName: 'TalentRadar',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '500+ Free ATS-Friendly Resume Templates | TalentRadar',
    description:
      'Recruiter-approved single-column and two-column resume templates verified for 100% ATS parsing.',
  },
};

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  const templatesJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '500+ ATS-Optimized Resume Templates',
    description:
      'A gallery of 500+ resume templates, from ATS-safe single-column styles to designer layouts.',
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
