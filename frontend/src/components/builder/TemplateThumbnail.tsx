'use client';

import React from 'react';
import ResumePreview from '@/components/builder/ResumePreview';
import { asPreviewLayout, previewFontFamily, SAMPLE_PREVIEW_DATA, templateAccent } from '@/lib/templatePreview';
import type { CVTemplate } from '@/types';

/** The real resume, rendered with sample content, in the template's own layout, font and colour. */
export default function TemplateThumbnail({ template, fit = true }: { template: CVTemplate; fit?: boolean }) {
  return (
    <div
      className="bg-white overflow-hidden text-slate-900"
      style={{
        containerType: 'inline-size',
        fontFamily: previewFontFamily(template.font_family),
      } as React.CSSProperties}
    >
      <ResumePreview
        fit={fit}
        layout={asPreviewLayout(template.layout)}
        accent={templateAccent(template)}
        data={SAMPLE_PREVIEW_DATA}
      />
    </div>
  );
}
