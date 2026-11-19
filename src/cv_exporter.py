"""ATS-optimized resume PDF and DOCX exporter for the template catalog.

Design rules applied to every template (these follow common ATS / recruiter guidance):

* Single reading order, real selectable text, no images, no text boxes, no columns.
* Standard section names (Professional Summary, Skills, Professional Experience, Projects, Education).
* Body text 10-10.5 pt, name 18-20 pt, headings 11-11.5 pt, margins 0.55-0.75 in.
* Embedded Unicode fonts (Arial / Times metric-compatible), so bullets and accented
  names extract and render correctly. Falls back to the built-in PDF fonts if the
  bundled font files are missing.
* Nothing is ever invented: empty sections are omitted instead of filled with placeholders,
  and keywords from a job description are never added to the candidate's skills.
* Dark text on white (WCAG AA contrast or better) for every palette.
"""

import io
import os
from xml.sax.saxutils import escape as xml_escape
from typing import Dict, Any, List, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, KeepTogether, Table, TableStyle

from src.cv_templates import get_template, get_palette

try:
    import docx
    from docx.shared import Inches, Pt, RGBColor
    from docx.oxml.ns import qn
except ImportError:  # pragma: no cover - optional dependency
    docx = None


# ---------------------------------------------------------------------------
# Section names (shared by PDF and DOCX so both outputs read the same)
# ---------------------------------------------------------------------------
SEC_SUMMARY = "PROFESSIONAL SUMMARY"
SEC_SKILLS = "SKILLS"
SEC_ACHIEVEMENTS = "SELECTED ACHIEVEMENTS"
SEC_EXPERIENCE = "PROFESSIONAL EXPERIENCE"
SEC_PROJECTS = "PROJECTS"
SEC_EDUCATION = "EDUCATION"

MUTED_TEXT = "#475569"  # 7.5:1 on white; used for dates / locations instead of light greys


# ---------------------------------------------------------------------------
# Fonts
# ---------------------------------------------------------------------------
_FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
_FAMILIES = {
    # template font_family -> (reportlab family name, file prefix, built-in fallback)
    "Helvetica": ("TR-Sans", "LiberationSans", ("Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique")),
    "Times-Roman": ("TR-Serif", "LiberationSerif", ("Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic")),
    "Courier": ("TR-Mono", "LiberationMono", ("Courier", "Courier-Bold", "Courier-Oblique", "Courier-BoldOblique")),
}

# User-facing font choices in the builder -> template font family
FONT_CHOICES = {"sans": "Helvetica", "serif": "Times-Roman", "mono": "Courier"}
_registered: Dict[str, Dict[str, str]] = {}


def _font_set(font_family: str) -> Dict[str, str]:
    """Return {'regular','bold','italic','bold_italic'} font names for a template font family."""
    key = font_family if font_family in _FAMILIES else "Helvetica"
    if key in _registered:
        return _registered[key]

    family, prefix, builtin = _FAMILIES[key]
    names = {"regular": builtin[0], "bold": builtin[1], "italic": builtin[2], "bold_italic": builtin[3]}
    try:
        files = {
            "regular": f"{prefix}-Regular.ttf",
            "bold": f"{prefix}-Bold.ttf",
            "italic": f"{prefix}-Italic.ttf",
            "bold_italic": f"{prefix}-BoldItalic.ttf",
        }
        paths = {k: os.path.join(_FONT_DIR, v) for k, v in files.items()}
        if all(os.path.exists(p) for p in paths.values()):
            registered = {k: f"{family}-{k}" for k in paths}
            for k, path in paths.items():
                pdfmetrics.registerFont(TTFont(registered[k], path))
            pdfmetrics.registerFontFamily(
                family,
                normal=registered["regular"],
                bold=registered["bold"],
                italic=registered["italic"],
                boldItalic=registered["bold_italic"],
            )
            names = registered
    except Exception:  # pragma: no cover - fall back to built-in fonts
        pass
    _registered[key] = names
    return names


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
def _hex_to_rgb(hex_code: str):
    """Converts hex '#RRGGBB' to tuple of (r, g, b) ints."""
    h = hex_code.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _luminance(hex_code: str) -> float:
    def chan(v: int) -> float:
        s = v / 255
        return s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4
    r, g, b = _hex_to_rgb(hex_code)
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)


def contrast_ratio(fg: str, bg: str = "#FFFFFF") -> float:
    a, b = _luminance(fg), _luminance(bg)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def readable_color(hex_code: str, bg: str = "#FFFFFF", minimum: float = 4.5) -> str:
    """Darken a colour until it reaches the minimum contrast ratio on the background."""
    r, g, b = _hex_to_rgb(hex_code)
    current = hex_code
    for _ in range(40):
        if contrast_ratio(current, bg) >= minimum:
            return current
        r, g, b = int(r * 0.9), int(g * 0.9), int(b * 0.9)
        current = f"#{r:02X}{g:02X}{b:02X}"
    return current


def _valid_hex(value: Optional[str]) -> Optional[str]:
    """Return '#RRGGBB' if value is a valid 6-digit hex colour, else None."""
    if isinstance(value, str) and len(value) == 7 and value[0] == "#":
        try:
            int(value[1:], 16)
            return value.upper()
        except ValueError:
            return None
    return None


def tint(hex_code: str, strength: float = 0.10) -> str:
    """Very light tint of a colour (mix with white). Used for heading bands; the builder preview uses the same formula."""
    r, g, b = _hex_to_rgb(hex_code)
    mix = lambda c: round(255 - (255 - c) * strength)  # noqa: E731
    return f"#{mix(r):02X}{mix(g):02X}{mix(b):02X}"


def _esc(val: Any) -> str:
    """Safely escapes text for ReportLab XML Paragraph parser."""
    if val is None:
        return ""
    return xml_escape(str(val).strip())


def _clean(val: Any) -> str:
    return str(val).strip() if val is not None else ""


# ---------------------------------------------------------------------------
# Resume data (never invents anything)
# ---------------------------------------------------------------------------
def _normalize_work_history(parsed_resume: Dict[str, Any], user_prefs: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Work history from parsed_resume['experiences'] or user_prefs['work_history']. Entries are never fabricated."""
    source = parsed_resume.get("experiences") or user_prefs.get("work_history") or []
    normalized: List[Dict[str, Any]] = []
    for exp in source:
        if not isinstance(exp, dict):
            continue
        title = _clean(exp.get("position") or exp.get("title"))
        company = _clean(exp.get("company"))
        location = _clean(exp.get("location"))
        start = _clean(exp.get("startDate"))
        end = _clean(exp.get("endDate"))
        period = _clean(exp.get("period")) or " – ".join(p for p in (start, end) if p)
        bullets = [_clean(b) for b in (exp.get("bullets") or []) if _clean(b)]
        if not (title or company or bullets):
            continue
        normalized.append({"title": title, "company": company, "location": location, "period": period, "bullets": bullets})
    return normalized


def _normalize_education(parsed_resume: Dict[str, Any], user_prefs: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Education from parsed_resume['educations'] or user_prefs['education']. Entries are never fabricated."""
    source = parsed_resume.get("educations") or user_prefs.get("education") or []
    normalized: List[Dict[str, Any]] = []
    for edu in source:
        if not isinstance(edu, dict):
            continue
        degree = _clean(edu.get("degree"))
        institution = _clean(edu.get("institution"))
        if not (degree or institution):
            continue
        normalized.append({
            "degree": degree,
            "institution": institution,
            "year": _clean(edu.get("year")),
            "honors": _clean(edu.get("honors")),
        })
    return normalized


def _normalize_projects(parsed_resume: Dict[str, Any]) -> List[Dict[str, str]]:
    projects: List[Dict[str, str]] = []
    for proj in parsed_resume.get("projects") or []:
        if not isinstance(proj, dict):
            continue
        title = _clean(proj.get("title"))
        description = _clean(proj.get("description"))
        if not (title or description):
            continue
        projects.append({"title": title, "stack": _clean(proj.get("techStack")), "description": description})
    return projects


def build_resume_data(
    job: Dict[str, Any],
    user_profile: Dict[str, Any],
    user_prefs: Dict[str, Any],
    parsed_resume: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Collects exactly what the candidate provided. Missing pieces stay empty and are omitted from the output."""
    parsed = parsed_resume or job.get("parsed_resume") or {}

    def real_name(value: Any) -> str:
        # "Candidate" is a schema / anonymous-session placeholder, not a person's name.
        text = _clean(value)
        return "" if text.lower() == "candidate" else text

    name = (
        real_name(parsed.get("fullName"))
        or real_name(user_prefs.get("candidate_name"))
        or real_name(user_profile.get("full_name"))
        or real_name(user_profile.get("username"))
    )

    contact = [
        _clean(parsed.get("email") or user_prefs.get("email") or user_profile.get("email")),
        _clean(parsed.get("phone") or user_prefs.get("phone")),
        _clean(parsed.get("location") or user_prefs.get("current_location")),
        _clean(parsed.get("linkedIn")),
        _clean(parsed.get("github")),
    ]

    skills_src = parsed.get("skills") or user_prefs.get("primary_stack") or []
    skills = list(dict.fromkeys(_clean(s) for s in skills_src if _clean(s)))

    achievements: List[str] = []
    for b in job.get("tailored_bullets") or []:
        text = (b.get("suggested_bullet") or b.get("bullet") or "") if isinstance(b, dict) else b
        if _clean(text):
            achievements.append(_clean(text))

    return {
        "name": name,
        "headline": _clean(job.get("title") or parsed.get("jobTitle")),
        "contact": [c for c in contact if c],
        "summary": _clean(parsed.get("summary") or job.get("tailored_summary")),
        "skills": skills,
        "achievements": achievements,
        "experience": _normalize_work_history(parsed, user_prefs),
        "projects": _normalize_projects(parsed),
        "education": _normalize_education(parsed, user_prefs),
    }


def _experience_head(item: Dict[str, Any]) -> List[str]:
    """Plain-text parts of an experience heading: [title, company, location, period]."""
    return [item.get("title", ""), item.get("company", ""), item.get("location", ""), item.get("period", "")]


def _education_text(edu: Dict[str, Any]) -> str:
    left = ", ".join(p for p in (edu["degree"], edu["institution"]) if p)
    extra = " | ".join(p for p in (edu["year"], edu["honors"]) if p)
    return f"{left} | {extra}" if (left and extra) else (left or extra)


# ---------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------
def generate_tailored_pdf(
    job: Dict[str, Any],
    user_profile: Dict[str, Any],
    user_prefs: Dict[str, Any],
    template_id: Optional[str] = "gulf_dubai_sapphire",
    parsed_resume: Optional[Dict[str, Any]] = None,
    accent_color: Optional[str] = None,
    font: Optional[str] = None,
) -> bytes:
    """Generates an ATS-friendly PDF resume in the selected template style (US Letter, single column).

    accent_color ('#RRGGBB') and font ('sans' | 'serif' | 'mono') optionally override the template's
    heading/banner colour and typeface, so the file matches what the builder preview shows.
    """
    data = build_resume_data(job, user_profile, user_prefs, parsed_resume)
    tmpl = get_template(template_id or "gulf_dubai_sapphire")
    pal = get_palette(tmpl.get("palette", "slate_navy"))
    layout = tmpl.get("layout", "single_column")
    family = FONT_CHOICES.get((font or "").lower(), tmpl.get("font_family", "Helvetica"))
    fonts = _font_set(family)
    override = _valid_hex(accent_color)
    # The classic serif single-column style centres its header (a familiar academic / executive look).
    centered = layout == "single_column" and family == "Times-Roman"

    is_compact = layout == "compact_dense"
    modern = layout == "modern_accent"
    margin = (0.55 if is_compact else 0.75) * inch
    body_size = 10 if is_compact else 10.5
    body_leading = 12.4 if is_compact else 13.8

    if override:
        # One user-chosen colour drives the banner, headings and sub-headline (always kept readable).
        primary = accent = readable_color(override, minimum=4.5)
    else:
        primary = readable_color(pal["primary"], minimum=7.0)
        accent = readable_color(pal["secondary"], minimum=4.5)
    text_hex = readable_color(pal["text"], minimum=7.0)
    rule_hex = pal["rule"]
    # Rules are decorative, but keep them visible on white.
    if contrast_ratio(rule_hex) < 1.6:
        rule_hex = "#94A3B8"
    if override:
        # Same neutral text / rule colours the builder preview uses, so the file matches the screen.
        text_hex = "#1E293B"
        rule_hex = "#94A3B8"

    buffer = io.BytesIO()
    page_name = data["name"] or "Resume"
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin + 0.1 * inch,
        title=f"{page_name} - Resume",
        author=data["name"] or "",
        subject="Resume",
        creator="TalentRadar",
    )

    styles = getSampleStyleSheet()
    sid = tmpl["id"]

    def style(name: str, **kw: Any) -> ParagraphStyle:
        return ParagraphStyle(f"{name}_{sid}", parent=styles["Normal"], **kw)

    align = 1 if centered else 0
    name_style = style("Name", fontName=fonts["bold"], fontSize=20 if is_compact else 24, leading=24 if is_compact else 28,
                       textColor=primary, spaceAfter=2, alignment=align)
    headline_style = style("Headline", fontName=fonts["bold"], fontSize=12, leading=15, textColor=accent, spaceAfter=3, alignment=align)
    contact_style = style("Contact", fontName=fonts["regular"], fontSize=10, leading=13, textColor=colors.HexColor(MUTED_TEXT),
                          spaceAfter=4, alignment=align)

    banner_name = style("BannerName", fontName=fonts["bold"], fontSize=24, leading=28, textColor=colors.white)
    banner_headline = style("BannerHeadline", fontName=fonts["bold"], fontSize=12, leading=15, textColor=colors.HexColor("#E2E8F0"))
    banner_contact = style("BannerContact", fontName=fonts["regular"], fontSize=10, leading=13, textColor=colors.HexColor("#E2E8F0"))

    heading_color = accent if layout == "modern_accent" else primary
    heading_kwargs: Dict[str, Any] = {}
    if modern:
        # Tinted band behind the heading text (still plain text for parsers).
        heading_kwargs = dict(backColor=colors.HexColor(tint(accent, 0.10)), borderPadding=(2, 6, 2, 6), leftIndent=6, rightIndent=6)
    heading_style = style("Section", fontName=fonts["bold"], fontSize=11 if is_compact else 11.5, leading=14,
                          textColor=heading_color, spaceBefore=(6 if is_compact else 10) + (3 if modern else 0),
                          spaceAfter=3 if modern else 1, keepWithNext=True, **heading_kwargs)
    body_style = style("Body", fontName=fonts["regular"], fontSize=body_size, leading=body_leading,
                       textColor=colors.HexColor(text_hex), spaceAfter=2 if is_compact else 3)
    entry_style = style("Entry", fontName=fonts["regular"], fontSize=body_size, leading=body_leading,
                        textColor=colors.HexColor(text_hex), spaceBefore=2 if is_compact else 4, spaceAfter=1, keepWithNext=True)
    bullet_style = style("Bullet", fontName=fonts["regular"], fontSize=body_size, leading=body_leading,
                         textColor=colors.HexColor(text_hex), leftIndent=14, bulletIndent=3,
                         bulletFontName=fonts["regular"], bulletFontSize=body_size, spaceAfter=1.5 if is_compact else 2.5)

    story: List[Any] = []

    # ---- Header ----
    contact_line = " &nbsp;|&nbsp; ".join(_esc(c) for c in data["contact"])
    if layout == "split_header":
        rows = []
        if data["name"]:
            rows.append([Paragraph(_esc(data["name"]), banner_name)])
        if data["headline"]:
            rows.append([Paragraph(_esc(data["headline"]), banner_headline)])
        if contact_line:
            rows.append([Paragraph(contact_line, banner_contact)])
        if rows:
            header = Table(rows, colWidths=[doc.width])
            header.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(primary)),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ]))
            story.append(header)
            story.append(Spacer(1, 4))
    else:
        if data["name"]:
            story.append(Paragraph(_esc(data["name"]), name_style))
        if data["headline"]:
            story.append(Paragraph(_esc(data["headline"]), headline_style))
        if contact_line:
            story.append(Paragraph(contact_line, contact_style))
        story.append(HRFlowable(width="100%", thickness=1.2 if layout == "modern_accent" else 0.8,
                                color=colors.HexColor(accent if layout == "modern_accent" else rule_hex),
                                spaceBefore=1, spaceAfter=2))

    def section(title: str) -> None:
        story.append(Paragraph(title, heading_style))
        if modern:
            return  # the tinted band is the heading's visual separator
        story.append(HRFlowable(
            width="100%",
            thickness=1.0 if layout == "modern_accent" else 0.6,
            color=colors.HexColor(accent if layout == "modern_accent" else rule_hex),
            spaceBefore=0, spaceAfter=3,
        ))

    # ---- Summary ----
    if data["summary"]:
        section(SEC_SUMMARY)
        story.append(Paragraph(_esc(data["summary"]), body_style))

    # ---- Skills (plain comma list: extracts cleanly in every ATS) ----
    if data["skills"]:
        section(SEC_SKILLS)
        story.append(Paragraph(", ".join(_esc(s) for s in data["skills"]), body_style))

    # ---- Achievements supplied by the caller (e.g. accepted ATS suggestions) ----
    if data["achievements"]:
        section(SEC_ACHIEVEMENTS)
        for text in data["achievements"]:
            story.append(Paragraph(_esc(text), bullet_style, bulletText="•"))

    # ---- Experience ----
    if data["experience"]:
        section(SEC_EXPERIENCE)
        for item in data["experience"]:
            title, company, location, period = _experience_head(item)
            first = f"<b>{_esc(title)}</b>" if title else ""
            if company:
                first += (" &ndash; " if first else "") + _esc(company)
            meta = " | ".join(_esc(p) for p in (location, period) if p)
            head = first + (f' <font color="{MUTED_TEXT}">| {meta}</font>' if (meta and first) else (f'<font color="{MUTED_TEXT}">{meta}</font>' if meta else ""))
            block: List[Any] = [Paragraph(head, entry_style)]
            for b in item["bullets"]:
                block.append(Paragraph(_esc(b), bullet_style, bulletText="•"))
            # Keep the heading with its first bullets, but let long roles flow across pages.
            story.extend(block[:3] if len(block) > 3 else [KeepTogether(block)])
            story.extend(block[3:])

    # ---- Projects ----
    if data["projects"]:
        section(SEC_PROJECTS)
        for proj in data["projects"]:
            head = f"<b>{_esc(proj['title'])}</b>" if proj["title"] else ""
            if proj["stack"]:
                head += (f' <font color="{MUTED_TEXT}">| {_esc(proj["stack"])}</font>' if head else _esc(proj["stack"]))
            if head:
                story.append(Paragraph(head, entry_style))
            if proj["description"]:
                story.append(Paragraph(_esc(proj["description"]), bullet_style, bulletText="•"))

    # ---- Education ----
    if data["education"]:
        section(SEC_EDUCATION)
        for edu in data["education"]:
            text = _education_text(edu)
            if text:
                story.append(Paragraph(_esc(text), body_style))

    if not story:
        story.append(Paragraph("&nbsp;", body_style))

    def later_pages(canvas: Any, document: Any) -> None:
        canvas.saveState()
        canvas.setFont(fonts["regular"], 9)
        canvas.setFillColor(colors.HexColor(MUTED_TEXT))
        label = f"{data['name']} - Page {document.page}" if data["name"] else f"Page {document.page}"
        canvas.drawCentredString(letter[0] / 2, 0.45 * inch, label)
        canvas.restoreState()

    doc.build(story, onLaterPages=later_pages)
    buffer.seek(0)
    return buffer.getvalue()


# ---------------------------------------------------------------------------
# DOCX
# ---------------------------------------------------------------------------
def _docx_font(run_or_style: Any, name: str) -> None:
    run_or_style.font.name = name
    element = run_or_style.element if hasattr(run_or_style, "element") else run_or_style._element
    props = element.get_or_add_rPr() if hasattr(element, "get_or_add_rPr") else element.rPr
    fonts = props.find(qn("w:rFonts"))
    if fonts is not None:
        for attr in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
            fonts.set(qn(attr), name)


def generate_tailored_docx(
    job: Dict[str, Any],
    user_profile: Dict[str, Any],
    user_prefs: Dict[str, Any],
    template_id: Optional[str] = "gulf_dubai_sapphire",
    parsed_resume: Optional[Dict[str, Any]] = None,
    accent_color: Optional[str] = None,
    font: Optional[str] = None,
) -> bytes:
    """Generates an ATS-friendly Word resume: real headings and list styles, no tables, template font and colours."""
    if docx is None:
        raise ImportError("python-docx is not installed.")

    data = build_resume_data(job, user_profile, user_prefs, parsed_resume)
    tmpl = get_template(template_id or "gulf_dubai_sapphire")
    pal = get_palette(tmpl.get("palette", "slate_navy"))
    is_compact = tmpl.get("layout") == "compact_dense"
    family = FONT_CHOICES.get((font or "").lower(), tmpl.get("font_family", "Helvetica"))
    font_name = {"Times-Roman": "Times New Roman", "Courier": "Courier New"}.get(family, "Arial")
    override = _valid_hex(accent_color)
    if override:
        primary_rgb = accent_rgb = _hex_to_rgb(readable_color(override, minimum=4.5))
    else:
        primary_rgb = _hex_to_rgb(readable_color(pal["primary"], minimum=7.0))
        accent_rgb = _hex_to_rgb(readable_color(pal["secondary"], minimum=4.5))
    muted_rgb = _hex_to_rgb(MUTED_TEXT)
    body_pt = 10 if is_compact else 10.5

    document = docx.Document()
    for section in document.sections:
        margin = Inches(0.55 if is_compact else 0.75)
        section.top_margin = section.bottom_margin = margin
        section.left_margin = section.right_margin = margin

    normal = document.styles["Normal"]
    _docx_font(normal, font_name)
    normal.font.size = Pt(body_pt)
    normal.paragraph_format.space_after = Pt(2)
    normal.paragraph_format.line_spacing = 1.08

    heading = document.styles["Heading 2"]
    _docx_font(heading, font_name)
    heading.font.size = Pt(11.5)
    heading.font.bold = True
    heading.font.color.rgb = RGBColor(*(accent_rgb if tmpl.get("layout") == "modern_accent" else primary_rgb))
    heading.paragraph_format.space_before = Pt(8)
    heading.paragraph_format.space_after = Pt(2)
    heading.paragraph_format.keep_with_next = True

    bullet = document.styles["List Bullet"]
    _docx_font(bullet, font_name)
    bullet.font.size = Pt(body_pt)
    bullet.paragraph_format.space_after = Pt(1.5)

    props = document.core_properties
    props.title = f"{data['name'] or 'Resume'} - Resume"
    props.author = data["name"] or ""
    props.subject = "Resume"

    def add_heading(text: str) -> None:
        document.add_heading(text, level=2)

    if data["name"]:
        p = document.add_paragraph()
        r = p.add_run(data["name"])
        r.bold = True
        r.font.size = Pt(18 if is_compact else 20)
        r.font.color.rgb = RGBColor(*primary_rgb)
        p.paragraph_format.space_after = Pt(1)
    if data["headline"]:
        p = document.add_paragraph()
        r = p.add_run(data["headline"])
        r.bold = True
        r.font.size = Pt(11.5)
        r.font.color.rgb = RGBColor(*accent_rgb)
        p.paragraph_format.space_after = Pt(1)
    if data["contact"]:
        p = document.add_paragraph()
        r = p.add_run(" | ".join(data["contact"]))
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(*muted_rgb)
        p.paragraph_format.space_after = Pt(4)

    if data["summary"]:
        add_heading(SEC_SUMMARY)
        document.add_paragraph(data["summary"])

    if data["skills"]:
        add_heading(SEC_SKILLS)
        document.add_paragraph(", ".join(data["skills"]))

    if data["achievements"]:
        add_heading(SEC_ACHIEVEMENTS)
        for text in data["achievements"]:
            document.add_paragraph(text, style="List Bullet")

    if data["experience"]:
        add_heading(SEC_EXPERIENCE)
        for item in data["experience"]:
            title, company, location, period = _experience_head(item)
            p = document.add_paragraph()
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.keep_with_next = True
            first = p.add_run(title)
            first.bold = True
            if company:
                p.add_run((" – " if title else "") + company)
            meta = " | ".join(x for x in (location, period) if x)
            if meta:
                m = p.add_run(f" | {meta}" if (title or company) else meta)
                m.font.color.rgb = RGBColor(*muted_rgb)
            for b in item["bullets"]:
                document.add_paragraph(b, style="List Bullet")

    if data["projects"]:
        add_heading(SEC_PROJECTS)
        for proj in data["projects"]:
            p = document.add_paragraph()
            p.paragraph_format.keep_with_next = bool(proj["description"])
            t = p.add_run(proj["title"])
            t.bold = True
            if proj["stack"]:
                s = p.add_run(f" | {proj['stack']}" if proj["title"] else proj["stack"])
                s.font.color.rgb = RGBColor(*muted_rgb)
            if proj["description"]:
                document.add_paragraph(proj["description"], style="List Bullet")

    if data["education"]:
        add_heading(SEC_EDUCATION)
        for edu in data["education"]:
            text = _education_text(edu)
            if text:
                document.add_paragraph(text)

    buffer = io.BytesIO()
    document.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
