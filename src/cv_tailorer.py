"""CV Tailoring & Job Description Gap Analysis Engine with Dynamic Permanent Stack & Role Specialization Guardrails."""

import os
import re
import json
from typing import Dict, Any, List, Optional
from src.database import JobDatabase
from src.preferences import load_preferences


# Known major tech ecosystems
ECOSYSTEM_TAXONOMY = {
    "rust": ["rust", "wasm", "webassembly", "cargo", "actix", "tokio"],
    "golang": ["golang", "go developer", "gin", "goroutine"],
    "php": ["php", "laravel", "symfony", "codeigniter", "wordpress", "magento", "drupal"],
    "ruby": ["ruby", "rails", "ruby on rails"],
    "csharp": ["c#", ".net", "dotnet", "asp.net"],
    "cpp": ["c++", "embedded c", "qt", "system c"],
    "swift": ["swift", "ios developer", "swiftui"],
    "kotlin": ["kotlin", "android developer", "flutter"],
    "mern": ["mern", "mean stack", "mern stack", "mern developer"],
    "frontend_only": ["frontend developer", "front end developer", "ui developer", "react developer", "vue developer", "angular developer", "web designer"]
}

# Comprehensive Technical Skills Catalog for ATS Keyword Scanning
TECH_CATALOG = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", ".NET", "Golang", "Go", "Rust", "PHP", "Ruby",
    "Swift", "Kotlin", "SQL", "Bash", "Shell", "HTML", "CSS", "SCSS",
    "Django", "FastAPI", "Flask", "React", "React.js", "React Native", "Next.js", "Vue", "Vue.js", "Angular",
    "Node.js", "Express", "Spring Boot", "ASP.NET", "Laravel", "Ruby on Rails", "NestJS", "Tailwind CSS",
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins",
    "GitHub Actions", "GitLab CI", "Linux", "Ansible", "Helm", "Serverless", "Lambda",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQLite", "DynamoDB", "Cassandra", "Snowflake", "BigQuery",
    "Kafka", "RabbitMQ", "Celery", "GraphQL", "REST API", "gRPC", "WebSockets", "Microservices",
    "Machine Learning", "Deep Learning", "AI", "NLP", "LLMs", "LangChain", "RAG", "PyTorch", "TensorFlow",
    "Scikit-learn", "Pandas", "NumPy", "Apache Spark", "Airflow", "Databricks", "Tableau", "PowerBI",
    "System Design", "Distributed Systems", "Clean Architecture", "OOP", "TDD", "Unit Testing", "Pytest",
    "Jest", "Cypress", "Playwright", "Cybersecurity", "OAuth", "JWT", "FinTech", "HealthTech"
]

SOFT_SKILLS_CATALOG = [
    "Agile", "Scrum", "Kanban", "Leadership", "Mentorship", "Problem Solving", "Cross-Functional Collaboration",
    "Communication", "Stakeholder Management", "Project Management", "Ownership", "Team Player",
    "Critical Thinking", "Adaptability", "Time Management", "Code Review", "Architecture Design", "Strategic Planning"
]

ACTION_VERBS = [
    "engineered", "architected", "spearheaded", "designed", "optimized", "automated", "built", "implemented",
    "scaled", "led", "delivered", "increased", "reduced", "accelerated", "streamlined", "modernized",
    "deployed", "integrated", "orchestrated", "established", "enhanced", "resolved", "managed", "developed",
    "boosted", "maximized", "transformed", "pioneered", "championed"
]

WEAK_VERBS = [
    "assisted", "helped", "worked on", "handled", "responsible for", "tasked with", "participated in",
    "involved in", "supported"
]


class CVTailorer:
    """Analyzes fit between candidate CV and Job Description with dynamic permanent stack and role alignment."""

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.model_name = model_name
        self.client = None

    def analyze_and_tailor(self, cv_text: str, candidate_profile: Dict[str, Any], job_title: str, company: str, job_description: str) -> Dict[str, Any]:
        """Performs deep comparison and applies dynamic permanent stack compatibility + learned preferences."""
        prefs = load_preferences()
        user_permanent_stack = [s.lower() for s in prefs.get("primary_stack", ["Python", "Django", "FastAPI"])]
        target_roles = [r.lower() for r in prefs.get("default_roles", ["Python Developer", "Django Developer", "Senior Backend Engineer"])]
        custom_instructions = prefs.get("custom_instructions", "").lower()
        excluded_keywords = [k.lower() for k in prefs.get("excluded_keywords", [])]

        base_analysis = self._analyze_heuristics(cv_text, candidate_profile, job_title, company, job_description, user_permanent_stack)

        score = base_analysis.get("match_score", 70)
        jd_lower = (job_title + " " + company + " " + job_description).lower()
        title_lower = job_title.lower()
        cv_lower = cv_text.lower()

        # ---------------------------------------------------------------------
        # 1. DYNAMIC GUARDRAIL: Permanent Tech Stack Conflict Detection
        # ---------------------------------------------------------------------
        conflicting_stack = None
        for eco_name, eco_keywords in ECOSYSTEM_TAXONOMY.items():
            user_has_eco = any(
                eco_name in s or any(kw in s for kw in eco_keywords) 
                for s in user_permanent_stack
            )

            # If user has not configured MERN / Frontend-only / Rust / PHP in their permanent stack
            if not user_has_eco:
                if any(re.search(r'\b' + re.escape(kw) + r'\b', title_lower) for kw in eco_keywords):
                    conflicting_stack = eco_name.replace("_", " ").upper()
                    break

        if conflicting_stack:
            score = 25
            base_analysis["match_score"] = 25
            base_analysis["fit_verdict"] = "Specialization Mismatch"
            base_analysis["summary"] = f"⚠️ Role Specialization Mismatch: Job title explicitly requires {conflicting_stack}, which is outside your configured permanent stack ({', '.join(prefs.get('primary_stack', [])[:4])})."
            return base_analysis

        # ---------------------------------------------------------------------
        # 2. Check Negative Excluded Keywords
        # ---------------------------------------------------------------------
        for excl in excluded_keywords:
            if excl and re.search(r'\b' + re.escape(excl) + r'\b', jd_lower):
                score = max(20, score - 35)
                base_analysis["summary"] += f" (⚠️ Penalty: contains excluded term '{excl}')"
                break

        # ---------------------------------------------------------------------
        # 3. Check Positive Focus in Custom Instructions
        # ---------------------------------------------------------------------
        focus_terms = re.findall(r'\b[a-zA-Z]{3,}\b', custom_instructions)
        relevant_focus = [t for t in focus_terms if t not in ["focus", "strongly", "prioritize", "prefer", "roles", "and", "the", "for", "with", "based"]]
        matched_focus = [t for t in relevant_focus if t in jd_lower]
        if len(matched_focus) >= 2:
            score = min(99, score + 12)
            base_analysis["summary"] += f" (🎯 Matches your custom instruction focus: {', '.join(set(matched_focus[:3]))})"

        # ---------------------------------------------------------------------
        # 4. Apply Learned Feedback Rules from DB
        # ---------------------------------------------------------------------
        try:
            db = JobDatabase()
            rules = db.get_learned_rules()
            boosted_terms = [b.lower() for b in rules.get("boosted", [])]
            penalized_terms = [p.lower() for p in rules.get("penalized", [])]
            
            if any(term in company.lower() or term in job_title.lower() for term in boosted_terms):
                score = min(98, score + 15)
                base_analysis["summary"] += " (⭐ Boosted by your positive feedback)"
            elif any(term in company.lower() or term in job_title.lower() for term in penalized_terms):
                score = max(25, score - 25)
                base_analysis["summary"] += " (⚠️ Penalized by your past feedback)"
        except Exception:
            pass

        base_analysis["match_score"] = score
        base_analysis["fit_verdict"] = "High Match" if score >= 75 else ("Moderate Match" if score >= 60 else "Growth Fit")
        return base_analysis

    def _analyze_heuristics(self, cv_text: str, profile: Dict[str, Any], job_title: str, company: str, jd: str, user_stack: List[str]) -> Dict[str, Any]:
        """Heuristic ATS keyword matching tailored to user's permanent stack."""
        cv_lower = cv_text.lower()
        jd_lower = jd.lower()

        jd_keywords = re.findall(r'\b[a-zA-Z]{3,}\b', jd_lower)
        common_words = {
            "the", "and", "for", "with", "that", "this", "from", "have", "will", "your", "team",
            "work", "experience", "role", "years", "skills", "ability", "working", "strong",
            "opportunity", "candidate", "responsibilities", "requirements", "including", "across",
            "knowledge", "understanding", "business", "company", "position", "preferred", "qualifications",
            "using", "looking", "experienced", "ideal", "hands", "along", "technologies", "applications",
            "development", "solutions", "clients", "practical", "digital"
        }
        filtered_keywords = [w for w in jd_keywords if w not in common_words]
        
        freq = {}
        for w in filtered_keywords:
            freq[w] = freq.get(w, 0) + 1
            
        top_jd_terms = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:25]

        matched_terms = []
        missing_terms = []
        for term, count in top_jd_terms:
            if term in cv_lower or any(term in s for s in user_stack):
                matched_terms.append(term.capitalize())
            else:
                missing_terms.append(term.capitalize())

        # Check how many of user's permanent stack skills appear in the JD
        stack_matches = [s for s in user_stack if s in jd_lower]
        stack_match_ratio = len(stack_matches) / max(len(user_stack), 1)

        # Dynamic match formula based on user's permanent stack
        base_score = int((stack_match_ratio * 60) + (len(matched_terms) / max(len(top_jd_terms), 1)) * 40)
        match_score = max(35, min(96, base_score + 10))

        top_skill = user_stack[0].capitalize() if user_stack else "Software Engineering"

        bullets = [
            {
                "original_or_focus": f"Demonstrating {job_title} expertise",
                "suggested_bullet": f"Engineered robust, production-grade microservices with {top_skill} and REST APIs, boosting request handling efficiency by 40% and optimizing DB queries."
            },
            {
                "original_or_focus": f"Targeting ATS Keywords ({', '.join(missing_terms[:2])})",
                "suggested_bullet": f"Implemented scalable architectures leveraging {missing_terms[0] if missing_terms else 'distributed systems'} and {missing_terms[1] if len(missing_terms) > 1 else 'automated CI/CD pipelines'} to accelerate delivery cycles."
            }
        ]

        verdict = "High Match" if match_score >= 75 else ("Moderate Match" if match_score >= 60 else "Growth Fit")

        return {
            "match_score": match_score,
            "fit_verdict": verdict,
            "summary": f"Alignment with {job_title} requirements. Demonstrates core competency in {', '.join(matched_terms[:3]) if matched_terms else top_skill}.",
            "matching_strengths": matched_terms[:4],
            "missing_keywords": missing_terms[:5],
            "tailored_cv_bullets": bullets,
            "tailored_summary_headline": f"Accomplished Software Engineer specializing in {top_skill} and high-performance backend systems, poised to deliver measurable impact as {job_title} at {company}."
        }

    def evaluate_ats_fit(self, cv_text: str, job_description: str, job_title: str = "", company: str = "") -> Dict[str, Any]:
        """Comprehensive ATS scoring & diagnostic engine comparing CV text against a Job Description."""
        cv_clean = cv_text.strip()
        cv_lower = cv_clean.lower()
        jd_clean = job_description.strip()
        jd_lower = jd_clean.lower()

        # If job title wasn't passed, attempt heuristic extraction from first line of JD
        if not job_title and jd_clean:
            first_lines = [l.strip() for l in jd_clean.splitlines() if l.strip()]
            if first_lines and len(first_lines[0].split()) <= 6:
                job_title = first_lines[0]
            else:
                job_title = "Target Role"

        if not company:
            company = "Target Company"

        # ---------------------------------------------------------------------
        # 1. Hard Technical Skills Analysis
        # ---------------------------------------------------------------------
        jd_hard_skills = []
        for skill in TECH_CATALOG:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, jd_lower):
                jd_hard_skills.append(skill)

        matched_hard = []
        missing_hard = []
        for skill in jd_hard_skills:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, cv_lower):
                matched_hard.append(skill)
            else:
                missing_hard.append(skill)

        # Fallback if JD didn't explicitly match predefined catalog
        if not jd_hard_skills:
            matched_hard_score = 75
        else:
            matched_hard_score = int((len(matched_hard) / max(len(jd_hard_skills), 1)) * 100)

        # ---------------------------------------------------------------------
        # 2. Soft Skills & Methodologies Analysis
        # ---------------------------------------------------------------------
        jd_soft_skills = []
        for skill in SOFT_SKILLS_CATALOG:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, jd_lower):
                jd_soft_skills.append(skill)

        matched_soft = []
        missing_soft = []
        for skill in jd_soft_skills:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, cv_lower):
                matched_soft.append(skill)
            else:
                missing_soft.append(skill)

        if not jd_soft_skills:
            matched_soft_score = 80
        else:
            matched_soft_score = int((len(matched_soft) / max(len(jd_soft_skills), 1)) * 100)

        # ---------------------------------------------------------------------
        # 3. Keyword Density & Frequency Table
        # ---------------------------------------------------------------------
        jd_words = re.findall(r'\b[a-zA-Z]{3,}\b', jd_lower)
        stop_words = {
            "the", "and", "for", "with", "that", "this", "from", "have", "will", "your", "team",
            "work", "experience", "role", "years", "skills", "ability", "working", "strong",
            "opportunity", "candidate", "responsibilities", "requirements", "including", "across",
            "knowledge", "understanding", "business", "company", "position", "preferred", "qualifications",
            "using", "looking", "experienced", "ideal", "hands", "along", "technologies", "applications",
            "development", "solutions", "clients", "practical", "digital", "join", "help", "apply", "must",
            "should", "good", "great", "plus", "well", "such", "than", "other", "part", "high", "about"
        }
        filtered_words = [w for w in jd_words if w not in stop_words]
        word_freq = {}
        for w in filtered_words:
            word_freq[w] = word_freq.get(w, 0) + 1

        top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:15]
        keywords_table = []
        matched_kw_count = 0
        for kw, count in top_keywords:
            in_cv = bool(re.search(r'\b' + re.escape(kw) + r'\b', cv_lower))
            if in_cv:
                matched_kw_count += 1
            keywords_table.append({
                "keyword": kw.capitalize(),
                "count": count,
                "in_cv": in_cv,
                "priority": "High" if count >= 3 else "Medium"
            })

        keyword_density_score = int((matched_kw_count / max(len(top_keywords), 1)) * 100) if top_keywords else 75

        # ---------------------------------------------------------------------
        # 4. Action Verbs, Measurable Metrics & Experience Quality
        # ---------------------------------------------------------------------
        found_action_verbs = []
        for verb in ACTION_VERBS:
            if re.search(r'\b' + re.escape(verb) + r'\b', cv_lower):
                found_action_verbs.append(verb.capitalize())

        found_weak_verbs = []
        for verb in WEAK_VERBS:
            if re.search(r'\b' + re.escape(verb) + r'\b', cv_lower):
                found_weak_verbs.append(verb.capitalize())

        # Regex for quantifiable metric expressions: %, $, ms, 10x, numbers with units
        metric_matches = re.findall(
            r'(\b\d+[\.,]?\d*%\b|\$\s*\d+[\d,]*[kmb]?\b|\b\d+x\b|\b\d+\s*ms\b|\b\d+\+?\s*(?:users|clients|projects|million|billion|k|requests|transactions|engineers|members|endpoints)\b)',
            cv_clean,
            re.IGNORECASE
        )
        unique_metrics = list(dict.fromkeys([m.strip() for m in metric_matches]))[:6]

        if len(found_action_verbs) >= 6 and len(unique_metrics) >= 3:
            experience_score = 95
        elif len(found_action_verbs) >= 4 and len(unique_metrics) >= 1:
            experience_score = 82
        elif len(found_action_verbs) >= 2 or len(unique_metrics) >= 1:
            experience_score = 68
        else:
            experience_score = 50

        # ---------------------------------------------------------------------
        # 5. Section & Formatting ATS Compliance Audit
        # ---------------------------------------------------------------------
        has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', cv_clean))
        has_phone = bool(re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}', cv_clean))
        has_linkedin = bool(re.search(r'linkedin\.com|\blinkedin\b', cv_lower))
        has_github = bool(re.search(r'github\.com|\bgithub\b|\bgitlab\b|\bportfolio\b', cv_lower))

        contact_score = 100 if (has_email and has_phone and has_linkedin) else (75 if (has_email and has_phone) else 50)
        has_summary = bool(re.search(r'\b(summary|profile|about me|professional summary|executive summary)\b', cv_lower))
        has_experience = bool(re.search(r'\b(experience|employment|work history|professional experience)\b', cv_lower))
        has_skills_section = bool(re.search(r'\b(skills|technical skills|technologies|core competencies|tech stack)\b', cv_lower))
        has_education = bool(re.search(r'\b(education|academic|university|degree|bachelor|master|b\.s|m\.s|phd)\b', cv_lower))

        sections_passed = sum([
            1 if contact_score >= 75 else 0,
            1 if has_summary else 0,
            1 if has_experience else 0,
            1 if has_skills_section else 0,
            1 if has_education else 0
        ])
        formatting_score = int((sections_passed / 5) * 100)

        # ---------------------------------------------------------------------
        # 6. Overall Weighted ATS Score Calculation
        # ---------------------------------------------------------------------
        raw_overall = int(
            (0.35 * matched_hard_score) +
            (0.20 * keyword_density_score) +
            (0.15 * matched_soft_score) +
            (0.15 * experience_score) +
            (0.15 * formatting_score)
        )
        overall_score = max(20, min(98, raw_overall))

        if overall_score >= 80:
            verdict = "Exceptional ATS Fit"
            verdict_badge = "Green"
        elif overall_score >= 68:
            verdict = "Strong ATS Match"
            verdict_badge = "Cyan"
        elif overall_score >= 52:
            verdict = "Moderate Match (Needs Optimization)"
            verdict_badge = "Amber"
        else:
            verdict = "Critical ATS Keyword Gaps"
            verdict_badge = "Rose"

        # ---------------------------------------------------------------------
        # 7. AI Tailored Headlines, Summary & Bullets
        # ---------------------------------------------------------------------
        top_matched_str = matched_hard[0] if matched_hard else "Software Engineering"
        secondary_skill = matched_hard[1] if len(matched_hard) > 1 else (matched_soft[0] if matched_soft else "System Architecture")
        target_missing_1 = missing_hard[0] if missing_hard else "Cloud Architecture"
        target_missing_2 = missing_hard[1] if len(missing_hard) > 1 else (missing_soft[0] if missing_soft else "High-Scale Systems")

        tailored_headline = f"{job_title} | Expert in {top_matched_str}, {secondary_skill} & {target_missing_1}"
        tailored_summary = (
            f"Results-driven professional with proven expertise in {top_matched_str} and {secondary_skill}, "
            f"specializing in architecting high-availability systems and scalable solutions. Track record of "
            f"delivering robust business impact at scale. Prepared to bring hands-on acumen in {target_missing_1} "
            f"and cross-functional leadership to accelerate engineering excellence as {job_title} at {company}."
        )

        tailored_bullets = [
            {
                "focus": f"Core Competency ({top_matched_str} & Scale)",
                "bullet": f"Architected and deployed high-performance microservices utilizing {top_matched_str} and RESTful APIs, improving system throughput by 38% and reducing p99 latency under heavy production loads."
            },
            {
                "focus": f"Targeting Missing Keyword ({target_missing_1})",
                "bullet": f"Engineered scalable infrastructure integrating {target_missing_1} and automated CI/CD pipelines, accelerating release cycles by 45% and eliminating deployment bottlenecks."
            },
            {
                "focus": f"Targeting Missing Keyword ({target_missing_2})",
                "bullet": f"Spearheaded database optimization and data pipeline streaming leveraging {target_missing_2}, slashing query execution times by 50% and enhancing reliability to 99.9% uptime."
            },
            {
                "focus": "Measurable Leadership & Cross-Functional Impact",
                "bullet": f"Led agile sprint planning and technical mentorship across cross-functional engineering teams, delivering enterprise features 2 weeks ahead of schedule with zero critical post-release defects."
            }
        ]

        # ---------------------------------------------------------------------
        # 8. Priority Action Items (Ranked by ROI)
        # ---------------------------------------------------------------------
        action_items = []
        if missing_hard:
            action_items.append(f"Add missing critical hard skills: {', '.join(missing_hard[:3])} to your Technical Skills section.")
        if len(unique_metrics) < 2:
            action_items.append("Quantify at least 2 experience bullets with measurable metrics (e.g. % efficiency gains, $ cost savings, ms latency reduction).")
        if not has_summary:
            action_items.append("Add a targeted 3-sentence Professional Summary at the top of your resume matching this role.")
        if missing_soft:
            action_items.append(f"Incorporate soft skill keywords: {', '.join(missing_soft[:2])} into your career accomplishments.")
        if not has_linkedin:
            action_items.append("Add a direct link to your active LinkedIn profile in your header for quick recruiter vetting.")

        if not action_items:
            action_items.append("Your CV is exceptionally aligned! Review the tailored bullets and export with an ATS-compliant template.")

        return {
            "overall_score": overall_score,
            "fit_verdict": verdict,
            "verdict_badge": verdict_badge,
            "summary_text": f"Your CV has a {overall_score}% match with {job_title} at {company}. {len(matched_hard)} required hard skills matched, with {len(missing_hard)} key skill gaps identified.",
            "sub_scores": {
                "hard_skills": matched_hard_score,
                "soft_skills": matched_soft_score,
                "keyword_density": keyword_density_score,
                "experience_impact": experience_score,
                "formatting_audit": formatting_score
            },
            "skills_analysis": {
                "matched_hard_skills": matched_hard,
                "missing_hard_skills": missing_hard,
                "matched_soft_skills": matched_soft,
                "missing_soft_skills": missing_soft
            },
            "keywords_table": keywords_table,
            "sections_audit": {
                "contact_info": {
                    "passed": contact_score >= 75,
                    "score": contact_score,
                    "has_email": has_email,
                    "has_phone": has_phone,
                    "has_linkedin": has_linkedin,
                    "has_github": has_github,
                    "notes": "Email & phone found." if (has_email and has_phone) else "Missing email or phone number in contact header."
                },
                "summary": {
                    "passed": has_summary,
                    "score": 100 if has_summary else 40,
                    "notes": "Professional summary detected." if has_summary else "Missing dedicated Professional Summary section."
                },
                "experience": {
                    "passed": has_experience and len(found_action_verbs) >= 3,
                    "score": experience_score,
                    "action_verbs_count": len(found_action_verbs),
                    "action_verbs_found": found_action_verbs[:5],
                    "metrics_count": len(unique_metrics),
                    "metrics_found": unique_metrics,
                    "weak_verbs_found": found_weak_verbs,
                    "notes": f"{len(found_action_verbs)} action verbs and {len(unique_metrics)} quantified metrics identified."
                },
                "skills": {
                    "passed": has_skills_section,
                    "score": 100 if has_skills_section else 40,
                    "count": len(matched_hard),
                    "notes": f"Dedicated skills section found with {len(matched_hard)} matched technical skills." if has_skills_section else "No dedicated Technical Skills section found."
                },
                "education": {
                    "passed": has_education,
                    "score": 100 if has_education else 50,
                    "notes": "Education and academic degree credentials verified." if has_education else "No explicit education credentials found."
                }
            },
            "tailored_kit": {
                "headline": tailored_headline,
                "summary": tailored_summary,
                "bullets": tailored_bullets
            },
            "priority_action_items": action_items
        }
