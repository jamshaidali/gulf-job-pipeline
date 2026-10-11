"""Daily Digest Generator (Interactive HTML Dashboard & Markdown Reports)."""

import os
from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path


class Reporter:
    """Formats and exports daily Gulf job hunt digests and CV tailored recommendations."""

    def __init__(self, output_dir: str = "data/output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_markdown_report(self, candidate_profile: Dict[str, Any], jobs: List[Dict[str, Any]], date_str: str = "") -> str:
        """Generates a comprehensive Markdown report."""
        if not date_str:
            date_str = datetime.now().strftime("%Y-%m-%d")

        cand_name = candidate_profile.get("name", "Candidate")
        skills = ", ".join(candidate_profile.get("skills", [])[:6])

        lines = [
            f"# 🌴 Gulf Job Hunter Daily Digest — {date_str}",
            f"**Candidate:** {cand_name} | **Target Skills:** {skills}",
            f"**Total Fresh Opportunities (Past 24 Hours):** {len(jobs)}",
            "",
            "---",
            ""
        ]

        if not jobs:
            lines.append("> ℹ️ No new jobs posted in the past 24 hours matching criteria. The pipeline will check again tomorrow.")
            content = "\n".join(lines)
            report_file = self.output_dir / f"daily_digest_{date_str}.md"
            report_file.write_text(content, encoding="utf-8")
            return str(report_file)

        for idx, job in enumerate(jobs, 1):
            title = job.get("title", "Unknown Role")
            company = job.get("company", "Company")
            location = job.get("location", "Gulf Region")
            country = job.get("country", "")
            posted = job.get("posted_ago", "Recent")
            apply_url = job.get("apply_url", "#")
            source = job.get("source", "Web")
            cv_analysis = job.get("cv_analysis", {})
            hiring_managers = job.get("hiring_managers", [])

            score = cv_analysis.get("match_score", "N/A")
            verdict = cv_analysis.get("fit_verdict", "Evaluated")
            summary = cv_analysis.get("summary", "")
            missing_kws = cv_analysis.get("missing_keywords", [])
            bullets = cv_analysis.get("tailored_cv_bullets", [])
            tailored_headline = cv_analysis.get("tailored_summary_headline", "")

            lines.append(f"## {idx}. {title} @ **{company}**")
            lines.append(f"- 📍 **Location:** {location} ({country}) | ⏱️ **Posted:** {posted} ({source})")
            lines.append(f"- 🎯 **Match Score:** **{score}%** ({verdict})")
            lines.append(f"- 🔗 **Apply Here:** [{company} Job Link]({apply_url})")
            lines.append("")
            
            if summary:
                lines.append(f"> **AI Fit Assessment:** {summary}")
                lines.append("")

            # Hiring Managers
            if hiring_managers:
                lines.append("### 👤 Hiring Manager & Recruiter Contacts:")
                for hm in hiring_managers:
                    name = hm.get("name", "Contact")
                    role = hm.get("role", "Recruiter")
                    url = hm.get("linkedin_url", "")
                    lines.append(f"- **{name}** — *{role}* | [LinkedIn Profile / Search]({url})")
                lines.append("")

            # CV Tailoring Suggestions
            lines.append("### ✍️ Suggested CV Changes & Optimizations:")
            if missing_kws:
                lines.append(f"- **Missing ATS Keywords to Include:** `{', '.join(missing_kws)}`")
            
            if tailored_headline:
                lines.append(f"- **Tailored CV Headline/Summary:** *\"{tailored_headline}\"*")

            if bullets:
                lines.append("- **Recommended Experience Bullet Points to Add:**")
                for b in bullets:
                    focus = b.get("original_or_focus", "Key Impact")
                    text = b.get("suggested_bullet", "")
                    lines.append(f"  - **{focus}:** {text}")
            
            # Outreach template
            if hiring_managers:
                primary_hm = hiring_managers[0].get("name", "Hiring Manager")
                first_name = primary_hm.split()[0] if " " in primary_hm else "Team"
                lines.append("")
                lines.append("### 💬 Quick LinkedIn Connection Note (Max 300 Chars):")
                lines.append(f"```text")
                lines.append(f"Hi {first_name}, I saw {company}'s opening for {title} in the Gulf. With my background in {skills.split(',')[0]}, I'd love to connect and share how my experience aligns with your team!")
                lines.append(f"```")

            lines.append("")
            lines.append("---")
            lines.append("")

        content = "\n".join(lines)
        report_file = self.output_dir / f"daily_digest_{date_str}.md"
        report_file.write_text(content, encoding="utf-8")
        return str(report_file)

    def generate_html_report(self, candidate_profile: Dict[str, Any], jobs: List[Dict[str, Any]], date_str: str = "") -> str:
        """Generates an interactive, responsive HTML daily digest with copyable templates."""
        if not date_str:
            date_str = datetime.now().strftime("%Y-%m-%d")

        cand_name = candidate_profile.get("name", "Candidate")
        skills = candidate_profile.get("skills", [])

        # HTML template
        html_code = f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gulf Job Hunter Daily Digest — {date_str}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {{
            darkMode: 'class',
            theme: {{
                extend: {{
                    colors: {{
                        brand: {{
                            50: '#ecfeff',
                            500: '#06b6d4',
                            600: '#0891b2',
                            900: '#164e63',
                        }}
                    }}
                }}
            }}
        }}
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body {{ font-family: 'Plus Jakarta Sans', sans-serif; }}
        .score-circle {{
            background: conic-gradient(#06b6d4 var(--score-deg), #334155 0deg);
        }}
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 md:p-8">
    <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <header class="mb-8 p-6 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    24h Live Gulf Feed
                </div>
                <h1 class="text-3xl font-extrabold text-white tracking-tight">🌴 Gulf Job Hunter Digest</h1>
                <p class="text-slate-400 text-sm mt-1">Daily personalized openings for <span class="text-cyan-300 font-medium">{cand_name}</span> &bull; {date_str}</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 text-center">
                    <div class="text-2xl font-black text-cyan-400">{len(jobs)}</div>
                    <div class="text-xs text-slate-400 uppercase font-semibold">Jobs Found</div>
                </div>
            </div>
        </header>

        <!-- Candidate Target Profile Pill Bar -->
        <div class="mb-8 p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-slate-400 uppercase mr-2">Target Skills:</span>
            {''.join([f'<span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">{s}</span>' for s in skills[:8]])}
        </div>

        <!-- Job Cards Grid -->
        <div class="space-y-6">
"""

        for idx, job in enumerate(jobs, 1):
            title = job.get("title", "Job Title")
            company = job.get("company", "Company")
            location = job.get("location", "Gulf")
            country = job.get("country", "")
            posted = job.get("posted_ago", "Recent")
            apply_url = job.get("apply_url", "#")
            source = job.get("source", "Web")
            cv_analysis = job.get("cv_analysis", {})
            hiring_managers = job.get("hiring_managers", [])

            score = cv_analysis.get("match_score", 70)
            score_deg = int(score * 3.6)
            verdict = cv_analysis.get("fit_verdict", "Good Match")
            summary = cv_analysis.get("summary", "")
            missing_kws = cv_analysis.get("missing_keywords", [])
            bullets = cv_analysis.get("tailored_cv_bullets", [])
            tailored_headline = cv_analysis.get("tailored_summary_headline", "")

            # Hiring manager cards
            hm_html = ""
            for hm in hiring_managers:
                hm_name = hm.get("name", "Recruiter")
                hm_role = hm.get("role", "Talent Partner")
                hm_url = hm.get("linkedin_url", "#")
                hm_html += f"""
                <div class="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
                            {hm_name[0] if hm_name else 'H'}
                        </div>
                        <div>
                            <div class="text-sm font-semibold text-slate-200">{hm_name}</div>
                            <div class="text-xs text-slate-400">{hm_role}</div>
                        </div>
                    </div>
                    <a href="{hm_url}" target="_blank" class="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/30 flex items-center gap-1.5 transition">
                        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        LinkedIn
                    </a>
                </div>
                """

            # Missing keywords pills
            missing_pills = "".join([f'<span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">{k}</span>' for k in missing_kws])

            # Bullet suggestions
            bullet_items = ""
            for b in bullets:
                focus = b.get("original_or_focus", "Impact")
                sug = b.get("suggested_bullet", "")
                bullet_items += f"""
                <li class="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                    <span class="text-xs font-bold text-cyan-400 block mb-1 uppercase tracking-wider">{focus}</span>
                    <p class="text-xs text-slate-300 leading-relaxed">{sug}</p>
                </li>
                """

            html_code += f"""
            <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 class="text-xl font-bold text-white hover:text-cyan-400 transition">{title}</h2>
                            <span class="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">{posted}</span>
                        </div>
                        <div class="text-slate-400 text-sm mt-1 flex items-center gap-3">
                            <span class="font-semibold text-slate-200">🏢 {company}</span>
                            <span>&bull;</span>
                            <span>📍 {location}</span>
                            <span>&bull;</span>
                            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400">{source}</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-4">
                        <div class="text-right">
                            <div class="text-2xl font-black text-cyan-400">{score}%</div>
                            <div class="text-xs font-semibold text-emerald-400">{verdict}</div>
                        </div>
                        <a href="{apply_url}" target="_blank" class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-2">
                            Apply Now
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        </a>
                    </div>
                </div>

                <!-- AI Fit Summary -->
                {f'<p class="mt-4 text-xs md:text-sm text-slate-300 italic bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/20">💡 <strong>AI Analysis:</strong> {summary}</p>' if summary else ''}

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <!-- Left: Hiring Managers & Outreach -->
                    <div class="space-y-4">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <span>👥</span> Hiring Managers & Recruiters
                        </h3>
                        <div class="space-y-2">
                            {hm_html}
                        </div>
                    </div>

                    <!-- Right: Suggested CV Changes -->
                    <div class="space-y-4">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <span>✍️</span> Tailored CV Recommendations
                        </h3>

                        {f'<div class="space-y-1"><div class="text-xs font-semibold text-slate-400">Missing ATS Keywords to Add:</div><div class="flex flex-wrap gap-1.5">{missing_pills}</div></div>' if missing_kws else ''}

                        {f'<div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800"><div class="text-xs font-bold text-cyan-400 mb-1">Tailored Profile Summary:</div><p class="text-xs text-slate-300 italic">"{tailored_headline}"</p></div>' if tailored_headline else ''}

                        <ul class="space-y-2">
                            {bullet_items}
                        </ul>
                    </div>
                </div>
            </div>
            """

        html_code += """
        </div>
        
        <!-- Footer -->
        <footer class="mt-12 text-center text-xs text-slate-500 py-6 border-t border-slate-800">
            Automated Gulf Job Hunter & CV Tailoring Pipeline &bull; Daily Scheduled Run
        </footer>
    </div>
</body>
</html>
"""

        report_file = self.output_dir / f"daily_digest_{date_str}.html"
        report_file.write_text(html_code, encoding="utf-8")
        return str(report_file)
