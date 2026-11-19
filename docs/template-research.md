# Resume template research and how it shaped the catalogue

This document records what we found when researching what makes a resume work, how much of it is solid,
and how it was used to design the 500+ templates. It is deliberately explicit about confidence: most
public advice on resumes comes from vendors who sell resume tools, and very little of it is controlled
research. **No template here is claimed to "get interviews", and none carries an ATS score.**

## What the evidence says

| Finding | Source quality | How we used it |
|---|---|---|
| Recruiters skim. An eye-tracking study of 30 recruiters (TheLadders, 2012; update 2018) found about 6-7 seconds per resume, with most attention on name, current and previous title/company, dates and education. Clean layouts with clear section headings did better than cluttered ones. | Small study, run by a company that sells resume services. Indicative, not definitive; it measures screening attention, not interviews. | Clear hierarchy in every template: a prominent name, a distinct headline, strong section headings, dates easy to find (optionally right-aligned), generous spacing in the "airy" density. |
| Single-column, simple structure is the safest choice for applicant tracking systems (ATS). Tables, text boxes, headers/footers and multi-column layouts are the most commonly reported parsing problems. A minority of sources say simple native two-column layouts parse acceptably, and all say you cannot assume the employer's parser behaves like a test tool. | Mostly career blogs and tool vendors, not ATS vendor documentation. Consistent in direction, weak on specifics. | All 300 new standard templates are single column with real, selectable text and standard headings. Anything with a sidebar or photo is a separate, clearly labelled **Designer** group, with a note that strict ATS software may read it poorly. |
| Reverse-chronological order is the safest default. | Consistent across sources; mostly advice, not measured. | Every template uses reverse-chronological experience with the standard section order (summary, skills, experience, projects, education). |
| Body text of about 10-12 pt and margins of at least 0.5 in. Shrinking type or margins to fit a page hurts skimmability. Common, familiar fonts (Arial/Helvetica, Times, Calibri, Cambria) are the usual recommendation. | Vendor and career-site guidance; consistent. | Body text is 10-11 pt in every density and margins are 0.55-0.85 in. Fonts are Arial-, Times-, Calibri- and Cambria-style (open-licensed metric equivalents are bundled so PDFs look the same everywhere). |
| Design flourishes belong in the header; keep accents restrained. Decorative graphics, icons and skill bars are widely reported to hurt text extraction. We found no primary evidence on skill bars specifically. | Vendor guidance; the skill-bar point is inference. | One accent colour per template, used for the name, headings and rules. No skill bars, icons or images in standard templates. |
| Length: the best-documented study (ResumeGo, 2018, 482 recruiters, a simulation) found two-page resumes were preferred over one-page for experienced candidates. Many articles quote callback rates by experience level, but the figures conflict and we could not find a primary source. | Preference study, not real callbacks. The callback numbers are unverified. | Content flows to a second page with a name-and-page footer; templates never shrink text to force one page. The compact density is available but never goes below 10 pt. |
| Photos: commonly advised against in the US and UK (bias concerns), and commonly expected in Germany and parts of the Gulf. Large employers often run CVs through a parser first, where a photo adds nothing. Job ads that ask for or forbid a photo override these norms. | Commercial resume-advice blogs, not official guidance. We did not find primary legal text (for example EEOC or Equality Act guidance). | Photos exist only in the **Designer** templates and are optional. The builder says what the photo is for, and the templates page labels designer layouts "Not for strict ATS". |

## What we did not find (and therefore do not claim)

- Evidence that any specific template, colour, font or layout raises interview rates.
- ATS vendor documentation proving a given layout parses correctly in Workday, Taleo, Greenhouse, Lever or iCIMS.
- Reliable callback statistics by resume length or format.

For that reason the site no longer shows per-template "ATS Pass %" figures, "recruiter-approved", or "tested on
Workday/Taleo/Greenhouse/Lever" claims.

## How 500+ templates are made

Other resume sites advertise hundreds or thousands of templates; in practice those are combinations of a small
number of layouts with colours and fonts. We do the same, openly, and make each combination a *real visual
difference*. A template is a combination of:

- **Header**: left, centered, split (name left, contact right), or full-width banner
- **Section headings**: ruled, tinted band, accent bar, short underline, or plain
- **Dates**: next to the title, or aligned right
- **Skills**: comma list or three columns
- **Bullets**: dot, dash or arrow
- **Spacing**: compact, standard or airy (type size, line height and margins)
- **Name**: normal or capitals
- **Font**: Arial-, Times-, Calibri- or Cambria-style
- **Colour palette**: 36 palettes, all checked for readable contrast on white
- Plus three **Designer** structures: dark photo sidebar, light photo sidebar, and photo banner

`src/template_factory.py` walks these combinations deterministically (fixed seed), so the catalogue is identical on
every run, no two templates share the same set of choices, and each gallery page mixes looks. Tests enforce this
(`tests/test_cv_exporter.py`): 500+ templates, all unique, 60+ distinct major looks, every one exports to PDF and Word.

A right-aligned date is drawn as its own text block on the same line as the role title. Position-based readers
(pdfplumber, `pdftotext -layout`) keep them on one line; a reader that splits wide gaps into separate blocks may
not. This is the same trade-off as any right-aligned date in any resume.

## Sources consulted

- TheLadders eye-tracking study: <https://www.bu.edu/com/files/2018/10/TheLadders-EyeTracking-StudyC2.pdf>, summary at <https://www.hrdive.com/news/eye-tracking-study-shows-recruiters-look-at-resumes-for-7-seconds/541582/>
- ResumeGo, one or two page resumes: <https://www.resumego.net/research/one-or-two-page-resumes/>
- ATS parsing of tables, columns and headers (vendor and career blogs): <https://recruitbpm.com/?p=20244>, <https://jobshinobi.com/blog/should-you-use-columns-in-an-ats-resume>, <https://wildandfreetools.com/blog/ats-resume-tables-columns-why-they-fail-fix>
- Fonts, sizes and margins: <https://www.resumecoach.com/best-resume-fonts/>, <https://api.huntr.co/blog/resume-margins>, <https://www.adobe.com/uk/express/learn/blog/best-fonts-for-your-resumes>
- Design restraint and ATS: <https://www.adobe.com/express/discover/tips/ats-resume-tips>, <https://www.livecareer.com/resources/resume-design>
- Photos by country (commercial advice): <https://www.betterpic.io/blog/cv-photos-2025-best-practices>, <https://www.resumemate.io/blog/resume-photos-by-country-dos-donts-legal-norms/>

These are secondary sources. Before making any stronger claim, check the primary documents (ATS vendor docs,
EEOC / Equality Act guidance, the original ResumeGo report).

## Fonts

PDFs embed Liberation Sans/Serif/Mono (Arial, Times, Courier metrics), Carlito (Calibri metrics) and Caladea
(Cambria metrics). All are SIL Open Font License 1.1; the licence texts are in `src/fonts/`. The same files are
served from `frontend/public/fonts/` so the browser preview uses the same typefaces as the download.
