import type { CVTemplate } from '@/types';
import type { PreviewData, PreviewLayout } from '@/components/builder/ResumePreview';

/** Map a catalog layout name to the preview layout (unknown layouts fall back to the classic single column). */
export const asPreviewLayout = (layout: string): PreviewLayout =>
  layout === 'split_header' || layout === 'modern_accent' || layout === 'compact_dense' ? layout : 'single_column';

const contrastOnWhite = (hex: string): number => {
  const chan = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 1.05 / (0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b) + 0.05);
};

/** Darken a colour until it is readable on white. Mirrors the exporter, so preview colour == printed colour. */
export const readableAccent = (hex: string, minimum = 4.5): string => {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return '#0369a1';
  let [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  let current = hex.toUpperCase();
  for (let i = 0; i < 40 && contrastOnWhite(current) < minimum; i++) {
    r = Math.floor(r * 0.9);
    g = Math.floor(g * 0.9);
    b = Math.floor(b * 0.9);
    current = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  }
  return current;
};

/** The heading / banner colour a catalog template uses by default. */
export const templateAccent = (tmpl: CVTemplate): string => {
  const base = tmpl.layout === 'modern_accent' ? tmpl.colors?.secondary : tmpl.colors?.primary;
  return readableAccent(base || '#0369a1');
};

export const previewFontFamily = (fontFamily: string): string =>
  fontFamily === 'Times-Roman' ? 'serif' : fontFamily === 'Courier' ? 'monospace' : 'sans-serif';

export const layoutLabel = (layout: string): string =>
  ({
    split_header: 'Banner header',
    modern_accent: 'Accent headings',
    compact_dense: 'Compact, fits more',
    single_column: 'Classic single column',
  })[layout] || 'Classic single column';

/** Realistic sample content used to show what a template looks like. */
export const SAMPLE_PREVIEW_DATA: PreviewData = {
  fullName: 'Alexander Chen',
  jobTitle: 'Senior Cloud & Backend Architect',
  email: 'alex.chen@email.com',
  phone: '+1 (555) 234-5678',
  location: 'Austin, TX',
  linkedIn: 'linkedin.com/in/alexchen',
  github: '',
  summary:
    'Cloud and backend architect with 7+ years of experience designing high-concurrency microservices and real-time data pipelines on AWS and Kubernetes.',
  skills: ['Python', 'FastAPI', 'PostgreSQL', 'System Design', 'Kubernetes', 'AWS', 'Docker', 'Redis', 'CI/CD'],
  experiences: [
    {
      id: '1',
      company: 'Stripe',
      position: 'Senior Backend Engineer',
      location: 'Remote',
      startDate: '2022',
      endDate: 'Present',
      bullets: [
        'Architected payment routing APIs in FastAPI and PostgreSQL, cutting p99 latency by 42% across 2.4M daily transactions.',
        'Migrated a monolith to Kubernetes microservices on AWS EKS, saving $140k a year in compute costs.',
        'Mentored 5 engineers and led weekly architecture reviews.',
      ],
    },
    {
      id: '2',
      company: 'Spotify',
      position: 'Backend Software Engineer',
      location: 'Hybrid',
      startDate: '2019',
      endDate: '2022',
      bullets: [
        'Built a real-time catalog search service processing 10k+ updates per minute at 99.98% uptime.',
        'Introduced Kafka-based event processing that removed nightly batch jobs.',
      ],
    },
  ],
  educations: [
    {
      id: '1',
      institution: 'Institute of Technology',
      degree: 'B.S. in Computer Science',
      year: '2019',
      honors: 'First Class Honors',
    },
  ],
  projects: [
    {
      id: '1',
      title: 'Event Ingestion Engine',
      description: 'Open-source pipeline processing 25,000 events per second with Go and Apache Kafka.',
      techStack: 'Go, Kafka, Redis',
    },
  ],
};
