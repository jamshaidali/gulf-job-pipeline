"""ATS-Optimized Tailored CV / Resume PDF and DOCX Exporter with 100+ Template Engine."""

import io
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


def generate_tailored_pdf(
    job: Dict[str, Any], 
    user_profile: Dict[str, Any], 
    user_prefs: Dict[str, Any],
    template_id: Optional[str] = "gulf_dubai_sapphire"
) -> bytes:
    """Generates an ATS-compliant, single/multi-page PDF tailored to a specific job posting in the selected template style."""
    tmpl = get_template(template_id)
    pal = get_palette(tmpl.get("palette", "dubai_sapphire"))
    layout = tmpl.get("layout", "single_column")
    font_name = tmpl.get("font_family", "Helvetica")
    font_bold = f"{font_name}-Bold"

    primary_color = colors.HexColor(pal["primary"])
    secondary_color = colors.HexColor(pal["secondary"])
    accent_color = colors.HexColor(pal.get("accent", pal["secondary"]))
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

    # 1. Candidate Info
    cand_name = user_prefs.get("candidate_name") or user_profile.get("full_name") or user_profile.get("username") or "Candidate"
    email = user_prefs.get("email") or user_profile.get("email") or "candidate@talentradar.ai"
    phone = user_prefs.get("phone") or "+92 (300) 123-4567"
    loc = user_prefs.get("current_location") or "Pakistan | Open to GCC Relocation (UAE / Saudi Arabia)"
    
    target_role = job.get("title", "Software Engineer")
    target_company = job.get("company", "Target Company")

    # Header Construction based on Template Layout
    if layout == "split_header":
        # Full width colored banner box
        header_table = Table(
            [
                [
                    Paragraph(cand_name, banner_title_style),
                ],
                [
                    Paragraph(f"{target_role} &bull; Targeted Application for {target_company}", banner_subtitle_style),
                ],
                [
                    Paragraph(f"{email} &nbsp;|&nbsp; {phone} &nbsp;|&nbsp; {loc} &nbsp;|&nbsp; GCC &amp; Remote Eligible", banner_contact_style)
                ]
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
        # Classic / Modern Accent / Compact Header
        story.append(Paragraph(cand_name, title_style))
        story.append(Paragraph(f"{target_role} &bull; Targeted Application for {target_company}", subtitle_style))
        story.append(Paragraph(f"{email} &nbsp;|&nbsp; {phone} &nbsp;|&nbsp; {loc} &nbsp;|&nbsp; Authorized for GCC &amp; Remote Employment", contact_style))
        story.append(HRFlowable(width="100%", thickness=1, color=rule_color, spaceBefore=1, spaceAfter=5))

    # Helper for section dividers
    def add_section_header(title_text: str):
        if layout == "modern_accent":
            story.append(Paragraph(f"<font color='{pal['accent']}'>&#9646;</font> {title_text}", section_heading_style))
        else:
            story.append(Paragraph(title_text, section_heading_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=rule_color, spaceBefore=1, spaceAfter=3))

    # 2. Tailored Executive Pitch / Summary
    add_section_header("PROFESSIONAL SUMMARY &amp; TARGET PROFILE")
    
    summary_text = (
        f"Accomplished professional targeting the <b>{target_role}</b> position at <b>{target_company}</b>. "
        f"Demonstrated track record executing mission-critical engineering initiatives, architecting scalable production systems, and driving measured outcomes. "
        f"Core technical competencies center on <b>{', '.join((user_prefs.get('primary_stack') or ['Python', 'FastAPI', 'PostgreSQL', 'Docker'])[:6])}</b>. "
        f"Committed to clean architecture, high reliability, and velocity for international and Gulf operations."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 3))

    # 3. Core Competencies & Matched ATS Keywords
    add_section_header("CORE TECHNICAL COMPETENCIES &amp; ATS KEYWORDS")
    
    primary_skills = user_prefs.get("primary_stack") or ["Python", "FastAPI", "Django", "PostgreSQL", "Docker", "AWS"]
    missing_kws = job.get("missing_keywords") or []
    all_competencies = list(dict.fromkeys(primary_skills + missing_kws))
    
    comp_str = " &nbsp;&bull;&nbsp; ".join(all_competencies[:18])
    story.append(Paragraph(f"<b>Key Technologies &amp; Methodologies:</b> {comp_str}", body_style))
    story.append(Spacer(1, 3))

    # 4. Tailored Accomplishments for this Role
    add_section_header(f"SELECTED ACHIEVEMENTS &amp; IMPACT (TAILORED FOR {target_company.upper()})")
    
    tailored_bullets = job.get("tailored_bullets") or []
    if tailored_bullets:
        for b in tailored_bullets:
            b_text = b.get("suggested_bullet", "") if isinstance(b, dict) else str(b)
            if b_text:
                story.append(Paragraph(f"&bull;&nbsp;&nbsp;{b_text}", bullet_style))
    else:
        stack_sample = ", ".join(primary_skills[:3])
        story.append(Paragraph(f"&bull;&nbsp;&nbsp;Engineered distributed, fault-tolerant backend architectures leveraging {stack_sample}, maintaining 99.98% service availability across critical workflows.", bullet_style))
        story.append(Paragraph(f"&bull;&nbsp;&nbsp;Optimized database execution plans and caching hierarchies, reducing query latency by 42% under peak transaction loads.", bullet_style))
        story.append(Paragraph(f"&bull;&nbsp;&nbsp;Spearheaded automated CI/CD pipeline deployments and Dockerized microservices, accelerating feature release velocity by 35%.", bullet_style))
    
    story.append(Spacer(1, 3))

    # 5. Professional Work History
    add_section_header("PROFESSIONAL EXPERIENCE")
    
    work_history = user_prefs.get("work_history") or [
        {
            "title": f"Lead / Senior {primary_skills[0]} Engineer",
            "company": "Enterprise Engineering Solutions",
            "period": "2021 &ndash; Present",
            "location": "Lahore, Pakistan &bull; Remote Gulf Operations",
            "bullets": [
                f"Led end-to-end design and delivery of mission-critical services utilizing {primary_skills[0]} and cloud infrastructure.",
                "Mentored mid-level engineering personnel on defensive system design, automated testing, and clean architecture principles.",
                "Collaborated directly with cross-functional product stakeholders to translate requirements into robust technical specifications."
            ]
        },
        {
            "title": f"Software Engineer ({primary_skills[1] if len(primary_skills) > 1 else 'Backend'})",
            "company": "Innovative Software Lab",
            "period": "2019 &ndash; 2021",
            "location": "Pakistan",
            "bullets": [
                "Developed high-throughput REST APIs and integrated asynchronous message queuing for distributed transaction processing.",
                "Implemented relational database schema migrations and automated indexing strategies to support 500k+ daily queries."
            ]
        }
    ]

    for item in work_history:
        exp_header = f"<b>{item.get('title', 'Engineer')}</b> &ndash; <i>{item.get('company', 'Company')}</i>"
        exp_meta = f"<font color='#64748B'>{item.get('location', '')} | {item.get('period', '')}</font>"
        
        block = [
            Paragraph(f"{exp_header} <font color='#94A3B8'>&bull;</font> {exp_meta}", body_style)
        ]
        for b in item.get("bullets", []):
            block.append(Paragraph(f"&bull;&nbsp;&nbsp;{b}", bullet_style))
        block.append(Spacer(1, 2))
        story.append(KeepTogether(block))

    # 6. Education & Certifications
    add_section_header("EDUCATION &amp; PROFESSIONAL CREDENTIALS")
    
    education = user_prefs.get("education") or [
        {
            "degree": "Bachelor of Science in Computer Science (BSCS)",
            "institution": "National University of Computer & Emerging Sciences (FAST-NUCES)",
            "year": "2019"
        }
    ]
    for edu in education:
        edu_text = f"<b>{edu.get('degree', 'Degree')}</b> &ndash; {edu.get('institution', 'Institution')} <font color='#64748B'>({edu.get('year', '')})</font>"
        story.append(Paragraph(edu_text, body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_tailored_docx(
    job: Dict[str, Any], 
    user_profile: Dict[str, Any], 
    user_prefs: Dict[str, Any],
    template_id: Optional[str] = "gulf_dubai_sapphire"
) -> bytes:
    """Generates an ATS-compliant Word document (.docx) tailored to the specific job using template colors."""
    if docx is None:
        raise ImportError("python-docx is not installed.")

    tmpl = get_template(template_id)
    pal = get_palette(tmpl.get("palette", "dubai_sapphire"))
    primary_rgb = _hex_to_rgb(pal["primary"])
    secondary_rgb = _hex_to_rgb(pal["secondary"])

    doc = docx.Document()
    
    # Page Margins 0.5 inches
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.5)
        section.bottom_margin = Inches(0.5)
        section.left_margin = Inches(0.5)
        section.right_margin = Inches(0.5)

    cand_name = user_prefs.get("candidate_name") or user_profile.get("full_name") or user_profile.get("username") or "Candidate"
    email = user_prefs.get("email") or user_profile.get("email") or "candidate@talentradar.ai"
    phone = user_prefs.get("phone") or "+92 (300) 123-4567"
    loc = user_prefs.get("current_location") or "Pakistan | Open to UAE / Saudi Arabia Relocation"
    
    target_role = job.get("title", "Software Engineer")
    target_company = job.get("company", "Target Company")
    primary_skills = user_prefs.get("primary_stack") or ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"]

    # Header
    title_p = doc.add_paragraph()
    r_name = title_p.add_run(cand_name)
    r_name.bold = True
    r_name.font.size = Pt(18)
    r_name.font.color.rgb = RGBColor(*primary_rgb)
    r_name.font.name = 'Calibri'
    title_p.paragraph_format.space_after = Pt(2)

    sub_p = doc.add_paragraph()
    r_sub = sub_p.add_run(f"{target_role} — Targeted Application for {target_company}")
    r_sub.bold = True
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(*secondary_rgb)
    r_sub.font.name = 'Calibri'
    sub_p.paragraph_format.space_after = Pt(2)

    contact_p = doc.add_paragraph()
    r_con = contact_p.add_run(f"{email} | {phone} | {loc} | GCC / Remote Eligible")
    r_con.font.size = Pt(9)
    r_con.font.color.rgb = RGBColor(100, 116, 139)
    r_con.font.name = 'Calibri'
    contact_p.paragraph_format.space_after = Pt(10)

    # 1. Summary
    h1 = doc.add_heading("PROFESSIONAL SUMMARY & TARGET PROFILE", level=2)
    h1.paragraph_format.space_before = Pt(8)
    h1.paragraph_format.space_after = Pt(2)

    summary_text = (
        f"Accomplished professional targeting the {target_role} opportunity at {target_company}. "
        f"Demonstrated track record executing high-impact technical initiatives, architecting scalable systems, and aligning engineering outcomes "
        f"with strategic business targets. Core specialization across {', '.join(primary_skills[:6])}. "
        f"Committed to delivering clean, reliable solutions for high-growth Gulf and international operations."
    )
    p_sum = doc.add_paragraph(summary_text)
    p_sum.paragraph_format.space_after = Pt(8)

    # 2. Competencies
    h2 = doc.add_heading("CORE TECHNICAL COMPETENCIES & ATS KEYWORDS", level=2)
    h2.paragraph_format.space_before = Pt(8)
    h2.paragraph_format.space_after = Pt(2)

    missing_kws = job.get("missing_keywords") or []
    all_competencies = list(dict.fromkeys(primary_skills + missing_kws))
    p_comp = doc.add_paragraph(f"Key Technologies: {', '.join(all_competencies[:18])}")
    p_comp.paragraph_format.space_after = Pt(8)

    # 3. Tailored Accomplishments
    h3 = doc.add_heading(f"SELECTED ACHIEVEMENTS FOR {target_company.upper()}", level=2)
    h3.paragraph_format.space_before = Pt(8)
    h3.paragraph_format.space_after = Pt(2)

    tailored_bullets = job.get("tailored_bullets") or []
    if tailored_bullets:
        for b in tailored_bullets:
            b_text = b.get("suggested_bullet", "") if isinstance(b, dict) else str(b)
            if b_text:
                doc.add_paragraph(b_text, style='List Bullet')
    else:
        doc.add_paragraph(f"Engineered distributed, fault-tolerant backend architectures leveraging {', '.join(primary_skills[:3])}.", style='List Bullet')
        doc.add_paragraph("Optimized database execution plans and caching hierarchies, reducing latency by 42%.", style='List Bullet')
        doc.add_paragraph("Spearheaded automated CI/CD pipeline deployments, accelerating feature release velocity by 35%.", style='List Bullet')

    # 4. Experience
    h4 = doc.add_heading("PROFESSIONAL EXPERIENCE", level=2)
    h4.paragraph_format.space_before = Pt(8)
    h4.paragraph_format.space_after = Pt(2)

    work_history = user_prefs.get("work_history") or [
        {
            "title": f"Lead / Senior {primary_skills[0]} Engineer",
            "company": "Enterprise Engineering Solutions",
            "period": "2021 – Present",
            "location": "Lahore, Pakistan • Remote Gulf Operations",
            "bullets": [
                f"Led end-to-end design and delivery of mission-critical services utilizing {primary_skills[0]}.",
                "Mentored engineering personnel on clean architecture, defensive systems, and testing.",
                "Collaborated with product stakeholders to deliver high-scale features on roadmap."
            ]
        }
    ]

    for item in work_history:
        p_role = doc.add_paragraph()
        r1 = p_role.add_run(f"{item.get('title', 'Engineer')} — {item.get('company', 'Company')} ")
        r1.bold = True
        r2 = p_role.add_run(f"({item.get('location', '')} | {item.get('period', '')})")
        r2.italic = True
        r2.font.color.rgb = RGBColor(100, 116, 139)
        p_role.paragraph_format.space_after = Pt(2)

        for b in item.get("bullets", []):
            doc.add_paragraph(b, style='List Bullet')

    # 5. Education
    h5 = doc.add_heading("EDUCATION & CREDENTIALS", level=2)
    h5.paragraph_format.space_before = Pt(8)
    h5.paragraph_format.space_after = Pt(2)

    education = user_prefs.get("education") or [
        {
            "degree": "Bachelor of Science in Computer Science (BSCS)",
            "institution": "National University of Computer & Emerging Sciences (FAST-NUCES)",
            "year": "2019"
        }
    ]
    for edu in education:
        p_edu = doc.add_paragraph(f"{edu.get('degree', 'Degree')} — {edu.get('institution', 'Institution')} ({edu.get('year', '')})")
        p_edu.paragraph_format.space_after = Pt(4)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
