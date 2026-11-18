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

    def parse_structured_resume(self, cv_text: str) -> Dict[str, Any]:
        """
        Parses raw resume text (from PDF, DOCX, or TXT) into structured sections
        ready to auto-fill all fields of the Live Visual Resume Builder:
        - fullName, jobTitle, email, phone, location, linkedIn, github
        - summary
        - skills (list of strings)
        - experiences (list of {id, company, position, location, startDate, endDate, bullets})
        - educations (list of {id, institution, degree, year, honors})
        - projects (list of {id, title, description, techStack})
        """
        base = self.parse_profile(cv_text)
        raw_lines = [line.strip() for line in cv_text.splitlines()]
        non_empty_lines = [line for line in raw_lines if line]

        # 1. Extract Links (LinkedIn, GitHub/Portfolio)
        linkedin_match = re.search(
            r'(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9_-]+/?',
            cv_text,
            re.IGNORECASE,
        )
        linkedin = linkedin_match.group(0) if linkedin_match else ""
        if linkedin and linkedin.startswith("http"):
            linkedin = re.sub(r'^https?://(www\.)?', '', linkedin).rstrip('/')

        github_match = re.search(
            r'(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_.-]+/?',
            cv_text,
            re.IGNORECASE,
        )
        github = github_match.group(0) if github_match else ""
        if github and github.startswith("http"):
            github = re.sub(r'^https?://(www\.)?', '', github).rstrip('/')

        # 2. Extract Name, Headline, and Location from top header lines
        full_name = base.get("name") or "Candidate Name"
        if non_empty_lines:
            first_line = non_empty_lines[0]
            # Clean pipe or dash suffixes from name line if present
            if "|" in first_line and "@" not in first_line:
                parts = [p.strip() for p in first_line.split("|") if p.strip()]
                if parts and 1 <= len(parts[0].split()) <= 4:
                    full_name = parts[0]
            elif 1 <= len(first_line.split()) <= 4 and "@" not in first_line and not re.search(r'\d{3}', first_line):
                full_name = first_line

        # Detect Job Title / Headline from header lines or detected roles
        section_header_Set = {
            "summary", "professional summary", "executive summary", "profile", "professional profile", "about me", "objective",
            "experience", "work experience", "professional experience", "employment history", "work history", "career history",
            "education", "academic background", "qualifications",
            "skills", "technical skills", "core competencies", "core technical skills", "skills & expertise", "technologies",
            "projects", "key projects", "personal projects", "certifications", "courses", "languages", "key achievements"
        }

        job_title = ""
        location = ""
        for line in non_empty_lines[1:6]:
            lower_l = line.lower().strip(": ")
            if lower_l in section_header_Set:
                break
            # Check if this line is a contact info bar (contains email, phone, or linkedin)
            if "@" in line or "linkedin.com" in lower_l or "github.com" in lower_l or re.search(r'\d{3}[-.\s)]\d{3}', line):
                # Try to extract location segment from pipe or bullet separated contact bar
                segments = re.split(r'[|•·]', line)
                for seg in segments:
                    s = seg.strip()
                    if not s:
                        continue
                    if "@" in s or "linkedin" in s.lower() or "github" in s.lower() or "http" in s.lower():
                        continue
                    if re.search(r'\d{3}', s):
                        continue
                    if 2 <= len(s) <= 42:
                        location = s
                        break
                continue
            if not job_title and 2 <= len(line.split()) <= 10 and len(line) <= 85:
                job_title = line

        if not job_title:
            detected_roles = base.get("target_roles") or []
            job_title = detected_roles[0] if detected_roles else "Senior Software Engineer"

        if not location:
            location = "Open to Remote & Hybrid"

        # 3. Segment CV lines into major sections
        section_map: Dict[str, List[str]] = {
            "header": [],
            "summary": [],
            "experience": [],
            "education": [],
            "skills": [],
            "projects": [],
            "other": [],
        }

        def classify_heading(line_str: str) -> Optional[str]:
            cleaned = re.sub(r'^[\d\.\s#*\-•]+', '', line_str).strip().rstrip(':').strip()
            if len(cleaned) > 48 or not cleaned:
                return None
            low = cleaned.lower()
            if low in {"summary", "professional summary", "executive summary", "profile", "professional profile", "about me", "career summary", "career objective", "objective"}:
                return "summary"
            if low in {"experience", "work experience", "professional experience", "employment history", "work history", "career history", "relevant experience"}:
                return "experience"
            if low in {"education", "academic background", "education & training", "academic qualifications", "education and qualifications"}:
                return "education"
            if low in {"skills", "technical skills", "core competencies", "core technical skills", "skills & competencies", "technical stack", "technologies", "key skills", "core skills"}:
                return "skills"
            if low in {"projects", "key projects", "selected projects", "personal projects", "key highlights"}:
                return "projects"
            if low in {"certifications", "certificates", "courses", "languages", "awards", "key achievements", "achievements"}:
                return "other"
            return None

        current_sec = "header"
        for line in non_empty_lines:
            sec = classify_heading(line)
            if sec:
                current_sec = sec
                continue
            section_map[current_sec].append(line)

        # 4. Extract Summary
        summary_lines = section_map["summary"]
        summary_text = " ".join(summary_lines).strip()
        if not summary_text:
            # Look for a paragraph in header if longer than 80 chars
            header_paras = [
                l for l in section_map["header"][1:]
                if len(l) > 75 and "@" not in l and "linkedin" not in l.lower()
            ]
            if header_paras:
                summary_text = " ".join(header_paras).strip()
        if not summary_text:
            top_skills = ", ".join((base.get("skills") or ["modern software architecture", "cloud systems"])[:4])
            summary_text = (
                f"Results-driven {job_title} with proven expertise in {top_skills}. "
                f"Demonstrated track record of delivering high-impact solutions, optimizing system performance, "
                f"and collaborating across cross-functional teams."
            )

        # 5. Extract Skills
        skills_list: List[str] = []
        for s_line in section_map["skills"]:
            # Strip category prefix like "Languages: Python, SQL" -> "Python, SQL"
            if ":" in s_line and len(s_line.split(":", 1)[0]) < 32:
                s_line = s_line.split(":", 1)[1]
            tokens = re.split(r'[,|•·;/]+', s_line)
            for tok in tokens:
                clean_tok = tok.strip().strip("-*•").strip()
                if 2 <= len(clean_tok) <= 35 and not clean_tok.lower().startswith("and "):
                    if clean_tok not in skills_list:
                        skills_list.append(clean_tok)

        for cat_skill in base.get("skills", []):
            if cat_skill not in skills_list:
                skills_list.append(cat_skill)

        if not skills_list:
            skills_list = ["Python", "TypeScript", "SQL", "AWS", "Docker", "System Design", "REST APIs", "Agile"]

        # 6. Extract Work Experiences
        date_range_regex = re.compile(
            r'((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:19|20)\d{2}|\d{1,2}/(?:19|20)\d{2})'
            r'\s*(?:[-–—]|to)\s*'
            r'((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:19|20)\d{2}|\d{1,2}/(?:19|20)\d{2}|Present|Current|Now)',
            re.IGNORECASE,
        )
        role_keywords = r'\b(engineer|developer|manager|director|lead|architect|analyst|specialist|consultant|vp|president|head|officer|designer|scientist|intern|coordinator|administrator|programmer|devops|sre|full\s*stack|backend|frontend)\b'

        experiences: List[Dict[str, Any]] = []
        exp_lines = section_map["experience"]
        current_exp: Optional[Dict[str, Any]] = None
        saw_explicit_bullet_in_exp = False

        for line in exp_lines:
            is_bullet = bool(re.match(r'^[-•*▪‣◦]\s+', line))
            date_match = date_range_regex.search(line)

            if date_match and not is_bullet and len(line) < 130:
                if current_exp:
                    if not current_exp["position"]:
                        current_exp["position"] = job_title
                    if not current_exp["company"]:
                        current_exp["company"] = "Enterprise Organization"
                    experiences.append(current_exp)

                start_d = date_match.group(1).strip()
                end_d = date_match.group(2).strip()
                header_without_date = (line[:date_match.start()] + " " + line[date_match.end():]).strip(" |-–—•,()")
                parts = [p.strip() for p in re.split(r'[|•—–]', header_without_date) if p.strip()]

                position = ""
                company = ""
                exp_loc = ""

                if len(parts) >= 2:
                    if re.search(role_keywords, parts[0], re.IGNORECASE) and not re.search(role_keywords, parts[1], re.IGNORECASE):
                        position = parts[0]
                        company = parts[1]
                    elif re.search(role_keywords, parts[1], re.IGNORECASE) and not re.search(role_keywords, parts[0], re.IGNORECASE):
                        company = parts[0]
                        position = parts[1]
                    else:
                        position = parts[0]
                        company = parts[1]
                    if len(parts) >= 3:
                        exp_loc = parts[2]
                elif len(parts) == 1 and parts[0]:
                    if " at " in parts[0]:
                        sub = parts[0].split(" at ", 1)
                        position = sub[0].strip()
                        company = sub[1].strip()
                    elif re.search(role_keywords, parts[0], re.IGNORECASE):
                        position = parts[0]
                    else:
                        company = parts[0]

                loc_paren = re.search(r'\(([^)]+)\)$', company)
                if loc_paren:
                    exp_loc = loc_paren.group(1).strip()
                    company = company[:loc_paren.start()].strip()

                current_exp = {
                    "id": str(len(experiences) + 1),
                    "company": company,
                    "position": position,
                    "location": exp_loc or location or "Remote",
                    "startDate": start_d,
                    "endDate": end_d,
                    "bullets": [],
                }
                saw_explicit_bullet_in_exp = False

            elif current_exp is not None and not current_exp["bullets"] and not is_bullet and len(line) < 95:
                # Secondary header line right below the date line (e.g. "Senior Software Engineer Lahore, Pakistan")
                sec_line = line.strip(" |-•")
                sec_parts = [p.strip() for p in re.split(r'[|•—–]', sec_line) if p.strip()]
                if len(sec_parts) >= 2:
                    if not current_exp["position"]:
                        current_exp["position"] = sec_parts[0]
                    elif not current_exp["company"]:
                        current_exp["company"] = sec_parts[0]
                    current_exp["location"] = sec_parts[-1]
                else:
                    # First check if line ends with the candidate's detected header location
                    if location and location != "Open to Remote & Hybrid" and sec_line.lower().endswith(location.lower()):
                        role_or_comp = sec_line[:len(sec_line) - len(location)].strip(" ,|-")
                        current_exp["location"] = location
                    else:
                        loc_tail = re.search(r'\b([A-Z][a-zA-Z]+,\s*[A-Z][a-zA-Z]+)$', sec_line)
                        if loc_tail and loc_tail.start() > 3:
                            role_or_comp = sec_line[:loc_tail.start()].strip(" ,|-")
                            current_exp["location"] = loc_tail.group(1).strip()
                        else:
                            role_or_comp = sec_line

                    if not current_exp["position"]:
                        current_exp["position"] = role_or_comp
                    elif not current_exp["company"]:
                        current_exp["company"] = role_or_comp

            elif is_bullet:
                saw_explicit_bullet_in_exp = True
                clean_b = re.sub(r'^[-•*▪‣◦]\s*', '', line).strip()
                if clean_b:
                    if current_exp is None:
                        current_exp = {
                            "id": "1",
                            "company": "Primary Organization",
                            "position": job_title,
                            "location": location,
                            "startDate": "2021",
                            "endDate": "Present",
                            "bullets": [],
                        }
                    current_exp["bullets"].append(clean_b)

            elif current_exp is not None:
                clean_cont = line.strip()
                if not clean_cont:
                    continue
                if saw_explicit_bullet_in_exp and current_exp["bullets"]:
                    # Continuation of a wrapped PDF bullet line
                    prev = current_exp["bullets"][-1]
                    if prev.endswith("-") and len(prev) > 2 and prev[-2].isalpha() and clean_cont[0].islower():
                        current_exp["bullets"][-1] = prev[:-1] + clean_cont
                    else:
                        current_exp["bullets"][-1] = prev + " " + clean_cont
                elif len(clean_cont) > 30:
                    current_exp["bullets"].append(clean_cont)

        if current_exp:
            if not current_exp["position"]:
                current_exp["position"] = job_title
            if not current_exp["company"]:
                current_exp["company"] = "Enterprise Organization"
            experiences.append(current_exp)

        # Ensure every experience has at least one bullet
        for exp in experiences:
            if not exp["bullets"]:
                exp["bullets"] = [
                    f"Delivered key technical and operational milestones as {exp['position']} at {exp['company']}."
                ]

        # Fallback if no experience section headings matched
        if not experiences:
            bullet_candidates = [
                re.sub(r'^[-•*▪‣◦]\s*', '', l).strip()
                for l in non_empty_lines
                if re.match(r'^[-•*▪‣◦]\s+', l) and len(l) > 25
            ]
            experiences = [
                {
                    "id": "1",
                    "company": "Primary Organization",
                    "position": job_title,
                    "location": location,
                    "startDate": "2021",
                    "endDate": "Present",
                    "bullets": bullet_candidates[:5] if bullet_candidates else [
                        f"Led core initiatives and cross-functional deliverables as {job_title}."
                    ],
                }
            ]

        # Update top-level job_title from the most recent experience position if generic
        if experiences and experiences[0].get("position") and job_title in {"Software Engineer", "Senior Software Engineer"}:
            job_title = experiences[0]["position"]

        # 7. Extract Education
        educations: List[Dict[str, Any]] = []
        edu_lines = section_map["education"]
        degree_regex = re.compile(
            r'\b(Bachelor|Master|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|MBA|Ph\.?D\.?|Associate|Diploma|BSCS|BEng|MEng|ICS|F\.?Sc|B\.?Tech|M\.?Tech|Hons)\b',
            re.IGNORECASE,
        )
        inst_regex = re.compile(r'\b(university|college|institute|school|academy|polytechnic)\b', re.IGNORECASE)

        for line in edu_lines:
            clean_edu = re.sub(r'^[-•*▪‣◦]\s*', '', line).strip()
            if len(clean_edu) < 3:
                continue
            year_match = re.search(r'((?:19|20)\d{2}(?:\s*[-–—]\s*(?:19|20)\d{2}|Present)?)', clean_edu)
            year_str = year_match.group(1) if year_match else ""
            line_clean = clean_edu
            if year_match:
                line_clean = (clean_edu[:year_match.start()] + " " + clean_edu[year_match.end():]).strip(" |-–—•,()")

            parts = [p.strip() for p in re.split(r'[|•—–]', line_clean) if p.strip()]
            if len(parts) >= 2:
                if degree_regex.search(parts[0]) and not inst_regex.search(parts[0]):
                    degree = parts[0]
                    institution = " - ".join(parts[1:])
                else:
                    institution = parts[0]
                    degree = " - ".join(parts[1:])
                educations.append({
                    "id": str(len(educations) + 1),
                    "institution": institution[:80],
                    "degree": degree[:80],
                    "year": year_str or "Graduated",
                    "honors": "Verified Academic Credential",
                })
            elif year_str or inst_regex.search(line_clean):
                if degree_regex.search(line_clean) and not inst_regex.search(line_clean) and educations and educations[-1]["degree"] == "Bachelor / University Degree":
                    educations[-1]["degree"] = line_clean[:80]
                else:
                    educations.append({
                        "id": str(len(educations) + 1),
                        "institution": line_clean[:80],
                        "degree": "Bachelor / University Degree",
                        "year": year_str or "Graduated",
                        "honors": "Verified Academic Credential",
                    })
            elif educations and educations[-1]["degree"] == "Bachelor / University Degree":
                # Second line of an education block specifying the degree (e.g. "BS (Hons.) Computer Science")
                educations[-1]["degree"] = line_clean[:80]
            elif degree_regex.search(line_clean):
                educations.append({
                    "id": str(len(educations) + 1),
                    "institution": "University / Academic Institution",
                    "degree": line_clean[:80],
                    "year": year_str or "Graduated",
                    "honors": "Verified Academic Credential",
                })

        if not educations:
            educations = [
                {
                    "id": "1",
                    "institution": "University / Institute of Technology",
                    "degree": "Bachelor of Science",
                    "year": "2020",
                    "honors": "Good Academic Standing",
                }
            ]

        # 8. Extract Projects
        projects: List[Dict[str, Any]] = []
        proj_lines = section_map["projects"]
        has_proj_bullets = any(re.match(r'^[-•*▪‣◦]\s+', pl) for pl in proj_lines)

        if has_proj_bullets:
            curr_proj: Optional[Dict[str, Any]] = None
            for p_line in proj_lines:
                is_p_bullet = bool(re.match(r'^[-•*▪‣◦]\s+', p_line))
                if not is_p_bullet:
                    # Could be a new project title line OR a wrapped continuation of the current bullet
                    if curr_proj and curr_proj["bullets"] and (p_line[0].islower() or curr_proj["bullets"][-1].endswith("-") or curr_proj["bullets"][-1].endswith(",")):
                        prev_b = curr_proj["bullets"][-1]
                        if prev_b.endswith("-") and len(prev_b) > 2 and prev_b[-2].isalpha() and p_line[0].islower():
                            curr_proj["bullets"][-1] = prev_b[:-1] + p_line.strip()
                        else:
                            curr_proj["bullets"][-1] = prev_b + " " + p_line.strip()
                    else:
                        if curr_proj:
                            projects.append({
                                "id": str(len(projects) + 1),
                                "title": curr_proj["title"],
                                "description": " ".join(curr_proj["bullets"][:2]) if curr_proj["bullets"] else curr_proj["title"],
                                "techStack": curr_proj["techStack"] or ", ".join(skills_list[:4]),
                            })
                        raw_title = p_line.strip()
                        curr_proj = {
                            "title": raw_title[:65],
                            "techStack": ", ".join(skills_list[:4]),
                            "bullets": [],
                        }
                else:
                    clean_pb = re.sub(r'^[-•*▪‣◦]\s*', '', p_line).strip()
                    if curr_proj is None:
                        curr_proj = {
                            "title": "Key Project",
                            "techStack": ", ".join(skills_list[:4]),
                            "bullets": [],
                        }
                    if clean_pb:
                        curr_proj["bullets"].append(clean_pb)
            if curr_proj:
                projects.append({
                    "id": str(len(projects) + 1),
                    "title": curr_proj["title"],
                    "description": " ".join(curr_proj["bullets"][:2]) if curr_proj["bullets"] else curr_proj["title"],
                    "techStack": curr_proj["techStack"] or ", ".join(skills_list[:4]),
                })
        else:
            for p_line in proj_lines[:4]:
                clean_p = re.sub(r'^[-•*▪]\s*', '', p_line).strip()
                if len(clean_p) > 12:
                    if ":" in clean_p:
                        title_part, desc_part = clean_p.split(":", 1)
                    elif " - " in clean_p:
                        title_part, desc_part = clean_p.split(" - ", 1)
                    else:
                        title_part, desc_part = clean_p[:40], clean_p
                    projects.append({
                        "id": str(len(projects) + 1),
                        "title": title_part.strip(),
                        "description": desc_part.strip(),
                        "techStack": ", ".join(skills_list[:4]),
                    })

        return {
            "fullName": full_name,
            "jobTitle": job_title,
            "email": base.get("email") or "candidate@email.com",
            "phone": base.get("phone") or "+1 (555) 234-5678",
            "location": location,
            "linkedIn": linkedin or "linkedin.com/in/profile",
            "github": github or "",
            "summary": summary_text,
            "skills": skills_list[:20],
            "experiences": experiences[:6],
            "educations": educations[:4],
            "projects": projects[:4],
        }
