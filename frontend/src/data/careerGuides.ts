export interface CareerGuide {
  slug: string;
  title: string;
  excerpt: string;
  market: string;
  category: string;
  readingTime: string;
  publishedAt: string;
  highlights: string[];
}

export const careerGuides: CareerGuide[] = [
  {
    slug: 'software-ai-engineer-resume-guide',
    title: 'How Software & AI Engineers Craft High-Converting Resumes That Pass Technical Screening',
    excerpt: 'Complete 2026 playbook: In-demand architecture keywords, system design metrics, ATS resume keyword optimization, and avoiding common recruiter rejection traps.',
    market: 'Engineering & AI',
    category: 'Tech Resumes',
    readingTime: '8 min read',
    publishedAt: 'October 2026',
    highlights: [
      'Top 10 highest-impact cloud, AI, and distributed systems keywords',
      'Structuring technical skill matrices for 6-second recruiter scans',
      'Quantifying latency, throughput, and infrastructure cost savings',
      'Why multi-column graphic CVs get filtered out by enterprise ATS bots'
    ]
  },
  {
    slug: 'executive-product-leadership-resume-blueprint',
    title: 'The Executive & Product Leadership Resume Blueprint: Standing Out for VP & Director Roles',
    excerpt: 'How senior leaders and product executives structure P&L ownership, cross-functional org scale, and strategic transformation wins on a crisp 1-to-2 page resume.',
    market: 'Executive & Product',
    category: 'Leadership Strategy',
    readingTime: '7 min read',
    publishedAt: 'October 2026',
    highlights: [
      'Crafting an executive summary that hooks C-suite hiring committees',
      'Highlighting ARR growth, retention lift, and capital efficiency',
      'Balancing strategic vision with hands-on operational execution',
      'How to pair your tailored resume with a 300-char executive pitch'
    ]
  },
  {
    slug: 'ats-resume-optimization-checklist-2026',
    title: 'The 2026 ATS Resume Optimization Checklist (Taleo, Workday, Greenhouse & Lever)',
    excerpt: 'Why 75% of qualified applicants are silently filtered out by applicant tracking systems, and how to format your CV with AI-tailored accomplishment bullets to score 85%+ match rates.',
    market: 'ATS Optimization',
    category: 'ATS & CV Strategy',
    readingTime: '6 min read',
    publishedAt: 'October 2026',
    highlights: [
      'Exact font, layout, and margin rules that pass Workday and Taleo',
      'How to extract high-yield JD keywords and embed them naturally',
      'The Google X-Y-Z metric formula: Transforming duties into quantified wins',
      'Common formatting errors that trigger automated disqualification'
    ]
  }
];
