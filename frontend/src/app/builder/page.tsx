'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TemplateAuthModal from '@/components/TemplateAuthModal';
import TemplateGalleryModal from '@/components/dashboard/TemplateGalleryModal';
import { CVTemplate } from '@/types';
import { fetchCurrentUser, fetchCVTemplates, importCvToBuilder, exportCustomAtsCv, ImportedStructuredResume } from '@/lib/api';
import ResumePreview, { PreviewLayout } from '@/components/builder/ResumePreview';
import { 
  Sparkles, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ArrowRight, 
  RotateCcw, 
  Sliders, 
  ShieldCheck, 
  Eye, 
  Printer, 
  Share2, 
  ExternalLink,
  ChevronDown,
  Layers,
  Palette,
  Type,
  Upload,
  FileUp,
  X,
  Lock,
  LogOut,
  User,
  History
} from 'lucide-react';

type BuilderTemplateId = 'tech_two_column' | 'minimalist' | 'executive' | 'compact' | 'classic_serif';

const BUILDER_TEMPLATES: Array<{
  id: BuilderTemplateId;
  name: string;
  shortName: string;
  tag: string;
  atsScore: string;
  accent: string;
  description: string;
}> = [
  {
    id: 'tech_two_column',
    name: 'Modern Tech (2-Column)',
    shortName: 'Modern Tech',
    tag: '1-Column Accent',
    atsScore: '100% ATS',
    accent: '#0369a1',
    description: 'Modern single-column layout with accent headings for Software, Cloud, Data & Product roles.',
  },
  {
    id: 'minimalist',
    name: 'ATS Minimalist Clean',
    shortName: 'ATS Minimalist',
    tag: '1-Column Standard',
    atsScore: '100% ATS',
    accent: '#0f172a',
    description: 'Ultra-clean single-column hierarchy built for strict Workday & Taleo parsers.',
  },
  {
    id: 'executive',
    name: 'Executive Leadership Pro',
    shortName: 'Executive',
    tag: 'Banner Header',
    atsScore: '99% ATS',
    accent: '#059669',
    description: 'Commanding header banner for Directors, VPs, Managers & Senior Leads.',
  },
  {
    id: 'compact',
    name: 'Engineering Compact',
    shortName: 'Tech Compact',
    tag: 'Dense 1-Page',
    atsScore: '100% ATS',
    accent: '#6366f1',
    description: 'High-density layout that fits 10+ years of experience on a single A4 page.',
  },
  {
    id: 'classic_serif',
    name: 'Classic Academic & Finance',
    shortName: 'Classic Serif',
    tag: 'Editorial Serif',
    atsScore: '99% ATS',
    accent: '#d97706',
    description: 'Timeless editorial typography for Finance, Consulting, Legal & Research.',
  },
];

interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  year: string;
  honors: string;
}

interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  techStack: string;
}

/** The 5 quick layouts: the catalog template (layout) each one exports with, and its default font. */
const QUICK_LAYOUTS: Record<BuilderTemplateId, { backendId: string; layout: PreviewLayout; font?: 'sans' | 'serif' }> = {
  tech_two_column: { backendId: 'saudi_vision_emerald', layout: 'modern_accent' },
  minimalist: { backendId: 'silicon_tech_indigo', layout: 'single_column' },
  executive: { backendId: 'gulf_dubai_sapphire', layout: 'split_header' },
  compact: { backendId: 'backend_architect_dark', layout: 'compact_dense' },
  classic_serif: { backendId: 'abu_dhabi_executive', layout: 'single_column', font: 'serif' },
};

const asPreviewLayout = (layout: string): PreviewLayout =>
  layout === 'split_header' || layout === 'modern_accent' || layout === 'compact_dense' ? layout : 'single_column';

/** Which quick-layout chip best describes a catalog template (used only to highlight a chip). */
const quickIdFor = (layout: string, fontFamily: string): BuilderTemplateId => {
  if (layout === 'split_header') return 'executive';
  if (layout === 'compact_dense') return 'compact';
  if (layout === 'modern_accent') return 'tech_two_column';
  return fontFamily === 'Times-Roman' ? 'classic_serif' : 'minimalist';
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
const readableAccent = (hex: string, minimum = 4.5): string => {
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

/** A CV the user imported. Kept in the browser so resetting to the demo never destroys it. */
interface SavedCv {
  id: string;
  name: string;
  savedAt: number;
  resume: ImportedStructuredResume;
}

const CV_LIBRARY_KEY = 'tr_builder_cv_library';
const MAX_SAVED_CVS = 5;
const SAMPLE_CV_NAME = 'Sample_Senior_Engineer_CV.pdf';
/** Autosave names that mean "demo content", not a CV the user uploaded. */
const NON_LIBRARY_NAMES = [SAMPLE_CV_NAME, 'Live_Edited_Resume.pdf'];

const newCvId = () => `cv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const readCvLibrary = (): SavedCv[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CV_LIBRARY_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((c) => c && typeof c.id === 'string' && typeof c.name === 'string' && c.resume).slice(0, MAX_SAVED_CVS)
      : [];
  } catch {
    return [];
  }
};

const writeCvLibrary = (list: SavedCv[]) => {
  try {
    localStorage.setItem(CV_LIBRARY_KEY, JSON.stringify(list.slice(0, MAX_SAVED_CVS)));
  } catch {
    // Storage full or blocked: the CV is still in the editor, just not in the library.
  }
};

/** Friendly label: pasted text has no real file name, so use the person's name instead. */
const cvLabel = (cv: SavedCv) =>
  /^pasted_resume/i.test(cv.name) ? `${cv.resume.fullName || 'Pasted resume'} (pasted text)` : cv.name;

const timeAgo = (ts: number) => {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} d ago`;
};

/** Join only the non-empty parts, so empty fields never leave dangling separators. */
const joinParts = (parts: Array<string | undefined | null>, sep = ' \u2022 ') =>
  parts.map((p) => (p || '').trim()).filter(Boolean).join(sep);

/**
 * Turn an imported resume into a COMPLETE set of builder fields. Anything the import does not
 * contain becomes blank, so values from a previously loaded CV or the demo never mix into it.
 */
function resumeToFields(res: ImportedStructuredResume) {
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  return {
    fullName: str(res.fullName),
    jobTitle: str(res.jobTitle),
    email: str(res.email),
    phone: str(res.phone),
    location: str(res.location),
    linkedIn: str(res.linkedIn),
    github: str(res.github),
    summary: str(res.summary),
    skills: Array.isArray(res.skills) ? res.skills : [],
    experiences:
      Array.isArray(res.experiences) && res.experiences.length > 0
        ? res.experiences
        : [{ id: '1', company: '', position: '', location: '', startDate: '', endDate: '', bullets: [''] }],
    educations:
      Array.isArray(res.educations) && res.educations.length > 0
        ? res.educations
        : [{ id: '1', institution: '', degree: '', year: '', honors: '' }],
    projects: Array.isArray(res.projects) ? res.projects : [],
  };
}

/** Textarea that always fits its content (re-measured on edit, resize and font load). */
function AutoGrowTextarea({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (val: string) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const fit = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useEffect(() => {
    fit();
  }, [value, fit]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, [fit]);
  return (
    <textarea
      ref={ref}
      rows={2}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2.5 pr-9 rounded-lg border border-slate-300 bg-white text-sm leading-relaxed resize-none overflow-hidden"
    />
  );
}

export default function ResumeBuilderPage() {
  // Resume Content State
  const [fullName, setFullName] = useState<string>('Alexander Chen');
  const [jobTitle, setJobTitle] = useState<string>('Senior Cloud & Backend Architect');
  const [email, setEmail] = useState<string>('alex.chen@email.com');
  const [phone, setPhone] = useState<string>('+1 (555) 234-5678');
  const [location, setLocation] = useState<string>('Open to Remote & Hybrid');
  const [linkedIn, setLinkedIn] = useState<string>('linkedin.com/in/alexchen-cloud');
  const [github, setGithub] = useState<string>('github.com/alexchen-arch');

  const [summary, setSummary] = useState<string>(
    'High-performance Cloud & Backend Architect with 7+ years of experience designing high-concurrency microservices, distributed systems, and real-time data pipelines. Proven record deploying resilient infrastructure on AWS & Kubernetes for high-scale enterprise platforms.'
  );

  const [skills, setSkills] = useState<string[]>([
    'Python', 'FastAPI', 'PostgreSQL', 'System Design', 'Kubernetes (EKS)', 'AWS Architecture', 'Docker', 'Redis Caching', 'CI/CD Pipelines', 'Microservices'
  ]);
  const [newSkill, setNewSkill] = useState<string>('');

  const [experiences, setExperiences] = useState<ExperienceEntry[]>([
    {
      id: '1',
      company: 'Stripe',
      position: 'Senior Backend Engineer (Platform Infrastructure)',
      location: 'Remote',
      startDate: '2022',
      endDate: 'Present',
      bullets: [
        'Architected high-throughput order settlement and payment routing APIs in FastAPI and PostgreSQL, slashing p99 latency by 42% across 2.4M daily transactions.',
        'Migrated monolithic backend to containerized Kubernetes microservices on AWS EKS, improving fault isolation and saving $140k in annual cloud compute costs.',
        'Spearheaded automated Redis caching tier and distributed locking, decreasing database connection contention during peak traffic.'
      ]
    },
    {
      id: '2',
      company: 'Spotify',
      position: 'Backend Software Engineer',
      location: 'Hybrid',
      startDate: '2020',
      endDate: '2022',
      bullets: [
        'Designed real-time catalog search and streaming metadata syncing service processing 10k+ updates per minute with 99.98% uptime.',
        'Implemented asynchronous message-driven queues with Kafka and RabbitMQ to decouple event processing from notification dispatchers.'
      ]
    }
  ]);

  const [educations, setEducations] = useState<EducationEntry[]>([
    {
      id: '1',
      institution: 'Top Institute of Technology',
      degree: 'B.S. in Computer Science',
      year: '2019',
      honors: 'First Class Honors (GPA: 3.8/4.0)'
    }
  ]);

  const [projects, setProjects] = useState<ProjectEntry[]>([
    {
      id: '1',
      title: 'High-Throughput Order Ingestion Engine',
      description: 'Open-source distributed pipeline processing 25,000 events/second using Go and Apache Kafka.',
      techStack: 'Go, Kafka, Redis, Docker'
    }
  ]);

  // Design System States
  const [template, setTemplate] = useState<BuilderTemplateId>('tech_two_column');
  const [accentColor, setAccentColor] = useState<string>('#0369a1'); // Sky blue (AA contrast on white)
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authUsername, setAuthUsername] = useState<string | null>(null);
  const [authModalTemplate, setAuthModalTemplate] = useState<{
    id: BuilderTemplateId;
    name: string;
    /** Set when the visitor arrived with a specific catalog template (?template=...). */
    catalog?: CVTemplate;
  } | null>(null);
  const [atsScanContext, setAtsScanContext] = useState<{
    overallScore?: number;
    missingHardSkills: string[];
    missingSoftSkills: string[];
    tailoredHeadline: string;
    tailoredSummary: string;
    tailoredBullets: Array<{ focus: string; bullet: string }>;
    targetJobTitle: string;
    targetCompany: string;
  } | null>(null);

  // Library of the user's imported CVs (kept in the browser) and which one is being edited now.
  // Template state. The catalog template decides the layout of the preview AND of the downloaded file;
  // accent colour and font are the user's overrides and are applied to both.
  const [activeBackendTemplateId, setActiveBackendTemplateId] = useState<string>(QUICK_LAYOUTS.tech_two_column.backendId);
  const [activeLayout, setActiveLayout] = useState<PreviewLayout>('modern_accent');
  const [activeTemplateLabel, setActiveTemplateLabel] = useState<string | null>(null);

  /** Use a catalog template (from the gallery or ?template=): layout, font and colour follow it. */
  const applyBackendTemplate = (tmpl: CVTemplate) => {
    setActiveBackendTemplateId(tmpl.id);
    setActiveLayout(asPreviewLayout(tmpl.layout));
    setActiveTemplateLabel(tmpl.name);
    setTemplate(quickIdFor(tmpl.layout, tmpl.font_family));
    setFontFamily(tmpl.font_family === 'Times-Roman' ? 'serif' : 'sans');
    const base = tmpl.layout === 'modern_accent' ? tmpl.colors?.secondary : tmpl.colors?.primary;
    if (base) setAccentColor(readableAccent(base));
  };

  /** Switch to one of the 5 quick layouts. */
  const applyQuickLayout = (id: BuilderTemplateId) => {
    const quick = QUICK_LAYOUTS[id];
    setTemplate(id);
    setActiveBackendTemplateId(quick.backendId);
    setActiveLayout(quick.layout);
    setActiveTemplateLabel(null);
    if (quick.font) setFontFamily(quick.font);
    else if (fontFamily === 'serif') setFontFamily('sans');
  };

  const [savedCvs, setSavedCvs] = useState<SavedCv[]>([]);
  const [activeCvId, setActiveCvId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      let library: SavedCv[] = [];
      if (typeof window !== 'undefined') {
        library = readCvLibrary();
        setSavedCvs(library);
        const rawStoredCv =
          sessionStorage.getItem('tr_builder_imported_cv') ||
          localStorage.getItem('tr_builder_imported_cv');
        if (rawStoredCv) {
          try {
            const parsedPayload = JSON.parse(rawStoredCv);
            if (parsedPayload && parsedPayload.resume) {
              const res: ImportedStructuredResume = parsedPayload.resume;
              const srcName: string = parsedPayload.filename || 'Uploaded_Resume.pdf';
              const f = resumeToFields(res);
              setFullName(f.fullName);
              setJobTitle(f.jobTitle);
              setEmail(f.email);
              setPhone(f.phone);
              setLocation(f.location);
              setLinkedIn(f.linkedIn);
              setGithub(f.github);
              setSummary(f.summary);
              setSkills(f.skills);
              setExperiences(f.experiences);
              setEducations(f.educations);
              setProjects(f.projects);
              setLastImportedFile(srcName);

              // Re-attach to the library entry being edited. A CV saved before the library existed
              // (or arriving from the ATS scanner) is added to it, so it can always be switched back to.
              let restoredId: string | null =
                typeof parsedPayload.cvId === 'string' && library.some((c) => c.id === parsedPayload.cvId)
                  ? parsedPayload.cvId
                  : null;
              if (!restoredId && !NON_LIBRARY_NAMES.includes(srcName)) {
                const entry: SavedCv = { id: newCvId(), name: srcName, savedAt: Date.now(), resume: f as ImportedStructuredResume };
                library = [entry, ...library].slice(0, MAX_SAVED_CVS);
                writeCvLibrary(library);
                setSavedCvs(library);
                restoredId = entry.id;
              }
              setActiveCvId(restoredId);

              if (parsedPayload.atsContext) {
                setAtsScanContext(parsedPayload.atsContext);
              }

              const urlParams = new URLSearchParams(window.location.search);
              if (urlParams.get('from') === 'ats-scanner') {
                setCopiedNotification(
                  `Loaded "${srcName}" from ATS Scanner — Auto-filled Name, ${res.experiences?.length || 1} Roles, Education & ${res.skills?.length || 0} Skills!`
                );
                setTimeout(() => setCopiedNotification(null), 4000);
              }
            }
          } catch {
            // Ignore malformed storage
          }
        }
      }

      let authed = false;
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('tr_auth_user');
        if (storedUser) {
          authed = true;
          setIsAuthenticated(true);
          try {
            const parsedUser = JSON.parse(storedUser);
            setAuthUsername(parsedUser?.full_name || parsedUser?.username || 'Account');
          } catch {
            setAuthUsername('Account');
          }
        }
      }
      try {
        const user = await fetchCurrentUser();
        if (user) {
          authed = true;
          setIsAuthenticated(true);
          setAuthUsername(user.full_name || user.username || 'Account');
        }
      } catch {
        // Ignore
      }

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (
          tabParam === 'basics' ||
          tabParam === 'summary' ||
          tabParam === 'experience' ||
          tabParam === 'skills' ||
          tabParam === 'education' ||
          tabParam === 'projects'
        ) {
          setActiveTab(tabParam);
        }
        const accentParam = params.get('accent');
        if (accentParam && /^#[0-9a-fA-F]{3,8}$/.test(accentParam)) {
          setAccentColor(accentParam);
        }
        const tplParam = params.get('template');
        if (tplParam) {
          const quickId = (Object.keys(QUICK_LAYOUTS) as BuilderTemplateId[]).find((id) => id === tplParam);
          if (quickId) {
            if (authed) {
              applyQuickLayout(quickId);
            } else {
              setAuthModalTemplate({ id: quickId, name: BUILDER_TEMPLATES.find((t) => t.id === quickId)?.name || 'ATS-Optimized Template' });
            }
          } else {
            // A catalog template id (e.g. from the Templates page): look it up so layout, font and colour follow it.
            try {
              const res = await fetchCVTemplates();
              const found = (res.templates || []).find((t) => t.id === tplParam);
              if (found) {
                if (authed) {
                  applyBackendTemplate(found);
                } else {
                  setAuthModalTemplate({ id: quickIdFor(found.layout, found.font_family), name: found.name, catalog: found });
                }
              }
            } catch {
              // Catalog unavailable: keep the default layout.
            }
          }
        }
      }
    };
    init();
  }, []);

  const handleSelectTemplate = (targetTpl: BuilderTemplateId, displayName: string) => {
    if (isAuthenticated || (typeof window !== 'undefined' && localStorage.getItem('tr_auth_user'))) {
      applyQuickLayout(targetTpl);
      showNotice(`Switched layout to ${displayName}!`);
    } else {
      setAuthModalTemplate({ id: targetTpl, name: displayName });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tr_auth_user');
    }
    setIsAuthenticated(false);
    setAuthUsername(null);
    showNotice('Signed out — Templates are now locked behind free signup.');
  };

  // Active Editor Tab
  const [activeTab, setActiveTab] = useState<'basics' | 'summary' | 'experience' | 'skills' | 'education' | 'projects'>('experience');
  const [hasManualEdits, setHasManualEdits] = useState<boolean>(false);

  // Import Existing Resume (PDF / DOCX / TXT) States
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importText, setImportText] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [lastImportedFile, setLastImportedFile] = useState<string | null>(null);

  // Live Autosave when user edits fields or has an imported CV active
  useEffect(() => {
    if (!hasManualEdits && !lastImportedFile) return;
    if (typeof window === 'undefined') return;
    const payload = JSON.stringify({
      filename: lastImportedFile || 'Live_Edited_Resume.pdf',
      cvId: activeCvId,
      resume: {
        fullName,
        jobTitle,
        email,
        phone,
        location,
        linkedIn,
        github,
        summary,
        skills,
        experiences,
        educations,
        projects,
      },
      atsContext: atsScanContext,
      timestamp: Date.now(),
    });
    localStorage.setItem('tr_builder_imported_cv', payload);
    sessionStorage.setItem('tr_builder_imported_cv', payload);
  }, [
    activeCvId,
    hasManualEdits,
    lastImportedFile,
    fullName,
    jobTitle,
    email,
    phone,
    location,
    linkedIn,
    github,
    summary,
    skills,
    experiences,
    educations,
    projects,
    atsScanContext,
  ]);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Keep the active CV's library entry in sync with the user's edits, so switching away never loses work.
  useEffect(() => {
    if (!activeCvId) return;
    const current = { fullName, jobTitle, email, phone, location, linkedIn, github, summary, skills, experiences, educations, projects };
    setSavedCvs((prev) => {
      const entry = prev.find((c) => c.id === activeCvId);
      if (!entry || JSON.stringify(entry.resume) === JSON.stringify(current)) return prev;
      const next = prev.map((c) =>
        c.id === activeCvId ? { ...c, resume: current as ImportedStructuredResume, savedAt: Date.now() } : c
      );
      writeCvLibrary(next);
      return next;
    });
  }, [activeCvId, fullName, jobTitle, email, phone, location, linkedIn, github, summary, skills, experiences, educations, projects]);

  const applyImportedResume = (res: ImportedStructuredResume, sourceName: string, opts?: { sample?: boolean }) => {
    const f = resumeToFields(res);
    setFullName(f.fullName);
    setJobTitle(f.jobTitle);
    setEmail(f.email);
    setPhone(f.phone);
    setLocation(f.location);
    setLinkedIn(f.linkedIn);
    setGithub(f.github);
    setSummary(f.summary);
    setSkills(f.skills);
    setExperiences(f.experiences);
    setEducations(f.educations);
    setProjects(f.projects);

    // Importing never discards the CV being edited: it already lives in the library. A real upload
    // becomes the newest library entry; the demo sample is shown but not added to it.
    let newActiveId: string | null = null;
    if (!opts?.sample) {
      const entry: SavedCv = { id: newCvId(), name: sourceName, savedAt: Date.now(), resume: f as ImportedStructuredResume };
      const nextLibrary = [entry, ...savedCvs].slice(0, MAX_SAVED_CVS);
      writeCvLibrary(nextLibrary);
      setSavedCvs(nextLibrary);
      newActiveId = entry.id;
    }
    setActiveCvId(newActiveId);

    setLastImportedFile(sourceName);
    if (typeof window !== 'undefined') {
      const payload = JSON.stringify({
        filename: sourceName,
        cvId: newActiveId,
        resume: res,
        atsContext: atsScanContext,
        timestamp: Date.now(),
      });
      localStorage.setItem('tr_builder_imported_cv', payload);
      sessionStorage.setItem('tr_builder_imported_cv', payload);
    }
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportText('');
    setImportError(null);
    showNotice(
      `Imported "${sourceName}" — Auto-filled Name, ${res.experiences?.length || 1} Roles, Education & ${res.skills?.length || 0} Skills!`
    );
  };

  const handleQuickFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const result = await importCvToBuilder({ file: selected });
      applyImportedResume(result.resume, result.filename || selected.name);
    } catch (err: any) {
      setImportError(err.message || 'Could not import resume file.');
      setIsImportModalOpen(true);
    } finally {
      setIsImporting(false);
      if (quickFileInputRef.current) {
        quickFileInputRef.current.value = '';
      }
    }
  };

  const handleModalImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);

    if (importMode === 'file' && !importFile) {
      setImportError('Please select a PDF, DOCX, or TXT resume file to import.');
      return;
    }
    if (importMode === 'paste' && !importText.trim()) {
      setImportError('Please paste your resume text to auto-fill the builder.');
      return;
    }

    setIsImporting(true);
    try {
      const result = await importCvToBuilder(
        importMode === 'file' ? { file: importFile! } : { cvText: importText }
      );
      applyImportedResume(result.resume, result.filename);
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse resume. Please try another file or paste text.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportSampleDemo = async () => {
    setImportError(null);
    setIsImporting(true);
    try {
      const result = await importCvToBuilder({ useSample: true });
      applyImportedResume(result.resume, SAMPLE_CV_NAME, { sample: true });
    } catch (err: any) {
      setImportError(err.message || 'Failed to import sample resume.');
    } finally {
      setIsImporting(false);
    }
  };

  // Measure the sticky header so each pane can fill exactly the remaining viewport height.
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(80);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderHeight(Math.ceil(el.getBoundingClientRect().height));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set());

  const handleSwitchToSavedCv = (id: string) => {
    const target = savedCvs.find((c) => c.id === id);
    if (!target) return;
    const f = resumeToFields(target.resume);
    setFullName(f.fullName);
    setJobTitle(f.jobTitle);
    setEmail(f.email);
    setPhone(f.phone);
    setLocation(f.location);
    setLinkedIn(f.linkedIn);
    setGithub(f.github);
    setSummary(f.summary);
    setSkills(f.skills);
    setExperiences(f.experiences);
    setEducations(f.educations);
    setProjects(f.projects);
    setActiveCvId(id);
    setLastImportedFile(target.name);
    setAtsScanContext(null);
    setActiveTab('basics');
    showNotice(`Switched to your CV "${cvLabel(target)}".`);
  };

  const handleDeleteSavedCv = (id: string) => {
    const target = savedCvs.find((c) => c.id === id);
    if (!target) return;
    if (typeof window !== 'undefined' && !window.confirm(`Remove "${cvLabel(target)}" from your saved CVs? This can't be undone.`)) return;
    const next = savedCvs.filter((c) => c.id !== id);
    writeCvLibrary(next);
    setSavedCvs(next);
    if (activeCvId === id) {
      setActiveCvId(null);
      setLastImportedFile(null);
    }
    showNotice(`Removed "${cvLabel(target)}" from your saved CVs.`);
  };

  const handleStartFromScratch = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tr_builder_imported_cv');
      sessionStorage.removeItem('tr_builder_imported_cv');
    }
    const leavingCv = savedCvs.find((c) => c.id === activeCvId);
    setActiveCvId(null);
    setHasManualEdits(false);
    setLastImportedFile(null);
    setAtsScanContext(null);
    setImportFile(null);
    setImportText('');
    setImportError(null);
    if (quickFileInputRef.current) {
      quickFileInputRef.current.value = '';
    }

    setFullName('');
    setJobTitle('');
    setEmail('');
    setPhone('');
    setLocation('');
    setLinkedIn('');
    setGithub('');
    setSummary('');
    setSkills([]);
    setExperiences([
      {
        id: '1',
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        bullets: [''],
      },
    ]);
    setEducations([
      {
        id: '1',
        institution: '',
        degree: '',
        year: '',
        honors: '',
      },
    ]);
    setProjects([]);
    setActiveTab('basics');
    showNotice(
      leavingCv
        ? `Blank resume ready. Your CV "${cvLabel(leavingCv)}" is saved — switch back from "Your saved CVs".`
        : 'Blank resume ready — start building from scratch!'
    );
  };

  const handleResetToDefaultTemplate = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tr_builder_imported_cv');
      sessionStorage.removeItem('tr_builder_imported_cv');
    }
    const leavingCv = savedCvs.find((c) => c.id === activeCvId);
    setActiveCvId(null);
    setHasManualEdits(false);
    setLastImportedFile(null);
    setAtsScanContext(null);
    setImportFile(null);
    setImportText('');
    setImportError(null);
    if (quickFileInputRef.current) {
      quickFileInputRef.current.value = '';
    }

    setFullName('Alexander Chen');
    setJobTitle('Senior Cloud & Backend Architect');
    setEmail('alex.chen@email.com');
    setPhone('+1 (555) 234-5678');
    setLocation('Open to Remote & Hybrid');
    setLinkedIn('linkedin.com/in/alexchen-cloud');
    setGithub('github.com/alexchen-arch');
    setSummary(
      'High-performance Cloud & Backend Architect with 7+ years of experience designing high-concurrency microservices, distributed systems, and real-time data pipelines. Proven record deploying resilient infrastructure on AWS & Kubernetes for high-scale enterprise platforms.'
    );
    setSkills([
      'Python',
      'FastAPI',
      'PostgreSQL',
      'System Design',
      'Kubernetes (EKS)',
      'AWS Architecture',
      'Docker',
      'Redis Caching',
      'CI/CD Pipelines',
      'Microservices',
    ]);
    setExperiences([
      {
        id: '1',
        company: 'Stripe',
        position: 'Senior Backend Engineer (Platform Infrastructure)',
        location: 'Remote',
        startDate: '2022',
        endDate: 'Present',
        bullets: [
          'Architected high-throughput order settlement and payment routing APIs in FastAPI and PostgreSQL, slashing p99 latency by 42% across 2.4M daily transactions.',
          'Migrated monolithic backend to containerized Kubernetes microservices on AWS EKS, improving fault isolation and saving $140k in annual cloud compute costs.',
          'Spearheaded automated Redis caching tier and distributed locking, decreasing database connection contention during peak traffic.',
        ],
      },
      {
        id: '2',
        company: 'Spotify',
        position: 'Backend Software Engineer',
        location: 'Hybrid',
        startDate: '2020',
        endDate: '2022',
        bullets: [
          'Designed real-time catalog search and streaming metadata syncing service processing 10k+ updates per minute with 99.98% uptime.',
          'Implemented asynchronous message-driven queues with Kafka and RabbitMQ to decouple event processing from notification dispatchers.',
        ],
      },
    ]);
    setEducations([
      {
        id: '1',
        institution: 'Top Institute of Technology',
        degree: 'B.S. in Computer Science',
        year: '2019',
        honors: 'First Class Honors (GPA: 3.8/4.0)',
      },
    ]);
    setProjects([
      {
        id: '1',
        title: 'High-Throughput Order Ingestion Engine',
        description:
          'Open-source distributed pipeline processing 25,000 events/second using Go and Apache Kafka.',
        techStack: 'Go, Kafka, Redis, Docker',
      },
    ]);
    showNotice(
      leavingCv
        ? `Showing the demo. Your CV "${cvLabel(leavingCv)}" is saved — switch back from "Your saved CVs".`
        : 'Reset resume back to default sample template!'
    );
  };

  // Calculate Real-time ATS Health Score
  const calculateATSScore = () => {
    let score = 50;
    if (fullName && email && phone) score += 10;
    if (summary.length > 80) score += 10;
    if (experiences.length >= 1) score += 10;
    if (skills.length >= 6) score += 10;
    if (educations.length >= 1) score += 5;
    // Check for quantified metrics (% or numbers or $)
    const allBullets = experiences.flatMap(e => e.bullets).join(' ');
    if (/[0-9]+%|\$[0-9]+|[0-9]+k/i.test(allBullets)) score += 5;
    return Math.min(score, 100);
  };

  const atsScore = calculateATSScore();

  // AI Helpers
  const handleEnhanceBullet = (expIndex: number, bulletIndex: number) => {
    const current = experiences[expIndex].bullets[bulletIndex];
    let improved = current;
    if (!/[0-9]+%/.test(current)) {
      improved = current.replace(/\.$/, '') + ', accelerating processing throughput by 38% and reducing error rates.';
    } else {
      improved = 'Engineered and optimized ' + current.charAt(0).toLowerCase() + current.slice(1);
    }
    const updated = [...experiences];
    updated[expIndex].bullets[bulletIndex] = improved;
    setExperiences(updated);
    showNotice('Bullet point enhanced with Google X-Y-Z metrics!');
  };

  const handleGenerateSummary = () => {
    setSummary(
      `Results-oriented ${jobTitle} with proven expertise in ${skills.slice(0, 4).join(', ')}. Demonstrated history architecting scalable platforms, slashing operational latency, and leading engineering squads to execute mission-critical deliverables across high-scale enterprise products.`
    );
    showNotice('AI Professional Summary generated!');
  };

  const handleAddSkill = (skill: string) => {
    if (!skill.trim() || skills.includes(skill.trim())) return;
    setSkills([...skills, skill.trim()]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const showNotice = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pendingDownloadAfterAuth, setPendingDownloadAfterAuth] = useState<'pdf' | 'docx' | false>(false);
  const [pendingCopyAfterAuth, setPendingCopyAfterAuth] = useState<boolean>(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState<boolean>(false);
  const [galleryExportError, setGalleryExportError] = useState<string | null>(null);

  const triggerBuilderExport = async (
    format: 'pdf' | 'docx' = 'pdf',
    customBackendTplId?: string
  ) => {
    setIsDownloadingPdf(true);
    setGalleryExportError(null);
    try {
      const resolvedTemplateId = customBackendTplId || activeBackendTemplateId;
      await exportCustomAtsCv({
        format,
        template_id: resolvedTemplateId,
        // What you see is what you download: the active template's layout plus your colour and font.
        accent_color: readableAccent(accentColor),
        font: fontFamily,
        job_title: jobTitle,
        company: atsScanContext?.targetCompany || '',
        parsed_resume: {
          fullName,
          jobTitle,
          email,
          phone,
          location,
          linkedIn,
          github,
          summary,
          skills,
          experiences,
          educations,
          projects,
        },
        tailored_summary: summary,
        // Only what the preview shows is exported (accepted ATS bullets are already inserted into the roles).
        tailored_bullets: [],
        missing_keywords: [],
      });
      setIsGalleryModalOpen(false);
      showNotice(`Downloaded tailored ${format.toUpperCase()} resume!`);
    } catch (err: any) {
      setGalleryExportError(err?.message || `Failed to export ${format.toUpperCase()}.`);
      if (format === 'pdf' && !isGalleryModalOpen) {
        window.print();
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const triggerBuilderPdfDownload = async () => {
    await triggerBuilderExport('pdf');
  };

  const handlePrint = () => {
    const authed =
      isAuthenticated || (typeof window !== 'undefined' && Boolean(localStorage.getItem('tr_auth_user')));
    if (!authed) {
      const currentMeta = BUILDER_TEMPLATES.find((t) => t.id === template);
      setPendingDownloadAfterAuth('pdf');
      setAuthModalTemplate({
        id: template,
        name: `${currentMeta?.name || 'Resume'} (PDF Download)`,
      });
      return;
    }
    triggerBuilderPdfDownload();
  };

  const handleDownloadDocx = () => {
    const authed =
      isAuthenticated || (typeof window !== 'undefined' && Boolean(localStorage.getItem('tr_auth_user')));
    if (!authed) {
      const currentMeta = BUILDER_TEMPLATES.find((t) => t.id === template);
      setPendingDownloadAfterAuth('docx');
      setAuthModalTemplate({
        id: template,
        name: `${currentMeta?.name || 'Resume'} (Word DOCX Download)`,
      });
      return;
    }
    triggerBuilderExport('docx');
  };

  const copyPlainTextNow = () => {
    const projectsBlock =
      projects.length > 0
        ? `\n\nKEY PROJECTS & HIGHLIGHTS\n${projects
            .map((p) => `${p.title}${p.techStack ? ` (${p.techStack})` : ''}: ${p.description}`)
            .join('\n')}`
        : '';
    const plainText = `
${fullName.toUpperCase()}
${jobTitle} | ${location}
Email: ${email} | Phone: ${phone}${linkedIn ? ` | LinkedIn: ${linkedIn}` : ''}${github ? ` | GitHub: ${github}` : ''}

PROFESSIONAL SUMMARY
${summary}

CORE COMPETENCIES & TECHNICAL SKILLS
${skills.join(', ')}

PROFESSIONAL EXPERIENCE
${experiences.map(e => `
${e.position} - ${e.company} (${e.location})
${e.startDate} - ${e.endDate}
${e.bullets.map(b => `- ${b}`).join('\n')}
`).join('\n')}

EDUCATION
${educations.map(ed => `${ed.degree} - ${ed.institution} (${ed.year})${ed.honors ? ` - ${ed.honors}` : ''}`).join('\n')}${projectsBlock}
    `.trim();

    navigator.clipboard.writeText(plainText);
    showNotice('Plain Text ATS format copied to clipboard!');
  };

  const handleExportPlainText = () => {
    const authed =
      isAuthenticated || (typeof window !== 'undefined' && Boolean(localStorage.getItem('tr_auth_user')));
    if (!authed) {
      const currentMeta = BUILDER_TEMPLATES.find((t) => t.id === template);
      setPendingCopyAfterAuth(true);
      setAuthModalTemplate({
        id: template,
        name: `${currentMeta?.name || 'Resume'} (Copy Plain Text)`,
      });
      return;
    }
    copyPlainTextNow();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #resume-canvas, #resume-canvas * {
            visibility: visible;
          }
          #resume-canvas {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Builder App Bar (No Print) */}
      <header ref={headerRef} className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 no-print shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight flex items-center gap-1.5 sm:gap-2 group shrink-0">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
              TR
            </span>
            <span className="truncate">TalentRadar</span>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 shrink-0">
              LIVE BUILDER
            </span>
          </Link>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Real-Time ATS Score Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] sm:text-xs font-bold text-slate-700 shrink-0">
            <span className="text-slate-500 font-medium" title="Formatting and structure score of this resume (separate from the job-description match in the ATS Scanner)">ATS Health:</span>
            <span className={`font-black ${atsScore >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {atsScore}%
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

        {/* Styling Toolbar */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-[13px] w-full xl:w-auto justify-start sm:justify-end">
          {/* Color Palettes */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
            {[
              { label: 'Cyan', color: '#0369a1' },
              { label: 'Navy', color: '#0f172a' },
              { label: 'Emerald', color: '#047857' },
              { label: 'Indigo', color: '#4f46e5' },
              { label: 'Amber', color: '#b45309' }
            ].map((c) => (
              <button
                key={c.color}
                onClick={() => setAccentColor(c.color)}
                style={{ backgroundColor: c.color }}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                  accentColor === c.color ? 'scale-125 ring-2 ring-slate-900 ring-offset-1' : 'opacity-80 hover:opacity-100'
                }`}
                title={c.label}
                aria-label={`Accent color ${c.label}`}
              />
            ))}
          </div>

          {/* Font Family Switcher */}
          <div className="hidden md:flex items-center gap-0.5 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs">
            <Type className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5 shrink-0" />
            {(
              [
                { id: 'sans', label: 'Sans' },
                { id: 'serif', label: 'Serif' },
                { id: 'mono', label: 'Mono' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFontFamily(f.id)}
                className={`px-2.5 py-1 rounded-full font-semibold transition cursor-pointer ${
                  fontFamily === f.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Import Existing Resume Button */}
          <button
            type="button"
            onClick={() => {
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-semibold transition border border-slate-300 cursor-pointer disabled:opacity-60"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Import PDF / DOCX</span>
          </button>

          {/* Export Actions */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-900 hover:bg-black text-white font-semibold transition shadow-xs cursor-pointer disabled:opacity-60"
          >
            {!isAuthenticated ? (
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
            <span>{isDownloadingPdf ? 'Downloading...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-semibold transition border border-slate-300 cursor-pointer disabled:opacity-60"
            title="Download Microsoft Word (.docx)"
          >
            {!isAuthenticated ? (
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span>Word (.docx)</span>
          </button>

          <button
            onClick={handleExportPlainText}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-semibold transition border border-slate-300 cursor-pointer disabled:opacity-60"
            title="Copy ATS Plain Text"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">Copy Plain Text</span>
          </button>

          <Link
            href="/ats-scanner"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-semibold transition border border-slate-300 cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>ATS Diagnostic</span>
          </Link>

          {/* Auth Status / Unlock Templates Control */}
          {isAuthenticated ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="max-w-[80px] sm:max-w-[100px] truncate">{authUsername || 'Signed In'}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 pl-1.5 border-l border-emerald-300 text-rose-600 hover:text-rose-800 font-extrabold flex items-center gap-0.5 cursor-pointer"
                title="Sign out to lock templates behind signup"
              >
                <LogOut className="w-3 h-3 shrink-0" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                setAuthModalTemplate({
                  id: 'minimalist',
                  name: 'All 105+ ATS Resume Templates',
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-cyan-800 hover:bg-cyan-50 font-semibold transition cursor-pointer underline-offset-2 hover:underline"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>Sign up free to unlock all templates</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Quick-Jump Bar between Editor & Live Resume Preview */}
      <div className="lg:hidden bg-slate-900 text-white px-4 py-2 flex items-center justify-between gap-2 text-xs no-print">
        <span className="font-bold text-slate-300 truncate">
          Template: <strong className="text-cyan-400">{BUILDER_TEMPLATES.find((t) => t.id === template)?.shortName}</strong>
        </span>
        <a
          href="#resume-canvas"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-[11px] shrink-0 shadow-xs"
        >
          <Eye className="w-3 h-3" />
          <span>Jump to Live Preview &darr;</span>
        </a>
      </div>

      {/* Floating Notification Toast */}
      {copiedNotification && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 bg-slate-950 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-cyan-500/40 animate-fade-in no-print">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* MAIN TWO-PANE WORKSPACE */}
      <div style={{ ['--builder-header-h' as string]: `${headerHeight}px` } as React.CSSProperties} className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-6 lg:p-8 lg:pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: Section Editor Controls (Width 5 cols) */}
        <div
          id="builder-editor-panel"
          onChangeCapture={() => setHasManualEdits(true)}
          className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6 no-print min-w-0 lg:sticky lg:top-[calc(var(--builder-header-h)+1rem)] lg:max-h-[calc(100dvh-var(--builder-header-h)-2rem)] lg:overflow-y-auto"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600">Live Modular Editor</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Autosaved Live</span>
                </span>
              </div>
              <h1 className="text-lg font-black text-slate-900">Customize Resume Content</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartFromScratch}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer"
                title="Clear all fields and start building from scratch"
              >
                <Trash2 className="w-3 h-3" />
                <span>Start From Scratch</span>
              </button>
              <button
                type="button"
                onClick={handleResetToDefaultTemplate}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Show the demo resume (your uploaded CV stays saved)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>

          {/* IMPORT EXISTING RESUME BANNER (PDF / DOCX / TXT AUTO-FILL) */}
          <div className={`rounded-2xl border border-slate-200 bg-slate-50/80 ${lastImportedFile ? "p-3" : "p-4"} space-y-3`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="text-sm">Import Existing PDF / Word Resume</span>
                  </div>
                  {!lastImportedFile && (
                    <p className="text-xs text-slate-600 leading-snug mt-0.5">
                      Upload your old PDF or DOCX resume to automatically populate Name, Experience, Education, and Skills.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <input
              ref={quickFileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              onChange={handleQuickFileSelect}
              className="hidden"
              data-testid="quick-resume-upload-input"
            />

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                disabled={isImporting}
                onClick={() => quickFileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isImporting ? 'Importing & Auto-Filling...' : 'Upload PDF / DOCX File'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImportError(null);
                  setIsImportModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer"
              >
                Paste Resume Text / Options
              </button>

              {lastImportedFile && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Loaded: {lastImportedFile}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetToDefaultTemplate}
                    className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer"
                    title="Show the demo resume (your uploaded CV stays saved)"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset CV</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* YOUR SAVED CVs: switching to the demo / sample / another file never deletes a CV */}
          {savedCvs.length > 0 && (
            <div
              data-testid="saved-cvs-card"
              className={`rounded-2xl border p-3 space-y-2.5 ${
                activeCvId ? 'border-slate-200 bg-white' : 'border-amber-300 bg-amber-50/70'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900">
                    {activeCvId ? 'Your saved CVs' : "You're viewing the demo — not your CV"}
                  </div>
                  <p className="text-[13px] text-slate-600 leading-snug">
                    {activeCvId
                      ? 'Resetting to the demo, trying the sample or importing another file never deletes your CV. Pick one here to switch back anytime.'
                      : 'Your uploaded CV is safe. Choose it below to switch back and keep editing.'}
                  </p>
                </div>
              </div>

              {!activeCvId && (
                <button
                  type="button"
                  onClick={() => handleSwitchToSavedCv(savedCvs[0].id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-semibold transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="truncate">Switch back to my CV: {cvLabel(savedCvs[0])}</span>
                </button>
              )}

              <ul className="space-y-1.5">
                {savedCvs.map((cv) => {
                  const isActive = cv.id === activeCvId;
                  return (
                    <li
                      key={cv.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                        isActive ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-slate-900 truncate">{cvLabel(cv)}</div>
                        <div className="text-xs text-slate-500">
                          {cv.resume.fullName ? `${cv.resume.fullName} · ` : ''}edited {timeAgo(cv.savedAt)}
                        </div>
                      </div>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Editing now
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwitchToSavedCv(cv.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 transition cursor-pointer shrink-0"
                        >
                          Switch to this CV
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedCv(cv.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                        title="Remove this CV from your saved list"
                        aria-label={`Remove ${cvLabel(cv)}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* ATS SCANNER SYNC BANNER (When opened via "Edit in Live Visual Builder" from /ats-scanner) */}
          {atsScanContext && (
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-950">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Synced from ATS Scanner
                    {typeof atsScanContext.overallScore === 'number'
                      ? ` (${atsScanContext.overallScore}% Match)`
                      : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAtsScanContext(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {atsScanContext.missingHardSkills && atsScanContext.missingHardSkills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const merged = [...skills];
                      let added = 0;
                      for (const sk of atsScanContext.missingHardSkills) {
                        if (!merged.includes(sk)) {
                          merged.push(sk);
                          added++;
                        }
                      }
                      setSkills(merged);
                      showNotice(
                        added > 0
                          ? `Added ${added} missing JD skills (${atsScanContext.missingHardSkills.slice(0, 3).join(', ')}) to your Resume!`
                          : 'All missing JD skills are already in your Skills section!'
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      Add {atsScanContext.missingHardSkills.length} Missing JD Skills (
                      {atsScanContext.missingHardSkills.slice(0, 3).join(', ')}
                      {atsScanContext.missingHardSkills.length > 3 ? '...' : ''})
                    </span>
                  </button>
                )}

                {atsScanContext.tailoredSummary && (
                  <button
                    type="button"
                    onClick={() => {
                      setHasManualEdits(true);
                      setSummary(atsScanContext.tailoredSummary);
                      showNotice('Applied ATS-tailored executive summary to your resume!');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-100/60 text-indigo-900 border border-indigo-200 text-[11px] font-bold transition cursor-pointer"
                  >
                    Apply ATS-Tailored Summary
                  </button>
                )}

                {atsScanContext.tailoredBullets && atsScanContext.tailoredBullets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setHasManualEdits(true);
                      const updated = [...experiences];
                      const bulletTexts = atsScanContext.tailoredBullets.map((b) => b.bullet).filter(Boolean);
                      if (updated.length > 0) {
                        const existing = new Set(updated[0].bullets);
                        const newBullets = bulletTexts.filter((b) => !existing.has(b));
                        updated[0] = {
                          ...updated[0],
                          bullets: [...newBullets, ...updated[0].bullets],
                        };
                        setExperiences(updated);
                        showNotice(
                          newBullets.length > 0
                            ? `Inserted ${newBullets.length} AI-tailored Google X-Y-Z bullets into Role #1!`
                            : 'AI-tailored bullets are already in Role #1!'
                        );
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>+ Insert {atsScanContext.tailoredBullets.length} AI-Tailored Bullets</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('basics')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'basics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Contact
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'summary' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'experience' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Experience
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'skills' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Skills
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'education' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Education
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'projects' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Projects
            </button>
          </div>

          {/* TAB 1: Contact Information */}
          {activeTab === 'basics' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Professional Headline</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Location &amp; Work Preference</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Open to Remote & Hybrid"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">LinkedIn Profile</label>
                  <input
                    type="text"
                    value={linkedIn}
                    onChange={(e) => setLinkedIn(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GitHub / Portfolio</label>
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Professional Summary */}
          {activeTab === 'summary' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Executive Profile Summary</label>
                <button
                  onClick={handleGenerateSummary}
                  className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 cursor-pointer bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-full border border-cyan-200 transition"
                >
                  <Sparkles className="w-3 h-3 text-cyan-600" />
                  <span>AI Polish Summary</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium leading-relaxed"
                placeholder="Write a concise 3-sentence summary highlighting your core tech stack, leadership experience, and quantified impact..."
              />
              <p className="text-[11px] text-slate-500">
                Tip: Keep between 50–90 words. Avoid generic clichés like &quot;hard worker&quot; or &quot;motivated individual&quot;.
              </p>
            </div>
          )}

          {/* TAB 3: Experience & Google X-Y-Z Bullets */}
          {activeTab === 'experience' && (
            <div className="space-y-6 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Work Experience Entries</span>
                <button
                  onClick={() => {
                    const newEntry: ExperienceEntry = {
                      id: String(Date.now()),
                      company: 'New Company',
                      position: 'Software Engineer',
                      location: 'Remote',
                      startDate: '2023',
                      endDate: 'Present',
                      bullets: ['Accomplished [X] as measured by [Y] by doing [Z].']
                    };
                    setExperiences([newEntry, ...experiences]);
                  }}
                  className="text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Role</span>
                </button>
              </div>

              {experiences.map((exp, expIdx) => {
                const isCollapsed = collapsedRoles.has(exp.id);
                return (
                <div key={exp.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className={`flex items-center justify-between gap-2 ${isCollapsed ? '' : 'pb-2 border-b border-slate-200'}`}>
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedRoles((prev) => {
                          const next = new Set(prev);
                          if (next.has(exp.id)) next.delete(exp.id);
                          else next.add(exp.id);
                          return next;
                        })
                      }
                      aria-expanded={!isCollapsed}
                      className="flex items-center gap-2 min-w-0 text-left cursor-pointer flex-1"
                    >
                      <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                      <span className="font-bold text-slate-900 text-sm shrink-0">Role #{expIdx + 1}</span>
                      {isCollapsed && (
                        <span className="text-xs text-slate-500 truncate">
                          {exp.position} · {exp.company}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setExperiences(experiences.filter((_, idx) => idx !== expIdx))}
                      className="text-red-500 hover:text-red-700 transition cursor-pointer p-1"
                      title="Remove Role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!isCollapsed && (<>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[expIdx].company = e.target.value;
                          setExperiences(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Position Title</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[expIdx].position = e.target.value;
                          setExperiences(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Start Year</label>
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[expIdx].startDate = e.target.value;
                          setExperiences(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">End Year</label>
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[expIdx].endDate = e.target.value;
                          setExperiences(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs font-semibold text-slate-700">Location</label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[expIdx].location = e.target.value;
                          setExperiences(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Bullet Points with AI Google X-Y-Z Assistant */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[11px] font-bold text-slate-800 block">Achievement Bullets</label>
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="group relative">
                        <AutoGrowTextarea
                          value={bullet}
                          ariaLabel={`Bullet ${bIdx + 1}`}
                          onChange={(val) => {
                            const updated = [...experiences];
                            updated[expIdx].bullets[bIdx] = val;
                            setExperiences(updated);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...experiences];
                            updated[expIdx].bullets = updated[expIdx].bullets.filter((_, i) => i !== bIdx);
                            setExperiences(updated);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete bullet"
                          aria-label={`Delete bullet ${bIdx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex justify-end mt-1 opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleEnhanceBullet(expIdx, bIdx)}
                            className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md hover:bg-cyan-50 transition"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>AI Quantify (X-Y-Z)</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const updated = [...experiences];
                        updated[expIdx].bullets.push('Accomplished [X] as measured by [Y] by doing [Z].');
                        setExperiences(updated);
                      }}
                      className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Bullet Point</span>
                    </button>
                  </div>
                  </>)}
                </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: Skills Matrix */}
          {activeTab === 'skills' && (
            <div className="space-y-4 text-xs">
              <label className="font-bold text-slate-700 block">Technical &amp; Core Competencies</label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. Docker, GraphQL)..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(newSkill);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                />
                <button
                  onClick={() => handleAddSkill(newSkill)}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Active Skills Chips */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-red-500 font-black cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              {/* 1-Click High-Demand Skills */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Recommended High-Salary ATS Keywords:
                </span>
                <div className="flex flex-wrap gap-1">
                  {[
                    'Terraform', 'Next.js', 'PostgreSQL', 'Golang', 'Snowflake', 'RabbitMQ', 'GCP', 'OpenAPI'
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleAddSkill(s)}
                      disabled={skills.includes(s)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        skills.includes(s)
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                          : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200 font-medium'
                      }`}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Education */}
          {activeTab === 'education' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 block">Education &amp; Academic Credentials</label>
                <button
                  type="button"
                  onClick={() => {
                    setHasManualEdits(true);
                    setEducations([
                      ...educations,
                      {
                        id: String(Date.now()),
                        institution: 'University / Institute',
                        degree: 'Degree & Major',
                        year: '2024',
                        honors: '',
                      },
                    ]);
                  }}
                  className="text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Degree</span>
                </button>
              </div>
              {educations.map((edu, idx) => (
                <div key={edu.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-black text-slate-900 text-xs">Credential #{idx + 1}</span>
                    {educations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setHasManualEdits(true);
                          setEducations(educations.filter((_, i) => i !== idx));
                        }}
                        className="text-red-500 hover:text-red-700 transition cursor-pointer p-1"
                        title="Remove Credential"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Institution / University</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = [...educations];
                        updated[idx].institution = e.target.value;
                        setEducations(updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Degree &amp; Major</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[idx].degree = e.target.value;
                          setEducations(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Graduation Year</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => {
                          const updated = [...educations];
                          updated[idx].year = e.target.value;
                          setEducations(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Honors / GPA</label>
                    <input
                      type="text"
                      value={edu.honors}
                      onChange={(e) => {
                        const updated = [...educations];
                        updated[idx].honors = e.target.value;
                        setEducations(updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: Projects & Key Highlights */}
          {activeTab === 'projects' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 block">Key Projects &amp; Highlights</label>
                <button
                  type="button"
                  onClick={() => {
                    setHasManualEdits(true);
                    setProjects([
                      ...projects,
                      {
                        id: String(Date.now()),
                        title: 'New Key Project',
                        description: 'Built scalable architecture or product feature with measurable impact.',
                        techStack: 'Python, React, AWS',
                      },
                    ]);
                  }}
                  className="text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Project</span>
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">No projects added yet</p>
                  <p className="text-[11px] text-slate-500">
                    Add notable engineering, open-source, or product projects to showcase hands-on impact.
                  </p>
                </div>
              ) : (
                projects.map((proj, idx) => (
                  <div key={proj.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="font-black text-slate-900 text-xs">Project #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setHasManualEdits(true);
                          setProjects(projects.filter((_, i) => i !== idx));
                        }}
                        className="text-red-500 hover:text-red-700 transition cursor-pointer p-1"
                        title="Remove Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Project Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].title = e.target.value;
                          setProjects(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Tech Stack / Tools</label>
                      <input
                        type="text"
                        value={proj.techStack}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].techStack = e.target.value;
                          setProjects(updated);
                        }}
                        placeholder="e.g. Python, FastAPI, PostgreSQL, Docker"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Impact &amp; Description</label>
                      <textarea
                        rows={3}
                        value={proj.description}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].description = e.target.value;
                          setProjects(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium leading-normal"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {/* CHOOSE RESUME TEMPLATE SHOWCASE (ACCOUNT-GATED WHEN LOGGED OUT) */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>Choose Resume Template</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[9px] font-black uppercase">
                      5 Live Layouts &bull; 105+ Designs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {isAuthenticated
                      ? 'All ATS-verified resume templates are unlocked on your account.'
                      : 'Select any template below — creating a free account is required to apply templates.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGalleryExportError(null);
                  setIsGalleryModalOpen(true);
                }}
                className="text-[11px] font-extrabold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Browse All 105+ &rarr;</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BUILDER_TEMPLATES.map((tpl) => {
                const isSelected = template === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id, tpl.name)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer group ${
                      isSelected
                        ? 'bg-white border-cyan-600 ring-2 ring-cyan-500/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Mini Visual Wireframe Preview */}
                    <div className="w-full h-14 rounded-lg bg-slate-50 border border-slate-200/80 p-1.5 flex flex-col justify-between overflow-hidden relative">
                      <div className="flex items-center justify-between gap-1">
                        <div
                          className="h-2 w-12 rounded-xs"
                          style={{ backgroundColor: tpl.accent }}
                        />
                        <span className="text-[8px] font-black px-1 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          {tpl.atsScore}
                        </span>
                      </div>
                      {tpl.id === 'tech_two_column' ? (
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          <div className="col-span-2 space-y-1">
                            <div className="h-1 bg-slate-300 rounded-xs w-full" />
                            <div className="h-1 bg-slate-200 rounded-xs w-5/6" />
                            <div className="h-1 bg-slate-200 rounded-xs w-4/6" />
                          </div>
                          <div className="col-span-1 space-y-1 border-l border-slate-200 pl-1">
                            <div className="h-1 bg-slate-300 rounded-xs w-full" />
                            <div className="h-1 bg-slate-200 rounded-xs w-3/4" />
                          </div>
                        </div>
                      ) : tpl.id === 'executive' ? (
                        <div className="space-y-1 pt-0.5">
                          <div
                            className="h-2.5 w-full rounded-xs opacity-85"
                            style={{ backgroundColor: tpl.accent }}
                          />
                          <div className="h-1 bg-slate-300 rounded-xs w-full" />
                          <div className="h-1 bg-slate-200 rounded-xs w-4/5" />
                        </div>
                      ) : (
                        <div className="space-y-1 pt-1">
                          <div className="h-1 bg-slate-300 rounded-xs w-full" />
                          <div className="h-1 bg-slate-200 rounded-xs w-11/12" />
                          <div className="h-1 bg-slate-200 rounded-xs w-3/4" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-extrabold text-slate-900 truncate">
                          {tpl.shortName}
                        </span>
                        {isSelected ? (
                          <span className="text-[9px] font-black text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                            Active
                          </span>
                        ) : !isAuthenticated ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Lock className="w-2.5 h-2.5 text-amber-600" />
                            <span>Sign Up</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-700">
                            Use &rarr;
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium block truncate">
                        {tpl.tag}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* 6th Card: Browse All 105+ Designs */}
              <button
                type="button"
                onClick={() => {
                  setGalleryExportError(null);
                  setIsGalleryModalOpen(true);
                }}
                className="p-2.5 rounded-xl border border-dashed border-cyan-300 bg-cyan-50/40 hover:bg-cyan-50 text-left transition flex flex-col justify-between gap-2 cursor-pointer group"
              >
                <div className="w-full h-14 rounded-lg bg-white/80 border border-cyan-200/80 flex flex-col items-center justify-center text-cyan-700">
                  <Sparkles className="w-4 h-4 mb-0.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider">+100 More</span>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-extrabold text-cyan-950 truncate">
                      105+ Templates
                    </span>
                    {!isAuthenticated && (
                      <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[9px] text-cyan-700 font-bold block truncate">
                    Explore Full Gallery &rarr;
                  </span>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Document Canvas (Width 7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-3 min-w-0 w-full">
          {/* Quick Template Switcher Bar Above Live A4 Preview */}
          <div className="w-full max-w-[850px] bg-white rounded-2xl border border-slate-200 px-3 sm:px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="flex items-center justify-between w-full sm:w-auto gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span className="font-bold text-slate-600">Active Layout:</span>
                <span className="font-black text-slate-900" data-testid="active-template-name">
                  {activeTemplateLabel || BUILDER_TEMPLATES.find((t) => t.id === template)?.name || 'Modern Tech'}
                </span>
              </div>
              <a
                href="#builder-editor-panel"
                className="lg:hidden text-[11px] font-extrabold text-cyan-700 hover:text-cyan-900"
              >
                &uarr; Back to Editor
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {BUILDER_TEMPLATES.map((tpl) => {
                const isSelected = !activeTemplateLabel && template === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id, tpl.name)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {!isAuthenticated && !isSelected && (
                      <Lock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                    )}
                    <span>{tpl.shortName}</span>
                  </button>
                );
              })}
            </div>
            <div className="basis-full flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-slate-500">
                What you see is what you download: a single-column, ATS-safe PDF or Word file in this style.
              </p>
              <button
                type="button"
                onClick={() => {
                  setGalleryExportError(null);
                  setIsGalleryModalOpen(true);
                }}
                data-testid="browse-templates-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[13px] font-semibold transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Browse 105+ templates</span>
              </button>
            </div>
          </div>

          <div 
            id="resume-canvas"
            className="w-full max-w-[816px] bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-900 break-words overflow-hidden"
            data-layout={activeLayout}
            data-template={activeBackendTemplateId}
            style={{
              containerType: 'inline-size',
              fontFamily: fontFamily === 'serif' ? 'serif' : fontFamily === 'mono' ? 'monospace' : 'sans-serif'
            } as React.CSSProperties}
          >
            <ResumePreview
              layout={activeLayout}
              accent={accentColor}
              data={{ fullName, jobTitle, email, phone, location, linkedIn, github, summary, skills, experiences, educations, projects }}
            />
          </div>
        </div>

      </div>

      {/* IMPORT EXISTING RESUME MODAL (PDF / DOCX / TXT / PASTE) */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 no-print animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-resume-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              aria-label="Close import modal"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 px-6 pt-6 pb-5 text-white">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold mb-2.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Resume Parser &amp; Auto-Fill</span>
              </div>
              <h3 id="import-resume-modal-title" className="text-xl font-extrabold tracking-tight text-white">
                Import Your Existing Resume
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Upload your PDF, Word (.docx), or TXT resume and we&apos;ll automatically extract and fill your Contact Info, Summary, Work Experience, Education, and Skills.
              </p>
            </div>

            <div className="px-6 pt-4">
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setImportMode('file');
                    setImportError(null);
                  }}
                  className={`py-2 rounded-lg transition cursor-pointer ${
                    importMode === 'file' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upload PDF / DOCX File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportMode('paste');
                    setImportError(null);
                  }}
                  className={`py-2 rounded-lg transition cursor-pointer ${
                    importMode === 'paste' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Paste Resume Text
                </button>
              </div>
            </div>

            <form onSubmit={handleModalImportSubmit} className="p-6 pt-4 space-y-4">
              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{importError}</span>
                </div>
              )}

              {importMode === 'file' ? (
                <div className="space-y-3">
                  <label className="block border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/70 hover:bg-emerald-50/30 transition">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="hidden"
                      data-testid="modal-resume-upload-input"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    {importFile ? (
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold text-emerald-800">{importFile.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {(importFile.size / 1024).toFixed(1)} KB &bull; Ready to auto-fill builder
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold text-slate-900">
                          Click to select your PDF, Word (.docx), or TXT resume
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Supports PDF, DOCX, DOC, TXT &bull; Max 5 MB
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Paste Your Full Resume Text
                  </label>
                  <textarea
                    rows={7}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste your existing resume or LinkedIn profile text here (Name, Experience, Education, Skills)..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none text-xs font-medium leading-relaxed"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={isImporting}
                  className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isImporting ? 'Extracting & Auto-Filling...' : 'Import & Auto-Fill Builder'}</span>
                </button>

                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleImportSampleDemo}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Try Sample Resume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TemplateGalleryModal
        mode="select"
        isOpen={isGalleryModalOpen}
        selectedTemplateId={activeBackendTemplateId}
        onSelectTemplate={() => {}}
        onUseTemplate={(tmpl: CVTemplate) => {
          applyBackendTemplate(tmpl);
          setIsGalleryModalOpen(false);
          showNotice(`Using "${tmpl.name}". Edit your details here, then download from the toolbar.`);
        }}
        onClose={() => setIsGalleryModalOpen(false)}
        isAuthenticated={isAuthenticated}
        onAuthSuccess={() => setIsAuthenticated(true)}
      />

      <TemplateAuthModal
        isOpen={!!authModalTemplate}
        onClose={() => {
          setPendingDownloadAfterAuth(false);
          setPendingCopyAfterAuth(false);
          setAuthModalTemplate(null);
        }}
        templateId={authModalTemplate?.id || 'tech_two_column'}
        templateName={authModalTemplate?.name || 'ATS-Optimized Template'}
        onSuccess={() => {
          const shouldDownload = pendingDownloadAfterAuth;
          const shouldCopy = pendingCopyAfterAuth;
          setIsAuthenticated(true);
          if (authModalTemplate && !shouldDownload && !shouldCopy) {
            if (authModalTemplate.catalog) applyBackendTemplate(authModalTemplate.catalog);
            else applyQuickLayout(authModalTemplate.id);
          }
          setPendingDownloadAfterAuth(false);
          setPendingCopyAfterAuth(false);
          setAuthModalTemplate(null);
          if (shouldDownload) {
            showNotice(`Account verified! Downloading your ${shouldDownload.toUpperCase()} resume...`);
            triggerBuilderExport(shouldDownload);
          } else if (shouldCopy) {
            copyPlainTextNow();
          } else {
            showNotice('Account verified! Template unlocked.');
          }
        }}
      />

      <Footer />
    </div>
  );
}
