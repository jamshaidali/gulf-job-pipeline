'use client';

import React from 'react';

/**
 * Live resume preview. It deliberately mirrors the PDF / Word exporter (src/cv_exporter.py):
 * same sections in the same order, same standard headings, same typographic scale, the same design
 * choices (header, heading style, dates, skills, bullets, density, name case) and the same rules for
 * omitting empty sections, so what you see here is what you download.
 *
 * Sizes are expressed in points of a US Letter page (8.5in wide) and scaled with the width of the
 * surrounding container (`#resume-canvas` sets `container-type: inline-size`), with a small pixel
 * floor so text stays legible on phones.
 */

export type PreviewLayout =
  | 'single_column'
  | 'split_header'
  | 'modern_accent'
  | 'compact_dense'
  // Designer layouts: a profile photo and/or a coloured sidebar (see DESIGNER_LAYOUTS in the exporter)
  | 'sidebar_photo'
  | 'sidebar_light'
  | 'photo_banner';

/** The design choices a template is made of (mirrors STYLE_DEFAULTS in src/cv_templates.py). */
export interface StyleSpec {
  header: 'left' | 'centered' | 'split' | 'banner';
  heading: 'rule' | 'band' | 'bar' | 'underline' | 'plain';
  skills: 'inline' | 'columns';
  dates: 'inline' | 'right';
  bullets: 'dot' | 'dash' | 'arrow';
  density: 'standard' | 'compact' | 'airy';
  caps: boolean;
}

export const DEFAULT_STYLE: StyleSpec = {
  header: 'left',
  heading: 'rule',
  skills: 'inline',
  dates: 'inline',
  bullets: 'dot',
  density: 'standard',
  caps: false,
};

/** Style of the original templates, which only carry a layout (mirrors resolve_style in the backend). */
export const legacyStyle = (layout: PreviewLayout, serifFont: boolean): StyleSpec => {
  const style = { ...DEFAULT_STYLE };
  if (layout === 'split_header' || layout === 'photo_banner') style.header = 'banner';
  else if (layout === 'modern_accent') style.heading = 'band';
  else if (layout === 'compact_dense') style.density = 'compact';
  else if (layout === 'single_column') style.header = serifFont ? 'centered' : 'left';
  return style;
};

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

const GLYPH = { dot: '•', dash: '–', arrow: '›' } as const;

// density -> [body pt, leading ratio, page margin %, name pt, space before section, before entry, after bullet]
const METRICS = {
  compact: [10, 12.4 / 10, 6.47, 20, 6, 2, 1.5],
  standard: [10.5, 13.8 / 10.5, 8.82, 24, 10, 4, 2.5],
  airy: [11, 15.2 / 11, 10, 26, 14, 6, 3.5],
} as const;

export default function ResumePreview({
  layout,
  accent,
  data,
  fit = false,
  centered = false,
  photo = null,
  style = null,
}: {
  layout: PreviewLayout;
  accent: string;
  data: PreviewData;
  /** Centre the header of an original single-column template (serif font). Ignored when `style` is given. */
  centered?: boolean;
  /** Thumbnail mode: keep exact page proportions at any width (text may become tiny). */
  fit?: boolean;
  /** Profile photo (data URL or image path) for the designer layouts. */
  photo?: string | null;
  /** The template's design choices. Original templates omit it and derive them from `layout`. */
  style?: Partial<StyleSpec> | null;
}) {
  const pt = fit ? ptExact : ptReadable;
  const spec: StyleSpec = { ...legacyStyle(layout, centered), ...(style || {}) };
  const sidebar = layout === 'sidebar_photo' || layout === 'sidebar_light';
  const photoBanner = layout === 'photo_banner';
  const banner = spec.header === 'banner' || photoBanner;
  const [body, leadRatio, marginPct, namePt, secBefore, entryBefore, bulletAfter] = METRICS[spec.density];
  const compact = spec.density === 'compact';
  const glyph = GLYPH[spec.bullets];

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

  const sectionHeading = (title: string) => {
    const base: React.CSSProperties = {
      color: spec.heading === 'band' ? accent : accent,
      fontSize: pt(compact ? 11 : 11.5),
      fontWeight: 700,
      lineHeight: 1.2,
      textTransform: 'uppercase',
      marginTop: pt(secBefore + (spec.heading === 'band' ? 3 : 0)),
      marginBottom: pt(3),
    };
    if (spec.heading === 'band') {
      Object.assign(base, { background: tint(accent, 0.1), padding: `${pt(2.5)} ${pt(6)}` });
    } else if (spec.heading === 'rule') {
      Object.assign(base, { paddingBottom: pt(1.5), borderBottom: `1px solid ${RULE}` });
    } else if (spec.heading === 'bar') {
      Object.assign(base, { borderLeft: `${pt(3.2)} solid ${accent}`, paddingLeft: pt(6.8), paddingTop: pt(1.5), paddingBottom: pt(1.5) });
    }
    return (
      <h2 style={base}>
        {title}
        {spec.heading === 'underline' && (
          <span style={{ display: 'block', width: pt(30), height: pt(2.2), background: accent, marginTop: pt(2) }} />
        )}
      </h2>
    );
  };

  const bulletList = (items: string[]) => (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((b, i) => (
        <li key={i} style={{ position: 'relative', paddingLeft: pt(14), marginBottom: pt(bulletAfter) }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: pt(3) }}>
            {glyph}
          </span>
          {b}
        </li>
      ))}
    </ul>
  );

  const entryHead = (strong: string, rest: string, meta: string, date = '') => {
    const left = (
      <span>
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
      </span>
    );
    return (
      <div
        style={{
          marginTop: pt(entryBefore),
          marginBottom: pt(1),
          ...(date ? { display: 'flex', justifyContent: 'space-between', gap: pt(8) } : {}),
        }}
      >
        {left}
        {date && <span style={{ color: MUTED, whiteSpace: 'nowrap', textAlign: 'right' }}>{date}</span>}
      </div>
    );
  };

  const mainSections = (
    <>
      {summary && (
        <section>
          {sectionHeading('Professional Summary')}
          <p>{summary}</p>
        </section>
      )}

      {!sidebar && skills.length > 0 && (
        <section>
          {sectionHeading('Skills')}
          {spec.skills === 'columns' && skills.length > 3 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: pt(6), rowGap: pt(1.5) }}>
              {skills.map((sk, i) => (
                <div key={i}>{sk}</div>
              ))}
            </div>
          ) : (
            <p>{skills.join(', ')}</p>
          )}
        </section>
      )}

      {experiences.length > 0 && (
        <section>
          {sectionHeading('Professional Experience')}
          {experiences.map((e, i) => (
            <div key={i}>
              {spec.dates === 'right' && e.period
                ? entryHead(e.title, e.company, e.location, e.period)
                : entryHead(e.title, e.company, [e.location, e.period].filter(Boolean).join(' | '))}
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

      {!sidebar && educations.length > 0 && (
        <section>
          {sectionHeading('Education')}
          {educations.map((line, i) => (
            <p key={i} style={{ marginBottom: pt(compact ? 2 : 3) }}>
              {line}
            </p>
          ))}
        </section>
      )}
    </>
  );

  const shownName = name ? (spec.caps ? name.toUpperCase() : name) : '';

  // ---- Designer: coloured sidebar (photo, contact, skills, education) + main column ----
  if (sidebar) {
    const dark = layout === 'sidebar_photo';
    const sideText = dark ? '#FFFFFF' : TEXT;
    const sideMuted = dark ? '#E2E8F0' : MUTED;
    const sideHead = dark ? '#FFFFFF' : accent;
    const sideHeading = (title: string) => (
      <h2
        style={{
          color: sideHead,
          fontSize: pt(10.5),
          fontWeight: 700,
          lineHeight: 1.2,
          textTransform: 'uppercase',
          marginTop: pt(12),
          marginBottom: pt(4),
          paddingBottom: pt(2),
          borderBottom: `1px solid ${dark ? '#FFFFFF' : accent}`,
        }}
      >
        {title}
      </h2>
    );
    const rawEducations = data.educations
      .map((e) => ({
        degree: clean(e.degree),
        institution: clean(e.institution),
        extra: [clean(e.year), clean(e.honors)].filter(Boolean).join(' | '),
      }))
      .filter((e) => e.degree || e.institution);

    return (
      <div
        data-testid="resume-preview"
        data-layout={layout}
        style={{
          display: 'grid',
          gridTemplateColumns: '31.05% 1fr',
          color: TEXT,
          fontSize: pt(body),
          lineHeight: leadRatio,
          aspectRatio: '8.5 / 11',
          overflowWrap: 'anywhere',
        }}
      >
        <aside
          style={{
            background: dark ? accent : tint(accent, 0.1),
            color: sideText,
            padding: `${pt(34)} ${pt(16)} ${pt(30)} ${pt(20)}`,
            fontSize: pt(10),
            lineHeight: 1.3,
          }}
        >
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="Profile photo"
              style={{
                display: 'block',
                width: pt(112),
                height: pt(112),
                borderRadius: '50%',
                objectFit: 'cover',
                margin: `0 auto ${pt(4)}`,
              }}
            />
          )}
          {contact.length > 0 && (
            <section>
              {sideHeading('Contact')}
              {contact.map((c, i) => (
                <div key={i} style={{ marginBottom: pt(2) }}>
                  {c}
                </div>
              ))}
            </section>
          )}
          {skills.length > 0 && (
            <section>
              {sideHeading('Skills')}
              {skills.map((sk, i) => (
                <div key={i} style={{ marginBottom: pt(2) }}>
                  {sk}
                </div>
              ))}
            </section>
          )}
          {rawEducations.length > 0 && (
            <section>
              {sideHeading('Education')}
              {rawEducations.map((e, i) => (
                <div key={i} style={{ marginBottom: pt(4) }}>
                  {e.degree && <div style={{ fontWeight: 700 }}>{e.degree}</div>}
                  {e.institution && <div>{e.institution}</div>}
                  {e.extra && <div style={{ color: sideMuted }}>{e.extra}</div>}
                </div>
              ))}
            </section>
          )}
        </aside>
        <div style={{ padding: `${pt(38)} ${pt(34)} ${pt(44)} ${pt(26)}` }}>
          <div style={{ borderBottom: `1.6px solid ${accent}`, paddingBottom: pt(4) }}>
            <div style={{ color: accent, fontSize: pt(namePt), fontWeight: 700, lineHeight: 1.2 }}>
              {shownName || <span style={{ color: RULE }}>Your Full Name</span>}
            </div>
            {headline && (
              <div style={{ color: MUTED, fontSize: pt(12), fontWeight: 700, marginTop: pt(2) }}>{headline}</div>
            )}
          </div>
          {mainSections}
        </div>
      </div>
    );
  }

  const nameNode = shownName || <span style={{ color: RULE }}>Your Full Name</span>;
  const headerRuleColor = spec.heading === 'band' ? accent : RULE;
  const headerRuleWidth = spec.heading === 'band' ? 1.6 : 1.1;

  return (
    <div
      data-testid="resume-preview"
      data-layout={layout}
      style={{
        padding: `${marginPct}%`,
        color: TEXT,
        fontSize: pt(body),
        lineHeight: leadRatio,
        aspectRatio: '8.5 / 11',
        overflowWrap: 'anywhere',
      }}
    >
      {/* ---- Header ---- */}
      {banner ? (
        <div
          style={{
            background: accent,
            color: '#fff',
            padding: `${pt(photoBanner && photo ? 12 : 10)} ${pt(12)}`,
            marginBottom: pt(4),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: pt(12),
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: pt(24), fontWeight: 700, lineHeight: 1.2 }}>
              {shownName || <span style={{ opacity: 0.6 }}>Your Full Name</span>}
            </div>
            {headline && (
              <div style={{ color: '#E2E8F0', fontSize: pt(12), fontWeight: 700, marginTop: pt(2) }}>{headline}</div>
            )}
            {contact.length > 0 && (
              <div style={{ color: '#E2E8F0', fontSize: pt(10), marginTop: pt(2) }}>{contact.join(' | ')}</div>
            )}
          </div>
          {photoBanner && photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="Profile photo"
              style={{ width: pt(84), height: pt(84), borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          )}
        </div>
      ) : spec.header === 'split' ? (
        <div style={{ borderBottom: `${headerRuleWidth}px solid ${headerRuleColor}`, paddingBottom: pt(4) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: pt(12) }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: accent, fontSize: pt(namePt), fontWeight: 700, lineHeight: 1.2 }}>{nameNode}</div>
              {headline && (
                <div style={{ color: accent, fontSize: pt(12), fontWeight: 700, marginTop: pt(2) }}>{headline}</div>
              )}
            </div>
            <div style={{ color: MUTED, fontSize: pt(10), textAlign: 'right', flexShrink: 0, maxWidth: '45%' }}>
              {contact.map((c, i) => (
                <div key={i}>{c}</div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            borderBottom: `${headerRuleWidth}px solid ${headerRuleColor}`,
            paddingBottom: pt(4),
            textAlign: spec.header === 'centered' ? 'center' : 'left',
          }}
        >
          <div style={{ color: accent, fontSize: pt(namePt), fontWeight: 700, lineHeight: 1.2 }}>{nameNode}</div>
          {headline && (
            <div style={{ color: accent, fontSize: pt(12), fontWeight: 700, marginTop: pt(2) }}>{headline}</div>
          )}
          {contact.length > 0 && (
            <div style={{ color: MUTED, fontSize: pt(10), marginTop: pt(3) }}>{contact.join(' | ')}</div>
          )}
        </div>
      )}

      {/* ---- Sections, in the same order as the exported file ---- */}
      {mainSections}
    </div>
  );
}
