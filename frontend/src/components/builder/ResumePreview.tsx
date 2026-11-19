'use client';

import React from 'react';

/**
 * Live resume preview. It deliberately mirrors the PDF / Word exporter (src/cv_exporter.py):
 * same sections in the same order, same standard headings, same typographic scale and the same
 * rules for omitting empty sections, so what you see here is what you download.
 *
 * Sizes are expressed in points of a US Letter page (8.5in wide) and scaled with the width of the
 * surrounding container (`#resume-canvas` sets `container-type: inline-size`), with a small pixel
 * floor so text stays legible on phones.
 */

export type PreviewLayout = 'single_column' | 'split_header' | 'modern_accent' | 'compact_dense';

interface PreviewExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}
interface PreviewEducation {
  id: string;
  institution: string;
  degree: string;
  year: string;
  honors: string;
}
interface PreviewProject {
  id: string;
  title: string;
  description: string;
  techStack: string;
}

export interface PreviewData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  github: string;
  summary: string;
  skills: string[];
  experiences: PreviewExperience[];
  educations: PreviewEducation[];
  projects: PreviewProject[];
}

const TEXT = '#1E293B';
const MUTED = '#475569';
const RULE = '#94A3B8';

/** n points of an 8.5in-wide page, scaled to the container, never below ~80% of the nominal px size. */
const ptReadable = (n: number) => `max(${(n * (96 / 72) * 0.8).toFixed(2)}px, ${((n / 612) * 100).toFixed(3)}cqw)`;
/** Exact proportions at any size (no pixel floor): used for thumbnails of the whole page. */
const ptExact = (n: number) => `${((n / 612) * 100).toFixed(3)}cqw`;

/** Very light tint of a colour (mix with white): identical formula to the exporter's heading band. */
export const tint = (hex: string, strength = 0.1): string => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const mix = (c: number) => Math.round(255 - (255 - c) * strength);
  return `#${[r, g, b].map((c) => mix(c).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};

const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export default function ResumePreview({
  layout,
  accent,
  data,
  fit = false,
  centered = false,
}: {
  layout: PreviewLayout;
  accent: string;
  data: PreviewData;
  /** Centre the header (the classic serif single-column style). Ignored for banner layouts. */
  centered?: boolean;
  /** Thumbnail mode: keep exact page proportions at any width (text may become tiny). */
  fit?: boolean;
}) {
  const pt = fit ? ptExact : ptReadable;
  const compact = layout === 'compact_dense';
  const modern = layout === 'modern_accent';
  const banner = layout === 'split_header';

  const body = compact ? 10 : 10.5;
  const lineHeight = compact ? 1.24 : 1.314;

  const name = clean(data.fullName);
  const headline = clean(data.jobTitle);
  const contact = [data.email, data.phone, data.location, data.linkedIn, data.github].map(clean).filter(Boolean);
  const summary = clean(data.summary);
  const skills = data.skills.map(clean).filter(Boolean);
  const experiences = data.experiences
    .map((e) => ({
      title: clean(e.position),
      company: clean(e.company),
      location: clean(e.location),
      period: [clean(e.startDate), clean(e.endDate)].filter(Boolean).join(' – '),
      bullets: e.bullets.map(clean).filter(Boolean),
    }))
    .filter((e) => e.title || e.company || e.bullets.length > 0);
  const projects = data.projects
    .map((p) => ({ title: clean(p.title), stack: clean(p.techStack), description: clean(p.description) }))
    .filter((p) => p.title || p.description);
  const educations = data.educations
    .map((e) => {
      const left = [clean(e.degree), clean(e.institution)].filter(Boolean).join(', ');
      const extra = [clean(e.year), clean(e.honors)].filter(Boolean).join(' | ');
      return left && extra ? `${left} | ${extra}` : left || extra;
    })
    .filter(Boolean);

  const sectionHeading = (title: string) => (
    <h2
      style={{
        color: accent,
        fontSize: pt(compact ? 11 : 11.5),
        fontWeight: 700,
        lineHeight: 1.2,
        textTransform: 'uppercase',
        marginTop: pt((compact ? 6 : 10) + (modern ? 3 : 0)),
        marginBottom: pt(3),
        ...(modern
          ? { background: tint(accent, 0.1), padding: `${pt(2)} ${pt(6)}` }
          : { paddingBottom: pt(1.5), borderBottom: `1px solid ${RULE}` }),
      }}
    >
      {title}
    </h2>
  );

  const bulletList = (items: string[]) => (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((b, i) => (
        <li
          key={i}
          style={{ position: 'relative', paddingLeft: pt(14), marginBottom: pt(compact ? 1.5 : 2.5) }}
        >
          <span aria-hidden="true" style={{ position: 'absolute', left: pt(3) }}>
            {'•'}
          </span>
          {b}
        </li>
      ))}
    </ul>
  );

  const entryHead = (strong: string, rest: string, meta: string) => (
    <div style={{ marginTop: pt(compact ? 2 : 4), marginBottom: pt(1) }}>
      {strong && <strong style={{ fontWeight: 700 }}>{strong}</strong>}
      {rest && (
        <span>
          {strong ? ' – ' : ''}
          {rest}
        </span>
      )}
      {meta && (
        <span style={{ color: MUTED }}>
          {strong || rest ? ' | ' : ''}
          {meta}
        </span>
      )}
    </div>
  );

  return (
    <div
      data-testid="resume-preview"
      data-layout={layout}
      style={{
        padding: compact ? '6.47%' : '8.82%',
        color: TEXT,
        fontSize: pt(body),
        lineHeight,
        aspectRatio: '8.5 / 11',
        overflowWrap: 'anywhere',
      }}
    >
      {/* ---- Header ---- */}
      {banner ? (
        <div style={{ background: accent, color: '#fff', padding: `${pt(10)} ${pt(12)}`, marginBottom: pt(4) }}>
          <div style={{ fontSize: pt(24), fontWeight: 700, lineHeight: 1.2 }}>
            {name || <span style={{ opacity: 0.6 }}>Your Full Name</span>}
          </div>
          {headline && (
            <div style={{ color: '#E2E8F0', fontSize: pt(12), fontWeight: 700, marginTop: pt(2) }}>{headline}</div>
          )}
          {contact.length > 0 && (
            <div style={{ color: '#E2E8F0', fontSize: pt(10), marginTop: pt(2) }}>{contact.join(' | ')}</div>
          )}
        </div>
      ) : (
        <div
          style={{
            borderBottom: `${modern ? 1.6 : 1.1}px solid ${modern ? accent : RULE}`,
            paddingBottom: pt(4),
            textAlign: centered ? 'center' : 'left',
          }}
        >
          <div style={{ color: accent, fontSize: pt(compact ? 20 : 24), fontWeight: 700, lineHeight: 1.2 }}>
            {name || <span style={{ color: RULE }}>Your Full Name</span>}
          </div>
          {headline && (
            <div style={{ color: accent, fontSize: pt(12), fontWeight: 700, marginTop: pt(2) }}>{headline}</div>
          )}
          {contact.length > 0 && (
            <div style={{ color: MUTED, fontSize: pt(10), marginTop: pt(3) }}>{contact.join(' | ')}</div>
          )}
        </div>
      )}

      {/* ---- Sections, in the same order as the exported file ---- */}
      {summary && (
        <section>
          {sectionHeading('Professional Summary')}
          <p>{summary}</p>
        </section>
      )}

      {skills.length > 0 && (
        <section>
          {sectionHeading('Skills')}
          <p>{skills.join(', ')}</p>
        </section>
      )}

      {experiences.length > 0 && (
        <section>
          {sectionHeading('Professional Experience')}
          {experiences.map((e, i) => (
            <div key={i}>
              {entryHead(e.title, e.company, [e.location, e.period].filter(Boolean).join(' | '))}
              {bulletList(e.bullets)}
            </div>
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section>
          {sectionHeading('Projects')}
          {projects.map((p, i) => (
            <div key={i}>
              {(p.title || p.stack) && entryHead(p.title, '', p.stack)}
              {p.description && bulletList([p.description])}
            </div>
          ))}
        </section>
      )}

      {educations.length > 0 && (
        <section>
          {sectionHeading('Education')}
          {educations.map((line, i) => (
            <p key={i} style={{ marginBottom: pt(compact ? 2 : 3) }}>
              {line}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
