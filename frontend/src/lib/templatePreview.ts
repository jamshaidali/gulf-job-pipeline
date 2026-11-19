import type { CVTemplate } from '@/types';
import type { PreviewData, PreviewLayout, StyleSpec } from '@/components/builder/ResumePreview';

/** Map a catalog layout name to the preview layout (unknown layouts fall back to the classic single column). */
export const asPreviewLayout = (layout: string): PreviewLayout =>
  layout === 'split_header' ||
  layout === 'modern_accent' ||
  layout === 'compact_dense' ||
  layout === 'sidebar_photo' ||
  layout === 'sidebar_light' ||
  layout === 'photo_banner'
    ? layout
    : 'single_column';

export const isDesignerLayout = (layout: string): boolean =>
  layout === 'sidebar_photo' || layout === 'sidebar_light' || layout === 'photo_banner';

export const DESIGNER_NOTE =
  'Designer layout with a photo or sidebar. Great for sharing directly with people; for online applications that run through strict ATS software, choose a single-column template.';

/** Illustrated placeholder portraits (not real people) used to show what the photo layouts look like. */
const SAMPLE_AVATARS = ['/sample-avatars/a1.svg', '/sample-avatars/a2.svg', '/sample-avatars/a3.svg', '/sample-avatars/a4.svg'];
export const samplePhotoFor = (id: string): string => {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SAMPLE_AVATARS[h % SAMPLE_AVATARS.length];
};

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

/** CSS font stack for a catalog font family (the Carlito / Caladea files are loaded from /fonts). */
export const previewFontFamily = (fontFamily: string): string =>
  fontFamily === 'Times-Roman'
    ? 'serif'
    : fontFamily === 'Courier'
    ? 'monospace'
    : fontFamily === 'Carlito'
    ? "'TR Carlito', Calibri, 'Segoe UI', sans-serif"
    : fontFamily === 'Caladea'
    ? "'TR Caladea', Cambria, Georgia, serif"
    : 'sans-serif';

export const isSerifFamily = (fontFamily: string): boolean => fontFamily === 'Times-Roman' || fontFamily === 'Caladea';

/** The builder's font choices -> the CSS font stack (and the exporter's `font` value is the same key). */
export type BuilderFont = 'sans' | 'serif' | 'mono' | 'modern' | 'book';
export const BUILDER_FONT_CSS: Record<BuilderFont, string> = {
  sans: 'sans-serif',
  serif: 'serif',
  mono: 'monospace',
  modern: "'TR Carlito', Calibri, 'Segoe UI', sans-serif",
  book: "'TR Caladea', Cambria, Georgia, serif",
};
export const builderFontFor = (fontFamily: string): BuilderFont =>
  fontFamily === 'Times-Roman' ? 'serif' : fontFamily === 'Courier' ? 'mono' : fontFamily === 'Carlito' ? 'modern' : fontFamily === 'Caladea' ? 'book' : 'sans';

/** Design choices of a template, or null for the original templates (their look follows layout and font). */
export const templateStyle = (tmpl: CVTemplate): Partial<StyleSpec> | null =>
  tmpl.custom_style && tmpl.style ? (tmpl.style as unknown as Partial<StyleSpec>) : null;

const HEADER_LABEL: Record<string, string> = { left: 'Left header', centered: 'Centered header', split: 'Split header', banner: 'Banner header' };
const HEADING_LABEL: Record<string, string> = {
  rule: 'ruled headings',
  band: 'tinted bands',
  bar: 'accent bars',
  underline: 'underlined headings',
  plain: 'plain headings',
};

/** A short, honest description of how a template looks, e.g. "Centered header · tinted bands". */
export const styleTagline = (tmpl: CVTemplate): string => {
  const st = templateStyle(tmpl);
  if (!st || isDesignerLayout(tmpl.layout)) return layoutLabel(tmpl.layout);
  return `${HEADER_LABEL[String(st.header)] || 'Left header'} · ${HEADING_LABEL[String(st.heading)] || 'ruled headings'}`;
};

export const layoutLabel = (layout: string): string =>
  ({
    split_header: 'Banner header',
    modern_accent: 'Accent headings',
    compact_dense: 'Compact, fits more',
    single_column: 'Classic single column',
    sidebar_photo: 'Photo + dark sidebar',
    sidebar_light: 'Photo + light sidebar',
    photo_banner: 'Photo banner',
  })[layout] || 'Classic single column';

/** Realistic, full-page sample content used to show what a template looks like. */
export const SAMPLE_PREVIEW_DATA: PreviewData = {
  fullName: 'Alexander Chen',
  jobTitle: 'Senior Cloud & Backend Architect',
  email: 'alex.chen@email.com',
  phone: '+1 (555) 234-5678',
  location: 'Austin, TX',
  linkedIn: 'linkedin.com/in/alexchen',
  github: 'github.com/alexchen',
  summary:
    'Cloud and backend architect with 8+ years of experience designing high-concurrency microservices and real-time data pipelines on AWS and Kubernetes. Known for cutting latency and cloud costs while mentoring teams and shipping reliable systems at scale.',
  skills: [
    'Python',
    'Go',
    'FastAPI',
    'PostgreSQL',
    'Redis',
    'Kafka',
    'System Design',
    'AWS',
    'Kubernetes',
    'Docker',
    'Terraform',
    'CI/CD',
    'Observability',
    'Technical Leadership',
  ],
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
        'Led weekly architecture reviews and mentored 5 engineers, two of whom were promoted to senior.',
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
        'Introduced Kafka-based event processing that removed nightly batch jobs and reduced data delays from hours to seconds.',
        'Created shared service templates adopted by 14 teams, cutting new-service setup from two weeks to two days.',
      ],
    },
    {
      id: '3',
      company: 'Atlassian',
      position: 'Software Engineer',
      location: 'Austin, TX',
      startDate: '2016',
      endDate: '2019',
      bullets: [
        'Developed REST APIs and background workers in Python serving 1.2M monthly active users.',
        'Raised automated test coverage from 48% to 91%, reducing production incidents by a third.',
      ],
    },
  ],
  educations: [
    {
      id: '1',
      institution: 'Institute of Technology',
      degree: 'B.S. in Computer Science',
      year: '2016',
      honors: 'First Class Honors',
    },
    {
      id: '2',
      institution: 'Cloud Engineering Council',
      degree: 'AWS Certified Solutions Architect, Professional',
      year: '2021',
      honors: '',
    },
  ],
  projects: [
    {
      id: '1',
      title: 'Event Ingestion Engine',
      description: 'Open-source pipeline processing 25,000 events per second with Go and Apache Kafka; 1.8k GitHub stars.',
      techStack: 'Go, Kafka, Redis',
    },
    {
      id: '2',
      title: 'Cost Radar',
      description: 'CLI that flags idle cloud resources and saved teams an average of 18% on monthly AWS bills.',
      techStack: 'Python, AWS, Terraform',
    },
  ],
};
