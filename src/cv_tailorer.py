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
