"""CV / Resume Parsing and Profile Extraction Module."""

import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None


class CVParser:
    """Extracts raw text and structured candidate profile from CV/Resume files."""

    def __init__(self, ai_client: Optional[Any] = None):
        self.ai_client = ai_client

    def extract_text(self, file_path: str) -> str:
        """Extracts text from PDF, DOCX, Markdown, or Text files."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"CV file not found: {file_path}")

        ext = path.suffix.lower()
        if ext == ".pdf":
            return self._extract_from_pdf(path)
        elif ext in [".docx", ".doc"]:
            return self._extract_from_docx(path)
        elif ext in [".txt", ".md", ".markdown"]:
            return self._extract_from_text(path)
        else:
            # Fallback to plain reading
            try:
                return path.read_text(encoding="utf-8", errors="ignore")
            except Exception as e:
                raise ValueError(f"Unsupported file format: {ext} ({e})")

    def _extract_from_pdf(self, path: Path) -> str:
        if pypdf is None:
            raise ImportError("pypdf is required for PDF parsing. Please install pypdf.")
        text_parts = []
        with open(path, "rb") as f:
            reader = pypdf.PdfReader(f)
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text.strip())
        return "\n\n".join(text_parts)

    def _extract_from_docx(self, path: Path) -> str:
        if docx is None:
            raise ImportError("python-docx is required for DOCX parsing. Please install python-docx.")
        doc = docx.Document(path)
        text_parts = []
        for p in doc.paragraphs:
            if p.text.strip():
                text_parts.append(p.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join([c.text.strip() for c in row.cells if c.text.strip()])
                if row_text:
                    text_parts.append(row_text)
        return "\n".join(text_parts)

    def _extract_from_text(self, path: Path) -> str:
        return path.read_text(encoding="utf-8", errors="ignore")

    def parse_profile(self, cv_text: str) -> Dict[str, Any]:
        """Extracts structured profile data (skills, current title, target roles, experience)."""
        # Heuristic extraction
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', cv_text)
        email = email_match.group(0) if email_match else ""

        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}', cv_text)
        phone = phone_match.group(0) if phone_match else ""

        # Extract probable name from first few lines
        lines = [l.strip() for l in cv_text.splitlines() if l.strip()]
        name = lines[0] if lines else "Candidate"
        if len(name.split()) > 4 or "@" in name or "resume" in name.lower() or "curriculum" in name.lower():
            name = "Candidate"
            for l in lines[:5]:
                if 1 <= len(l.split()) <= 3 and not any(c in l for c in ["@", "http", "+", "github", "linkedin"]):
                    name = l
                    break

        # Extract common tech skills & domain keywords
        skill_catalog = [
            "Python", "Java", "C++", "C#", ".NET", "Go", "Golang", "Rust", "Node.js", "TypeScript", "JavaScript",
            "React", "Angular", "Vue.js", "Next.js", "Django", "FastAPI", "Flask", "Spring Boot",
            "AWS", "Azure", "GCP", "Kubernetes", "Docker", "Terraform", "CI/CD", "DevOps", "Microservices",
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "Snowflake", "BigQuery",
            "Machine Learning", "Deep Learning", "AI", "NLP", "LLMs", "LangChain", "PyTorch", "TensorFlow",
            "Data Science", "Data Engineering", "Apache Spark", "Airflow", "Kafka", "Tableau", "PowerBI",
            "Product Management", "Agile", "Scrum", "Project Management", "System Architecture", "REST API", "GraphQL",
            "Cybersecurity", "Penetration Testing", "SOC", "SIEM", "FinTech", "Blockchain", "Solidity"
        ]

        detected_skills = []
        for skill in skill_catalog:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, cv_text, re.IGNORECASE):
                detected_skills.append(skill)

        # Detect candidate primary roles & seniority
        roles_catalog = [
            "Software Engineer", "Senior Software Engineer", "Backend Engineer", "Frontend Engineer", "Full Stack Engineer",
            "Data Scientist", "Data Engineer", "Machine Learning Engineer", "AI Engineer", "MLOps Engineer",
            "DevOps Engineer", "Cloud Architect", "Solutions Architect", "Site Reliability Engineer",
            "Product Manager", "Engineering Manager", "Technical Lead", "CTO", "Scrum Master",
            "Cybersecurity Engineer", "Security Analyst", "Database Administrator", "QA Engineer"
        ]
        
        detected_roles = []
        for role in roles_catalog:
            pattern = r'\b' + re.escape(role) + r'\b'
            if re.search(pattern, cv_text, re.IGNORECASE):
                detected_roles.append(role)

        if not detected_roles:
            detected_roles = ["Software Engineer", "AI/ML Engineer", "Data Engineer"]

        # Determine target search keywords
        target_queries = []
        for role in detected_roles[:3]:
            target_queries.append(role)

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "skills": detected_skills,
            "target_roles": detected_roles,
            "search_queries": target_queries,
            "raw_text": cv_text,
            "summary_snippet": cv_text[:800].strip()
        }
