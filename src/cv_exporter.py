"""ATS-Optimized Tailored CV / Resume PDF and DOCX Exporter with 100+ Template Engine."""

import io
from xml.sax.saxutils import escape as xml_escape
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    KeepTogether,
    Table,
    TableStyle
)

from src.cv_templates import get_template, get_palette

try:
    import docx
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
except ImportError:
    docx = None


def _hex_to_rgb(hex_code: str):
    """Converts hex '#RRGGBB' to tuple of (r, g, b) ints."""
    h = hex_code.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def _esc(val: Any) -> str:
    """Safely escapes text for ReportLab XML Paragraph parser."""
    if val is None:
        return ""
    return xml_escape(str(val).strip())


def _normalize_work_history(parsed_resume: Dict[str, Any], user_prefs: Dict[str, Any], primary_skills: List[str]) -> List[Dict[str, Any]]:
    """Extracts work history from parsed_resume['experiences'] or user_prefs['work_history']."""
    experiences = parsed_resume.get("experiences") or []
    normalized: List[Dict[str, Any]] = []
    for exp in experiences:
        if not isinstance(exp, dict):
            continue
        title = exp.get("position") or exp.get("title") or "Software Engineer"
        company = exp.get("company") or "Technology Organization"
        location = exp.get("location") or ""
        start = exp.get("startDate") or ""
        end = exp.get("endDate") or ""
        period = exp.get("period") or (f"{start} – {end}".strip(" –") if (start or end) else "")
        bullets = [str(b).strip() for b in (exp.get("bullets") or []) if str(b).strip()]
        normalized.append({
            "title": title,
            "company": company,
            "location": location,
            "period": period,
            "bullets": bullets,
        })
    if normalized:
        return normalized

    pref_history = user_prefs.get("work_history") or []
    if pref_history:
        return pref_history

    top_skill = primary_skills[0] if primary_skills else "Software"
    second_skill = primary_skills[1] if len(primary_skills) > 1 else "Backend"
    return [
        {
            "title": f"Senior {top_skill} Engineer",
            "company": "Enterprise Engineering Solutions",
            "period": "2021 – Present",
            "location": "Remote & Hybrid",
            "bullets": [
                f"Led end-to-end design and delivery of mission-critical services utilizing {top_skill} and cloud infrastructure.",
                "Mentored engineering personnel on system design, automated testing, and clean architecture principles.",
                "Collaborated directly with cross-functional product stakeholders to translate requirements into scalable specifications."
            ]
        },
        {
            "title": f"Software Engineer ({second_skill})",
            "company": "Innovative Software Lab",
            "period": "2019 – 2021",
            "location": "Hybrid",
            "bullets": [
                "Developed high-throughput REST APIs and integrated asynchronous message queuing for distributed transaction processing.",
                "Implemented relational database schema migrations and automated indexing strategies to support 500k+ daily queries."
            ]
        }
    ]


def _normalize_education(parsed_resume: Dict[str, Any], user_prefs: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extracts education from parsed_resume['educations'] or user_prefs['education']."""
    educations = parsed_resume.get("educations") or []
    normalized: List[Dict[str, Any]] = []
    for edu in educations:
        if not isinstance(edu, dict):
            continue
        degree = edu.get("degree") or "Bachelor of Science in Computer Science"
        institution = edu.get("institution") or "University"
        year = edu.get("year") or ""
        honors = edu.get("honors") or ""
        normalized.append({
            "degree": degree,
            "institution": institution,
            "year": year,
            "honors": honors,
        })
    if normalized:
        return normalized

    pref_edu = user_prefs.get("education") or []
    if pref_edu:
        return pref_edu

    return [
        {
            "degree": "Bachelor of Science in Computer Science (BSCS)",
            "institution": "University of Engineering & Technology",
            "year": "2019",
            "honors": ""
        }
    ]


def generate_tailored_pdf(
    job: Dict[str, Any],
    user_profile: Dict[str, Any],
    user_prefs: Dict[str, Any],
    template_id: Optional[str] = "gulf_dubai_sapphire",
    parsed_resume: Optional[Dict[str, Any]] = None,
) -> bytes:
    """Generates an ATS-compliant, single/multi-page PDF tailored to a specific job posting in the selected template style."""
    parsed = parsed_resume or job.get("parsed_resume") or {}
    tmpl = get_template(template_id or "gulf_dubai_sapphire")
    pal = get_palette(tmpl.get("palette", "dubai_sapphire"))
    layout = tmpl.get("layout", "single_column")
    font_name = tmpl.get("font_family", "Helvetica")
    font_bold = f"{font_name}-Bold"

    primary_color = colors.HexColor(pal["primary"])
    secondary_color = colors.HexColor(pal["secondary"])
    text_color = colors.HexColor(pal["text"])
    rule_color = colors.HexColor(pal["rule"])

    is_compact = (layout == "compact_dense")
    margin_size = 0.4 * inch if is_compact else 0.5 * inch

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=margin_size,
        rightMargin=margin_size,
        topMargin=margin_size,
        bottomMargin=margin_size
    )

    styles = getSampleStyleSheet()

    # Custom ATS Typography Styles driven by the template theme
    title_style = ParagraphStyle(
        f'ATSTitle_{tmpl["id"]}',
        parent=styles['Heading1'],
        fontName=font_bold,
        fontSize=18 if not is_compact else 16,
        leading=22 if not is_compact else 19,
        textColor=primary_color,
        spaceAfter=2,
        alignment=0
    )

    banner_title_style = ParagraphStyle(
        f'ATSBannerTitle_{tmpl["id"]}',
        parent=styles['Heading1'],
        fontName=font_bold,
        fontSize=17,
        leading=21,
        textColor=colors.white,
        spaceAfter=2,
        alignment=0
    )

    subtitle_style = ParagraphStyle(
        f'ATSSubtitle_{tmpl["id"]}',
        parent=styles['Normal'],
        fontName=font_bold,
        fontSize=10.5 if not is_compact else 10,
        leading=13 if not is_compact else 12,
        textColor=secondary_color,
        spaceAfter=3,
        alignment=0
    )

    banner_subtitle_style = ParagraphStyle(
        f'ATSBannerSubtitle_{tmpl["id"]}',
        parent=styles['Normal'],
        fontName=font_bold,
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#A5F3FC"),
        spaceAfter=3,
        alignment=0
    )

    contact_style = ParagraphStyle(
        f'ATSContact_{tmpl["id"]}',
        parent=styles['Normal'],
        fontName=font_name,
        fontSize=8.5 if not is_compact else 8,
        leading=11 if not is_compact else 10,
        textColor=colors.HexColor('#475569'),
        spaceAfter=6,
        alignment=0
    )

    banner_contact_style = ParagraphStyle(
        f'ATSBannerContact_{tmpl["id"]}',
        parent=styles['Normal'],
        fontName=font_name,
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#E2E8F0"),
        spaceAfter=0,
        alignment=0
    )

    section_heading_style = ParagraphStyle(
        f'ATSSection_{tmpl["id"]}',
        parent=styles['Heading2'],
        fontName=font_bold,
        fontSize=10.5 if not is_compact else 9.5,
        leading=13 if not is_compact else 11.5,
        textColor=primary_color if layout != "modern_accent" else secondary_color,
        spaceBefore=7 if not is_compact else 5,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        f'ATSBody_{tmpl["id"]}',
        parent=styles['Normal'],
        fontName=font_name,
        fontSize=8.5 if not is_compact else 8,
        leading=11.5 if not is_compact else 10.5,
        textColor=text_color,
        spaceAfter=3 if not is_compact else 2
    )

    bullet_style = ParagraphStyle(
        f'ATSBullet_{tmpl["id"]}',
        parent=styles['Normal'],
        fontName=font_name,
        fontSize=8.5 if not is_compact else 8,
        leading=11.5 if not is_compact else 10.5,
        textColor=text_color,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5 if not is_compact else 1.5
    )

    story = []

    # 1. Candidate Info (prioritize parsed uploaded CV -> user preferences -> user profile)
    cand_name = (
        parsed.get("fullName")
        or user_prefs.get("candidate_name")
        or user_profile.get("full_name")
        or user_profile.get("username")
        or "Candidate"
    )
    email = parsed.get("email") or user_prefs.get("email") or user_profile.get("email") or "candidate@talentradar.ai"
    phone = parsed.get("phone") or user_prefs.get("phone") or "+1 (555) 234-5678"
    loc = parsed.get("location") or user_prefs.get("current_location") or "Open to Remote & Hybrid"
    linkedin = parsed.get("linkedIn") or ""
    github = parsed.get("github") or ""

    target_role = job.get("title") or parsed.get("jobTitle") or "Software Engineer"
    target_company = job.get("company") or ""

    subtitle_line = (
        f"{_esc(target_role)} &bull; Tailored for {_esc(target_company)}"
        if target_company and target_company.lower() not in ["target company", "hiring team"]
        else _esc(target_role)
    )

    contact_parts = [_esc(email), _esc(phone), _esc(loc)]
    if linkedin:
        contact_parts.append(_esc(linkedin))
    if github:
        contact_parts.append(_esc(github))
    contact_line = " &nbsp;|&nbsp; ".join([p for p in contact_parts if p])

    # Header Construction based on Template Layout
    if layout == "split_header":
        header_table = Table(
            [
                [Paragraph(_esc(cand_name), banner_title_style)],
                [Paragraph(subtitle_line, banner_subtitle_style)],
                [Paragraph(contact_line, banner_contact_style)]
            ],
            colWidths=[7.5 * inch]
        )
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), primary_color),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 6))
    else:
        story.append(Paragraph(_esc(cand_name), title_style))
        story.append(Paragraph(subtitle_line, subtitle_style))
        story.append(Paragraph(contact_line, contact_style))
        story.append(HRFlowable(width="100%", thickness=1, color=rule_color, spaceBefore=1, spaceAfter=5))

    def add_section_header(title_text: str):
        if layout == "modern_accent":
            story.append(Paragraph(f"<font color='{pal['accent']}'>&#9646;</font> {title_text}", section_heading_style))
        else:
            story.append(Paragraph(title_text, section_heading_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=rule_color, spaceBefore=1, spaceAfter=3))

    # 2. Tailored Executive Pitch / Summary
    add_section_header("PROFESSIONAL SUMMARY")

    primary_skills = (
        parsed.get("skills")
        or user_prefs.get("primary_stack")
        or ["Python", "FastAPI", "Django", "PostgreSQL", "Docker", "AWS"]
    )
    custom_summary = parsed.get("summary") or job.get("tailored_summary") or ""
    if custom_summary:
        story.append(Paragraph(_esc(custom_summary), body_style))
    else:
        company_clause = f" at <b>{_esc(target_company)}</b>" if target_company else ""
        summary_text = (
            f"Results-driven <b>{_esc(target_role)}</b>{company_clause} with a proven track record of "
            f"architecting scalable production systems, optimizing critical workflows, and delivering measurable business impact. "
            f"Core technical expertise spans <b>{_esc(', '.join(primary_skills[:8]))}</b>."
        )
        story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 3))

    # 3. Core Competencies & Matched ATS Keywords
    add_section_header("CORE TECHNICAL COMPETENCIES &amp; SKILLS")

    missing_kws = job.get("missing_keywords") or []
    all_competencies = list(dict.fromkeys([str(s) for s in primary_skills] + [str(k) for k in missing_kws]))
    comp_str = " &nbsp;&bull;&nbsp; ".join([_esc(c) for c in all_competencies[:22] if c])
    story.append(Paragraph(f"<b>Key Technologies &amp; Skills:</b> {comp_str}", body_style))
    story.append(Spacer(1, 3))

    # 4. Tailored Accomplishments (if provided from ATS scan)
    tailored_bullets = job.get("tailored_bullets") or []
    if tailored_bullets:
        header_label = (
            f"KEY ATS-TAILORED HIGHLIGHTS ({_esc(target_company.upper())})"
            if target_company
            else "KEY ATS-TAILORED HIGHLIGHTS"
        )
        add_section_header(header_label)
        for b in tailored_bullets:
            if isinstance(b, dict):
                b_text = b.get("suggested_bullet") or b.get("bullet") or ""
            else:
                b_text = str(b)
            if b_text:
                story.append(Paragraph(f"&bull;&nbsp;&nbsp;{_esc(b_text)}", bullet_style))
        story.append(Spacer(1, 3))

    # 5. Professional Work History
    add_section_header("PROFESSIONAL EXPERIENCE")

    work_history = _normalize_work_history(parsed, user_prefs, primary_skills)
    for item in work_history:
        exp_header = f"<b>{_esc(item.get('title', 'Engineer'))}</b> &ndash; <i>{_esc(item.get('company', 'Company'))}</i>"
        meta_bits = [ bit for bit in [_esc(item.get('location', '')), _esc(item.get('period', ''))] if bit ]
        exp_meta = f"<font color='#64748B'>{' | '.join(meta_bits)}</font>" if meta_bits else ""

        header_line = f"{exp_header} <font color='#94A3B8'>&bull;</font> {exp_meta}" if exp_meta else exp_header
        block = [Paragraph(header_line, body_style)]
        for b in item.get("bullets", []):
            if str(b).strip():
                block.append(Paragraph(f"&bull;&nbsp;&nbsp;{_esc(b)}", bullet_style))
        block.append(Spacer(1, 2))
        story.append(KeepTogether(block))

    # 6. Projects (if present in parsed resume)
    projects = parsed.get("projects") or []
    if projects:
        add_section_header("KEY PROJECTS &amp; TECHNICAL HIGHLIGHTS")
        for proj in projects:
            if not isinstance(proj, dict):
                continue
            p_title = _esc(proj.get("title") or "Project")
            p_stack = _esc(proj.get("techStack") or "")
            p_desc = _esc(proj.get("description") or "")
            title_line = f"<b>{p_title}</b>" + (f" <font color='#64748B'>({p_stack})</font>" if p_stack else "")
            story.append(Paragraph(title_line, body_style))
            if p_desc:
                story.append(Paragraph(f"&bull;&nbsp;&nbsp;{p_desc}", bullet_style))
        story.append(Spacer(1, 2))

    # 7. Education & Certifications
    add_section_header("EDUCATION &amp; CREDENTIALS")

    education = _normalize_education(parsed, user_prefs)
    for edu in education:
        deg = _esc(edu.get('degree', 'Degree'))
        inst = _esc(edu.get('institution', 'Institution'))
        yr = _esc(edu.get('year', ''))
        yr_str = f" <font color='#64748B'>({yr})</font>" if yr else ""
        edu_text = f"<b>{deg}</b> &ndash; {inst}{yr_str}"
        story.append(Paragraph(edu_text, body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_tailored_docx(
    job: Dict[str, Any],
    user_profile: Dict[str, Any],
    user_prefs: Dict[str, Any],
    template_id: Optional[str] = "gulf_dubai_sapphire",
    parsed_resume: Optional[Dict[str, Any]] = None,
) -> bytes:
    """Generates an ATS-compliant Word document (.docx) tailored to the specific job using template colors."""
    if docx is None:
        raise ImportError("python-docx is not installed.")

    parsed = parsed_resume or job.get("parsed_resume") or {}
    tmpl = get_template(template_id or "gulf_dubai_sapphire")
    pal = get_palette(tmpl.get("palette", "dubai_sapphire"))
    primary_rgb = _hex_to_rgb(pal["primary"])
    secondary_rgb = _hex_to_rgb(pal["secondary"])

    doc = docx.Document()

    # Page Margins 0.5 inches
    for section in doc.sections:
        section.top_margin = Inches(0.5)
        section.bottom_margin = Inches(0.5)
        section.left_margin = Inches(0.5)
        section.right_margin = Inches(0.5)

    cand_name = (
        parsed.get("fullName")
        or user_prefs.get("candidate_name")
        or user_profile.get("full_name")
        or user_profile.get("username")
        or "Candidate"
    )
    email = parsed.get("email") or user_prefs.get("email") or user_profile.get("email") or "candidate@talentradar.ai"
    phone = parsed.get("phone") or user_prefs.get("phone") or "+1 (555) 234-5678"
    loc = parsed.get("location") or user_prefs.get("current_location") or "Open to Remote & Hybrid"
    linkedin = parsed.get("linkedIn") or ""
    github = parsed.get("github") or ""

    target_role = job.get("title") or parsed.get("jobTitle") or "Software Engineer"
    target_company = job.get("company") or ""
    primary_skills = (
        parsed.get("skills")
        or user_prefs.get("primary_stack")
        or ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"]
    )

    # Header
    title_p = doc.add_paragraph()
    r_name = title_p.add_run(str(cand_name))
    r_name.bold = True
    r_name.font.size = Pt(18)
    r_name.font.color.rgb = RGBColor(*primary_rgb)
    r_name.font.name = 'Calibri'
    title_p.paragraph_format.space_after = Pt(2)

    sub_p = doc.add_paragraph()
    sub_text = (
        f"{target_role} — Tailored for {target_company}"
        if target_company and target_company.lower() not in ["target company", "hiring team"]
        else str(target_role)
    )
    r_sub = sub_p.add_run(sub_text)
    r_sub.bold = True
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(*secondary_rgb)
    r_sub.font.name = 'Calibri'
    sub_p.paragraph_format.space_after = Pt(2)

    contact_parts = [str(email), str(phone), str(loc)]
    if linkedin:
        contact_parts.append(str(linkedin))
    if github:
        contact_parts.append(str(github))

    contact_p = doc.add_paragraph()
    r_con = contact_p.add_run(" | ".join([p for p in contact_parts if p]))
    r_con.font.size = Pt(9)
    r_con.font.color.rgb = RGBColor(100, 116, 139)
    r_con.font.name = 'Calibri'
    contact_p.paragraph_format.space_after = Pt(10)

    # 1. Summary
    h1 = doc.add_heading("PROFESSIONAL SUMMARY", level=2)
    h1.paragraph_format.space_before = Pt(8)
    h1.paragraph_format.space_after = Pt(2)

    custom_summary = parsed.get("summary") or job.get("tailored_summary") or ""
    if not custom_summary:
        company_clause = f" at {target_company}" if target_company else ""
        custom_summary = (
            f"Accomplished {target_role}{company_clause} with a demonstrated track record of executing "
            f"high-impact technical initiatives, architecting scalable systems, and aligning engineering outcomes "
            f"with business goals. Core specialization across {', '.join([str(s) for s in primary_skills[:8]])}."
        )
    p_sum = doc.add_paragraph(str(custom_summary))
    p_sum.paragraph_format.space_after = Pt(8)

    # 2. Competencies
    h2 = doc.add_heading("CORE TECHNICAL COMPETENCIES & SKILLS", level=2)
    h2.paragraph_format.space_before = Pt(8)
    h2.paragraph_format.space_after = Pt(2)

    missing_kws = job.get("missing_keywords") or []
    all_competencies = list(dict.fromkeys([str(s) for s in primary_skills] + [str(k) for k in missing_kws]))
    p_comp = doc.add_paragraph(f"Key Technologies: {', '.join(all_competencies[:22])}")
    p_comp.paragraph_format.space_after = Pt(8)

    # 3. Tailored Accomplishments
    tailored_bullets = job.get("tailored_bullets") or []
    if tailored_bullets:
        h3 = doc.add_heading(
            f"KEY ATS-TAILORED HIGHLIGHTS ({target_company.upper()})" if target_company else "KEY ATS-TAILORED HIGHLIGHTS",
            level=2
        )
        h3.paragraph_format.space_before = Pt(8)
        h3.paragraph_format.space_after = Pt(2)
        for b in tailored_bullets:
            b_text = (b.get("suggested_bullet") or b.get("bullet") or "") if isinstance(b, dict) else str(b)
            if b_text:
                doc.add_paragraph(str(b_text), style='List Bullet')

    # 4. Experience
    h4 = doc.add_heading("PROFESSIONAL EXPERIENCE", level=2)
    h4.paragraph_format.space_before = Pt(8)
    h4.paragraph_format.space_after = Pt(2)

    work_history = _normalize_work_history(parsed, user_prefs, primary_skills)
    for item in work_history:
        p_role = doc.add_paragraph()
        r1 = p_role.add_run(f"{item.get('title', 'Engineer')} — {item.get('company', 'Company')} ")
        r1.bold = True
        meta_bits = [b for b in [item.get('location', ''), item.get('period', '')] if b]
        if meta_bits:
            r2 = p_role.add_run(f"({' | '.join(meta_bits)})")
            r2.italic = True
            r2.font.color.rgb = RGBColor(100, 116, 139)
        p_role.paragraph_format.space_after = Pt(2)

        for b in item.get("bullets", []):
            if str(b).strip():
                doc.add_paragraph(str(b), style='List Bullet')

    # 5. Projects
    projects = parsed.get("projects") or []
    if projects:
        h_proj = doc.add_heading("KEY PROJECTS & HIGHLIGHTS", level=2)
        h_proj.paragraph_format.space_before = Pt(8)
        h_proj.paragraph_format.space_after = Pt(2)
        for proj in projects:
            if not isinstance(proj, dict):
                continue
            p_pr = doc.add_paragraph()
            r_pt = p_pr.add_run(str(proj.get("title") or "Project"))
            r_pt.bold = True
            if proj.get("techStack"):
                r_ps = p_pr.add_run(f" ({proj.get('techStack')})")
                r_ps.italic = True
            if proj.get("description"):
                doc.add_paragraph(str(proj.get("description")), style='List Bullet')

    # 6. Education
    h5 = doc.add_heading("EDUCATION & CREDENTIALS", level=2)
    h5.paragraph_format.space_before = Pt(8)
    h5.paragraph_format.space_after = Pt(2)

    education = _normalize_education(parsed, user_prefs)
    for edu in education:
        yr = f" ({edu.get('year')})" if edu.get('year') else ""
        p_edu = doc.add_paragraph(f"{edu.get('degree', 'Degree')} — {edu.get('institution', 'Institution')}{yr}")
        p_edu.paragraph_format.space_after = Pt(4)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
