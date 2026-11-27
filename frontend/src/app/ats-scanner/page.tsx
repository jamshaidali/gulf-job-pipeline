'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TemplateGalleryModal from '@/components/dashboard/TemplateGalleryModal';
import { 
  fetchCurrentUser, 
  fetchATSSample, 
  scanATS, 
  scanATSUpload, 
  exportCustomAtsCv,
  importCvToBuilder,
  ImportedStructuredResume
} from '@/lib/api';
import { ATSScanResults, UserProfile, CVTemplate } from '@/types';
import { 
  Sparkles, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  ArrowRight, 
  RotateCw, 
  Sliders, 
  ShieldCheck, 
  Briefcase, 
  Award, 
  Flame, 
  TrendingUp, 
  ChevronRight,
  ExternalLink,
  Download,
  Info
} from 'lucide-react';

export default function ATSScannerPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Input States
  const [inputMode, setInputMode] = useState<'paste' | 'upload' | 'active'>('paste');
  const [cvText, setCvText] = useState<string>('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');

  // Execution States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isOpeningBuilder, setIsOpeningBuilder] = useState<boolean>(false);
  const [results, setResults] = useState<ATSScanResults | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'keywords' | 'audit' | 'tailored'>('keywords');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Export Modal States
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('gulf_dubai_sapphire');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isLocalAuthed, setIsLocalAuthed] = useState<boolean>(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('tr_auth_user')) {
      setIsLocalAuthed(true);
    }
    fetchCurrentUser().then((u) => {
      setUser(u);
      if (u) setIsLocalAuthed(true);
    });
  }, []);

  const persistResumeForBuilder = (
    parsedResume: ImportedStructuredResume,
    sourceFilename: string,
    scanResults?: ATSScanResults | null,
    includeMissingSkills: boolean = false
  ) => {
    const finalSkills = [...(parsedResume.skills || [])];
    if (includeMissingSkills && scanResults?.skills_analysis?.missing_hard_skills) {
      for (const skill of scanResults.skills_analysis.missing_hard_skills) {
        if (!finalSkills.includes(skill)) {
          finalSkills.push(skill);
        }
      }
    }

    const payload = {
      filename: sourceFilename,
      resume: {
        ...parsedResume,
        skills: finalSkills,
      },
      atsContext: scanResults
        ? {
            overallScore: scanResults.overall_score,
            missingHardSkills: scanResults.skills_analysis?.missing_hard_skills || [],
            missingSoftSkills: scanResults.skills_analysis?.missing_soft_skills || [],
            tailoredHeadline: scanResults.tailored_kit?.headline || '',
            tailoredSummary: scanResults.tailored_kit?.summary || '',
            tailoredBullets: scanResults.tailored_kit?.bullets || [],
            targetJobTitle: jobTitle || '',
            targetCompany: company || '',
          }
        : null,
      timestamp: Date.now(),
    };

    if (typeof window !== 'undefined') {
      const serialized = JSON.stringify(payload);
      localStorage.setItem('tr_builder_imported_cv', serialized);
      sessionStorage.setItem('tr_builder_imported_cv', serialized);
    }
  };

  const handleEditInLiveBuilder = async (includeMissingSkills: boolean = false) => {
    setIsOpeningBuilder(true);
    try {
      let structured: ImportedStructuredResume | undefined = results?.parsed_resume;
      let filename =
        results?.source_filename ||
        (inputMode === 'upload' && cvFile ? cvFile.name : 'Scanned_Resume.pdf');

      // If parsed_resume wasn't already returned in scan results, fetch it explicitly via /api/builder/import-cv
      if (!structured) {
        if (inputMode === 'upload' && cvFile) {
          const imported = await importCvToBuilder({ file: cvFile });
          structured = imported.resume;
          filename = imported.filename || cvFile.name;
        } else if (cvText.trim()) {
          const imported = await importCvToBuilder({ cvText });
          structured = imported.resume;
          filename = imported.filename || 'Pasted_Resume.txt';
        } else {
          const imported = await importCvToBuilder({ useSample: true });
          structured = imported.resume;
          filename = imported.filename || 'Sample_Resume.pdf';
        }
      }

      if (structured) {
        persistResumeForBuilder(structured, filename, results, includeMissingSkills);
      }
    } catch (err) {
      console.error('Could not pre-parse resume for builder:', err);
    } finally {
      setIsOpeningBuilder(false);
      router.push('/builder?from=ats-scanner');
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLoadSample = async () => {
    try {
      setErrorMessage(null);
      const sample = await fetchATSSample();
      setCvText(sample.sample_cv);
      setJobTitle(sample.job_title);
      setCompany(sample.company);
      setJobDescription(sample.job_description);
      setInputMode('paste');
    } catch {
      setErrorMessage('Failed to load sample data. Please try again.');
    }
  };

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!jobDescription.trim()) {
      setErrorMessage('Please paste or provide the target Job Description.');
      return;
    }

    if (inputMode === 'paste' && !cvText.trim()) {
      setErrorMessage('Please paste your CV text or switch to upload mode.');
      return;
    }

    if (inputMode === 'upload' && !cvFile) {
      setErrorMessage('Please select a PDF, DOCX, or TXT file to upload.');
      return;
    }

    setIsScanning(true);
    try {
      let scanData: ATSScanResults;
      if (inputMode === 'upload' && cvFile) {
        const formData = new FormData();
        formData.append('file', cvFile);
        formData.append('job_description', jobDescription);
        if (jobTitle) formData.append('job_title', jobTitle);
        if (company) formData.append('company', company);
        scanData = await scanATSUpload(formData);
      } else {
        scanData = await scanATS({
          cv_text: inputMode === 'paste' ? cvText : '',
          job_description: jobDescription,
          job_title: jobTitle,
          company: company,
          use_active_cv: inputMode === 'active',
        });
      }

      setResults(scanData);
      if (scanData.parsed_resume) {
        const fname =
          scanData.source_filename ||
          (inputMode === 'upload' && cvFile ? cvFile.name : 'Scanned_Resume.pdf');
        persistResumeForBuilder(scanData.parsed_resume, fname, scanData, false);
      }
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during ATS analysis. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportCV = async (format: 'pdf' | 'docx', templateId: string) => {
    setIsExporting(true);
    setExportError(null);
    try {
      let structured: ImportedStructuredResume | undefined = results?.parsed_resume;
      if (!structured) {
        if (inputMode === 'upload' && cvFile) {
          const imported = await importCvToBuilder({ file: cvFile });
          structured = imported.resume;
        } else if (cvText.trim()) {
          const imported = await importCvToBuilder({ cvText });
          structured = imported.resume;
        }
      }

      await exportCustomAtsCv({
        format,
        template_id: templateId || 'gulf_dubai_sapphire',
        job_title: jobTitle || structured?.jobTitle || 'Senior Software Engineer',
        company: company || '',
        parsed_resume: structured || null,
        tailored_summary: results?.tailored_kit?.summary || '',
        tailored_bullets: results?.tailored_kit?.bullets || [],
        missing_keywords: results?.skills_analysis?.missing_hard_skills || [],
      });
      setIsExportModalOpen(false);
    } catch (err: any) {
      setExportError(err?.message || `Failed to download tailored ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper for score gauge color
  const getScoreTheme = (score: number) => {
    if (score >= 80) {
      return {
        stroke: '#10b981', // emerald-500
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        label: 'Top ATS Fit'
      };
    }
    if (score >= 65) {
      return {
        stroke: '#06b6d4', // cyan-500
        text: 'text-cyan-700',
        bg: 'bg-cyan-50',
        border: 'border-cyan-200',
        badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        label: 'Competitive Match'
      };
    }
    if (score >= 50) {
      return {
        stroke: '#f59e0b', // amber-500
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        label: 'Needs Keyword Optimization'
      };
    }
    return {
      stroke: '#f43f5e', // rose-500
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      label: 'Critical Gaps Detected'
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      <Navbar user={user} />

      {/* Hero Header */}
      <section className="relative pt-12 pb-10 bg-gradient-to-b from-white via-cyan-50/20 to-slate-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100/70 text-cyan-900 border border-cyan-200/80 text-xs font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
            <span>AI ATS Resume Diagnostic Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight max-w-3xl mx-auto leading-tight">
            Check Your CV ATS Score <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600">
              Against Any Job Description
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium">
            Over 75% of CVs are filtered out by enterprise ATS scanners before a human recruiter sees them. 
            Scan your resume against any job description, uncover missing keywords, and get tailored impact bullets in seconds.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={handleLoadSample}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs transition hover:border-slate-300 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Sample Tech Job (1-Click Demo)</span>
            </button>
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              100% Free &amp; Private &bull; No credit card required
            </span>
          </div>
        </div>
      </section>

      {/* Main Dual-Input Form */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleRunScan} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT CARD: RESUME INPUT */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900">Your Resume / CV</h2>
                  </div>

                  {/* Mode Switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setInputMode('paste')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        inputMode === 'paste' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('upload')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        inputMode === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Upload File
                    </button>
                    {user && (
                      <button
                        type="button"
                        onClick={() => setInputMode('active')}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          inputMode === 'active' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Active CV
                      </button>
                    )}
                  </div>
                </div>

                {/* Input Area by Mode */}
                <div className="mt-4">
                  {inputMode === 'paste' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Paste your full CV / Resume text:
                      </label>
                      <textarea
                        value={cvText}
                        onChange={(e) => setCvText(e.target.value)}
                        placeholder="Paste your CV text here (Summary, Experience, Skills, Education)..."
                        rows={14}
                        className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition resize-y"
                      />
                      <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                        <span>Tip: Include your skills section &amp; recent experience bullets</span>
                        <span>{cvText ? `${cvText.split(/\s+/).filter(Boolean).length} words` : '0 words'}</span>
                      </div>
                    </div>
                  )}

                  {inputMode === 'upload' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Upload your Resume (PDF, DOCX, or TXT):
                        </label>
                        {cvFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setCvFile(null);
                              setResults(null);
                              if (typeof window !== 'undefined') {
                                localStorage.removeItem('tr_builder_imported_cv');
                                sessionStorage.removeItem('tr_builder_imported_cv');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Remove / Reset Uploaded CV</span>
                          </button>
                        )}
                      </div>
                      <div className="border-2 border-dashed border-slate-200 hover:border-cyan-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-cyan-50/30 transition cursor-pointer relative group">
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.txt"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setCvFile(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center group-hover:scale-105 transition">
                            <Upload className="w-6 h-6 text-cyan-600" />
                          </div>
                          <span className="text-xs font-black text-slate-800">
                            {cvFile ? cvFile.name : 'Click to upload or drag & drop'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {cvFile 
                              ? `${(cvFile.size / 1024).toFixed(1)} KB selected — Click to replace`
                              : 'Supports PDF, Word (.docx), or plain text (.txt) up to 5 MB'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {inputMode === 'active' && (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 my-4">
                      <FileText className="w-10 h-10 text-cyan-600 mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Using Your Saved Active CV</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          We will scan against the active resume currently saved on your RateYourCV account.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                        <Check className="w-3.5 h-3.5" />
                        <span>Ready to scan with your active profile</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Text is analyzed securely in-memory and never shared with recruiters without your permission.</span>
                </div>
                {(cvFile || cvText || results) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCvFile(null);
                      setCvText('');
                      setResults(null);
                      setErrorMessage(null);
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('tr_builder_imported_cv');
                        sessionStorage.removeItem('tr_builder_imported_cv');
                      }
                    }}
                    className="text-rose-600 hover:text-rose-800 font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Reset CV</span>
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT CARD: TARGET JOB DESCRIPTION */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900">Target Job Description</h2>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">LinkedIn, Indeed, Glassdoor, etc.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Job Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Backend Engineer"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Stripe, Datadog, Spotify"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Paste Full Job Description Text: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job posting requirements, responsibilities, and qualifications here..."
                    rows={inputMode === 'paste' ? 10 : 12}
                    className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-y"
                    required
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                    <span>The more detailed the JD, the more precise the ATS keyword audit</span>
                    <span>{jobDescription ? `${jobDescription.split(/\s+/).filter(Boolean).length} words` : '0 words'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-indigo-600 hover:text-indigo-800 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Insert sample Tech job description</span>
                </button>
              </div>
            </div>

          </div>

          {/* PRIMARY SUBMIT CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isScanning}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 hover:from-black hover:to-indigo-900 text-white font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-60"
            >
              {isScanning ? (
                <>
                  <RotateCw className="w-5 h-5 text-cyan-400 animate-spin" />
                  <span>Analyzing ATS Keywords &amp; Format...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
                  <span>Scan Resume Against Job Description</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* RESULTS SECTION */}
        {results && (
          <div ref={resultsRef} className="pt-6 space-y-6 animate-fadeIn">
            
            {/* Top Score Summary Banner */}
            {(() => {
              const theme = getScoreTheme(results.overall_score);
              const circumference = 2 * Math.PI * 44;
              const strokeDashoffset = circumference - (results.overall_score / 100) * circumference;

              return (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    
                    {/* Left: Score Gauge + Verdict */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                      
                      {/* Circular Gauge */}
                      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                        <svg className="w-28 h-28 transform -rotate-90">
                          <circle
                            cx="56"
                            cy="56"
                            r="44"
                            stroke="#e2e8f0"
                            strokeWidth="9"
                            fill="transparent"
                          />
                          <circle
                            cx="56"
                            cy="56"
                            r="44"
                            stroke={theme.stroke}
                            strokeWidth="9"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            {results.overall_score}%
                          </span>
                          <span className="text-[10px] font-extrabold uppercase text-slate-400">
                            ATS Score
                          </span>
                        </div>
                      </div>

                      {/* Verdict & Context */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-black border ${theme.badge}`}>
                            {results.fit_verdict}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            Target: {jobTitle || 'Target Role'}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                          {results.summary_text}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-xl">
                          Based on algorithmic analysis of {results.keywords_table.length} job-specific keywords, technical requirements, action verbs, and standard ATS formatting criteria.
                        </p>
                      </div>
                    </div>

                    {/* Right: Quick Action to Export CV */}
                    <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => handleEditInLiveBuilder(false)}
                        disabled={isOpeningBuilder}
                        className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isOpeningBuilder ? (
                          <>
                            <RotateCw className="w-4 h-4 text-cyan-400 animate-spin" />
                            <span>Loading CV into Builder...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span>Edit in Live Visual Builder &rarr;</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsExportModalOpen(true)}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-white" />
                        <span>Export Tailored CV (500+ Designs)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('tailored')}
                        className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                        <span>View AI Tailored Bullets</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Sub-Score Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">Technical Skills</span>
                        <span className="font-black text-slate-900">{results.sub_scores.hard_skills}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${results.sub_scores.hard_skills}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {results.skills_analysis.matched_hard_skills.length} matched, {results.skills_analysis.missing_hard_skills.length} missing
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">Soft Skills</span>
                        <span className="font-black text-slate-900">{results.sub_scores.soft_skills}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${results.sub_scores.soft_skills}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {results.skills_analysis.matched_soft_skills.length} matched in JD
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">Experience Impact</span>
                        <span className="font-black text-slate-900">{results.sub_scores.experience_impact}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${results.sub_scores.experience_impact}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {results.sections_audit.experience.action_verbs_count} action verbs &bull; {results.sections_audit.experience.metrics_count} metrics
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">Formatting Audit</span>
                        <span className="font-black text-slate-900">{results.sub_scores.formatting_audit}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${results.sub_scores.formatting_audit}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Contact, summary, skills &amp; education
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Priority Action Items Checklist */}
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-black text-amber-950 uppercase tracking-wider">
                  Top Recommended Fixes to Reach 90%+ Match
                </h4>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                {results.priority_action_items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-800">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto text-xs sm:text-sm font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('keywords')}
                className={`pb-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'keywords'
                    ? 'border-cyan-600 text-cyan-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                1. Keywords &amp; Skills Gap ({results.skills_analysis.missing_hard_skills.length} Missing)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`pb-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'audit'
                    ? 'border-cyan-600 text-cyan-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                2. ATS Section &amp; Formatting Audit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tailored')}
                className={`pb-3 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'tailored'
                    ? 'border-cyan-600 text-cyan-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                3. AI-Tailored Resume Kit (Bullets &amp; Headline)
              </button>
            </div>

            {/* TAB CONTENT 1: KEYWORDS & SKILLS */}
            {activeTab === 'keywords' && (
              <div className="space-y-6">
                
                {/* Missing Hard Skills */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Missing Critical Technical Skills</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        These tools were explicitly required in the JD but not found in your CV. Add them to your Skills or Experience section.
                      </p>
                    </div>
                    {results.skills_analysis.missing_hard_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditInLiveBuilder(true)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-100" />
                          <span>Add All to Live Builder &rarr;</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(results.skills_analysis.missing_hard_skills.join(', '), 'missing-all')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'missing-all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy All Missing</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {results.skills_analysis.missing_hard_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {results.skills_analysis.missing_hard_skills.map((skill, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 group"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(skill, `skill-${idx}`)}
                            title="Copy keyword"
                            className="text-rose-400 hover:text-rose-700 transition cursor-pointer"
                          >
                            {copiedKey === `skill-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Zero missing technical skills! Your resume covers all core technical stack requirements.</span>
                    </div>
                  )}
                </div>

                {/* Matched Hard Skills */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Matched Technical Skills</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {results.skills_analysis.matched_hard_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Soft Skills Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Matched Methodologies / Soft Skills</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {results.skills_analysis.matched_soft_skills.length > 0 ? (
                        results.skills_analysis.matched_soft_skills.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                            ✓ {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">None detected in CV</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Missing Methodologies / Soft Skills</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {results.skills_analysis.missing_soft_skills.length > 0 ? (
                        results.skills_analysis.missing_soft_skills.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                            + {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold">All detected soft skills present!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Keywords Frequency Table */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900">
                      Top Job Description Keyword Frequency
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">Ranked by frequency in JD</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Keyword</th>
                          <th className="py-2.5 px-3">Occurrences in JD</th>
                          <th className="py-2.5 px-3">Status in CV</th>
                          <th className="py-2.5 px-3">Impact Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.keywords_table.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-bold text-slate-800">{row.keyword}</td>
                            <td className="py-2 px-3 text-slate-500 font-semibold">{row.count}x</td>
                            <td className="py-2 px-3">
                              {row.in_cv ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                  <Check className="w-3.5 h-3.5" /> Present
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                                  <XCircle className="w-3.5 h-3.5" /> Missing
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                row.priority === 'High' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {row.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT 2: SECTION & FORMATTING AUDIT */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                
                {/* Contact Info Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {results.sections_audit.contact_info.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">Contact Information &amp; Header</h4>
                        <p className="text-xs text-slate-500">{results.sections_audit.contact_info.notes}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-800">
                      Score: {results.sections_audit.contact_info.score}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
                    <div className={`p-2.5 rounded-xl border flex items-center gap-1.5 ${
                      results.sections_audit.contact_info.has_email ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {results.sections_audit.contact_info.has_email ? '✓ Email' : '✗ Email Missing'}
                    </div>
                    <div className={`p-2.5 rounded-xl border flex items-center gap-1.5 ${
                      results.sections_audit.contact_info.has_phone ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {results.sections_audit.contact_info.has_phone ? '✓ Phone Number' : '✗ Phone Missing'}
                    </div>
                    <div className={`p-2.5 rounded-xl border flex items-center gap-1.5 ${
                      results.sections_audit.contact_info.has_linkedin ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {results.sections_audit.contact_info.has_linkedin ? '✓ LinkedIn Link' : '○ No LinkedIn'}
                    </div>
                    <div className={`p-2.5 rounded-xl border flex items-center gap-1.5 ${
                      results.sections_audit.contact_info.has_github ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {results.sections_audit.contact_info.has_github ? '✓ GitHub / Portfolio' : '○ No GitHub'}
                    </div>
                  </div>
                </div>

                {/* Professional Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {results.sections_audit.summary.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">Professional Summary Section</h4>
                        <p className="text-xs text-slate-500">{results.sections_audit.summary.notes}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-800">{results.sections_audit.summary.score}%</span>
                  </div>
                </div>

                {/* Experience & Action Verbs */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {results.sections_audit.experience.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">Experience &amp; Measurable Metrics</h4>
                        <p className="text-xs text-slate-500">{results.sections_audit.experience.notes}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-800">{results.sections_audit.experience.score}%</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {results.sections_audit.experience.action_verbs_found.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-600">Action Verbs Found:</span>
                        {results.sections_audit.experience.action_verbs_found.map((verb, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                            {verb}
                          </span>
                        ))}
                      </div>
                    )}

                    {results.sections_audit.experience.metrics_found.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-600">Metrics Found:</span>
                        {results.sections_audit.experience.metrics_found.map((metric, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 font-mono font-bold">
                            {metric}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {results.sections_audit.skills.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">Technical Skills Header</h4>
                        <p className="text-xs text-slate-500">{results.sections_audit.skills.notes}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-800">{results.sections_audit.skills.score}%</span>
                  </div>
                </div>

                {/* Education Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {results.sections_audit.education.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">Education Credentials</h4>
                        <p className="text-xs text-slate-500">{results.sections_audit.education.notes}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-800">{results.sections_audit.education.score}%</span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT 3: AI-TAILORED RESUME KIT */}
            {activeTab === 'tailored' && (
              <div className="space-y-6">
                
                {/* Tailored Headline */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-600" />
                      <span>Optimized ATS Headline</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleCopy(results.tailored_kit.headline, 'headline')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'headline' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'headline' ? 'Copied!' : 'Copy Headline'}</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 font-mono">
                    {results.tailored_kit.headline}
                  </div>
                </div>

                {/* Tailored Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Tailored Professional Executive Summary</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleCopy(results.tailored_kit.summary, 'summary')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'summary' ? 'Copied!' : 'Copy Summary'}</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    {results.tailored_kit.summary}
                  </div>
                </div>

                {/* Tailored Experience Bullets */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>Google X-Y-Z Achievement Bullets</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Adding the posting's wording where it is true, with real results, so the resume reads well to people and to software.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {results.tailored_kit.bullets.map((b, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                            {b.focus}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(b.bullet, `bullet-${idx}`)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedKey === `bullet-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === `bullet-${idx}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                          &bull; {b.bullet}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Export CTA Banner */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 shadow-sm">
                    <div className="space-y-1 text-center sm:text-left">
                      <h4 className="text-base font-black tracking-tight">
                        Ready to apply? Export your tailored CV in 500+ designs
                      </h4>
                      <p className="text-xs text-slate-300">
                        Download an ATS-optimized, single-column PDF or Microsoft Word document formatted for enterprise ATS systems.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsExportModalOpen(true)}
                      className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition shadow-md flex items-center gap-2 cursor-pointer flex-shrink-0"
                    >
                      <Download className="w-4 h-4 text-slate-950" />
                      <span>Choose Template &amp; Download</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* EDUCATIONAL & FAQ SECTION */}
        <section className="pt-12 border-t border-slate-200 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              How ATS Scanners Work in 2026
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              What applicant tracking systems (ATS) generally do with your resume.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Keyword Matching</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Recruiters and ATS software often search and filter by the skills and terms in the job description, so using the posting's wording, where it is true, helps your resume turn up.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Single-Column Formatting</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complex multi-column tables, graphics, and text boxes can confuse ATS parsers. Our ATS-safe templates use a single column, standard headings, and real, selectable text.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Quantifiable Metrics</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Modern AI filters look for measurable impact (percentages, revenue, performance gains) rather than passive responsibility lists.
              </p>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      {/* 500+ TEMPLATES EXPORT MODAL */}
      <TemplateGalleryModal
        isOpen={isExportModalOpen}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={(tmpl: CVTemplate) => setSelectedTemplateId(tmpl.id)}
        onClose={() => {
          setExportError(null);
          setIsExportModalOpen(false);
        }}
        onExport={handleExportCV}
        isExporting={isExporting}
        isAuthenticated={Boolean(user) || isLocalAuthed}
        onAuthSuccess={() => {
          setIsLocalAuthed(true);
          fetchCurrentUser().then((u) => {
            if (u) setUser(u);
          });
        }}
        exportError={exportError}
      />
    </div>
  );
}
