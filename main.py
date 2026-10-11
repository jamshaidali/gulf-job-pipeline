"""Main CLI & Orchestration Pipeline for Gulf and Pakistan Tech Jobs (with Database Sync)."""

import os
import sys
import yaml
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from src.cv_parser import CVParser
from src.job_searcher import GulfJobSearcher
from src.pakistan_job_searcher import PakistanJobSearcher
from src.hiring_manager import HiringManagerFinder
from src.cv_tailorer import CVTailorer
from src.reporter import Reporter
from src.notifier import Notifier
from src.seen_tracker import SeenTracker
from src.database import JobDatabase


def load_config(config_path: str = "config.yaml") -> Dict[str, Any]:
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    path = Path(config_path)
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}


def find_default_cv(resumes_dir: str = "data/resumes") -> str:
    path = Path(resumes_dir)
    if not path.exists():
        return ""
    for ext in ["*.pdf", "*.docx", "*.doc", "*.txt", "*.md"]:
        found = list(path.glob(ext))
        if found:
            return str(found[0])
    return ""


def run_single_pipeline(
    region_name: str,
    region_title: str,
    flag_emoji: str,
    searcher_instance: Any,
    cv_path: str,
    roles: List[str],
    limit: int = 10,
    send_notify: bool = True,
    only_unseen: bool = True
):
    print("\n" + "=" * 65)
    print(f"{flag_emoji} SCANNING {region_title.upper()} (FRESH POSTINGS)")
    print("=" * 65)

    config = load_config()

    if not cv_path:
        cv_path = find_default_cv()
    
    parser = CVParser()
    cv_text = parser.extract_text(cv_path)
    profile = parser.parse_profile(cv_text)

    print(f"[*] Candidate: {profile.get('name', 'Candidate')}")
    print(f"[*] Target Roles: {', '.join(roles)}")

    # 1. Search raw jobs from platforms
    if hasattr(searcher_instance, "search_all_pakistan_jobs"):
        raw_jobs = searcher_instance.search_all_pakistan_jobs(keywords=roles, max_jobs=limit)
    else:
        raw_jobs = searcher_instance.search_all_gulf_jobs(keywords=roles, max_jobs=limit)

    if not raw_jobs:
        print(f"[!] No active jobs found for {region_title}.")
        return

    # 2. Filter out already-seen jobs if only_unseen is active
    tracker = SeenTracker(f"data/seen_jobs_{region_name}.json")
    if only_unseen:
        jobs = tracker.filter_unseen(raw_jobs)
        print(f"[*] Filtered {len(raw_jobs)} fetched jobs -> {len(jobs)} brand new unseen jobs.")
    else:
        jobs = raw_jobs

    if not jobs:
        print(f"[✓] Zero new jobs since last check in {region_title}. No duplicate email sent.")
        return

    # 3. Enrich with Hiring Managers & Tailor CV
    hm_finder = HiringManagerFinder()
    tailorer = CVTailorer()
    processed_jobs = []
    db = JobDatabase()

    print(f"\n[*] Processing {len(jobs)} NEW {region_title} jobs...")
    for idx, job in enumerate(jobs, 1):
        print(f"  [{idx}/{len(jobs)}] Processing: {job.title} @ {job.company}...")
        
        hiring_contacts = hm_finder.find_hiring_managers(
            company=job.company,
            job_title=job.title,
            location=job.location,
            job_description=job.description
        )
        job.hiring_managers = hiring_contacts

        analysis = tailorer.analyze_and_tailor(
            cv_text=cv_text,
            candidate_profile=profile,
            job_title=job.title,
            company=job.company,
            job_description=job.description
        )
        job.cv_analysis = analysis
        job_dict = job.to_dict()
        processed_jobs.append(job_dict)

        # Save to SQLite Job Tracker Database
        db.save_job(job_dict, country_tag="Pakistan" if "pakistan" in region_name else "Gulf")

    # 4. Save local reports
    out_dir = Path("data/output")
    out_dir.mkdir(parents=True, exist_ok=True)
    today_str = datetime.now().strftime("%Y-%m-%d_%H-%M")
    
    html_file = out_dir / f"{region_name}_digest_{today_str}.html"
    notifier = Notifier(config)
    html_content = notifier.build_email_html(processed_jobs, region_title=region_title, flag_emoji=flag_emoji)
    html_file.write_text(html_content, encoding="utf-8")

    # 5. Dispatch dedicated regional email
    if send_notify and config.get("notifications", {}).get("enabled"):
        notifier.send_email(processed_jobs, region_title=region_title, flag_emoji=flag_emoji)

    # 6. Mark these jobs as seen so they are never emailed again
    tracker.mark_seen(jobs)

    print(f"\n[✓] {region_title} Alert Sent: {len(processed_jobs)} new opportunities dispatched & synced to Dashboard DB!")


def main():
    parser = argparse.ArgumentParser(description="Gulf & Pakistan Daily/Hourly Job Hunter Pipeline")
    parser.add_argument("--cv", type=str, default="", help="Path to CV file (.pdf, .docx)")
    parser.add_argument("--region", type=str, default="all", choices=["all", "gulf", "pakistan"], help="Region to scan")
    parser.add_argument("--limit", type=int, default=10, help="Max jobs per region")
    parser.add_argument("--all-jobs", action="store_true", help="Include already seen jobs (disable delta filter)")
    parser.add_argument("--notify", action="store_true", default=True, help="Send email alerts")

    args = parser.parse_args()
    config = load_config()
    roles = config.get("target_profile", {}).get("default_roles", ["Python Developer", "Django Developer", "Full Stack Engineer"])

    only_unseen = not args.all_jobs

    # Run Gulf Pipeline
    if args.region in ["all", "gulf"] and config.get("gulf_pipeline", {}).get("enabled", True):
        gulf_searcher = GulfJobSearcher()
        run_single_pipeline(
            region_name="gulf",
            region_title="Gulf Region",
            flag_emoji="🌴",
            searcher_instance=gulf_searcher,
            cv_path=args.cv,
            roles=roles,
            limit=config.get("gulf_pipeline", {}).get("max_jobs", args.limit),
            send_notify=args.notify,
            only_unseen=only_unseen
        )

    # Run Pakistan Pipeline (Lahore & Islamabad)
    if args.region in ["all", "pakistan"] and config.get("pakistan_pipeline", {}).get("enabled", True):
        pk_searcher = PakistanJobSearcher()
        run_single_pipeline(
            region_name="pakistan",
            region_title="Pakistan & Lahore Tech",
            flag_emoji="🇵🇰",
            searcher_instance=pk_searcher,
            cv_path=args.cv,
            roles=roles,
            limit=config.get("pakistan_pipeline", {}).get("max_jobs", args.limit),
            send_notify=args.notify,
            only_unseen=only_unseen
        )


if __name__ == "__main__":
    main()
