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
from reportlab.platypus.flowables import Flowable
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    FrameBreak,
    HRFlowable,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageTemplate,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from src.cv_templates import DESIGNER_LAYOUTS, SERIF_FAMILIES, get_template, get_palette, resolve_style

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
    # Calibri- and Cambria-metric open fonts: the two most familiar word-processor typefaces.
    "Carlito": ("TR-Carlito", "Carlito", ("Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique")),
    "Caladea": ("TR-Caladea", "Caladea", ("Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic")),
}

# User-facing font choices in the builder -> template font family
FONT_CHOICES = {"sans": "Helvetica", "serif": "Times-Roman", "mono": "Courier", "modern": "Carlito", "book": "Caladea"}
# Word-processor font names used in the .docx for each family
DOCX_FONT_NAMES = {"Helvetica": "Arial", "Times-Roman": "Times New Roman", "Courier": "Courier New", "Carlito": "Calibri", "Caladea": "Cambria"}
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

# ---------------------------------------------------------------------------
# Profile photo (designer layouts)
# ---------------------------------------------------------------------------
MAX_PHOTO_DATA_URL = 1_500_000  # characters; the builder sends a ~320px JPEG (a few tens of KB)


def prepare_photo(photo: Optional[str]) -> Optional[bytes]:
    """Validate an uploaded data-URL image and return a square, circle-masked PNG (or None if unusable).

    The image is decoded and re-encoded with Pillow, so only real raster images get through, and the
    result is small and uniform for both the PDF and the Word file.
    """
    if not photo or not isinstance(photo, str) or len(photo) > MAX_PHOTO_DATA_URL:
        return None
    import base64
    import re as _re

    match = _re.match(r"^data:image/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$", photo)
    if not match:
        return None
    try:
        from PIL import Image as PILImage, ImageDraw

        img = PILImage.open(io.BytesIO(base64.b64decode(match.group(2), validate=False)))
        img.load()
        img = img.convert("RGBA")
        side = min(img.size)
        left, top = (img.width - side) // 2, (img.height - side) // 2
        img = img.crop((left, top, left + side, top + side)).resize((360, 360))
        mask = PILImage.new("L", (360 * 4, 360 * 4), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, 360 * 4 - 1, 360 * 4 - 1), fill=255)
        img.putalpha(mask.resize((360, 360), PILImage.LANCZOS))
        out = io.BytesIO()
        img.save(out, format="PNG", optimize=True)
        return out.getvalue()
    except Exception:
        return None


def _sidebar_pdf(
    data: Dict[str, Any],
    layout: str,
    fonts: Dict[str, str],
    accent: str,
    photo_png: Optional[bytes],
    title: str,
    spec: Optional[Dict[str, Any]] = None,
) -> bytes:
    """Two-area page: a coloured sidebar (photo, contact, skills, education) beside the main column
    (name, summary, experience, projects). Built with frames, so long resumes flow onto page 2."""
    width, height = letter
    side_w = 190.0
    spec = spec or {}
    glyph = BULLET_GLYPHS.get(spec.get("bullets", "dot"), "\u2022")
    dense = spec.get("density", "standard")
    body_pt, body_lead = {"compact": (10.0, 12.6), "standard": (10.5, 13.8), "airy": (11.0, 15.2)}[dense]
    name_pt = {"compact": 22.0, "standard": 24.0, "airy": 26.0}[dense]
    dates_right = spec.get("dates") == "right"
    dark = layout == "sidebar_photo"
    side_bg = accent if dark else tint(accent, 0.10)
    side_text = "#FFFFFF" if dark else "#1E293B"
    side_muted = "#E2E8F0" if dark else MUTED_TEXT
    side_heading = "#FFFFFF" if dark else accent
    side_rule = "#FFFFFF" if dark else accent
    body_hex = "#1E293B"

    styles = getSampleStyleSheet()

    def style(name: str, **kw: Any) -> ParagraphStyle:
        return ParagraphStyle(f"{name}_{layout}", parent=styles["Normal"], **kw)

    s_head = style("SideHead", fontName=fonts["bold"], fontSize=10.5, leading=13, textColor=colors.HexColor(side_heading),
                   spaceBefore=12, spaceAfter=2, keepWithNext=True)
    s_body = style("SideBody", fontName=fonts["regular"], fontSize=10, leading=13, textColor=colors.HexColor(side_text), spaceAfter=2)
    s_bold = style("SideBold", fontName=fonts["bold"], fontSize=10, leading=13, textColor=colors.HexColor(side_text), spaceAfter=0)
    s_muted = style("SideMuted", fontName=fonts["regular"], fontSize=10, leading=13, textColor=colors.HexColor(side_muted), spaceAfter=4)

    m_name = style("MainName", fontName=fonts["bold"], fontSize=name_pt, leading=name_pt + 4, textColor=colors.HexColor(accent), spaceAfter=2)
    m_headline = style("MainHeadline", fontName=fonts["bold"], fontSize=12, leading=15, textColor=colors.HexColor(MUTED_TEXT), spaceAfter=4)
    m_head = style("MainHead", fontName=fonts["bold"], fontSize=11.5, leading=14, textColor=colors.HexColor(accent),
                   spaceBefore=10, spaceAfter=1, keepWithNext=True)
    m_body = style("MainBody", fontName=fonts["regular"], fontSize=body_pt, leading=body_lead, textColor=colors.HexColor(body_hex), spaceAfter=3)
    m_entry = style("MainEntry", fontName=fonts["regular"], fontSize=body_pt, leading=body_lead, textColor=colors.HexColor(body_hex),
                    spaceBefore=4, spaceAfter=1, keepWithNext=True)
    m_bullet = style("MainBullet", fontName=fonts["regular"], fontSize=body_pt, leading=body_lead, textColor=colors.HexColor(body_hex),
                     leftIndent=14, bulletIndent=3, bulletFontName=fonts["regular"], bulletFontSize=body_pt, spaceAfter=2.5)

    def side_section(story: List[Any], heading: str) -> None:
        story.append(Paragraph(heading, s_head))
        story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor(side_rule), spaceBefore=0, spaceAfter=4))

    story: List[Any] = []

    # ---- sidebar ----
    if photo_png:
        story.append(Image(io.BytesIO(photo_png), width=112, height=112, hAlign="CENTER"))
        story.append(Spacer(1, 4))
    if data["contact"]:
        side_section(story, "CONTACT")
        for item in data["contact"]:
            story.append(Paragraph(_esc(item), s_body))
    if data["skills"]:
        side_section(story, SEC_SKILLS)
        for skill in data["skills"]:
            story.append(Paragraph(_esc(skill), s_body))
    if data["education"]:
        side_section(story, SEC_EDUCATION)
        for edu in data["education"]:
            if edu["degree"]:
                story.append(Paragraph(_esc(edu["degree"]), s_bold))
            if edu["institution"]:
                story.append(Paragraph(_esc(edu["institution"]), s_body))
            extra = " | ".join(p for p in (edu["year"], edu["honors"]) if p)
            if extra:
                story.append(Paragraph(_esc(extra), s_muted))
    story.append(FrameBreak())
    story.append(NextPageTemplate("later"))

    # ---- main column ----
    if data["name"]:
        story.append(Paragraph(_esc(data["name"].upper() if spec.get("caps") else data["name"]), m_name))
    if data["headline"]:
        story.append(Paragraph(_esc(data["headline"]), m_headline))
    if data["name"] or data["headline"]:
        story.append(HRFlowable(width="100%", thickness=1.2, color=colors.HexColor(accent), spaceBefore=1, spaceAfter=2))

    def main_section(heading: str) -> None:
        story.append(Paragraph(heading, m_head))
        story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#94A3B8"), spaceBefore=0, spaceAfter=3))

    if data["summary"]:
        main_section(SEC_SUMMARY)
        story.append(Paragraph(_esc(data["summary"]), m_body))
    if data["achievements"]:
        main_section(SEC_ACHIEVEMENTS)
        for text in data["achievements"]:
            story.append(Paragraph(_esc(text), m_bullet, bulletText=glyph))
    if data["experience"]:
        main_section(SEC_EXPERIENCE)
        for item in data["experience"]:
            etitle, company, location, period = _experience_head(item)
            first = f"<b>{_esc(etitle)}</b>" if etitle else ""
            if company:
                first += (" &ndash; " if first else "") + _esc(company)
            if dates_right and period:
                meta = _esc(location)
                head = first + (f' <font color="{MUTED_TEXT}">| {meta}</font>' if (meta and first) else (f'<font color="{MUTED_TEXT}">{meta}</font>' if meta else ""))
                m_date = style("MainDate", fontName=fonts["regular"], fontSize=body_pt, leading=body_lead,
                               textColor=colors.HexColor(MUTED_TEXT), alignment=2)
                head_flow: Any = Table([[Paragraph(head, m_entry), Paragraph(_esc(period), m_date)]],
                                       colWidths=[width - side_w - 60 - 78, 78])
                head_flow.setStyle(TableStyle([
                    ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]))
                head_flow.keepWithNext = True
            else:
                meta = " | ".join(_esc(x) for x in (location, period) if x)
                head = first + (f' <font color="{MUTED_TEXT}">| {meta}</font>' if (meta and first) else (f'<font color="{MUTED_TEXT}">{meta}</font>' if meta else ""))
                head_flow = Paragraph(head, m_entry)
            block: List[Any] = [head_flow]
            for b in item["bullets"]:
                block.append(Paragraph(_esc(b), m_bullet, bulletText=glyph))
            story.extend(block[:3] if len(block) > 3 else [KeepTogether(block)])
            story.extend(block[3:])
    if data["projects"]:
        main_section(SEC_PROJECTS)
        for proj in data["projects"]:
            head = f"<b>{_esc(proj['title'])}</b>" if proj["title"] else ""
            if proj["stack"]:
                head += (f' <font color="{MUTED_TEXT}">| {_esc(proj["stack"])}</font>' if head else _esc(proj["stack"]))
            if head:
                story.append(Paragraph(head, m_entry))
            if proj["description"]:
                story.append(Paragraph(_esc(proj["description"]), m_bullet, bulletText=glyph))

    def draw_background(canvas: Any, document: Any) -> None:
        canvas.saveState()
        canvas.setFillColor(colors.HexColor(side_bg))
        canvas.rect(0, 0, side_w, height, stroke=0, fill=1)
        canvas.restoreState()

    def later_page(canvas: Any, document: Any) -> None:
        draw_background(canvas, document)
        canvas.saveState()
        canvas.setFont(fonts["regular"], 9)
        canvas.setFillColor(colors.HexColor(MUTED_TEXT))
        label = f"{data['name']} - Page {document.page}" if data["name"] else f"Page {document.page}"
        canvas.drawCentredString(side_w + (width - side_w) / 2, 0.4 * inch, label)
        canvas.restoreState()

    buffer = io.BytesIO()
    doc = BaseDocTemplate(buffer, pagesize=letter, title=f"{title} - Resume", author=data["name"] or "",
                          subject="Resume", creator="RateYourCV")
    side_frame = Frame(0, 0, side_w, height, leftPadding=20, rightPadding=16, topPadding=34, bottomPadding=30, id="side")
    main_frame = Frame(side_w, 0, width - side_w, height, leftPadding=26, rightPadding=34, topPadding=38, bottomPadding=44, id="main")
    later_frame = Frame(side_w, 0, width - side_w, height, leftPadding=26, rightPadding=34, topPadding=38, bottomPadding=44, id="main2")
    doc.addPageTemplates([
        PageTemplate(id="first", frames=[side_frame, main_frame], onPage=draw_background),
        PageTemplate(id="later", frames=[later_frame], onPage=later_page),
    ])
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


# ---------------------------------------------------------------------------
# Template design choices (see src/template_factory.py)
# ---------------------------------------------------------------------------
BULLET_GLYPHS = {"dot": "\u2022", "dash": "\u2013", "arrow": "\u203a"}

# density -> (body pt, leading, margin in, name pt, space before section, space before entry, space after bullet)
DENSITY_METRICS = {
    "compact": (10.0, 12.4, 0.55, 20.0, 6.0, 2.0, 1.5),
    "standard": (10.5, 13.8, 0.75, 24.0, 10.0, 4.0, 2.5),
    "airy": (11.0, 15.2, 0.85, 26.0, 14.0, 6.0, 3.5),
}


class SectionHeading(Flowable):
    """A section heading drawn in one of five styles. The text is still ordinary text, so parsers read it normally.

    kinds: rule (thin rule below) | band (tinted band) | bar (accent bar at the left) |
           underline (short thick accent underline) | plain (text only)
    """

    def __init__(self, text: str, kind: str, font: str, size: float, text_color: str, accent: str, rule_color: str,
                 before: float, keep: bool = True):
        super().__init__()
        self.text, self.kind = text, kind
        self.accent, self.rule_color = accent, rule_color
        self.spaceBefore = before + (3 if kind == "band" else 0)
        self.spaceAfter = 3
        self.keepWithNext = keep
        self.pad_x = 6.0 if kind == "band" else (10.0 if kind == "bar" else 0.0)
        self.pad_y = 2.5 if kind == "band" else (1.5 if kind == "bar" else 0.0)
        self._style = ParagraphStyle(f"SH_{kind}", fontName=font, fontSize=size, leading=size + 3,
                                     textColor=colors.HexColor(text_color))
        self._para: Any = None

    def wrap(self, avail_width: float, avail_height: float):
        self._para = Paragraph(self.text, self._style)
        _, h = self._para.wrap(avail_width - 2 * self.pad_x, avail_height)
        extra = {"rule": 4.5, "underline": 6.0}.get(self.kind, 0.0)
        self.width, self.height = avail_width, h + 2 * self.pad_y + extra
        self._text_h = h
        return self.width, self.height

    def draw(self) -> None:
        c = self.canv
        extra = {"rule": 4.5, "underline": 6.0}.get(self.kind, 0.0)
        top_y = self.height - self.pad_y
        if self.kind == "band":
            c.setFillColor(colors.HexColor(tint(self.accent, 0.10)))
            c.rect(0, 0, self.width, self.height, stroke=0, fill=1)
        elif self.kind == "bar":
            c.setFillColor(colors.HexColor(self.accent))
            c.rect(0, 0, 3.2, self.height, stroke=0, fill=1)
        self._para.drawOn(c, self.pad_x, top_y - self._text_h)
        if self.kind == "rule":
            c.setStrokeColor(colors.HexColor(self.rule_color))
            c.setLineWidth(0.6)
            c.line(0, 1.5, self.width, 1.5)
        elif self.kind == "underline":
            c.setStrokeColor(colors.HexColor(self.accent))
            c.setLineWidth(2.2)
            c.line(0, 1.5, 30, 1.5)


def generate_tailored_pdf(
    job: Dict[str, Any],
    user_profile: Dict[str, Any],
    user_prefs: Dict[str, Any],
    template_id: Optional[str] = "gulf_dubai_sapphire",
    parsed_resume: Optional[Dict[str, Any]] = None,
    accent_color: Optional[str] = None,
    font: Optional[str] = None,
    photo: Optional[str] = None,
) -> bytes:
    """Generates a PDF resume in the selected template style (US Letter).

    Most templates are single column and ATS-safe. The "designer" layouts (sidebar_photo, sidebar_light,
    photo_banner) add a profile photo and/or a coloured sidebar; `photo` is an optional data-URL image.

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

    spec = resolve_style(tmpl)
    if not tmpl.get("style") and layout == "single_column":
        # Original templates: the classic serif look centres its header (follows the font you picked).
        spec["header"] = "centered" if family in SERIF_FAMILIES else "left"
    body_size, body_leading, margin_in, name_size, sec_before, entry_before, bullet_after = DENSITY_METRICS[spec["density"]]
    margin = margin_in * inch
    bullet_glyph = BULLET_GLYPHS[spec["bullets"]]
    heading_kind = spec["heading"]

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

    photo_png = prepare_photo(photo) if layout in DESIGNER_LAYOUTS else None
    if layout in ("sidebar_photo", "sidebar_light"):
        return _sidebar_pdf(data, layout, fonts, accent, photo_png, data["name"] or "Resume", spec)

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
        creator="RateYourCV",
    )

    styles = getSampleStyleSheet()
    sid = tmpl["id"]

    def style(name: str, **kw: Any) -> ParagraphStyle:
        return ParagraphStyle(f"{name}_{sid}", parent=styles["Normal"], **kw)

    header_kind = spec["header"]
    align = 1 if header_kind == "centered" else 0
    shown_name = data["name"].upper() if spec["caps"] else data["name"]
    name_style = style("Name", fontName=fonts["bold"], fontSize=name_size, leading=name_size + 4,
                       textColor=primary, spaceAfter=2, alignment=align)
    headline_style = style("Headline", fontName=fonts["bold"], fontSize=12, leading=15, textColor=accent, spaceAfter=3, alignment=align)
    contact_style = style("Contact", fontName=fonts["regular"], fontSize=10, leading=13, textColor=colors.HexColor(MUTED_TEXT),
                          spaceAfter=4, alignment=align)
    contact_right = style("ContactRight", fontName=fonts["regular"], fontSize=10, leading=13, textColor=colors.HexColor(MUTED_TEXT),
                          alignment=2)

    banner_name = style("BannerName", fontName=fonts["bold"], fontSize=24, leading=28, textColor=colors.white)
    banner_headline = style("BannerHeadline", fontName=fonts["bold"], fontSize=12, leading=15, textColor=colors.HexColor("#E2E8F0"))
    banner_contact = style("BannerContact", fontName=fonts["regular"], fontSize=10, leading=13, textColor=colors.HexColor("#E2E8F0"))

    body_style = style("Body", fontName=fonts["regular"], fontSize=body_size, leading=body_leading,
                       textColor=colors.HexColor(text_hex), spaceAfter=2 if spec["density"] == "compact" else 3)
    cell_style = style("Cell", fontName=fonts["regular"], fontSize=body_size, leading=body_leading, textColor=colors.HexColor(text_hex))
    entry_style = style("Entry", fontName=fonts["regular"], fontSize=body_size, leading=body_leading,
                        textColor=colors.HexColor(text_hex), spaceBefore=entry_before, spaceAfter=1, keepWithNext=True)
    date_style = style("Date", fontName=fonts["regular"], fontSize=body_size, leading=body_leading,
                       textColor=colors.HexColor(MUTED_TEXT), alignment=2)
    bullet_style = style("Bullet", fontName=fonts["regular"], fontSize=body_size, leading=body_leading,
                         textColor=colors.HexColor(text_hex), leftIndent=14, bulletIndent=3,
                         bulletFontName=fonts["regular"], bulletFontSize=body_size, spaceAfter=bullet_after)

    story: List[Any] = []
    header_rule_color = accent if heading_kind == "band" else rule_hex
    header_rule_width = 1.2 if heading_kind == "band" else 0.8

    # ---- Header ----
    contact_line = " &nbsp;|&nbsp; ".join(_esc(c) for c in data["contact"])
    if header_kind == "banner" or layout == "photo_banner":
        rows = []
        if shown_name:
            rows.append([Paragraph(_esc(shown_name), banner_name)])
        if data["headline"]:
            rows.append([Paragraph(_esc(data["headline"]), banner_headline)])
        if contact_line:
            rows.append([Paragraph(contact_line, banner_contact)])
        if rows and layout == "photo_banner" and photo_png:
            # Banner with the circular photo on the right-hand side.
            text_cells = [r[0] for r in rows]
            header = Table([[text_cells, Image(io.BytesIO(photo_png), width=84, height=84)]],
                           colWidths=[doc.width - 84 - 24, 84 + 12])
            header.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(primary)),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("LEFTPADDING", (0, 0), (0, 0), 12),
                ("RIGHTPADDING", (-1, -1), (-1, -1), 12),
            ]))
            story.append(header)
            story.append(Spacer(1, 4))
        elif rows:
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
    elif header_kind == "split":
        left_cells: List[Any] = []
        if shown_name:
            left_cells.append(Paragraph(_esc(shown_name), name_style))
        if data["headline"]:
            left_cells.append(Paragraph(_esc(data["headline"]), headline_style))
        right_cells = [Paragraph(_esc(c), contact_right) for c in data["contact"]]
        if left_cells or right_cells:
            header = Table([[left_cells or "", right_cells or ""]], colWidths=[doc.width * 0.58, doc.width * 0.42])
            header.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]))
            story.append(header)
        story.append(HRFlowable(width="100%", thickness=header_rule_width, color=colors.HexColor(header_rule_color),
                                spaceBefore=3, spaceAfter=2))
    else:
        if shown_name:
            story.append(Paragraph(_esc(shown_name), name_style))
        if data["headline"]:
            story.append(Paragraph(_esc(data["headline"]), headline_style))
        if contact_line:
            story.append(Paragraph(contact_line, contact_style))
        story.append(HRFlowable(width="100%", thickness=header_rule_width, color=colors.HexColor(header_rule_color),
                                spaceBefore=1, spaceAfter=2))

    def section(title: str) -> None:
        story.append(SectionHeading(
            title, heading_kind, fonts["bold"], 11.0 if spec["density"] == "compact" else 11.5,
            accent if heading_kind == "band" else primary, accent, rule_hex, sec_before,
        ))

    def meta_run(text: str) -> str:
        return f'<font color="{MUTED_TEXT}">{text}</font>'

    # ---- Summary ----
    if data["summary"]:
        section(SEC_SUMMARY)
        story.append(Paragraph(_esc(data["summary"]), body_style))

    # ---- Skills (a plain comma list, or the same words laid out in three columns) ----
    if data["skills"]:
        section(SEC_SKILLS)
        if spec["skills"] == "columns" and len(data["skills"]) > 3:
            cols = 3
            cells = [Paragraph(_esc(sk), cell_style) for sk in data["skills"]]
            while len(cells) % cols:
                cells.append(Paragraph("", cell_style))
            grid = Table([cells[i:i + cols] for i in range(0, len(cells), cols)], colWidths=[doc.width / cols] * cols)
            grid.setStyle(TableStyle([
                ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]))
            story.append(grid)
        else:
            story.append(Paragraph(", ".join(_esc(sk) for sk in data["skills"]), body_style))

    # ---- Achievements supplied by the caller (e.g. accepted ATS suggestions) ----
    if data["achievements"]:
        section(SEC_ACHIEVEMENTS)
        for text in data["achievements"]:
            story.append(Paragraph(_esc(text), bullet_style, bulletText=bullet_glyph))

    # ---- Experience ----
    if data["experience"]:
        section(SEC_EXPERIENCE)
        for item in data["experience"]:
            title, company, location, period = _experience_head(item)
            first = f"<b>{_esc(title)}</b>" if title else ""
            if company:
                first += (" &ndash; " if first else "") + _esc(company)
            if spec["dates"] == "right" and period:
                meta = _esc(location)
                head = first + (meta_run(f" | {meta}") if (meta and first) else (meta_run(meta) if meta else ""))
                head_flow: Any = Table([[Paragraph(head, entry_style), Paragraph(_esc(period), date_style)]],
                                       colWidths=[doc.width - 100, 100])
                head_flow.setStyle(TableStyle([
                    ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]))
                head_flow.keepWithNext = True
            else:
                meta = " | ".join(_esc(x) for x in (location, period) if x)
                head = first + (meta_run(f"| {meta}") if (meta and first) else (meta_run(meta) if meta else ""))
                if meta and first:
                    head = first + " " + meta_run(f"| {meta}")
                head_flow = Paragraph(head, entry_style)
            block: List[Any] = [head_flow]
            for b in item["bullets"]:
                block.append(Paragraph(_esc(b), bullet_style, bulletText=bullet_glyph))
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
                story.append(Paragraph(_esc(proj["description"]), bullet_style, bulletText=bullet_glyph))

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


def _shade(cell: Any, hex_fill: str) -> None:
    """Fill a Word table cell with a solid colour."""
    from docx.oxml import OxmlElement

    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_fill.lstrip("#"))
    tc_pr.append(shd)


def _cell_margins(cell: Any, top: int, right: int, bottom: int, left: int) -> None:
    from docx.oxml import OxmlElement

    tc_pr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for side, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tc_pr.append(mar)


def _para_border(paragraph: Any, side: str, hex_color: str, size_eighths: int = 6, space: int = 1) -> None:
    """Add a border (top|left|bottom|right) to a paragraph."""
    from docx.oxml import OxmlElement

    p_pr = paragraph._p.get_or_add_pPr()
    borders = p_pr.find(qn("w:pBdr"))
    if borders is None:
        borders = OxmlElement("w:pBdr")
        p_pr.append(borders)
    el = OxmlElement(f"w:{side}")
    el.set(qn("w:val"), "single")
    el.set(qn("w:sz"), str(size_eighths))
    el.set(qn("w:space"), str(space))
    el.set(qn("w:color"), hex_color.lstrip("#"))
    borders.append(el)


def _para_shade(paragraph: Any, hex_fill: str) -> None:
    from docx.oxml import OxmlElement

    p_pr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_fill.lstrip("#"))
    p_pr.append(shd)


def _set_cell_width(cell: Any, inches: float) -> None:
    cell.width = Inches(inches)


def _first_paragraph(cell: Any, used: List[bool]) -> Any:
    """Reuse the empty paragraph every new cell starts with, then add new ones."""
    if not used[0]:
        used[0] = True
        return cell.paragraphs[0]
    return cell.add_paragraph()


def _docx_sidebar_layout(
    document: Any,
    data: Dict[str, Any],
    layout: str,
    font_name: str,
    accent_rgb: tuple,
    muted_rgb: tuple,
    body_pt: float,
    photo_png: Optional[bytes],
    spec: Optional[Dict[str, Any]] = None,
) -> None:
    """Sidebar (photo, contact, skills, education) + main column (name, summary, experience, projects)
    laid out as a borderless two-cell table. Word carries the sidebar shading across pages."""
    dark = layout == "sidebar_photo"
    accent_hex = "#%02X%02X%02X" % accent_rgb
    side_fill = accent_hex if dark else tint(accent_hex, 0.10)
    side_text = (255, 255, 255) if dark else (30, 41, 59)
    side_muted = (226, 232, 240) if dark else muted_rgb
    side_head = (255, 255, 255) if dark else accent_rgb

    for section in document.sections:
        section.top_margin = section.bottom_margin = Inches(0.4)
        section.left_margin = section.right_margin = Inches(0.4)

    table = document.add_table(rows=1, cols=2)
    table.autofit = False
    row = table.rows[0]
    from docx.enum.table import WD_ROW_HEIGHT_RULE

    row.height = Inches(10.1)
    row.height_rule = WD_ROW_HEIGHT_RULE.AT_LEAST
    side, main = row.cells
    _set_cell_width(side, 2.3)
    _set_cell_width(main, 5.4)
    _shade(side, side_fill)
    _cell_margins(side, 360, 200, 300, 280)
    _cell_margins(main, 380, 340, 300, 360)

    side_used, main_used = [False], [False]

    def put(cell: Any, used: List[bool], text: str, size: float, bold: bool = False, color: tuple = (30, 41, 59),
            after: float = 2, before: float = 0, style: Optional[str] = None) -> Any:
        para = _first_paragraph(cell, used)
        if style:
            para.style = document.styles[style]
        para.paragraph_format.space_after = Pt(after)
        para.paragraph_format.space_before = Pt(before)
        run = para.add_run(text)
        run.bold = bold
        run.font.size = Pt(size)
        run.font.color.rgb = RGBColor(*color)
        return para

    # ---- sidebar ----
    if photo_png:
        pp = _first_paragraph(side, side_used)
        pp.alignment = 1
        pp.add_run().add_picture(io.BytesIO(photo_png), width=Inches(1.45))
    if data["contact"]:
        put(side, side_used, "CONTACT", 10.5, True, side_head, after=2, before=10)
        for item in data["contact"]:
            put(side, side_used, item, 10, color=side_text)
    if data["skills"]:
        put(side, side_used, SEC_SKILLS, 10.5, True, side_head, after=2, before=10)
        for skill in data["skills"]:
            put(side, side_used, skill, 10, color=side_text)
    if data["education"]:
        put(side, side_used, SEC_EDUCATION, 10.5, True, side_head, after=2, before=10)
        for edu in data["education"]:
            if edu["degree"]:
                put(side, side_used, edu["degree"], 10, True, side_text, after=0)
            if edu["institution"]:
                put(side, side_used, edu["institution"], 10, color=side_text, after=0)
            extra = " | ".join(p for p in (edu["year"], edu["honors"]) if p)
            if extra:
                put(side, side_used, extra, 10, color=side_muted, after=4)

    # ---- main column ----
    def heading(text: str) -> None:
        para = _first_paragraph(main, main_used)
        para.style = document.styles["Heading 2"]
        para.add_run(text)

    if data["name"]:
        put(main, main_used, data["name"].upper() if (spec or {}).get("caps") else data["name"], 24, True, accent_rgb, after=0)
    if data["headline"]:
        put(main, main_used, data["headline"], 12, True, muted_rgb, after=4)
    if data["summary"]:
        heading(SEC_SUMMARY)
        put(main, main_used, data["summary"], body_pt)
    if data["achievements"]:
        heading(SEC_ACHIEVEMENTS)
        for text in data["achievements"]:
            _first_paragraph(main, main_used).style = document.styles["List Bullet"]
            main.paragraphs[-1].add_run(text)
    if data["experience"]:
        heading(SEC_EXPERIENCE)
        for item in data["experience"]:
            etitle, company, location, period = _experience_head(item)
            para = _first_paragraph(main, main_used)
            para.paragraph_format.space_before = Pt(3)
            para.paragraph_format.keep_with_next = True
            first = para.add_run(etitle)
            first.bold = True
            if company:
                para.add_run((" \u2013 " if etitle else "") + company)
            meta = " | ".join(x for x in (location, period) if x)
            if meta:
                m = para.add_run(f" | {meta}" if (etitle or company) else meta)
                m.font.color.rgb = RGBColor(*muted_rgb)
            for b in item["bullets"]:
                bp = main.add_paragraph(style="List Bullet")
                bp.add_run(b)
    if data["projects"]:
        heading(SEC_PROJECTS)
        for proj in data["projects"]:
            para = _first_paragraph(main, main_used)
            t = para.add_run(proj["title"])
            t.bold = True
            if proj["stack"]:
                st = para.add_run(f" | {proj['stack']}" if proj["title"] else proj["stack"])
                st.font.color.rgb = RGBColor(*muted_rgb)
            if proj["description"]:
                main.add_paragraph(style="List Bullet").add_run(proj["description"])
    if not main_used[0]:
        main.paragraphs[0].add_run("")


def generate_tailored_docx(
    job: Dict[str, Any],
    user_profile: Dict[str, Any],
    user_prefs: Dict[str, Any],
    template_id: Optional[str] = "gulf_dubai_sapphire",
    parsed_resume: Optional[Dict[str, Any]] = None,
    accent_color: Optional[str] = None,
    font: Optional[str] = None,
    photo: Optional[str] = None,
) -> bytes:
    """Generates a Word resume: real headings and list styles, template font and colours.

    Standard templates use no tables. The designer layouts (sidebar_photo, sidebar_light, photo_banner) use
    a borderless table for the sidebar / photo banner, and `photo` is an optional data-URL image."""
    if docx is None:
        raise ImportError("python-docx is not installed.")

    data = build_resume_data(job, user_profile, user_prefs, parsed_resume)
    tmpl = get_template(template_id or "gulf_dubai_sapphire")
    pal = get_palette(tmpl.get("palette", "slate_navy"))
    family = FONT_CHOICES.get((font or "").lower(), tmpl.get("font_family", "Helvetica"))
    spec = resolve_style(tmpl)
    if not tmpl.get("style") and tmpl.get("layout") == "single_column":
        spec["header"] = "centered" if family in SERIF_FAMILIES else "left"
    is_compact = spec["density"] == "compact"
    font_name = DOCX_FONT_NAMES.get(family, "Arial")
    override = _valid_hex(accent_color)
    if override:
        primary_rgb = accent_rgb = _hex_to_rgb(readable_color(override, minimum=4.5))
    else:
        primary_rgb = _hex_to_rgb(readable_color(pal["primary"], minimum=7.0))
        accent_rgb = _hex_to_rgb(readable_color(pal["secondary"], minimum=4.5))
    muted_rgb = _hex_to_rgb(MUTED_TEXT)
    body_pt, _lead, margin_in, name_pt, *_rest = DENSITY_METRICS[spec["density"]]

    document = docx.Document()
    for section in document.sections:
        margin = Inches(margin_in)
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
    heading.font.color.rgb = RGBColor(*(accent_rgb if spec["heading"] == "band" else primary_rgb))
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

    layout_name = tmpl.get("layout", "single_column")
    photo_png = prepare_photo(photo) if layout_name in DESIGNER_LAYOUTS else None

    if layout_name in ("sidebar_photo", "sidebar_light"):
        _docx_sidebar_layout(document, data, layout_name, font_name, accent_rgb, muted_rgb, body_pt, photo_png, spec)
        buffer = io.BytesIO()
        document.save(buffer)
        buffer.seek(0)
        return buffer.getvalue()

    accent_hex = "#%02X%02X%02X" % accent_rgb
    rule_hex_docx = "#94A3B8"
    kind = spec["heading"]

    def add_heading(text: str) -> None:
        para = document.add_heading(text, level=2)
        if kind == "rule":
            _para_border(para, "bottom", rule_hex_docx, 6)
        elif kind == "band":
            _para_shade(para, tint(accent_hex, 0.10))
        elif kind == "bar":
            _para_border(para, "left", accent_hex, 24, 6)
        elif kind == "underline":
            _para_border(para, "bottom", accent_hex, 14)

    if layout_name == "photo_banner" or spec["header"] == "banner":
        accent_hex = "#%02X%02X%02X" % accent_rgb
        banner = document.add_table(rows=1, cols=2 if photo_png else 1)
        banner.autofit = False
        text_cell = banner.rows[0].cells[0]
        _shade(text_cell, accent_hex)
        _cell_margins(text_cell, 160, 200, 160, 200)
        used = [False]
        width_in = 8.5 - 2 * margin_in
        _set_cell_width(text_cell, width_in - (1.35 if photo_png else 0))
        for text, size, bold, color in (
            (data["name"].upper() if spec["caps"] else data["name"], 24, True, (255, 255, 255)),
            (data["headline"], 12, True, (226, 232, 240)),
            (" | ".join(data["contact"]), 10, False, (226, 232, 240)),
        ):
            if not text:
                continue
            para = _first_paragraph(text_cell, used)
            para.paragraph_format.space_after = Pt(1)
            run = para.add_run(text)
            run.bold = bold
            run.font.size = Pt(size)
            run.font.color.rgb = RGBColor(*color)
        if photo_png:
            photo_cell = banner.rows[0].cells[1]
            _shade(photo_cell, accent_hex)
            _cell_margins(photo_cell, 120, 160, 120, 40)
            _set_cell_width(photo_cell, 1.35)
            pp = photo_cell.paragraphs[0]
            pp.alignment = 2
            pp.add_run().add_picture(io.BytesIO(photo_png), width=Inches(1.05))
        document.add_paragraph().paragraph_format.space_after = Pt(0)
        data = {**data, "name": "", "headline": "", "contact": []}  # already shown in the banner

    if data["name"]:
        p = document.add_paragraph()
        r = p.add_run(data["name"].upper() if spec["caps"] else data["name"])
        r.bold = True
        r.font.size = Pt(name_pt)
        r.font.color.rgb = RGBColor(*primary_rgb)
        p.paragraph_format.space_after = Pt(1)
        if spec["header"] == "centered":
            p.alignment = 1
    if data["headline"]:
        p = document.add_paragraph()
        r = p.add_run(data["headline"])
        r.bold = True
        r.font.size = Pt(11.5)
        r.font.color.rgb = RGBColor(*accent_rgb)
        p.paragraph_format.space_after = Pt(1)
        if spec["header"] == "centered":
            p.alignment = 1
    if data["contact"]:
        p = document.add_paragraph()
        r = p.add_run(" | ".join(data["contact"]))
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(*muted_rgb)
        p.paragraph_format.space_after = Pt(4)
        if spec["header"] == "centered":
            p.alignment = 1

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
            if spec["dates"] == "right" and period:
                from docx.enum.text import WD_TAB_ALIGNMENT

                p.paragraph_format.tab_stops.add_tab_stop(Inches(8.5 - 2 * margin_in), WD_TAB_ALIGNMENT.RIGHT)
                if location:
                    lm = p.add_run(f" | {location}")
                    lm.font.color.rgb = RGBColor(*muted_rgb)
                pm = p.add_run(f"\t{period}")
                pm.font.color.rgb = RGBColor(*muted_rgb)
            else:
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
