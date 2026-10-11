"""Multi-Platform Job Aggregator with Full-Week & Multi-Day Time Window Support."""

import re
import time
import urllib.parse
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional
import requests
from bs4 import BeautifulSoup


@dataclass
class JobPosting:
    id: str
    title: str
    company: str
    location: str
    country: str
    posted_ago: str
    apply_url: str
    description: str
    source: str
    employment_type: str = "Full-time"
    hiring_managers: List[Dict[str, str]] = None
    cv_analysis: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        if self.hiring_managers is None:
            d["hiring_managers"] = []
        return d


class GulfJobSearcher:
    """Aggregates jobs across multiple platforms with configurable time ranges (24h, 3 days, full week)."""

    DEFAULT_LOCATIONS = [
        {"name": "Dubai, UAE", "query_loc": "Dubai, United Arab Emirates", "country": "UAE"},
        {"name": "Abu Dhabi, UAE", "query_loc": "Abu Dhabi, United Arab Emirates", "country": "UAE"},
        {"name": "Riyadh, Saudi Arabia", "query_loc": "Riyadh, Saudi Arabia", "country": "Saudi Arabia"},
        {"name": "Doha, Qatar", "query_loc": "Doha, Qatar", "country": "Qatar"},
    ]

    TIME_FILTERS = {
        "24h": "r86400",    # 1 day
        "2d": "r172800",    # 2 days
        "3d": "r259200",    # 3 days
        "week": "r604800",  # 7 days (Full Week)
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

    # 1. LINKEDIN GUEST API (Configurable Time Range)
    def search_linkedin(self, keyword: str, location: str, country_tag: str = "Gulf", time_window: str = "week", limit: int = 8) -> List[JobPosting]:
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
                company = company_elem.get_text(strip=True) if company_elem else "Company"
                loc = loc_elem.get_text(strip=True) if loc_elem else location
                apply_url = link_elem.get("href", "").split("?")[0]
                posted_ago = time_elem.get_text(strip=True) if time_elem else "Recent"
                job_id = f"li_{abs(hash(title + company))}"

                description = self._fetch_linkedin_description(apply_url)

                jobs.append(JobPosting(
                    id=job_id,
                    title=title,
                    company=company,
                    location=loc,
                    country=country_tag,
                    posted_ago=posted_ago,
                    apply_url=apply_url,
                    description=description,
                    source="LinkedIn",
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

    # 2. JOBICY API (EMEA & Middle East Developer Jobs)
    def search_jobicy(self, keyword: str, limit: int = 5) -> List[JobPosting]:
        jobs = []
        tag = "python" if "python" in keyword.lower() or "django" in keyword.lower() else "dev"
        url = f"https://jobicy.com/api/v2/remote-jobs?tag={tag}&count=15"
        try:
            resp = self.session.get(url, timeout=8)
            if resp.status_code == 200:
                data = resp.json().get("jobs", [])
                for item in data[:limit]:
                    title = item.get("jobTitle", "Software Engineer")
                    company = item.get("companyName", "Tech Company")
                    apply_url = item.get("url", "#")
                    loc = item.get("jobGeo", "Gulf / Remote")
                    desc = BeautifulSoup(item.get("jobDescription", ""), "html.parser").get_text(strip=True)[:600]
                    job_id = f"jobicy_{item.get('id', abs(hash(title+company)))}"

                    jobs.append(JobPosting(
                        id=job_id,
                        title=title,
                        company=company,
                        location=loc,
                        country="Gulf / Remote",
                        posted_ago=item.get("pubDate", "Recent")[:10],
                        apply_url=apply_url,
                        description=desc,
                        source="Jobicy",
                        hiring_managers=[]
                    ))
        except Exception:
            pass
        return jobs

    # 3. WEWORKREMOTELY (Global Programming Feed)
    def search_weworkremotely(self, keyword: str, limit: int = 4) -> List[JobPosting]:
        jobs = []
        url = "https://weworkremotely.com/categories/remote-programming-jobs.rss"
        try:
            resp = self.session.get(url, timeout=8)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "xml")
                items = soup.find_all("item")
                for it in items[:limit]:
                    full_title = it.find("title").text if it.find("title") else "Software Engineer"
                    parts = full_title.split(":")
                    company = parts[0].strip() if len(parts) > 1 else "Tech Employer"
                    title = parts[1].strip() if len(parts) > 1 else full_title
                    link = it.find("link").text if it.find("link") else "#"
                    desc = BeautifulSoup(it.find("description").text if it.find("description") else "", "html.parser").get_text(strip=True)[:500]
                    job_id = f"wwr_{abs(hash(title+company))}"

                    jobs.append(JobPosting(
                        id=job_id,
                        title=title,
                        company=company,
                        location="Remote / Worldwide",
                        country="Remote",
                        posted_ago="Past week",
                        apply_url=link,
                        description=desc,
                        source="WeWorkRemotely",
                        hiring_managers=[]
                    ))
        except Exception:
            pass
        return jobs

    # 4. ARBEITNOW API (Verified Tech Jobs)
    def search_arbeitnow(self, keyword: str, limit: int = 4) -> List[JobPosting]:
        jobs = []
        url = "https://www.arbeitnow.com/api/job-board-api"
        try:
            resp = self.session.get(url, timeout=8)
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                matching = [j for j in data if "python" in j.get("title", "").lower() or "engineer" in j.get("title", "").lower() or "developer" in j.get("title", "").lower()]
                for item in matching[:limit]:
                    title = item.get("title", "Developer")
                    company = item.get("company_name", "Tech Company")
                    apply_url = item.get("url", "#")
                    loc = item.get("location", "Remote")
                    desc = BeautifulSoup(item.get("description", ""), "html.parser").get_text(strip=True)[:500]
                    job_id = f"arbeit_{abs(hash(title+company))}"

                    jobs.append(JobPosting(
                        id=job_id,
                        title=title,
                        company=company,
                        location=loc,
                        country="Remote / Gulf",
                        posted_ago="Past week",
                        apply_url=apply_url,
                        description=desc,
                        source="Arbeitnow",
                        hiring_managers=[]
                    ))
        except Exception:
            pass
        return jobs

    # 5. MASTER MULTI-PLATFORM AGGREGATOR
    def search_all_gulf_jobs(
        self,
        keywords: List[str],
        locations: Optional[List[Dict[str, str]]] = None,
        time_window: str = "week",
        max_jobs: int = 25
    ) -> List[JobPosting]:
        """Queries ALL platforms with specified time range (24h, 3d, week)."""
        if locations is None:
            locations = self.DEFAULT_LOCATIONS

        all_jobs: Dict[str, JobPosting] = {}

        print(f"[*] Aggregating Gulf jobs (Time Window: {time_window.upper()}) across LinkedIn, Jobicy, WeWorkRemotely, Arbeitnow...")

        # 1. LinkedIn Gulf Hubs
        for kw in keywords[:3]:
            for loc in locations[:3]:
                batch = self.search_linkedin(keyword=kw, location=loc["query_loc"], country_tag=loc["country"], time_window=time_window, limit=5)
                for j in batch:
                    k = f"{re.sub(r'[^a-zA-Z0-9]', '', j.title).lower()[:15]}_{re.sub(r'[^a-zA-Z0-9]', '', j.company).lower()[:10]}"
                    if k not in all_jobs:
                        all_jobs[k] = j
                time.sleep(0.4)

        # 2. Jobicy API
        jobicy_batch = self.search_jobicy(keywords[0], limit=4)
        for j in jobicy_batch:
            k = f"{re.sub(r'[^a-zA-Z0-9]', '', j.title).lower()[:15]}_{re.sub(r'[^a-zA-Z0-9]', '', j.company).lower()[:10]}"
            if k not in all_jobs:
                all_jobs[k] = j

        # 3. WeWorkRemotely
        wwr_batch = self.search_weworkremotely(keywords[0], limit=3)
        for j in wwr_batch:
            k = f"{re.sub(r'[^a-zA-Z0-9]', '', j.title).lower()[:15]}_{re.sub(r'[^a-zA-Z0-9]', '', j.company).lower()[:10]}"
            if k not in all_jobs:
                all_jobs[k] = j

        # 4. Arbeitnow
        ar_batch = self.search_arbeitnow(keywords[0], limit=3)
        for j in ar_batch:
            k = f"{re.sub(r'[^a-zA-Z0-9]', '', j.title).lower()[:15]}_{re.sub(r'[^a-zA-Z0-9]', '', j.company).lower()[:10]}"
            if k not in all_jobs:
                all_jobs[k] = j

        results = list(all_jobs.values())[:max_jobs]
        print(f"[+] Total fresh Gulf jobs aggregated ({time_window}): {len(results)}")
        return results
