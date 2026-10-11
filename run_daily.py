"""Automated Hourly / Multi-Run Job Hunter Daemon for Gulf & Pakistan."""

import time
import schedule
from datetime import datetime
from main import load_config, run_single_pipeline
from src.job_searcher import GulfJobSearcher
from src.pakistan_job_searcher import PakistanJobSearcher


def job_task():
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ⏰ Executing Job Hunter Check...")
    config = load_config()
    roles = config.get("target_profile", {}).get("default_roles", ["Python Developer", "Django Developer", "Full Stack Engineer"])
    cv_path = "data/resumes/Jamshaid_Ali_Python_Django-5.pdf"

    # 1. Run Gulf Pipeline (Only Unseen Jobs)
    if config.get("gulf_pipeline", {}).get("enabled", True):
        try:
            gulf_searcher = GulfJobSearcher()
            run_single_pipeline(
                region_name="gulf",
                region_title="Gulf Region",
                flag_emoji="🌴",
                searcher_instance=gulf_searcher,
                cv_path=cv_path,
                roles=roles,
                limit=config.get("gulf_pipeline", {}).get("max_jobs", 10),
                send_notify=True,
                only_unseen=True
            )
        except Exception as e:
            print(f"[Error] Gulf Pipeline: {e}")

    # 2. Run Pakistan Pipeline (Only Unseen Jobs)
    if config.get("pakistan_pipeline", {}).get("enabled", True):
        try:
            pk_searcher = PakistanJobSearcher()
            run_single_pipeline(
                region_name="pakistan",
                region_title="Pakistan & Lahore Tech",
                flag_emoji="🇵🇰",
                searcher_instance=pk_searcher,
                cv_path=cv_path,
                roles=roles,
                limit=config.get("pakistan_pipeline", {}).get("max_jobs", 10),
                send_notify=True,
                only_unseen=True
            )
        except Exception as e:
            print(f"[Error] Pakistan Pipeline: {e}")


def main():
    config = load_config()
    sched_cfg = config.get("scheduler", {})
    mode = sched_cfg.get("mode", "hourly")
    interval = sched_cfg.get("interval_minutes", 60)
    run_times = sched_cfg.get("run_times", ["08:00", "13:00", "18:00"])

    print("=" * 65)
    print("⚡ INSTANT GULF & PAKISTAN JOB HUNTER DAEMON")
    print("=" * 65)
    print(f"[*] Target Email: {config.get('notifications', {}).get('email', {}).get('recipient_email')}")

    # Run initial check
    job_task()

    if mode == "hourly":
        print(f"\n[*] Mode: HOURLY RADAR (Scanning every {interval} minutes for brand new jobs)")
        schedule.every(interval).minutes.do(job_task)
    else:
        print(f"\n[*] Mode: FIXED TIMES ({', '.join(run_times)})")
        for t in run_times:
            schedule.every().day.at(t).do(job_task)

    print(f"[*] Daemon is running in the background. Press Ctrl+C to stop.")

    while True:
        schedule.run_pending()
        time.sleep(30)


if __name__ == "__main__":
    main()
