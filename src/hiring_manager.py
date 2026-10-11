"""Hiring Manager & Recruiter Discovery and Cold Outreach Generator."""

import re
import urllib.parse
from typing import List, Dict, Any, Optional
import requests
from bs4 import BeautifulSoup


class HiringManagerFinder:
    """Discovers likely hiring managers, talent acquisition leads, and generates custom outreach."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        })

    def find_hiring_managers(self, company: str, job_title: str, location: str, job_description: str = "") -> List[Dict[str, str]]:
        """Finds recruiters/hiring managers from JD text and LinkedIn search discovery."""
        contacts = []
        
        # 1. Check if named recruiter or contact is inside the job description
        jd_contacts = self._extract_contacts_from_jd(company, job_description)
        if jd_contacts:
            contacts.extend(jd_contacts)

        # 2. Search LinkedIn public profiles for company recruiters/managers
        searched_contacts = self._search_linkedin_profiles(company, job_title, location)
        for sc in searched_contacts:
            if not any(c.get("linkedin_url") == sc.get("linkedin_url") for c in contacts):
                contacts.append(sc)

        # 3. If no specific profiles resolved, provide direct curated search links for LinkedIn
        if not contacts:
            recruiter_query = urllib.parse.quote(f"{company} Talent Acquisition Recruiter {location}")
            manager_query = urllib.parse.quote(f"{company} Hiring Manager {job_title} {location}")
            
            contacts.append({
                "name": f"Talent Acquisition Team ({company})",
                "role": "Recruiter / Talent Partner",
                "linkedin_url": f"https://www.linkedin.com/search/results/people/?keywords={recruiter_query}",
                "type": "Direct Search Link"
            })
            contacts.append({
                "name": f"Department Lead / Hiring Manager ({company})",
                "role": f"Hiring Manager for {job_title}",
                "linkedin_url": f"https://www.linkedin.com/search/results/people/?keywords={manager_query}",
                "type": "Direct Search Link"
            })

        return contacts[:3]

    def _extract_contacts_from_jd(self, company: str, description: str) -> List[Dict[str, str]]:
        """Extracts contact info from text if explicitly stated."""
        contacts = []
        # Look for recruiter mentions: e.g. "Posted by John Doe", "Contact: jane@company.com"
        patterns = [
            r'(?:contact|reach out to|recruiter|posted by|hiring manager)\s*:?\s*([A-Z][a-z]+ [A-Z][a-z]+)',
            r'([A-Z][a-z]+ [A-Z][a-z]+)\s*\((?:Recruiter|Talent Acquisition|HR)\)',
        ]
        for pat in patterns:
            match = re.search(pat, description, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                if len(name.split()) == 2 and company.lower() not in name.lower():
                    search_q = urllib.parse.quote(f"{name} {company} LinkedIn")
                    contacts.append({
                        "name": name,
                        "role": f"Recruiter at {company}",
                        "linkedin_url": f"https://www.google.com/search?q={search_q}",
                        "type": "Mentioned in JD"
                    })
        return contacts

    def _search_linkedin_profiles(self, company: str, job_title: str, location: str) -> List[Dict[str, str]]:
        """Finds LinkedIn profiles of HR / hiring managers at the company."""
        if not company or company.lower() in ["confidential", "stealth", "undisclosed"]:
            return []

        contacts = []
        # Target search query for recruiter or hiring manager
        clean_company = re.sub(r'[^a-zA-Z0-9\s]', '', company).strip()
        search_query = f'site:linkedin.com/in "{clean_company}" ("Talent Acquisition" OR "Recruiter" OR "Engineering Manager" OR "Head of") "{location.split(",")[0]}"'
        
        try:
            url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(search_query)}"
            resp = self.session.get(url, timeout=6)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                results = soup.find_all("div", class_="result")
                for r in results[:4]:
                    title_elem = r.find("a", class_="result__url") or r.find("a", class_="result__snippet")
                    header_elem = r.find("h2", class_="result__title")
                    if not header_elem:
                        continue
                    
                    full_title = header_elem.get_text(strip=True)
                    # Example format: "Jane Doe - Senior Technical Recruiter - Company | LinkedIn"
                    name_parts = full_title.split(" - ")
                    if len(name_parts) >= 2:
                        name = name_parts[0].replace(" | LinkedIn", "").strip()
                        role = name_parts[1].replace(" | LinkedIn", "").strip()
                        
                        link_elem = header_elem.find("a")
                        raw_href = link_elem.get("href", "") if link_elem else ""
                        
                        # Extract target linkedin URL from redirect if needed
                        li_match = re.search(r'(https://[a-z]{2,3}\.linkedin\.com/in/[a-zA-Z0-9\-_%]+)', raw_href)
                        linkedin_url = li_match.group(1) if li_match else f"https://www.linkedin.com/search/results/people/?keywords={urllib.parse.quote(name + ' ' + company)}"
                        
                        if len(name.split()) <= 4 and "profiles" not in name.lower():
                            contacts.append({
                                "name": name,
                                "role": role,
                                "linkedin_url": linkedin_url,
                                "type": "LinkedIn Discovery"
                            })
        except Exception:
            pass

        return contacts

    def generate_outreach_templates(
        self,
        candidate_name: str,
        hiring_manager_name: str,
        job_title: str,
        company: str,
        top_skills: List[str]
    ) -> Dict[str, str]:
        """Generates a 300-char LinkedIn connection note and a full InMail message."""
        first_name = hiring_manager_name.split()[0] if hiring_manager_name and " " in hiring_manager_name else "Hiring Team"
        cand_first = candidate_name.split()[0] if candidate_name else "Candidate"
        skills_str = ", ".join(top_skills[:2]) if top_skills else "relevant domain experience"

        # Under 300 characters for LinkedIn connection invite note
        connection_note = (
            f"Hi {first_name}, I noticed {company} is hiring for the {job_title} role in the Gulf region. "
            f"With my background in {skills_str}, I’d love to connect and share how I can contribute to your team!"
        )
        if len(connection_note) > 300:
            connection_note = connection_note[:297] + "..."

        # Full InMail / Email pitch
        inmail_pitch = (
            f"Subject: Application & Inquiry: {job_title} - {candidate_name}\n\n"
            f"Dear {first_name},\n\n"
            f"I hope you are doing well. I recently came across the {job_title} opening at {company} in the Gulf region "
            f"and was immediately drawn to the impact your team is making.\n\n"
            f"With proven experience across {skills_str}, I have successfully delivered high-impact projects matching the core requirements of this role. "
            f"I have submitted my official application and would welcome the opportunity to briefly introduce my background to you.\n\n"
            f"Thank you for your time and consideration.\n\n"
            f"Best regards,\n{candidate_name}"
        )

        return {
            "linkedin_connection_note": connection_note,
            "full_inmail_pitch": inmail_pitch
        }
