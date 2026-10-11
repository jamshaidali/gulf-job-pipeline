"""Pakistan Tech Job Searcher with Full-Week & Multi-Day Time Window Support."""

import re
import time
import urllib.parse
from typing import List, Dict, Any, Optional
import requests
from bs4 import BeautifulSoup
from src.job_searcher import JobPosting


class PakistanJobSearcher:
    """Aggregates tech jobs across Pakistan (Lahore, Islamabad, Remote) with configurable time range."""

    TARGET_HUBS = [
        {"name": "Lahore, Pakistan", "query_loc": "Lahore, Punjab, Pakistan", "city": "Lahore"},
        {"name": "Islamabad / Rawalpindi", "query_loc": "Islamabad, Pakistan", "city": "Islamabad"},
        {"name": "Pakistan (Remote / Any)", "query_loc": "Pakistan", "city": "Remote / Pakistan"},
    ]

    TIME_FILTERS = {
        "24h": "r86400",
        "2d": "r172800",
        "3d": "r259200",
        "week": "r604800",
    }

    def __init__(self, headers: Optional[Dict[str, str]] = None):
        self.session = requests.Session()
        self.headers = headers or {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        self.session.headers.update(self.headers)

    def search_linkedin_pk(self, keyword: str, location: str, city_tag: str = "Lahore", time_window: str = "week", limit: int = 8) -> List[JobPosting]:
        jobs = []
        base_url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
        f_tpr = self.TIME_FILTERS.get(time_window, "r604800")
        url = f"{base_url}?keywords={urllib.parse.quote(keyword)}&location={urllib.parse.quote(location)}&f_TPR={f_tpr}&start=0"
        
        try:
            resp = self.session.get(url, timeout=10)
            if resp.status_code != 200 or not resp.text.strip():
                return jobs

            soup = BeautifulSoup(resp.text, "html.parser")
            job_cards = soup.find_all("li") or soup.find_all("div", class_=re.compile("base-card"))

            for card in job_cards[:limit]:
                title_elem = card.find("h3", class_=re.compile("base-search-card__title|job-card-list__title"))
                company_elem = card.find("h4", class_=re.compile("base-search-card__subtitle|job-card-container__company-name"))
                loc_elem = card.find("span", class_=re.compile("job-search-card__location"))
                link_elem = card.find("a", class_=re.compile("base-card__full-link|job-card-list__title"))
                time_elem = card.find("time")

                if not title_elem or not link_elem:
                    continue

                title = title_elem.get_text(strip=True)
                company = company_elem.get_text(strip=True) if company_elem else "Pakistan Tech Company"
                loc = loc_elem.get_text(strip=True) if loc_elem else location
                apply_url = link_elem.get("href", "").split("?")[0]
                posted_ago = time_elem.get_text(strip=True) if time_elem else "Recent"
                job_id = f"pk_li_{abs(hash(title + company))}"

                description = self._fetch_linkedin_description(apply_url)

                jobs.append(JobPosting(
                    id=job_id,
                    title=title,
                    company=company,
                    location=f"{loc} ({city_tag})",
                    country="Pakistan",
                    posted_ago=posted_ago,
                    apply_url=apply_url,
                    description=description,
                    source="LinkedIn PK",
                    hiring_managers=[]
                ))
        except Exception:
            pass
        return jobs

    def _fetch_linkedin_description(self, job_url: str) -> str:
        if job_url:
            try:
                resp = self.session.get(job_url, timeout=6)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    desc = soup.find("div", class_=re.compile("description|show-more-less-html"))
                    if desc:
                        return desc.get_text(separator="\n", strip=True)
            except Exception:
                pass
        return "Full job description available on company LinkedIn application portal."

    def search_all_pakistan_jobs(
        self,
        keywords: List[str],
        time_window: str = "week",
        max_jobs: int = 25
    ) -> List[JobPosting]:
        all_jobs: Dict[str, JobPosting] = {}

        print(f"[*] Aggregating Pakistan tech jobs (Time Window: {time_window.upper()}) across Lahore & Islamabad...")
        
        for kw in keywords:
            if len(all_jobs) >= max_jobs:
                break
                
            # 1. Search LinkedIn for Lahore
            lahore_batch = self.search_linkedin_pk(keyword=kw, location="Lahore, Punjab, Pakistan", city_tag="Lahore", time_window=time_window, limit=6)
            for j in lahore_batch:
                key = f"{re.sub(r'[^a-zA-Z0-9]', '', j.title).lower()[:15]}_{re.sub(r'[^a-zA-Z0-9]', '', j.company).lower()[:10]}"
                if key not in all_jobs:
                    all_jobs[key] = j
            time.sleep(0.4)

            # 2. Search LinkedIn for Islamabad & Remote
            if len(all_jobs) < max_jobs:
                isb_batch = self.search_linkedin_pk(keyword=kw, location="Islamabad, Pakistan", city_tag="Islamabad/Remote", time_window=time_window, limit=5)
                for j in isb_batch:
                    key = f"{re.sub(r'[^a-zA-Z0-9]', '', j.title).lower()[:15]}_{re.sub(r'[^a-zA-Z0-9]', '', j.company).lower()[:10]}"
                    if key not in all_jobs:
                        all_jobs[key] = j
                time.sleep(0.4)

        results = list(all_jobs.values())[:max_jobs]
        print(f"[+] Total unique Pakistan jobs aggregated ({time_window}): {len(results)}")
        return results
