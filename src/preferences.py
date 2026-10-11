"""User Profile, Active CV Management & Custom Matching Preferences Manager with Permanent Tech Stack."""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, List, Optional
from src.cv_parser import CVParser


CONFIG_PATH = Path("config.yaml")


def load_preferences() -> Dict[str, Any]:
    """Loads all preferences including permanent tech stack, candidate profile, active CV, target roles, custom instructions, and exclusion rules."""
    if not CONFIG_PATH.exists():
        return _default_preferences()
    
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}

    target = cfg.get("target_profile", {})
    return {
        "active_cv": target.get("active_cv", "Jamshaid_Ali_Python_Django-5.pdf"),
        "candidate_name": target.get("candidate_name", "Jamshaid Ali"),
        "primary_stack": target.get("primary_stack", [
            "Python", "Django", "FastAPI", "PostgreSQL", "AWS", "Docker", "Celery", "Redis", "AI"
        ]),
        "default_roles": target.get("default_roles", [
            "Python Developer",
            "Django Developer",
            "Senior Backend Engineer",
            "Full Stack Engineer",
            "AI Engineer"
        ]),
        "custom_instructions": target.get("custom_instructions", (
            "Focus strongly on Python, Django, FastAPI, Celery async tasks, REST/GraphQL APIs, "
            "PostgreSQL, Docker, AWS, and AI agent / LLM integrations. Prioritize remote roles or offices in Lahore/Dubai."
        )),
        "excluded_keywords": target.get("excluded_keywords", [
            "WordPress", "PHP", "Junior", "Internship", "Crypto Scam"
        ]),
        "min_match_score": target.get("min_match_score", 55),
        "experience_level": target.get("experience_level", "Mid-Senior")
    }


def _default_preferences() -> Dict[str, Any]:
    return {
        "active_cv": "Jamshaid_Ali_Python_Django-5.pdf",
        "candidate_name": "Jamshaid Ali",
        "primary_stack": [
            "Python", "Django", "FastAPI", "PostgreSQL", "AWS", "Docker", "Celery", "Redis", "AI"
        ],
        "default_roles": [
            "Python Developer",
            "Django Developer",
            "Senior Backend Engineer",
            "Full Stack Engineer",
            "AI Engineer"
        ],
        "custom_instructions": (
            "Focus strongly on Python, Django, FastAPI, Celery async tasks, REST/GraphQL APIs, "
            "PostgreSQL, Docker, AWS, and AI agent / LLM integrations. Prioritize remote roles or offices in Lahore/Dubai."
        ),
        "excluded_keywords": ["WordPress", "PHP", "Junior", "Internship"],
        "min_match_score": 55,
        "experience_level": "Mid-Senior"
    }


def save_preferences(prefs: Dict[str, Any]) -> bool:
    """Saves updated matching preferences and primary stack to config.yaml."""
    cfg = {}
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f) or {}
    
    if "target_profile" not in cfg:
        cfg["target_profile"] = {}
    
    for key in ["active_cv", "candidate_name", "primary_stack", "default_roles", "custom_instructions", "excluded_keywords", "min_match_score", "experience_level"]:
        if key in prefs:
            cfg["target_profile"][key] = prefs[key]

    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        yaml.safe_dump(cfg, f, default_flow_style=False, sort_keys=False)
    
    return True


def get_active_cv_details() -> Dict[str, Any]:
    """Inspects and parses the currently selected CV file."""
    prefs = load_preferences()
    cv_filename = prefs.get("active_cv", "Jamshaid_Ali_Python_Django-5.pdf")
    resumes_dir = Path("data/resumes")
    cv_path = resumes_dir / cv_filename

    # Fallback search if specific file not found
    if not cv_path.exists():
        for ext in ["*.pdf", "*.docx", "*.doc", "*.txt", "*.md"]:
            found = list(resumes_dir.glob(ext))
            if found:
                cv_path = found[0]
                cv_filename = cv_path.name
                break

    if not cv_path.exists():
        return {
            "found": False,
            "filename": "None",
            "name": prefs.get("candidate_name", "Jamshaid Ali"),
            "skills": prefs.get("primary_stack", ["Python", "Django"]),
            "size_kb": 0
        }

    try:
        parser = CVParser()
        text = parser.extract_text(str(cv_path))
        profile = parser.parse_profile(text)
        size_kb = round(cv_path.stat().st_size / 1024, 1)

        detected_skills = profile.get("skills", [])
        # Merge with user's permanent stack
        user_stack = prefs.get("primary_stack", [])

        return {
            "found": True,
            "filename": cv_filename,
            "path": str(cv_path),
            "name": profile.get("name") or prefs.get("candidate_name", "Jamshaid Ali"),
            "email": profile.get("email", ""),
            "skills": user_stack if user_stack else detected_skills,
            "detected_cv_skills": detected_skills,
            "size_kb": size_kb,
            "parsed_text_length": len(text)
        }
    except Exception as e:
        return {
            "found": True,
            "filename": cv_filename,
            "name": prefs.get("candidate_name", "Jamshaid Ali"),
            "skills": prefs.get("primary_stack", ["Python", "Django"]),
            "size_kb": 0,
            "error": str(e)
        }
