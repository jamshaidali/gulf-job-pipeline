"""Deterministic generator for the extended template catalogue.

A template is a *combination of real design choices*, not a re-labelled copy:

    header   : left | centered | split | banner          where the name and contact details sit
    heading  : rule | band | bar | underline | plain     how section headings are drawn
    dates    : inline | right                            dates next to the title, or aligned right
    skills   : inline | columns                          a comma list, or a three-column list
    bullets  : dot | dash | arrow                        bullet glyph
    density  : standard | compact | airy                 type size, line height, margins, spacing
    caps     : bool                                      name in capitals
    font     : Arial-, Times-, Calibri- or Cambria-style
    palette  : one of the colour palettes

plus the "designer" structures (dark sidebar, light sidebar, photo banner) which add a profile photo.
The generator walks those combinations in a fixed, spread-out order, so the catalogue is reproducible and
neighbouring templates differ in several ways at once. Nothing here claims an ATS score.
"""

import random
from itertools import product
from typing import Any, Dict, List, Tuple

HEADERS = ("left", "centered", "split", "banner")
HEADINGS = ("rule", "band", "bar", "underline", "plain")
DATES = ("inline", "right")
SKILLS = ("inline", "columns")
BULLETS = ("dot", "dash", "arrow")
DENSITIES = ("standard", "compact", "airy")
FONTS = ("Helvetica", "Times-Roman", "Carlito", "Caladea")
DESIGNER_LAYOUTS_ORDER = ("sidebar_photo", "sidebar_light", "photo_banner")

STANDARD_COUNT = 300
DESIGNER_PER_LAYOUT = 40

# (primary, secondary): a dark main colour and a mid-tone partner. Colours are made readable at render time.
NEW_PALETTE_COLORS: Dict[str, Tuple[str, str]] = {
    "harbor_blue": ("#12355B", "#2A6F97"),
    "ember_orange": ("#7C2D12", "#C2410C"),
    "forest_green": ("#14532D", "#15803D"),
    "plum_violet": ("#3B0764", "#7E22CE"),
    "rose_quartz": ("#881337", "#BE185D"),
    "lagoon": ("#0C4A6E", "#0284C7"),
    "midnight": ("#0F172A", "#334155"),
    "olive_grove": ("#3F4A1F", "#65752B"),
    "copper": ("#5B2A12", "#9A5B2E"),
    "steel": ("#1F2937", "#475569"),
    "berry": ("#4A044E", "#A21CAF"),
    "mint_leaf": ("#064E3B", "#047857"),
    "ruby": ("#7F1D1D", "#B91C1C"),
    "sand_dune": ("#44403C", "#A16207"),
    "storm": ("#1E293B", "#0E7490"),
    "azure": ("#1E3A8A", "#2563EB"),
    "cocoa": ("#3E2723", "#795548"),
    "sage": ("#2F4F3E", "#5E8C6A"),
    "denim": ("#1B2A49", "#3D5A80"),
    "saffron": ("#78350F", "#B45309"),
    "orchid": ("#4C1D95", "#7C3AED"),
    "pine": ("#052E16", "#166534"),
    "cobalt_sky": ("#0B3C5D", "#328CC1"),
    "charcoal_gold": ("#18181B", "#A16207"),
}

PALETTE_WORDS = {
    "slate_navy": "Slate", "dubai_sapphire": "Sapphire", "saudi_emerald": "Emerald", "riyadh_gold": "Amber",
    "pure_black": "Noir", "minimal_graphite": "Graphite", "executive_burgundy": "Burgundy", "royal_cobalt": "Cobalt",
    "gulf_teal": "Teal", "charcoal_crimson": "Crimson", "nordic_frost": "Frost", "silicon_cyan": "Cyan",
    "harbor_blue": "Harbor", "ember_orange": "Ember", "forest_green": "Forest", "plum_violet": "Plum",
    "rose_quartz": "Rose", "lagoon": "Lagoon", "midnight": "Midnight", "olive_grove": "Olive", "copper": "Copper",
    "steel": "Steel", "berry": "Berry", "mint_leaf": "Mint", "ruby": "Ruby", "sand_dune": "Dune", "storm": "Storm",
    "azure": "Azure", "cocoa": "Cocoa", "sage": "Sage", "denim": "Denim", "saffron": "Saffron", "orchid": "Orchid",
    "pine": "Pine", "cobalt_sky": "Skyline", "charcoal_gold": "Charcoal",
}

# (header, heading) -> a short style word used in the template name
STYLE_WORDS = {
    ("left", "rule"): "Classic", ("left", "band"): "Banded", ("left", "bar"): "Marker",
    ("left", "underline"): "Accent", ("left", "plain"): "Clean",
    ("centered", "rule"): "Heritage", ("centered", "band"): "Ribbon", ("centered", "bar"): "Chapter",
    ("centered", "underline"): "Poise", ("centered", "plain"): "Quiet",
    ("split", "rule"): "Ledger", ("split", "band"): "Docket", ("split", "bar"): "Index",
    ("split", "underline"): "Signal", ("split", "plain"): "Brief",
    ("banner", "rule"): "Masthead", ("banner", "band"): "Spectrum", ("banner", "bar"): "Anchor",
    ("banner", "underline"): "Horizon", ("banner", "plain"): "Statement",
}
DESIGNER_WORDS = {"sidebar_photo": "Studio", "sidebar_light": "Atelier", "photo_banner": "Portrait"}

HEADER_TEXT = {
    "left": "Left-aligned header",
    "centered": "Centered header",
    "split": "Name on the left with contact details on the right",
    "banner": "Full-width colour banner header",
}
HEADING_TEXT = {
    "rule": "ruled section headings",
    "band": "tinted section bands",
    "bar": "accent-bar section headings",
    "underline": "short accent underlines under headings",
    "plain": "plain, uncluttered section headings",
}
FONT_TEXT = {
    "Helvetica": "Arial-style sans-serif",
    "Times-Roman": "Times-style serif",
    "Carlito": "Calibri-style sans-serif",
    "Caladea": "Cambria-style serif",
}
DENSITY_TEXT = {"standard": "balanced spacing", "compact": "compact spacing", "airy": "airy spacing"}
DESIGNER_TEXT = {
    "sidebar_photo": "Dark colour sidebar with a profile photo, contact details, skills and education beside the main column",
    "sidebar_light": "Light tinted sidebar with a profile photo, contact details, skills and education beside the main column",
    "photo_banner": "Colour banner header with a round profile photo, then a single-column body",
}


def _tint(hex_code: str, strength: float) -> str:
    r, g, b = (int(hex_code[i:i + 2], 16) for i in (1, 3, 5))
    mix = lambda c: round(255 - (255 - c) * strength)  # noqa: E731
    return f"#{mix(r):02X}{mix(g):02X}{mix(b):02X}"


def build_palettes() -> Dict[str, Dict[str, str]]:
    palettes: Dict[str, Dict[str, str]] = {}
    for pid, (primary, secondary) in NEW_PALETTE_COLORS.items():
        palettes[pid] = {
            "primary": primary,
            "secondary": secondary,
            "accent": secondary,
            "text": "#1E293B",
            "bg": _tint(secondary, 0.06),
            "rule": _tint(secondary, 0.30),
        }
    return palettes


def _category(style: Dict[str, Any], font: str) -> str:
    if style["density"] == "compact":
        return "Compact"
    if style["header"] == "banner":
        return "Bold"
    if style["header"] == "centered":
        return "Elegant"
    if style["heading"] == "plain" or style["density"] == "airy":
        return "Minimal"
    if font in ("Times-Roman", "Caladea"):
        return "Classic"
    return "Modern"


def _describe(style: Dict[str, Any], font: str) -> str:
    parts = [f"{HEADER_TEXT[style['header']]} with {HEADING_TEXT[style['heading']]}"]
    extras = []
    if style["dates"] == "right":
        extras.append("dates aligned to the right")
    if style["skills"] == "columns":
        extras.append("skills in three columns")
    if style["caps"]:
        extras.append("name in capitals")
    if extras:
        parts.append(", ".join(extras))
    return f"{'; '.join(parts)}. {FONT_TEXT[font]}, {DENSITY_TEXT[style['density']]}."


def build_templates(palette_ids: List[str]) -> List[Dict[str, Any]]:
    """The extra templates (300 ATS-safe single-column styles + 120 designer layouts).

    Recipes are generated from the design choices, shuffled with a fixed seed and interleaved, so any page
    of the gallery shows a mix of looks and the catalogue is identical on every run.
    """
    n_pal = len(palette_ids)
    standard: List[Tuple[str, Dict[str, Any], str, str]] = []
    designer: List[Tuple[str, Dict[str, Any], str, str]] = []

    # ---- standard (single column) ------------------------------------------------------------
    majors = list(product(HEADERS, HEADINGS, DATES, SKILLS))  # 80 distinct "major looks"
    for k in range(4):
        for m, (header, heading, dates, skills) in enumerate(majors):
            if len(standard) >= STANDARD_COUNT:
                break
            style = {
                "header": header,
                "heading": heading,
                "dates": dates,
                "skills": skills,
                "bullets": BULLETS[(m * 2 + k) % 3],
                "density": DENSITIES[(m + k) % 3],
                "caps": (m + k) % 2 == 0,
            }
            font = FONTS[(m * 3 + k * 5 + k) % 4]
            palette = palette_ids[(m * 5 + k * 11 + k * k) % n_pal]
            standard.append(("single_column", style, font, palette))

    # ---- designer (photo / sidebar) ----------------------------------------------------------
    for li, layout in enumerate(DESIGNER_LAYOUTS_ORDER):
        for k in range(DESIGNER_PER_LAYOUT):
            style = {
                "header": "banner" if layout == "photo_banner" else "left",
                "heading": "rule",
                "dates": DATES[k % 2],
                "skills": "inline",
                "bullets": BULLETS[(k // 2 + li) % 3],
                "density": DENSITIES[(k // 4 + li) % 3],
                "caps": (k // 3) % 2 == 0,
            }
            font = FONTS[(k + li) % 4]
            palette = palette_ids[(k * 7 + li * 5 + k // 4) % n_pal]
            designer.append((layout, style, font, palette))

    rng = random.Random(2026)
    rng.shuffle(standard)
    rng.shuffle(designer)

    # Interleave: roughly 5 standard to 2 designer, so designer styles appear throughout.
    ordered: List[Tuple[str, Dict[str, Any], str, str]] = []
    si = di = 0
    while si < len(standard) or di < len(designer):
        for _ in range(5):
            if si < len(standard):
                ordered.append(standard[si])
                si += 1
        for _ in range(2):
            if di < len(designer):
                ordered.append(designer[di])
                di += 1

    out = [_entry(i, layout, style, font, palette) for i, (layout, style, font, palette) in enumerate(ordered)]
    _name_uniquely(out)
    return out


def _entry(index: int, layout: str, style: Dict[str, Any], font: str, palette: str) -> Dict[str, Any]:
    designer = layout in DESIGNER_WORDS
    word = DESIGNER_WORDS[layout] if designer else STYLE_WORDS[(style["header"], style["heading"])]
    category = "Designer" if designer else _category(style, font)
    description = (
        f"{DESIGNER_TEXT[layout]}. {FONT_TEXT[font]}, {DENSITY_TEXT[style['density']]}."
        if designer
        else _describe(style, font)
    )
    return {
        "id": f"x{index + 1:03d}_{palette}_{layout if designer else style['header'] + '_' + style['heading']}",
        "name": f"{PALETTE_WORDS.get(palette, palette.title())} {word}",
        "category": category,
        "layout": layout,
        "palette": palette,
        "badge": category,
        "ats_score": "Designer layout" if designer else "ATS-friendly layout",
        "description": description,
        "font_family": font,
        "style": style,
    }


def _name_uniquely(entries: List[Dict[str, Any]]) -> None:
    """Names are 'Palette Style'; when several templates share one, add a numeral (Harbor Ledger II)."""
    numerals = ["", " II", " III", " IV", " V", " VI", " VII", " VIII", " IX", " X"]
    seen: Dict[str, int] = {}
    for e in entries:
        n = seen.get(e["name"], 0)
        seen[e["name"]] = n + 1
        if n:
            e["name"] = f"{e['name']}{numerals[n] if n < len(numerals) else ' ' + str(n + 1)}"
