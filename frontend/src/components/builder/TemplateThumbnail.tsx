'use client';

import React from 'react';
import ResumePreview from '@/components/builder/ResumePreview';
import {
  asPreviewLayout,
  isDesignerLayout,
  previewFontFamily,
  SAMPLE_PREVIEW_DATA,
  samplePhotoFor,
  templateAccent,
} from '@/lib/templatePreview';
import type { CVTemplate } from '@/types';

/**
 * The real resume, rendered with sample content, in the template's own layout, font and colour.
 * `crop` shows the strongest part of the page (header + first sections) and fades out at the bottom,
 * which reads better at card size than a whole, tiny page.
 */
export default function TemplateThumbnail({
  template,
  fit = true,
  crop = false,
}: {
  template: CVTemplate;
  fit?: boolean;
  crop?: boolean;
}) {
  const layout = asPreviewLayout(template.layout);
  return (
    <div
      className="relative bg-white overflow-hidden text-slate-900"
      style={{
        containerType: 'inline-size',
        fontFamily: previewFontFamily(template.font_family),
        ...(crop ? { aspectRatio: '8.5 / 8.2' } : {}),
      } as React.CSSProperties}
    >
      <ResumePreview
        fit={fit}
        layout={layout}
        centered={layout === 'single_column' && template.font_family === 'Times-Roman'}
        accent={templateAccent(template)}
        photo={isDesignerLayout(template.layout) ? samplePhotoFor(template.id) : null}
        data={SAMPLE_PREVIEW_DATA}
      />
      {crop && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white via-white/80 to-transparent"
        />
      )}
    </div>
  );
}
