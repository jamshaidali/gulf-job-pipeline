'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TemplateAuthModal from '@/components/TemplateAuthModal';
import TemplateGalleryModal from '@/components/dashboard/TemplateGalleryModal';
import { CVTemplate } from '@/types';
import { fetchCurrentUser, importCvToBuilder, exportCustomAtsCv, ImportedStructuredResume } from '@/lib/api';
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
  User
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
    tag: '2-Column Split',
    atsScore: '100% ATS',
    accent: '#0284c7',
    description: 'High-impact 2-column layout for Software, Cloud, Data & Product roles.',
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
  const [accentColor, setAccentColor] = useState<string>('#0284c7'); // Cyan/Sky
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authUsername, setAuthUsername] = useState<string | null>(null);
  const [authModalTemplate, setAuthModalTemplate] = useState<{
    id: BuilderTemplateId;
    name: string;
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

  useEffect(() => {
    const mapTemplateParam = (raw: string | null): BuilderTemplateId | null => {
      if (!raw) return null;
      const lower = raw.toLowerCase();
      if (lower.includes('compact') || lower.includes('dense')) {
        return 'compact';
      }
      if (lower.includes('classic') || lower.includes('serif') || lower.includes('academic')) {
        return 'classic_serif';
      }
      if (lower.includes('minimal') || lower.includes('monochrome')) {
        return 'minimalist';
      }
      if (lower.includes('exec')) {
        return 'executive';
      }
      return 'tech_two_column';
    };

    const init = async () => {
      if (typeof window !== 'undefined') {
        const rawStoredCv =
          sessionStorage.getItem('tr_builder_imported_cv') ||
          localStorage.getItem('tr_builder_imported_cv');
        if (rawStoredCv) {
          try {
            const parsedPayload = JSON.parse(rawStoredCv);
            if (parsedPayload && parsedPayload.resume) {
              const res: ImportedStructuredResume = parsedPayload.resume;
              const srcName: string = parsedPayload.filename || 'Uploaded_Resume.pdf';
              if (res.fullName) setFullName(res.fullName);
              if (res.jobTitle) setJobTitle(res.jobTitle);
              if (res.email) setEmail(res.email);
              if (res.phone) setPhone(res.phone);
              if (res.location) setLocation(res.location);
              if (typeof res.linkedIn === 'string') setLinkedIn(res.linkedIn);
              if (typeof res.github === 'string') setGithub(res.github);
              if (res.summary) setSummary(res.summary);
              if (Array.isArray(res.skills) && res.skills.length > 0) setSkills(res.skills);
              if (Array.isArray(res.experiences) && res.experiences.length > 0) setExperiences(res.experiences);
              if (Array.isArray(res.educations) && res.educations.length > 0) setEducations(res.educations);
              if (Array.isArray(res.projects) && res.projects.length > 0) setProjects(res.projects);
              setLastImportedFile(srcName);

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
        const mapped = mapTemplateParam(tplParam);
        if (mapped) {
          if (tplParam && !['tech_two_column', 'minimalist', 'executive', 'compact', 'classic_serif'].includes(tplParam)) {
            setActiveBackendTemplateId(tplParam);
          }
          const foundMeta = BUILDER_TEMPLATES.find((t) => t.id === mapped);
          if (authed) {
            setTemplate(mapped);
          } else {
            setAuthModalTemplate({
              id: mapped,
              name: foundMeta?.name || 'ATS-Optimized Template',
            });
          }
        }
      }
    };
    init();
  }, []);

  const handleSelectTemplate = (targetTpl: BuilderTemplateId, displayName: string) => {
    if (isAuthenticated || (typeof window !== 'undefined' && localStorage.getItem('tr_auth_user'))) {
      setTemplate(targetTpl);
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

  const applyImportedResume = (res: ImportedStructuredResume, sourceName: string) => {
    if (res.fullName) setFullName(res.fullName);
    if (res.jobTitle) setJobTitle(res.jobTitle);
    if (res.email) setEmail(res.email);
    if (res.phone) setPhone(res.phone);
    if (res.location) setLocation(res.location);
    if (typeof res.linkedIn === 'string') setLinkedIn(res.linkedIn);
    if (typeof res.github === 'string') setGithub(res.github);
    if (res.summary) setSummary(res.summary);
    if (Array.isArray(res.skills) && res.skills.length > 0) setSkills(res.skills);
    if (Array.isArray(res.experiences) && res.experiences.length > 0) setExperiences(res.experiences);
    if (Array.isArray(res.educations) && res.educations.length > 0) setEducations(res.educations);
    if (Array.isArray(res.projects) && res.projects.length > 0) setProjects(res.projects);

    setLastImportedFile(sourceName);
    if (typeof window !== 'undefined') {
      const payload = JSON.stringify({
        filename: sourceName,
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
      applyImportedResume(result.resume, 'Sample_Senior_Engineer_CV.pdf');
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

  const handleStartFromScratch = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tr_builder_imported_cv');
      sessionStorage.removeItem('tr_builder_imported_cv');
    }
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
    showNotice('Cleared uploaded CV — Ready to build your resume from scratch!');
  };

  const handleResetToDefaultTemplate = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tr_builder_imported_cv');
      sessionStorage.removeItem('tr_builder_imported_cv');
    }
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
    showNotice('Reset resume back to default sample template!');
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
  const [activeBackendTemplateId, setActiveBackendTemplateId] = useState<string>('gulf_dubai_sapphire');
  const [galleryExportError, setGalleryExportError] = useState<string | null>(null);

  const backendTemplateMap: Record<BuilderTemplateId, string> = {
    tech_two_column: 'gulf_dubai_sapphire',
    minimalist: 'silicon_tech_indigo',
    executive: 'abu_dhabi_executive',
    compact: 'backend_architect_dark',
    classic_serif: 'qatar_pearl_corporate',
  };

  const triggerBuilderExport = async (
    format: 'pdf' | 'docx' = 'pdf',
    customBackendTplId?: string,
    tplId: BuilderTemplateId = template
  ) => {
    setIsDownloadingPdf(true);
    setGalleryExportError(null);
    try {
      const resolvedTemplateId = customBackendTplId || activeBackendTemplateId || backendTemplateMap[tplId] || 'gulf_dubai_sapphire';
      await exportCustomAtsCv({
        format,
        template_id: resolvedTemplateId,
        job_title: jobTitle || 'Senior Software Engineer',
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
        tailored_bullets: atsScanContext?.tailoredBullets || [],
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

  const triggerBuilderPdfDownload = async (tplId: BuilderTemplateId = template) => {
    await triggerBuilderExport('pdf', backendTemplateMap[tplId], tplId);
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
    triggerBuilderPdfDownload(template);
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
    triggerBuilderExport('docx', backendTemplateMap[template], template);
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
              { label: 'Cyan', color: '#0284c7' },
              { label: 'Navy', color: '#0f172a' },
              { label: 'Emerald', color: '#059669' },
              { label: 'Indigo', color: '#6366f1' },
              { label: 'Amber', color: '#d97706' }
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
                title="Reset to sample template data"
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
                    title="Remove uploaded CV and reset"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset CV</span>
                  </button>
                </div>
              )}
            </div>
          </div>

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
                        <textarea
                          rows={2}
                          value={bullet}
                          aria-label={`Bullet ${bIdx + 1}`}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          onInput={(e) => {
                            const el = e.currentTarget;
                            el.style.height = 'auto';
                            el.style.height = `${el.scrollHeight}px`;
                          }}
                          onChange={(e) => {
                            const updated = [...experiences];
                            updated[expIdx].bullets[bIdx] = e.target.value;
                            setExperiences(updated);
                          }}
                          className="w-full p-2.5 pr-9 rounded-lg border border-slate-300 bg-white text-sm leading-relaxed resize-none overflow-hidden"
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
        <div className="lg:col-span-7 flex flex-col items-center lg:sticky lg:top-[calc(var(--builder-header-h)+1rem)] lg:max-h-[calc(100dvh-var(--builder-header-h)-2rem)] lg:overflow-y-auto space-y-3 min-w-0 w-full">
          {/* Quick Template Switcher Bar Above Live A4 Preview */}
          <div className="w-full max-w-[850px] bg-white rounded-2xl border border-slate-200 px-3 sm:px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="flex items-center justify-between w-full sm:w-auto gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span className="font-bold text-slate-600">Active Layout:</span>
                <span className="font-black text-slate-900">
                  {BUILDER_TEMPLATES.find((t) => t.id === template)?.name || 'Modern Tech'}
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
                const isSelected = template === tpl.id;
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
          </div>

          <div 
            id="resume-canvas"
            className="w-full max-w-[850px] bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-8 md:p-12 min-h-[640px] sm:min-h-[1050px] text-slate-900 transition-all break-words overflow-hidden"
            style={{
              fontFamily: fontFamily === 'serif' ? 'serif' : fontFamily === 'mono' ? 'monospace' : 'sans-serif'
            }}
          >
            {/* TEMPLATE VARIANT: TECH TWO COLUMN */}
            {template === 'tech_two_column' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b-2 pb-5" style={{ borderColor: accentColor }}>
                  <div className="text-xl sm:text-3xl font-black tracking-tight" style={{ color: accentColor }}>
                    {fullName || 'Your Full Name'}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                    {jobTitle || 'Target Professional Role'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500 mt-2 font-medium break-all sm:break-words">
                    <span>{location}</span>
                    <span>&bull;</span>
                    <span>{phone}</span>
                    <span>&bull;</span>
                    <span>{email}</span>
                    {linkedIn && (
                      <>
                        <span>&bull;</span>
                        <span className="text-slate-700">{linkedIn}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8">
                  {/* Left Main Stream (8 cols) */}
                  <div className="sm:col-span-8 space-y-6 min-w-0">
                    {/* Summary */}
                    {summary && (
                      <div>
                        <h2 className="text-xs font-black uppercase tracking-wider pb-1.5 mb-2 border-b border-slate-200" style={{ color: accentColor }}>
                          Professional Profile
                        </h2>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {summary}
                        </p>
                      </div>
                    )}

                    {/* Experience */}
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider pb-1.5 mb-3 border-b border-slate-200" style={{ color: accentColor }}>
                        Experience
                      </h2>
                      <div className="space-y-4">
                        {experiences.map((exp) => (
                          <div key={exp.id} className="space-y-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-xs">
                              <span className="font-extrabold text-slate-900">{exp.position}</span>
                              <span className="text-[10px] text-slate-500 font-semibold">{exp.startDate} &ndash; {exp.endDate}</span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-600">
                              {exp.company} &bull; {exp.location}
                            </div>
                            <ul className="list-disc list-outside pl-4 space-y-1 text-[11px] text-slate-700 pt-1 leading-relaxed">
                              {exp.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Sidebar (4 cols) */}
                  <div className="sm:col-span-4 space-y-6 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 min-w-0">
                    {/* Skills Matrix */}
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider pb-1.5 mb-2.5 border-b border-slate-200" style={{ color: accentColor }}>
                        Technical Stack
                      </h2>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-sm bg-slate-100 text-[10px] font-bold text-slate-800"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider pb-1.5 mb-2.5 border-b border-slate-200" style={{ color: accentColor }}>
                        Education
                      </h2>
                      <div className="space-y-2">
                        {educations.map((edu) => (
                          <div key={edu.id} className="text-xs">
                            <div className="font-bold text-slate-900">{edu.degree}</div>
                            <div className="text-[10px] text-slate-600">{edu.institution}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{edu.year} &bull; {edu.honors}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Portfolio / Projects */}
                    {projects.length > 0 && (
                      <div>
                        <h2 className="text-xs font-black uppercase tracking-wider pb-1.5 mb-2.5 border-b border-slate-200" style={{ color: accentColor }}>
                          Key Highlights
                        </h2>
                        {projects.map((proj) => (
                          <div key={proj.id} className="text-xs space-y-1">
                            <div className="font-bold text-slate-900">{proj.title}</div>
                            <div className="text-[10px] text-slate-600 leading-normal">{proj.description}</div>
                            <div className="text-[9px] text-slate-400 font-mono">{proj.techStack}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TEMPLATE VARIANT: MINIMALIST SINGLE COLUMN */}
            {template === 'minimalist' && (
              <div className="space-y-6">
                <div className="text-center border-b pb-4 border-slate-200">
                  <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {fullName}
                  </div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-1">
                    {jobTitle}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 break-words">
                    {location} | {phone} | {email} | {linkedIn}
                  </p>
                </div>

                {summary && (
                  <div>
                    <h2 className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2 border-b border-slate-800 text-slate-900">
                      Summary
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>
                  </div>
                )}

                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2 border-b border-slate-800 text-slate-900">
                    Core Competencies
                  </h2>
                  <p className="text-xs text-slate-700">{skills.join(' • ')}</p>
                </div>

                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-3 border-b border-slate-800 text-slate-900">
                    Work Experience
                  </h2>
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="space-y-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-xs font-bold">
                          <span>{exp.position} &mdash; {exp.company}</span>
                          <span className="text-[10px] text-slate-500 font-normal">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
                          {exp.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2 border-b border-slate-800 text-slate-900">
                    Education
                  </h2>
                  {educations.map((edu) => (
                    <div key={edu.id} className="flex flex-wrap justify-between gap-x-2 text-xs">
                      <span><strong>{edu.degree}</strong>, {edu.institution}</span>
                      <span className="text-slate-500">{edu.year}</span>
                    </div>
                  ))}
                </div>

                {projects.length > 0 && (
                  <div>
                    <h2 className="text-xs font-extrabold uppercase tracking-wider pb-1 mb-2 border-b border-slate-800 text-slate-900">
                      Key Projects &amp; Highlights
                    </h2>
                    <div className="space-y-2">
                      {projects.map((proj) => (
                        <div key={proj.id} className="text-xs">
                          <div className="font-bold text-slate-900">
                            {proj.title} {proj.techStack ? <span className="font-normal text-slate-500">({proj.techStack})</span> : null}
                          </div>
                          <p className="text-slate-700 leading-relaxed">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEMPLATE VARIANT: EXECUTIVE */}
            {template === 'executive' && (
              <div className="space-y-6">
                <div className="p-4 sm:p-6 rounded-xl text-white space-y-1.5" style={{ backgroundColor: accentColor }}>
                  <div className="text-xl sm:text-3xl font-black tracking-tight">{fullName}</div>
                  <p className="text-xs sm:text-sm font-semibold opacity-90">{jobTitle}</p>
                  <p className="text-[11px] opacity-80 pt-1 break-words">{location} &bull; {phone} &bull; {email}</p>
                </div>

                {summary && (
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b-2" style={{ borderColor: accentColor, color: accentColor }}>
                      Executive Summary
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed font-serif">{summary}</p>
                  </div>
                )}

                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-3 border-b-2" style={{ borderColor: accentColor, color: accentColor }}>
                    Professional Background
                  </h2>
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="space-y-1">
                        <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-xs font-bold text-slate-900">
                          <span>{exp.position} | {exp.company}</span>
                          <span className="text-slate-500 font-normal">{exp.startDate} &ndash; {exp.endDate}</span>
                        </div>
                        <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700 font-serif">
                          {exp.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b-2" style={{ borderColor: accentColor, color: accentColor }}>
                    Core Leadership &amp; Tech Competencies
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-sm bg-slate-100 text-slate-800 text-xs font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {projects.length > 0 && (
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider pb-1 mb-2 border-b-2" style={{ borderColor: accentColor, color: accentColor }}>
                      Key Strategic Initiatives &amp; Projects
                    </h2>
                    <div className="space-y-2">
                      {projects.map((proj) => (
                        <div key={proj.id} className="text-xs">
                          <span className="font-bold text-slate-900">{proj.title}: </span>
                          <span className="text-slate-700 font-serif">{proj.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEMPLATE VARIANT: TECH COMPACT (DENSE 1-PAGE) */}
            {template === 'compact' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 pb-3 gap-1" style={{ borderColor: accentColor }}>
                  <div>
                    <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">{fullName}</div>
                    <div className="text-xs font-extrabold uppercase tracking-wider mt-0.5" style={{ color: accentColor }}>
                      {jobTitle}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 sm:text-right space-y-0.5 font-medium break-words">
                    <div>{email} &bull; {phone}</div>
                    <div>{location} {linkedIn ? `• ${linkedIn}` : ''}</div>
                  </div>
                </div>

                {summary && (
                  <p className="text-[11px] text-slate-700 leading-snug bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                    {summary}
                  </p>
                )}

                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest pb-1 mb-1.5 border-b border-slate-200" style={{ color: accentColor }}>
                    Technical Skills &amp; Core Stack
                  </h2>
                  <div className="flex flex-wrap gap-1">
                    {skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-800">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest pb-1 mb-2 border-b border-slate-200" style={{ color: accentColor }}>
                    Professional Experience
                  </h2>
                  <div className="space-y-3">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="space-y-0.5">
                        <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-xs font-extrabold text-slate-900">
                          <span>{exp.position} &mdash; <span className="text-slate-600 font-bold">{exp.company} ({exp.location})</span></span>
                          <span className="text-[10px] text-slate-500 font-semibold">{exp.startDate} &ndash; {exp.endDate}</span>
                        </div>
                        <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11px] text-slate-700 leading-snug">
                          {exp.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest pb-1 mb-1.5 border-b border-slate-200" style={{ color: accentColor }}>
                      Education
                    </h2>
                    {educations.map((edu) => (
                      <div key={edu.id} className="text-[11px]">
                        <div className="font-bold text-slate-900">{edu.degree}</div>
                        <div className="text-slate-600 text-[10px]">{edu.institution} ({edu.year})</div>
                      </div>
                    ))}
                  </div>
                  {projects.length > 0 && (
                    <div>
                      <h2 className="text-[10px] font-black uppercase tracking-widest pb-1 mb-1.5 border-b border-slate-200" style={{ color: accentColor }}>
                        Key Projects
                      </h2>
                      {projects.slice(0, 2).map((proj) => (
                        <div key={proj.id} className="text-[11px] mb-1">
                          <span className="font-bold text-slate-900">{proj.title}: </span>
                          <span className="text-slate-600 text-[10px]">{proj.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TEMPLATE VARIANT: CLASSIC SERIF (ACADEMIC / FINANCE / LEGAL) */}
            {template === 'classic_serif' && (
              <div className="space-y-5 font-serif">
                <div className="text-center border-b-2 border-slate-900 pb-4">
                  <div className="text-xl sm:text-3xl font-bold tracking-wide uppercase text-slate-950">
                    {fullName}
                  </div>
                  <div className="text-xs italic text-slate-700 mt-1">{jobTitle}</div>
                  <div className="text-[11px] text-slate-600 mt-1 break-words">
                    {location} &bull; {phone} &bull; {email} {linkedIn ? `• ${linkedIn}` : ''}
                  </div>
                </div>

                {summary && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-400 pb-0.5 mb-2 text-slate-900">
                      Executive Profile
                    </h2>
                    <p className="text-xs text-slate-800 leading-relaxed">{summary}</p>
                  </div>
                )}

                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-400 pb-0.5 mb-2.5 text-slate-900">
                    Professional Experience
                  </h2>
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="space-y-1">
                        <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-xs font-bold text-slate-950">
                          <span>{exp.company}, {exp.location}</span>
                          <span>{exp.startDate} &ndash; {exp.endDate}</span>
                        </div>
                        <div className="text-xs italic text-slate-700">{exp.position}</div>
                        <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-800">
                          {exp.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-400 pb-0.5 mb-2 text-slate-900">
                    Education
                  </h2>
                  {educations.map((edu) => (
                    <div key={edu.id} className="flex flex-wrap justify-between gap-x-2 text-xs mb-1">
                      <span><strong>{edu.institution}</strong> &mdash; <em>{edu.degree}</em></span>
                      <span>{edu.year}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-400 pb-0.5 mb-1.5 text-slate-900">
                    Core Skills &amp; Expertise
                  </h2>
                  <p className="text-xs text-slate-800">{skills.join(', ')}</p>
                </div>

                {projects.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest border-b border-slate-400 pb-0.5 mb-2 text-slate-900">
                      Key Projects &amp; Publications
                    </h2>
                    <div className="space-y-1.5">
                      {projects.map((proj) => (
                        <div key={proj.id} className="text-xs">
                          <strong>{proj.title}:</strong> {proj.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
        isOpen={isGalleryModalOpen}
        selectedTemplateId={activeBackendTemplateId}
        onSelectTemplate={(tmpl: CVTemplate) => {
          setActiveBackendTemplateId(tmpl.id);
          if (tmpl.colors?.primary) {
            setAccentColor(tmpl.colors.primary);
          }
          const mappedLayout: BuilderTemplateId =
            tmpl.layout === 'compact_dense'
              ? 'compact'
              : tmpl.layout === 'single_column'
              ? 'minimalist'
              : tmpl.category.toLowerCase().includes('executive')
              ? 'executive'
              : tmpl.category.toLowerCase().includes('finance')
              ? 'classic_serif'
              : 'tech_two_column';
          setTemplate(mappedLayout);
        }}
        onOpenInBuilder={(tmpl: CVTemplate) => {
          setActiveBackendTemplateId(tmpl.id);
          if (tmpl.colors?.primary) {
            setAccentColor(tmpl.colors.primary);
          }
          const mappedLayout: BuilderTemplateId =
            tmpl.layout === 'compact_dense'
              ? 'compact'
              : tmpl.layout === 'single_column'
              ? 'minimalist'
              : tmpl.category.toLowerCase().includes('executive')
              ? 'executive'
              : tmpl.category.toLowerCase().includes('finance')
              ? 'classic_serif'
              : 'tech_two_column';
          setTemplate(mappedLayout);
          setIsGalleryModalOpen(false);
          showNotice(`Applied "${tmpl.name}" layout & color theme to Live Builder!`);
        }}
        onClose={() => setIsGalleryModalOpen(false)}
        onExport={(format, templateId) => triggerBuilderExport(format, templateId)}
        isExporting={isDownloadingPdf}
        isAuthenticated={isAuthenticated}
        onAuthSuccess={() => setIsAuthenticated(true)}
        exportError={galleryExportError}
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
          const targetTpl = authModalTemplate?.id || template;
          const shouldDownload = pendingDownloadAfterAuth;
          const shouldCopy = pendingCopyAfterAuth;
          setIsAuthenticated(true);
          if (authModalTemplate) {
            setTemplate(authModalTemplate.id);
          }
          setPendingDownloadAfterAuth(false);
          setPendingCopyAfterAuth(false);
          setAuthModalTemplate(null);
          if (shouldDownload) {
            showNotice(`Account verified! Downloading your ${shouldDownload.toUpperCase()} resume...`);
            triggerBuilderExport(shouldDownload, backendTemplateMap[targetTpl], targetTpl);
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
