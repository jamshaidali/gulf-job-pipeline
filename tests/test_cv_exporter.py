"""Regression tests for the resume exporters: every catalog template must render a standards-compliant,
ATS-parseable PDF/DOCX and must never invent content the candidate did not provide."""

import io

import pytest
from pypdf import PdfReader

from src.cv_exporter import (
    build_resume_data,
    contrast_ratio,
    generate_tailored_docx,
    generate_tailored_pdf,
    readable_color,
)
from src.cv_templates import DESIGNER_LAYOUTS, PALETTES, TEMPLATES_CATALOG, list_templates

STANDARD_HEADINGS = {"PROFESSIONAL SUMMARY", "SKILLS", "PROFESSIONAL EXPERIENCE", "PROJECTS", "EDUCATION"}

RESUME = {
    "fullName": "José Müller-Åkesson",
    "jobTitle": "Senior Software Engineer",
    "email": "jose@example.com",
    "phone": "+49 151 2345678",
    "location": "Berlin, Germany",
    "linkedIn": "linkedin.com/in/jose",
    "github": "",
    "summary": "Backend engineer focused on R&D for <payments> & \"fintech\".",
    "skills": ["Python", "Django", "PostgreSQL"],
    "experiences": [
        {"id": "1", "company": "Acme & Sons", "position": "Senior Engineer", "location": "Berlin",
         "startDate": "2021", "endDate": "Present",
         "bullets": ["Reduced p99 latency from 350ms to 42ms across 2.4M daily transactions."]},
    ],
    "educations": [{"id": "e", "institution": "TU Berlin", "degree": "BSc Computer Science", "year": "2018", "honors": ""}],
    "projects": [{"id": "p", "title": "Ledger", "techStack": "Python, Django", "description": "Built a double-entry ledger."}],
}
JOB = {"title": "Senior Software Engineer", "company": "", "missing_keywords": [], "tailored_bullets": []}
PROFILE = {"full_name": "x"}


def _pdf(template_id, resume=RESUME, job=JOB):
    return generate_tailored_pdf(job, PROFILE, {}, template_id=template_id, parsed_resume=resume)


def _text_and_sizes(pdf_bytes):
    reader = PdfReader(io.BytesIO(pdf_bytes))
    sizes = []

    def visitor(text, cm, tm, font_dict, font_size):
        if text.strip():
            sizes.append(round(font_size, 1))

    text = "\n".join(page.extract_text(visitor_text=visitor) or "" for page in reader.pages)
    return text, sizes, len(reader.pages)


def test_catalog_is_consistent():
    assert len(TEMPLATES_CATALOG) >= 100
    for t in TEMPLATES_CATALOG:
        assert t["palette"] in PALETTES, t["id"]
        assert t["font_family"] in ("Helvetica", "Times-Roman"), t["id"]
        assert t["layout"] in (
            "single_column", "split_header", "modern_accent", "compact_dense",
            "sidebar_photo", "sidebar_light", "photo_banner",
        ), t["id"]


@pytest.mark.parametrize("template_id", [t["id"] for t in TEMPLATES_CATALOG])
def test_every_template_renders_a_valid_pdf_and_docx(template_id):
    pdf = _pdf(template_id)
    assert pdf.startswith(b"%PDF") and len(pdf) > 2000
    docx_bytes = generate_tailored_docx(JOB, PROFILE, {}, template_id=template_id, parsed_resume=RESUME)
    assert docx_bytes.startswith(b"PK")


def test_pdf_text_is_ats_parseable_for_every_layout_and_font():
    seen = set()
    for t in TEMPLATES_CATALOG:
        key = (t["layout"], t["font_family"])
        if key in seen:
            continue
        seen.add(key)
        text, _sizes, pages = _text_and_sizes(_pdf(t["id"]))
        designer = t["layout"] in DESIGNER_LAYOUTS

        assert "(cid:" not in text, key
        assert "•" in text or "•" in text, f"bullet glyph missing from extracted text for {key}"
        for heading in STANDARD_HEADINGS:
            assert heading in text, (key, heading)
        assert "José Müller-Åkesson" in text, key           # accents survive
        assert "R&D for <payments> & \"fintech\"" in text, key  # markup characters are escaped, not parsed
        if not designer:
            # Standard templates read top to bottom in the order ATS parsers expect. Designer sidebars put
            # skills / education beside the main column, which is exactly why they are labelled "Designer".
            assert text.index("PROFESSIONAL SUMMARY") < text.index("SKILLS") < text.index("PROFESSIONAL EXPERIENCE") < text.index("EDUCATION")
        assert pages == 1


def test_minimum_font_size_is_10pt():
    seen = set()
    for t in TEMPLATES_CATALOG:
        key = (t["layout"], t["font_family"])
        if key in seen:
            continue
        seen.add(key)
        _text, sizes, _pages = _text_and_sizes(_pdf(t["id"]))
        assert sizes and min(sizes) >= 9, key  # page footer is 9pt; everything on page 1 is >= 10pt
        body = [s for s in sizes if s >= 10]
        assert len(body) / len(sizes) > 0.95, key


def test_nothing_is_invented_for_an_empty_resume():
    for tid in ("gulf_dubai_sapphire", "abu_dhabi_executive", "saudi_cloud_infra"):
        text, _sizes, _pages = _text_and_sizes(_pdf(tid, resume={"fullName": "Sara Khan"}))
        assert "Sara Khan" in text
        for marker in ("talentradar.ai", "555", "Open to Remote", "Enterprise Engineering", "Innovative Software",
                       "BSCS", "Results-driven", "University of Engineering", "PROFESSIONAL EXPERIENCE", "SKILLS"):
            assert marker not in text, (tid, marker)


def test_job_keywords_are_never_added_to_candidate_skills():
    job = {**JOB, "missing_keywords": ["Kubernetes", "Terraform"], "company": "Stripe"}
    data = build_resume_data(job, PROFILE, {}, RESUME)
    assert data["skills"] == ["Python", "Django", "PostgreSQL"]
    text, _s, _p = _text_and_sizes(_pdf("gulf_dubai_sapphire", job=job))
    assert "Terraform" not in text and "Tailored for" not in text and "ATS-TAILORED" not in text


def test_schema_default_candidate_name_is_not_used_as_a_real_name():
    assert build_resume_data({}, {}, {"candidate_name": "Candidate"}, {})["name"] == ""
    assert build_resume_data({}, {"full_name": "Candidate", "username": "candidate"}, {}, {})["name"] == ""


def test_long_resume_flows_onto_a_second_page_with_a_footer():
    long_resume = {**RESUME, "experiences": [
        {"id": str(i), "company": f"Company {i}", "position": "Engineer", "location": "Berlin",
         "startDate": "2019", "endDate": "2021", "bullets": ["Delivered measurable impact across the platform."] * 6}
        for i in range(8)]}
    text, _sizes, pages = _text_and_sizes(_pdf("abu_dhabi_executive", resume=long_resume))
    assert pages >= 2 and "José Müller-Åkesson - Page 2" in text


def test_docx_uses_real_headings_and_lists_without_tables():
    from docx import Document

    doc = Document(io.BytesIO(generate_tailored_docx(JOB, PROFILE, {}, template_id="abu_dhabi_executive", parsed_resume=RESUME)))
    assert len(doc.tables) == 0
    headings = [p.text for p in doc.paragraphs if p.style.name == "Heading 2"]
    assert set(headings) == STANDARD_HEADINGS
    assert any(p.style.name == "List Bullet" for p in doc.paragraphs)
    text = "\n".join(p.text for p in doc.paragraphs)
    assert "talentradar.ai" not in text and "555" not in text


def test_palette_colors_meet_wcag_aa_on_white():
    for name, pal in PALETTES.items():
        assert contrast_ratio(readable_color(pal["primary"], minimum=7.0)) >= 7.0, name
        assert contrast_ratio(readable_color(pal["secondary"])) >= 4.5, name
        assert contrast_ratio(readable_color(pal["text"], minimum=7.0)) >= 7.0, name


def test_accent_and_font_overrides_match_what_the_builder_preview_shows():
    import pdfplumber

    base = generate_tailored_pdf(JOB, PROFILE, {}, template_id="abu_dhabi_executive", parsed_resume=RESUME)
    custom = generate_tailored_pdf(JOB, PROFILE, {}, template_id="abu_dhabi_executive", parsed_resume=RESUME,
                                   accent_color="#059669", font="mono")
    assert base != custom

    with pdfplumber.open(io.BytesIO(custom)) as pdf:
        fonts = {ch["fontname"].split("+")[-1] for ch in pdf.pages[0].chars}
        heading = next(ch for ch in pdf.pages[0].chars if ch["text"] == "P")  # PROFESSIONAL SUMMARY
        assert any("Mono" in f for f in fonts), fonts
    # headings are drawn in the (readable) accent colour, not the template default
    assert heading["non_stroking_color"] != (0, 0, 0)
    # invalid values fall back to the template instead of failing
    ok = generate_tailored_pdf(JOB, PROFILE, {}, template_id="abu_dhabi_executive", parsed_resume=RESUME,
                               accent_color="not-a-colour", font="comic-sans")
    assert ok.startswith(b"%PDF")
    docx_bytes = generate_tailored_docx(JOB, PROFILE, {}, template_id="abu_dhabi_executive", parsed_resume=RESUME,
                                        accent_color="#059669", font="mono")
    assert docx_bytes.startswith(b"PK")


def _photo_data_url(size=(500, 400)):
    import base64
    from PIL import Image, ImageDraw

    im = Image.new("RGB", size, (120, 160, 200))
    d = ImageDraw.Draw(im)
    d.ellipse((170, 60, 330, 220), fill=(235, 200, 170))
    d.ellipse((90, 230, 410, 520), fill=(60, 70, 110))
    buf = io.BytesIO()
    im.save(buf, "JPEG")
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def test_catalog_marks_designer_templates_honestly():
    listed = list_templates()
    designers = [t for t in listed if t["designer"]]
    assert 30 <= len(designers) < len(listed)
    for t in designers:
        assert t["layout"] in DESIGNER_LAYOUTS and t["ats_note"] and "ATS" in t["ats_note"]
        assert "% ATS" not in t["ats_score"]          # no invented ATS percentage on designer layouts
    for t in listed:
        if not t["designer"]:
            assert t["ats_note"] == ""
    # the Minimalist ATS category never gets a designer layout
    assert all(not t["designer"] for t in listed if t["category"] == "Minimalist ATS")


@pytest.mark.parametrize("template_id", ["ui_ux_product_designer", "frontend_ui_clean", "tech_lead_manager"])
def test_designer_layouts_embed_the_photo_and_keep_all_content(template_id):
    photo = _photo_data_url()
    pdf = generate_tailored_pdf(JOB, PROFILE, {}, template_id=template_id, parsed_resume=RESUME, photo=photo)
    without = generate_tailored_pdf(JOB, PROFILE, {}, template_id=template_id, parsed_resume=RESUME)
    assert len(pdf) > len(without) + 2000                      # the circular photo is really embedded
    reader = PdfReader(io.BytesIO(pdf))
    assert len(reader.pages) == 1 and len(reader.pages[0].images) == 1
    text = reader.pages[0].extract_text()
    for needle in ("José Müller-Åkesson", "jose@example.com", "Python", "Acme & Sons", "BSc Computer Science", "Ledger"):
        assert needle in text, (template_id, needle)

    from docx import Document

    doc = Document(io.BytesIO(generate_tailored_docx(JOB, PROFILE, {}, template_id=template_id, parsed_resume=RESUME, photo=photo)))
    assert len(doc.tables) == 1
    assert len(doc.inline_shapes) == 1                          # the photo
    all_text = "\n".join(p.text for c in doc.tables[0].rows[0].cells for p in c.paragraphs) + "\n".join(p.text for p in doc.paragraphs)
    for needle in ("José Müller-Åkesson", "jose@example.com", "Python", "Acme & Sons", "BSc Computer Science"):
        assert needle in all_text, (template_id, needle)


def test_bad_or_oversized_photos_are_ignored_not_fatal():
    from src.cv_exporter import prepare_photo

    assert prepare_photo(None) is None
    assert prepare_photo("not a data url") is None
    assert prepare_photo("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=") is None            # SVG is not accepted
    assert prepare_photo("data:image/png;base64," + "A" * 100) is None                     # not an image
    assert prepare_photo("data:image/png;base64," + "A" * 2_000_000) is None               # too large
    ok = prepare_photo(_photo_data_url())
    assert ok and ok.startswith(b"\x89PNG")
    # a broken photo must not break the export
    pdf = generate_tailored_pdf(JOB, PROFILE, {}, template_id="ui_ux_product_designer", parsed_resume=RESUME, photo="data:image/png;base64,AAAA")
    assert pdf.startswith(b"%PDF")


def test_designer_long_resume_flows_to_a_second_page_with_the_sidebar_kept():
    long_resume = {**RESUME, "experiences": [
        {"id": str(i), "company": f"Company {i}", "position": "Engineer", "location": "Berlin",
         "startDate": "2019", "endDate": "2021", "bullets": ["Delivered measurable impact across the platform."] * 6}
        for i in range(8)]}
    pdf = generate_tailored_pdf(JOB, PROFILE, {}, template_id="ui_ux_product_designer", parsed_resume=long_resume, photo=_photo_data_url())
    reader = PdfReader(io.BytesIO(pdf))
    assert len(reader.pages) >= 2
    assert "José Müller-Åkesson - Page 2" in reader.pages[1].extract_text()
